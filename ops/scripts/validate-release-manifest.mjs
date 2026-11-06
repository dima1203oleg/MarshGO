/**
 * Offline release-manifest gate for RELEASE_MANIFEST.json.
 *
 * materialize-release.mjs checks only the four pins it clones, and it needs the
 * network to get that far. This runs first, offline and without dependencies, so
 * a manifest that cannot support a release claim fails before any clone, install
 * or image build.
 *
 * Two profiles share one schema version. `current` is the canonical root
 * manifest. `legacy` is the pre-migration snapshot kept at docs/RELEASE_MANIFEST.json,
 * which recorded migration state as prose instead of a pin; every other rule is
 * identical, so old evidence stays readable without weakening the live gate.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

const COMMIT_SHA = /^[a-f0-9]{40}$/;
const SHA256_DIGEST = /^[a-f0-9]{64}$/;
const TREE_HASH12 = /^[a-f0-9]{12}$/;
const API_VERSION = /^v\d+$/;
const MIGRATION_PIN = /^\d{3}$/;
// A uniform 40-hex string passes the SHA shape test but names no real commit.
const UNIFORM_HEX_SHA = /^(.)\1{39}$/;
const URL_FIELD_NAME = /(^|_)(url|urls|pull_request|pr|link|href)$/i;
const URL_TOKEN = /https?:\/\/[^\s"'<>\\^`{|)}\]]*/g;
const PLACEHOLDER_VALUE =
  /^(tbd|todo|fixme|xxx+|placeholder|unknown|pending|n\/a|na|none|null|undefined|nan|unspecified|not[_ ]?set|-+|\?+|\.{3}|…)$/i;
const PLACEHOLDER_INLINE = /\b(tbd|todo|fixme|placeholder|lorem ipsum)\b|<[^>]+>|\?\?\?/i;
const UNVERIFIED_EVIDENCE =
  /^(not[_ ]released|not[_ ]tested|not[_ ]configured|blocked|fail|failed|pending|unknown|unverified|no\b)/i;

export const SUPPORTED_SCHEMA_VERSIONS = [1];
export const PROFILES = ['current', 'legacy'];
export const COMPONENTS = ['server', 'site', 'admin', 'partner', 'ios', 'integration'];
export const REQUIRED_PINS = COMPONENTS.map((component) => `${component}_sha`);
export const REQUIRED_EVIDENCE = ['production_deployment', 'staging'];
export const RELEASE_STATUSES = ['NOT_RELEASED', 'RELEASED'];
export const NULLABLE_SHA_FIELDS = new Set(['deployed_site_sha']);
export const CONTRACT_STRING_FIELDS = ['product', 'release_candidate', 'api_version'];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function placeholderReason(value) {
  const text = value.trim();
  if (PLACEHOLDER_VALUE.test(text)) return `placeholder value ${JSON.stringify(value)}`;
  if (PLACEHOLDER_INLINE.test(text)) return `contains a placeholder marker: ${JSON.stringify(value)}`;
  if (COMMIT_SHA.test(text) && UNIFORM_HEX_SHA.test(text)) {
    return `uniform repeated-character SHA names no real commit: ${JSON.stringify(value)}`;
  }
  return null;
}

function isUnverifiedEvidence(value) {
  return UNVERIFIED_EVIDENCE.test(value.trim());
}

function shaRule(key) {
  if (/sha256$/i.test(key)) return { pattern: SHA256_DIGEST, width: 64, label: 'sha256 digest' };
  if (/hash12$/i.test(key)) return { pattern: TREE_HASH12, width: 12, label: '12-character tree hash' };
  if (/sha$/i.test(key)) return { pattern: COMMIT_SHA, width: 40, label: 'exact commit SHA' };
  return null;
}

