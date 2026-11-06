/**
 * Offline exact-SHA gate for RELEASE_MANIFEST.json.
 *
 * materialize-release.mjs validates only the four pins it clones, and it needs
 * network access to reach that point. This validator runs first and offline so
 * a manifest that does not name exact commits fails before any repository is
 * cloned or any image is built.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const COMMIT_SHA = /^[a-f0-9]{40}$/;
const FILE_SHA256 = /^[a-f0-9]{64}$/;
const TREE_HASH12 = /^[a-f0-9]{12}$/;

export const SCHEMA_VERSION = 1;

/** Every component pin that a release build is assembled from. */
export const REQUIRED_PINS = [
  'server_sha',
  'site_sha',
  'admin_sha',
  'partner_sha',
  'ios_sha',
  'integration_sha',
];

/** Pins allowed to stay unresolved while nothing is deployed. */
export const NULLABLE_SHA_FIELDS = new Set(['deployed_site_sha']);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldRule(key) {
  if (/sha256$/i.test(key)) return { pattern: FILE_SHA256, width: 64, label: 'sha256 digest' };
  if (/sha$/i.test(key)) return { pattern: COMMIT_SHA, width: 40, label: 'exact commit SHA' };
  if (/hash12$/i.test(key)) return { pattern: TREE_HASH12, width: 12, label: '12-char tree hash' };
  return null;
}

function checkValue(key, value, path, problems) {
  const rule = fieldRule(key);
  if (!rule) return;

  if (value === null) {
    if (!NULLABLE_SHA_FIELDS.has(key)) {
      problems.push(`${path}: ${rule.label} is null but only ${[...NULLABLE_SHA_FIELDS].join(', ')} may be`);
    }
    return;
  }

  if (isRecord(value)) {
    checkCorrectionRecord(rule, value, path, problems);
    return;
  }

  if (typeof value !== 'string') {
    problems.push(`${path}: ${rule.label} must be a string, got ${typeof value}`);
    return;
  }

  if (!rule.pattern.test(value)) {
    problems.push(
      `${path}: ${rule.label} must be ${rule.width} lowercase hex characters, got ${value.length}: ${JSON.stringify(value)}`,
    );
  }
}

/**
 * A pin correction record keeps the abbreviated `was`/`now` values it replaced
 * and must still name the exact commit it settled on.
 */
function checkCorrectionRecord(rule, value, path, problems) {
  if (rule.pattern !== COMMIT_SHA || !('now_full' in value)) {
    problems.push(`${path}: ${rule.label} must be a string, got an object`);
    return;
  }

  if (typeof value.now_full !== 'string' || !COMMIT_SHA.test(value.now_full)) {
    problems.push(
      `${path}.now_full: pin correction must record an exact 40-char commit SHA, got ${JSON.stringify(value.now_full)}`,
    );
  }
}

function walk(value, path, key, problems) {
  if (Array.isArray(value)) {
    // `commits` claims to enumerate exact commits. The narrative keys
    // `commit`, `commit_admin`, `commit_partner` and `commits_today` hold
    // abbreviations by convention and are deliberately not checked here.
    if (key === 'commits') {
      value.forEach((entry, index) => checkValue('sha', entry, `${path}[${index}]`, problems));
    }
    value.forEach((entry, index) => walk(entry, `${path}[${index}]`, null, problems));
    return;
  }

  if (isRecord(value)) {
    for (const [childKey, entry] of Object.entries(value)) {
      const childPath = path ? `${path}.${childKey}` : childKey;
      checkValue(childKey, entry, childPath, problems);
      walk(entry, childPath, childKey, problems);
    }
  }
}

function checkPins(manifest, problems) {
  for (const pin of REQUIRED_PINS) {
    const value = manifest[pin];
    if (value === undefined) {
      problems.push(`${pin}: required release pin is missing`);
    } else if (typeof value !== 'string' || !COMMIT_SHA.test(value)) {
      problems.push(
        `${pin}: release pin must be an exact 40-char lowercase commit SHA, got ${JSON.stringify(value)}`,
      );
    }
  }
}

function checkReleaseStatus(manifest, problems) {
  for (const key of ['status', 'production_ready', 'ready_for_server_deployment']) {
    if (manifest[key] === undefined) problems.push(`${key}: required release status field is missing`);
  }

  if (manifest.status === 'NOT_RELEASED') {
    if (manifest.production_ready !== false) {
      problems.push('production_ready: must be false while status is NOT_RELEASED');
    }
    if (manifest.ready_for_server_deployment !== false) {
      problems.push('ready_for_server_deployment: must be false while status is NOT_RELEASED');
    }
  }

  // A manifest cannot claim production readiness without naming the exact
  // commit that is actually serving traffic.
  if (manifest.production_ready === true) {
    const deployed = manifest.deployed_site_sha;
    if (typeof deployed !== 'string' || !COMMIT_SHA.test(deployed)) {
      problems.push('deployed_site_sha: must be an exact 40-char commit SHA when production_ready is true');
    } else if (deployed !== manifest.site_sha) {
      problems.push(
        `deployed_site_sha: deployed ${deployed} does not match pinned site_sha ${manifest.site_sha}`,
      );
    }
  }
}

/**
 * @param {unknown} manifest parsed RELEASE_MANIFEST.json
 * @returns {string[]} every violation found; empty means the manifest is exact
 */
export function validateReleaseManifest(manifest) {
  const problems = [];

  if (!isRecord(manifest)) {
    return ['RELEASE_MANIFEST.json must be a JSON object'];
  }

  if (manifest.schema_version !== SCHEMA_VERSION) {
    problems.push(
      `schema_version: expected ${SCHEMA_VERSION}, got ${JSON.stringify(manifest.schema_version)}`,
    );
  }

  checkPins(manifest, problems);
  checkReleaseStatus(manifest, problems);
  walk(manifest, '', null, problems);

  return problems;
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function readReleaseManifest(manifestPath = join(root, 'RELEASE_MANIFEST.json')) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifestPath = process.argv[2] ? resolve(process.argv[2]) : join(root, 'RELEASE_MANIFEST.json');
  const problems = validateReleaseManifest(readReleaseManifest(manifestPath));

  if (problems.length > 0) {
    process.stderr.write(`RELEASE_MANIFEST.json is not an exact-SHA release manifest (${problems.length} problems):\n`);
    for (const problem of problems) process.stderr.write(`  - ${problem}\n`);
    process.exitCode = 1;
  } else {
    const manifest = readReleaseManifest(manifestPath);
    process.stdout.write(
      `RELEASE_MANIFEST.json is exact: schema_version ${manifest.schema_version}, ` +
        `${REQUIRED_PINS.length}/${REQUIRED_PINS.length} pins verified, status ${manifest.status}\n`,
    );
  }
}