function checkUrl(value, path, problems, { allowProse, key }) {
  if (value === null || value === undefined) return;
  // `pr` carries a numeric pull-request id in the candidate tuples and a URL in
  // the narrative blocks; both are established conventions, not malformed URLs.
  if (typeof value === 'number' && /(^|_)pr$/i.test(key ?? '')) {
    if (!Number.isInteger(value) || value < 1) {
      problems.push({ path, code: 'invalid_type', message: `pull-request id must be a positive integer, got ${value}` });
    }
    return;
  }
  if (typeof value !== 'string') {
    problems.push({ path, code: 'invalid_type', message: `URL must be a string or null, got ${typeof value}` });
    return;
  }
  const reason = placeholderReason(value);
  if (reason) {
    problems.push({ path, code: 'placeholder', message: reason });
    return;
  }
  const tokens = value.match(URL_TOKEN) ?? [];
  if (tokens.length === 0) {
    // Evidence blocks narrate why a URL is absent ("not opened for this commit").
    // The contract surface may not: it must name a URL or be explicitly null.
    if (!allowProse) {
      problems.push({
        path,
        code: 'invalid_url',
        message: `must be null or an https URL, got prose ${JSON.stringify(value.slice(0, 120))}`,
      });
    }
    return;
  }
  for (const token of tokens) {
    let parsed;
    try {
      parsed = new URL(token);
    } catch {
      problems.push({ path, code: 'invalid_url', message: `malformed URL ${JSON.stringify(token)}` });
      continue;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      problems.push({ path, code: 'invalid_url', message: `unsupported protocol ${parsed.protocol} in ${JSON.stringify(token)}` });
    }
  }
  if (!allowProse && tokens.length === 1 && tokens[0] !== value.trim()) {
    problems.push({
      path,
      code: 'invalid_url',
      message: `must be a bare URL without surrounding prose, got ${JSON.stringify(value.slice(0, 120))}`,
    });
  }
  if (!allowProse && tokens.length > 1) {
    problems.push({ path, code: 'invalid_url', message: `must name exactly one URL, got ${tokens.length}` });
  }
}

/**
 * A pin-correction record keeps the abbreviated `was`/`now` it replaced, so only
 * `now_full` claims exactness. When it corrects a release pin it must still agree
 * with the pin the release is actually built from.
 */
function checkCorrectionRecord(key, value, path, manifest, problems) {
  if (!('now_full' in value)) {
    problems.push({ path, code: 'invalid_sha', message: 'pin correction must record an exact now_full commit SHA' });
    return;
  }
  const exact = value.now_full;
  if (typeof exact !== 'string' || !COMMIT_SHA.test(exact) || UNIFORM_HEX_SHA.test(exact)) {
    problems.push({
      path: `${path}.now_full`,
      code: 'invalid_sha',
      message: `pin correction must name an exact 40-character lowercase commit SHA, got ${JSON.stringify(exact)}`,
    });
    return;
  }
  if (REQUIRED_PINS.includes(key) && manifest[key] !== exact) {
    problems.push({
      path: `${path}.now_full`,
      code: 'pin_mismatch',
      message: `corrected pin ${exact} disagrees with release pin ${key}=${JSON.stringify(manifest[key])}`,
    });
  }
}

function checkShaField(key, value, path, manifest, problems) {
  const rule = shaRule(key);
  if (!rule) return;

  if (value === null || value === undefined) {
    if (!NULLABLE_SHA_FIELDS.has(key)) {
      problems.push({
        path,
        code: 'null_sha',
        message: `${rule.label} is ${value === null ? 'null' : 'missing'}; only ${[...NULLABLE_SHA_FIELDS].join(', ')} may be unresolved`,
      });
    }
    return;
  }

  if (isRecord(value)) {
    if (rule.pattern !== COMMIT_SHA) {
      problems.push({ path, code: 'invalid_type', message: `${rule.label} must be a string, got an object` });
      return;
    }
    checkCorrectionRecord(key, value, path, manifest, problems);
    return;
  }

  if (typeof value !== 'string') {
    problems.push({ path, code: 'invalid_type', message: `${rule.label} must be a string, got ${typeof value}` });
    return;
  }

  const reason = placeholderReason(value);
  if (reason) {
    problems.push({ path, code: 'placeholder', message: reason });
    return;
  }

  if (!rule.pattern.test(value)) {
    problems.push({
      path,
      code: 'invalid_sha',
      message: `${rule.label} must be ${rule.width} lowercase hex characters, got ${value.length}: ${JSON.stringify(value.slice(0, 160))}`,
    });
  }
}

function walkExactness(value, path, key, manifest, problems) {
  if (Array.isArray(value)) {
    // `commits` claims to enumerate exact commits. Narrative keys such as
    // `commit`, `head_commit` and `commit_log` hold abbreviations by convention.
    if (key === 'commits') {
      value.forEach((entry, index) => checkShaField('sha', entry, `${path}[${index}]`, manifest, problems));
    }
    value.forEach((entry, index) => walkExactness(entry, `${path}[${index}]`, null, manifest, problems));
    return;
  }
  if (!isRecord(value)) return;
  for (const [childKey, entry] of Object.entries(value)) {
    const childPath = path ? `${path}.${childKey}` : childKey;
    checkShaField(childKey, entry, childPath, manifest, problems);
    if (URL_FIELD_NAME.test(childKey)) {
      checkUrl(entry, childPath, problems, { allowProse: path !== '', key: childKey });
    }
    walkExactness(entry, childPath, childKey, manifest, problems);
  }
}

function checkRequiredString(manifest, key, problems, pattern, label) {
  const value = manifest[key];
  if (value === undefined) {
    problems.push({ path: key, code: 'missing_field', message: `required ${label} is missing` });
    return false;
  }
  if (!isNonEmptyString(value)) {
    problems.push({ path: key, code: 'invalid_type', message: `${label} must be a non-empty string, got ${JSON.stringify(value)}` });
    return false;
  }
  const reason = placeholderReason(value);
  if (reason) {
    problems.push({ path: key, code: 'placeholder', message: reason });
    return false;
  }
  if (pattern && !pattern.test(value)) {
    problems.push({ path: key, code: 'invalid_pin', message: `${label} must match ${pattern}, got ${JSON.stringify(value)}` });
    return false;
  }
  return true;
}

function checkMigrationPin(manifest, key, problems, notes, profile) {
  const value = manifest[key];
  if (value === undefined) {
    if (key === 'database_migration') {
      problems.push({ path: key, code: 'missing_field', message: 'required schema pin database_migration is missing' });
    }
    return;
  }
  if (!isNonEmptyString(value)) {
    problems.push({ path: key, code: 'invalid_type', message: `schema pin must be a non-empty string, got ${JSON.stringify(value)}` });
    return;
  }
  const reason = placeholderReason(value);
  if (reason) {
    problems.push({ path: key, code: 'placeholder', message: reason });
    return;
  }
  if (MIGRATION_PIN.test(value)) return;
  if (profile === 'legacy') {
    notes.push({
      path: key,
      code: 'legacy_prose_pin',
      message: 'pre-migration snapshot records migration state as prose; the current profile requires a zero-padded pin such as "056"',
    });
    return;
  }
  problems.push({
    path: key,
    code: 'invalid_pin',
    message: `schema pin must be a zero-padded migration number such as "056", got ${JSON.stringify(value.slice(0, 160))}`,
  });
}

function checkStaging(manifest, problems) {
  const staging = manifest.staging;
  if (!isRecord(staging)) {
    problems.push({ path: 'staging', code: 'missing_evidence', message: 'staging evidence block is required and must be an object' });
    return;
  }
  if (!isNonEmptyString(staging.status)) {
    problems.push({ path: 'staging.status', code: 'missing_evidence', message: 'staging must state its verification status' });
  }
  if (typeof staging.staging_ready !== 'boolean') {
    problems.push({ path: 'staging.staging_ready', code: 'invalid_type', message: 'staging_ready must be a boolean' });
  }
  checkUrl(staging.url, 'staging.url', problems, { allowProse: false, key: 'url' });
  if (staging.url !== null && staging.url !== undefined && typeof staging.url === 'string') {
    let protocol = null;
    try {
      protocol = new URL(staging.url).protocol;
    } catch {
      protocol = null;
    }
    if (protocol !== 'https:') {
      problems.push({ path: 'staging.url', code: 'invalid_url', message: 'a claimed staging origin must be https' });
    }
  }
  if (staging.staging_ready === true && !isNonEmptyString(staging.url)) {
    problems.push({ path: 'staging.url', code: 'missing_evidence', message: 'staging_ready=true requires a verified staging URL' });
  }
}

function checkEvidence(manifest, problems) {
  const verification = manifest.verification;
  if (!isRecord(verification)) {
    problems.push({ path: 'verification', code: 'missing_evidence', message: 'verification evidence ledger is required and must be an object' });
    return;
  }
  for (const key of REQUIRED_EVIDENCE) {
    if (!isNonEmptyString(verification[key])) {
      problems.push({
        path: `verification.${key}`,
        code: 'missing_evidence',
        message: `release evidence is required; state the verified result or an explicit NOT_TESTED / NOT_RELEASED reason`,
      });
    }
  }
}

function checkSourceRepositories(manifest, problems) {
  const sources = manifest.source_repositories;
  if (!isRecord(sources)) {
    problems.push({ path: 'source_repositories', code: 'missing_field', message: 'source_repositories must name every component repository' });
    return;
  }
  for (const component of COMPONENTS) {
    if (!isNonEmptyString(sources[component])) {
      problems.push({ path: `source_repositories.${component}`, code: 'missing_field', message: `repository provenance is required for ${component}` });
    }
  }
}

function checkStatus(manifest, problems) {
  const { status } = manifest;
  if (!isNonEmptyString(status)) {
    problems.push({ path: 'status', code: 'missing_field', message: `release status is required, one of ${RELEASE_STATUSES.join(', ')}` });
    return;
  }
  if (!RELEASE_STATUSES.includes(status)) {
    problems.push({ path: 'status', code: 'unknown_status', message: `unsupported release status ${JSON.stringify(status)}; expected one of ${RELEASE_STATUSES.join(', ')}` });
    return;
  }
  for (const flag of ['production_ready', 'ready_for_server_deployment']) {
    if (manifest[flag] === undefined) {
      problems.push({ path: flag, code: 'missing_field', message: `required release status field ${flag} is missing` });
    } else if (typeof manifest[flag] !== 'boolean') {
      problems.push({ path: flag, code: 'invalid_type', message: `${flag} must be an explicit boolean, got ${JSON.stringify(manifest[flag])}` });
    }
  }

  if (status === 'NOT_RELEASED') {
    for (const flag of ['production_ready', 'ready_for_server_deployment']) {
      if (manifest[flag] === undefined || typeof manifest[flag] !== 'boolean') continue;
      if (manifest[flag] !== false) {
        problems.push({ path: flag, code: 'status_contradiction', message: `must be false while status is NOT_RELEASED, got ${JSON.stringify(manifest[flag])}` });
      }
    }
    return;
  }

  if (manifest.production_ready !== true) {
    problems.push({ path: 'production_ready', code: 'status_contradiction', message: 'status RELEASED requires production_ready=true' });
  }
}

function checkProductionClaim(manifest, problems) {
  if (manifest.production_ready !== true) return;

  const deployed = manifest.deployed_site_sha;
  if (typeof deployed !== 'string' || !COMMIT_SHA.test(deployed)) {
    problems.push({ path: 'deployed_site_sha', code: 'missing_evidence', message: 'production_ready=true requires the exact 40-character SHA actually serving traffic' });
  } else if (deployed !== manifest.site_sha) {
    problems.push({
      path: 'deployed_site_sha',
      code: 'pin_mismatch',
      message: `deployed ${deployed} does not match pinned site_sha ${JSON.stringify(manifest.site_sha)}`,
    });
  }

  const claim = manifest.verification?.production_deployment;
  if (!isNonEmptyString(claim) || isUnverifiedEvidence(claim)) {
    problems.push({
      path: 'verification.production_deployment',
      code: 'missing_evidence',
      message: 'production_ready=true requires affirmative deployment evidence, not a NOT_RELEASED / NOT_TESTED / BLOCKED statement',
    });
  }

  if (manifest.staging?.staging_ready !== true) {
    problems.push({ path: 'staging.staging_ready', code: 'missing_evidence', message: 'production_ready=true requires a verified staging rehearsal' });
  }
}

/**
 * @param {unknown} manifest parsed RELEASE_MANIFEST.json
 * @param {{profile?: 'current'|'legacy'}} [options]
 * @returns {{ok: boolean, profile: string, schemaVersion: unknown, problems: object[], notes: object[]}}
 */
export function validateReleaseManifest(manifest, options = {}) {
  const profile = options.profile ?? 'current';
  const problems = [];
  const notes = [];

  if (!PROFILES.includes(profile)) {
    return {
      ok: false,
      profile,
      schemaVersion: undefined,
      problems: [{ path: 'profile', code: 'unknown_profile', message: `unsupported profile ${JSON.stringify(profile)}; expected one of ${PROFILES.join(', ')}` }],
      notes,
    };
  }

  if (!isRecord(manifest)) {
    return {
      ok: false,
      profile,
      schemaVersion: undefined,
      problems: [{ path: '$', code: 'not_an_object', message: 'RELEASE_MANIFEST.json must be a JSON object' }],
      notes,
    };
  }

  const schemaVersion = manifest.schema_version;
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)) {
    problems.push({
      path: 'schema_version',
      code: 'unsupported_schema_version',
      message: `expected one of ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}, got ${JSON.stringify(schemaVersion)}`,
    });
  }

  for (const pin of REQUIRED_PINS) {
    const value = manifest[pin];
    if (value === undefined) {
      problems.push({ path: pin, code: 'missing_field', message: `required release pin ${pin} is missing` });
      continue;
    }
    checkShaField(pin, value, pin, manifest, problems);
  }

  for (const key of CONTRACT_STRING_FIELDS) {
    checkRequiredString(manifest, key, problems, key === 'api_version' ? API_VERSION : null, key === 'api_version' ? 'API contract pin' : key);
  }
  checkMigrationPin(manifest, 'database_migration', problems, notes, profile);
  checkMigrationPin(manifest, 'candidate_database_migration', problems, notes, profile);
  if (
    profile === 'current' &&
    MIGRATION_PIN.test(manifest.database_migration ?? '') &&
    manifest.candidate_database_migration !== undefined &&
    manifest.candidate_database_migration !== manifest.database_migration
  ) {
    problems.push({
      path: 'candidate_database_migration',
      code: 'pin_mismatch',
      message: `candidate schema pin ${JSON.stringify(manifest.candidate_database_migration)} disagrees with database_migration ${JSON.stringify(manifest.database_migration)}`,
    });
  }

  checkStatus(manifest, problems);
  checkStaging(manifest, problems);
  checkEvidence(manifest, problems);
  checkSourceRepositories(manifest, problems);
  checkProductionClaim(manifest, problems);
  walkExactness(manifest, '', null, manifest, problems);

  // The six release pins are checked once for a required-pin diagnostic and once
  // by the recursive exactness pass; report each violation only once.
  const seen = new Set();
  const unique = problems.filter((entry) => {
    const id = `${entry.path}|${entry.code}|${entry.message}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return { ok: unique.length === 0, profile, schemaVersion, problems: unique, notes };
}

export function readReleaseManifest(manifestPath) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function formatDiagnostics(result) {
  return [...problemsOf(result), ...notesOf(result)].map((entry) => `  - ${entry.path}: ${entry.message}`);
}

function problemsOf(result) {
  return result.problems.map((entry) => ({ ...entry, message: `[${entry.code}] ${entry.message}` }));
}

function notesOf(result) {
  return result.notes.map((entry) => ({ ...entry, path: `${entry.path} (legacy note)`, message: `[${entry.code}] ${entry.message}` }));
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgs(argv) {
  const options = { profile: 'current', manifestPath: join(root, 'RELEASE_MANIFEST.json') };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--profile') {
      options.profile = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--profile=')) {
      options.profile = arg.slice('--profile='.length);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 0) options.manifestPath = resolve(positional[0]);
  return options;
}

function main(argv) {
  const { profile, manifestPath } = parseArgs(argv);
  let manifest;
  try {
    manifest = readReleaseManifest(manifestPath);
  } catch (error) {
    process.stderr.write(`${manifestPath}: cannot read release manifest: ${error.message}\n`);
    return 1;
  }

  const result = validateReleaseManifest(manifest, { profile });
  const label = `${manifestPath} (profile ${profile})`;
  if (!result.ok) {
    process.stderr.write(`${label} is not a valid release manifest (${result.problems.length} problems):\n`);
    for (const line of formatDiagnostics(result)) process.stderr.write(`${line}\n`);
    return 1;
  }

  process.stdout.write(
    `${label} is exact: schema_version ${result.schemaVersion}, ` +
      `${REQUIRED_PINS.length}/${REQUIRED_PINS.length} pins verified, status ${manifest.status}, ` +
      `production_ready=${manifest.production_ready}\n`,
  );
  for (const line of formatDiagnostics(result)) process.stdout.write(`${line}\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}