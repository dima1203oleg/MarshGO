import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { after, describe, it } from 'node:test';
import {
  COMPONENTS,
  PROFILES,
  REQUIRED_EVIDENCE,
  REQUIRED_PINS,
  formatDiagnostics,
  readReleaseManifest,
  validateReleaseManifest,
} from './validate-release-manifest.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const script = join(here, 'validate-release-manifest.mjs');

// Real candidate pins: varied hex, so they cannot trip the uniform-placeholder rule.
const PINS = {
  server_sha: '44f954b3ce6099dde86cebfe7984079a078a5872',
  site_sha: 'fef697e2603b43c5bc76a9f98e78dba50cc8b480',
  ios_sha: '4353cec3cacbaf662ceea047402f361024292b22',
  admin_sha: '4eb5d15d1692ebcdb5aae40dbcffc39446138fb5',
  partner_sha: '544e5d8c71a04601fae5f0d92dd5ec186f7ac241',
  integration_sha: 'd117f4b96cb2bb900eacf5a4c3692399d175431a',
};
const OTHER_SHA = 'd6c9a957a5f767a491daed2ffb5e70bb8ed8b559';

function validManifest(overrides = {}) {
  return {
    schema_version: 1,
    product: 'MARSHGO',
    release_candidate: 'RC-2026-10-30-evidence.3',
    status: 'NOT_RELEASED',
    production_ready: false,
    ready_for_server_deployment: false,
    ...PINS,
    api_version: 'v1',
    database_migration: '056',
    candidate_database_migration: '056',
    deployed_site_sha: null,
    source_repositories: Object.fromEntries(COMPONENTS.map((c) => [c, `dima1203oleg/MarshGO-${c}@codex/rc`])),
    staging: {
      url: null,
      provider: null,
      status: 'NOT_CONFIGURED / NOT_TESTED: no verified staging host or API origin.',
      staging_ready: false,
    },
    verification: {
      production_deployment: 'NOT_RELEASED: no verified staging/production origin, deployed SHA, HTTPS smoke or rollback rehearsal.',
      staging: 'NOT_CONFIGURED / NOT_TESTED: no verified staging URL, API origin, credentials, or deployed SHA.',
    },
    ...overrides,
  };
}

function releasedManifest(overrides = {}) {
  return validManifest({
    status: 'RELEASED',
    production_ready: true,
    ready_for_server_deployment: true,
    deployed_site_sha: PINS.site_sha,
    staging: {
      url: 'https://staging.marshgo.example',
      provider: 'owner-managed host',
      status: 'PASS: clean-host bootstrap rehearsal, HTTPS smoke and rollback drill executed.',
      staging_ready: true,
    },
    verification: {
      production_deployment: 'PASS: deployed exact Site SHA over https://marshgo.example, HTTPS smoke and rollback rehearsal executed.',
      staging: 'PASS: staging rehearsal on https://staging.marshgo.example.',
    },
    ...overrides,
  });
}

const paths = (result) => result.problems.map((problem) => problem.path);
const at = (result, path) => result.problems.filter((problem) => problem.path === path);

function expectProblem(result, path, code) {
  const hits = at(result, path);
  assert.ok(hits.length > 0, `expected a problem at ${path}, got ${JSON.stringify(paths(result))}`);
  assert.ok(hits.some((problem) => problem.code === code), `expected ${code} at ${path}, got ${JSON.stringify(hits)}`);
  assert.ok(hits.every((problem) => problem.message.length > 0), 'every diagnostic carries a message');
}

describe('release manifest validator — valid manifests', () => {
  it('accepts a minimal exact NOT_RELEASED manifest with all six pins', () => {
    const result = validateReleaseManifest(validManifest());
    assert.deepEqual(result.problems, []);
    assert.equal(result.ok, true);
    assert.equal(result.profile, 'current');
    assert.equal(result.schemaVersion, 1);
    assert.equal(REQUIRED_PINS.length, 6);
  });

  it('accepts the canonical root RELEASE_MANIFEST.json', () => {
    const result = validateReleaseManifest(readReleaseManifest(join(root, 'RELEASE_MANIFEST.json')));
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
    assert.equal(result.ok, true);
  });

  it('accepts a fully evidenced RELEASED manifest', () => {
    const result = validateReleaseManifest(releasedManifest());
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
    assert.equal(result.ok, true);
  });

  it('accepts numeric pull-request ids and pin-correction records', () => {
    const result = validateReleaseManifest(validManifest({
      review_candidate_tuple: {
        components: {
          site: { sha: OTHER_SHA, pr: 28, hosted_runs: ['40305831219'] },
          server: { sha: PINS.server_sha, pr: 42 },
        },
      },
      gate02_materialized_release_2026_11_01: {
        pins_corrected: {
          server_sha: { was: 'fc5b589ca395', now: '44f954b3ce60', now_full: PINS.server_sha },
        },
      },
      preview_environment_2026_10_31: { site_uncommitted_tree_hash12: '10886e2841fd' },
      gate05_sha_manifest_and_dr_drill_2026_11_01: {
        dr_drill: { dump_sha256: 'dd5f72d7b68e4ffc8a8bcaf78aa25a941413f85d92a206cd5bd9908a5eba6e62' },
      },
    }));
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
  });

  it('accepts narrative evidence that explains an absent URL', () => {
    const result = validateReleaseManifest(validManifest({
      search_latency_2026_10_31_part2: {
        pull_request: 'not opened for this commit; PR #63 still points at 1e26b9f',
        public_https_evidence: 'https://marshgo-dima.shares.zrok.io returned HTTP 200 in 17.17 s',
      },
    }));
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
  });
});

describe('release manifest validator — missing fields and evidence', () => {
  for (const pin of REQUIRED_PINS) {
    it(`rejects a missing ${pin}`, () => {
      const manifest = validManifest();
      delete manifest[pin];
      expectProblem(validateReleaseManifest(manifest), pin, 'missing_field');
    });
  }

  for (const field of ['product', 'release_candidate', 'api_version', 'database_migration', 'status', 'schema_version']) {
    it(`rejects a missing ${field}`, () => {
      const manifest = validManifest();
      delete manifest[field];
      const result = validateReleaseManifest(manifest);
      assert.equal(result.ok, false);
      expectProblem(result, field, field === 'schema_version' ? 'unsupported_schema_version' : 'missing_field');
    });
  }

  for (const flag of ['production_ready', 'ready_for_server_deployment']) {
    it(`rejects a missing ${flag}`, () => {
      const manifest = validManifest();
      delete manifest[flag];
      const result = validateReleaseManifest(manifest);
      expectProblem(result, flag, 'missing_field');
    });
  }

  for (const evidence of REQUIRED_EVIDENCE) {
    it(`rejects missing verification.${evidence}`, () => {
      const manifest = validManifest();
      delete manifest.verification[evidence];
      expectProblem(validateReleaseManifest(manifest), `verification.${evidence}`, 'missing_evidence');
    });

    it(`rejects blank verification.${evidence}`, () => {
      const manifest = validManifest();
      manifest.verification[evidence] = '   ';
      expectProblem(validateReleaseManifest(manifest), `verification.${evidence}`, 'missing_evidence');
    });
  }

  it('rejects a missing verification ledger and staging block', () => {
    for (const key of ['verification', 'staging', 'source_repositories']) {
      const manifest = validManifest();
      delete manifest[key];
      const result = validateReleaseManifest(manifest);
      assert.equal(result.ok, false, key);
      expectProblem(result, key, key === 'source_repositories' ? 'missing_field' : 'missing_evidence');
    }
  });

  for (const component of COMPONENTS) {
    it(`rejects missing source_repositories.${component}`, () => {
      const manifest = validManifest();
      delete manifest.source_repositories[component];
      expectProblem(validateReleaseManifest(manifest), `source_repositories.${component}`, 'missing_field');
    });
  }

  it('rejects a missing staging status and staging_ready flag', () => {
    const manifest = validManifest({ staging: { url: null } });
    const result = validateReleaseManifest(manifest);
    expectProblem(result, 'staging.status', 'missing_evidence');
    expectProblem(result, 'staging.staging_ready', 'invalid_type');
  });
});

describe('release manifest validator — malformed pins and SHAs', () => {
  it('rejects an abbreviated SHA and reports the field and length', () => {
    const result = validateReleaseManifest(validManifest({ server_sha: '44f954b' }));
    expectProblem(result, 'server_sha', 'invalid_sha');
    assert.match(at(result, 'server_sha')[0].message, /40 lowercase hex characters, got 7/);
  });

  it('rejects uppercase, prose-suffixed and non-string SHAs', () => {
    expectProblem(validateReleaseManifest(validManifest({ site_sha: PINS.site_sha.toUpperCase() })), 'site_sha', 'invalid_sha');
    expectProblem(
      validateReleaseManifest(validManifest({ ios_sha: `${PINS.ios_sha} (local commit, not yet pushed)` })),
      'ios_sha',
      'invalid_sha',
    );
    expectProblem(validateReleaseManifest(validManifest({ admin_sha: 12345 })), 'admin_sha', 'invalid_type');
  });

  it('rejects a null release pin but allows a null deployed_site_sha', () => {
    expectProblem(validateReleaseManifest(validManifest({ partner_sha: null })), 'partner_sha', 'null_sha');
    assert.equal(validateReleaseManifest(validManifest({ deployed_site_sha: null })).ok, true);
    expectProblem(validateReleaseManifest(validManifest({ deployed_site_sha: 'abc' })), 'deployed_site_sha', 'invalid_sha');
  });

  it('enforces exact width on sha256 digests and 12-character tree hashes', () => {
    expectProblem(
      validateReleaseManifest(validManifest({ drill: { dump_sha256: 'dd5f72d7b68e4ffc' } })),
      'drill.dump_sha256',
      'invalid_sha',
    );
    expectProblem(
      validateReleaseManifest(validManifest({ preview: { site_uncommitted_tree_hash12: '10886e2841fd1088' } })),
      'preview.site_uncommitted_tree_hash12',
      'invalid_sha',
    );
  });

  it('rejects an abbreviated entry inside a commits array', () => {
    const result = validateReleaseManifest(validManifest({
      checkpoint: { head_sha: OTHER_SHA, commits: [OTHER_SHA, '48ab36b (perf(journey): cache fix)'] },
    }));
    expectProblem(result, 'checkpoint.commits[1]', 'invalid_sha');
    assert.deepEqual(at(result, 'checkpoint.commits[0]'), []);
  });

  it('rejects malformed API and schema pins', () => {
    expectProblem(validateReleaseManifest(validManifest({ api_version: '1' })), 'api_version', 'invalid_pin');
    expectProblem(validateReleaseManifest(validManifest({ database_migration: '56' })), 'database_migration', 'invalid_pin');
    expectProblem(
      validateReleaseManifest(validManifest({ database_migration: 'Server migrations through 054 passed' })),
      'database_migration',
      'invalid_pin',
    );
  });

  it('rejects a candidate schema pin that disagrees with the release pin', () => {
    expectProblem(
      validateReleaseManifest(validManifest({ candidate_database_migration: '055' })),
      'candidate_database_migration',
      'pin_mismatch',
    );
  });

  it('rejects a pin correction whose now_full is abbreviated or stale', () => {
    expectProblem(
      validateReleaseManifest(validManifest({ gate: { pins_corrected: { server_sha: { was: 'fc5b589', now_full: '44f954b3ce60' } } } })),
      'gate.pins_corrected.server_sha.now_full',
      'invalid_sha',
    );
    expectProblem(
      validateReleaseManifest(validManifest({ gate: { pins_corrected: { server_sha: { was: 'fc5b589', now_full: OTHER_SHA } } } })),
      'gate.pins_corrected.server_sha.now_full',
      'pin_mismatch',
    );
    expectProblem(
      validateReleaseManifest(validManifest({ gate: { pins_corrected: { server_sha: { was: 'fc5b589' } } } })),
      'gate.pins_corrected.server_sha',
      'invalid_sha',
    );
  });

  it('reports each release-pin violation exactly once', () => {
    const result = validateReleaseManifest(validManifest({ server_sha: '44f954b' }));
    assert.equal(at(result, 'server_sha').length, 1);
  });
});

describe('release manifest validator — URLs', () => {
  it('rejects a malformed, non-https or prose staging URL', () => {
    expectProblem(validateReleaseManifest(validManifest({ staging: { ...validManifest().staging, url: 'https://' } })), 'staging.url', 'invalid_url');
    expectProblem(
      validateReleaseManifest(validManifest({ staging: { ...validManifest().staging, url: 'http://staging.marshgo.example' } })),
      'staging.url',
      'invalid_url',
    );
    expectProblem(
      validateReleaseManifest(validManifest({ staging: { ...validManifest().staging, url: 'no staging URL is configured' } })),
      'staging.url',
      'invalid_url',
    );
  });

  it('rejects a staging URL wrapped in prose or naming more than one origin', () => {
    expectProblem(
      validateReleaseManifest(validManifest({ staging: { ...validManifest().staging, url: 'https://staging.marshgo.example at 570x843' } })),
      'staging.url',
      'invalid_url',
    );
    expectProblem(
      validateReleaseManifest(validManifest({ staging: { ...validManifest().staging, url: 'https://a.example https://b.example' } })),
      'staging.url',
      'invalid_url',
    );
  });

  it('rejects a malformed URL token embedded in evidence', () => {
    const result = validateReleaseManifest(validManifest({
      checkpoint: { public_url: 'see https://marshgo-dima.shares.zrok.io:80:90 for the run' },
    }));
    expectProblem(result, 'checkpoint.public_url', 'invalid_url');
    expectProblem(
      validateReleaseManifest(validManifest({ checkpoint: { public_url: 'tunnel was https:// before it died' } })),
      'checkpoint.public_url',
      'invalid_url',
    );
  });

  it('accepts a well-formed https evidence URL and a numeric pull-request id', () => {
    const result = validateReleaseManifest(validManifest({
      checkpoint: { pull_request: 'https://github.com/dima1203oleg/MarshGO-Server/pull/63', pr: 63 },
    }));
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
  });

  it('rejects a non-positive or fractional pull-request id', () => {
    expectProblem(validateReleaseManifest(validManifest({ checkpoint: { pr: 0 } })), 'checkpoint.pr', 'invalid_type');
    expectProblem(validateReleaseManifest(validManifest({ checkpoint: { pr: 1.5 } })), 'checkpoint.pr', 'invalid_type');
  });
});

describe('release manifest validator — status contradictions', () => {
  it('rejects production_ready=true while NOT_RELEASED', () => {
    const result = validateReleaseManifest(validManifest({ production_ready: true }));
    expectProblem(result, 'production_ready', 'status_contradiction');
  });

  it('rejects ready_for_server_deployment=true while NOT_RELEASED', () => {
    expectProblem(
      validateReleaseManifest(validManifest({ ready_for_server_deployment: true })),
      'ready_for_server_deployment',
      'status_contradiction',
    );
  });

  it('rejects string flags instead of explicit booleans', () => {
    expectProblem(validateReleaseManifest(validManifest({ production_ready: 'false' })), 'production_ready', 'invalid_type');
    expectProblem(validateReleaseManifest(validManifest({ ready_for_server_deployment: 0 })), 'ready_for_server_deployment', 'invalid_type');
  });

  it('rejects an unknown release status', () => {
    expectProblem(validateReleaseManifest(validManifest({ status: 'PRODUCTION_READY' })), 'status', 'unknown_status');
  });

  it('rejects RELEASED without production_ready', () => {
    expectProblem(validateReleaseManifest(releasedManifest({ production_ready: false })), 'production_ready', 'status_contradiction');
  });

  it('rejects a production claim with no deployed SHA', () => {
    expectProblem(validateReleaseManifest(releasedManifest({ deployed_site_sha: null })), 'deployed_site_sha', 'missing_evidence');
  });

  it('rejects a deployed SHA that is not the pinned Site SHA', () => {
    expectProblem(validateReleaseManifest(releasedManifest({ deployed_site_sha: OTHER_SHA })), 'deployed_site_sha', 'pin_mismatch');
  });

  it('rejects a production claim backed by NOT_RELEASED deployment evidence', () => {
    const manifest = releasedManifest();
    manifest.verification.production_deployment = 'NOT_RELEASED: no verified staging/production origin or deployed SHA.';
    expectProblem(validateReleaseManifest(manifest), 'verification.production_deployment', 'missing_evidence');
  });

  it('rejects a production claim without a staging rehearsal', () => {
    const manifest = releasedManifest();
    manifest.staging.staging_ready = false;
    expectProblem(validateReleaseManifest(manifest), 'staging.staging_ready', 'missing_evidence');
  });

  it('rejects staging_ready=true with no staging URL', () => {
    const manifest = validManifest();
    manifest.staging.staging_ready = true;
    expectProblem(validateReleaseManifest(manifest), 'staging.url', 'missing_evidence');
  });
});

describe('release manifest validator — placeholders', () => {
  it('rejects a uniform repeated-character SHA that names no real commit', () => {
    for (const filler of ['0', 'f', 'a']) {
      const result = validateReleaseManifest(validManifest({ server_sha: filler.repeat(40) }));
      expectProblem(result, 'server_sha', 'placeholder');
    }
  });

  it('rejects placeholder contract values', () => {
    expectProblem(validateReleaseManifest(validManifest({ release_candidate: 'TBD' })), 'release_candidate', 'placeholder');
    expectProblem(validateReleaseManifest(validManifest({ product: 'PLACEHOLDER' })), 'product', 'placeholder');
    expectProblem(validateReleaseManifest(validManifest({ api_version: '<version>' })), 'api_version', 'placeholder');
    expectProblem(validateReleaseManifest(validManifest({ database_migration: 'TODO' })), 'database_migration', 'placeholder');
    expectProblem(validateReleaseManifest(validManifest({ release_candidate: 'RC-???' })), 'release_candidate', 'placeholder');
  });

  it('rejects a placeholder URL and a placeholder deployed SHA', () => {
    expectProblem(
      validateReleaseManifest(validManifest({ staging: { ...validManifest().staging, url: 'https://staging.example/<token>' } })),
      'staging.url',
      'placeholder',
    );
    expectProblem(validateReleaseManifest(releasedManifest({ deployed_site_sha: '0'.repeat(40) })), 'deployed_site_sha', 'placeholder');
  });

  it('does not mistake honest NOT_TESTED evidence for a placeholder', () => {
    const result = validateReleaseManifest(validManifest({
      verification: {
        production_deployment: 'NOT_RELEASED: physical iPhone, APNs and signing NOT_TESTED.',
        staging: 'NOT_CONFIGURED / NOT_TESTED: no verified staging URL. Current full exact-pair E2E pending.',
      },
    }));
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
  });
});

describe('release manifest validator — schema versions and legacy evidence', () => {
  it('rejects an unsupported or non-numeric schema_version', () => {
    expectProblem(validateReleaseManifest(validManifest({ schema_version: 2 })), 'schema_version', 'unsupported_schema_version');
    expectProblem(validateReleaseManifest(validManifest({ schema_version: '1' })), 'schema_version', 'unsupported_schema_version');
  });

  it('rejects a non-object manifest', () => {
    for (const value of [null, [], 'RELEASE_MANIFEST', 1]) {
      const result = validateReleaseManifest(value);
      assert.equal(result.ok, false);
      expectProblem(result, '$', 'not_an_object');
    }
  });

  it('rejects an unknown profile', () => {
    const result = validateReleaseManifest(validManifest(), { profile: 'historic' });
    assert.equal(result.ok, false);
    expectProblem(result, 'profile', 'unknown_profile');
    assert.deepEqual(PROFILES, ['current', 'legacy']);
  });

  it('keeps the pre-migration docs snapshot valid under the legacy profile', () => {
    const legacy = readReleaseManifest(join(root, 'docs/RELEASE_MANIFEST.json'));
    const result = validateReleaseManifest(legacy, { profile: 'legacy' });
    assert.deepEqual(result.problems, [], formatDiagnostics(result).join('\n'));
    assert.equal(result.ok, true);
    assert.deepEqual(result.notes.map((note) => note.path), ['database_migration', 'candidate_database_migration']);
    assert.ok(result.notes.every((note) => note.code === 'legacy_prose_pin'));
  });

  it('rejects the same docs snapshot under the current profile, so the profiles are not interchangeable', () => {
    const legacy = readReleaseManifest(join(root, 'docs/RELEASE_MANIFEST.json'));
    const result = validateReleaseManifest(legacy, { profile: 'current' });
    assert.equal(result.ok, false);
    expectProblem(result, 'database_migration', 'invalid_pin');
    expectProblem(result, 'candidate_database_migration', 'invalid_pin');
  });

  it('still enforces exact pins and status consistency under the legacy profile', () => {
    const legacy = readReleaseManifest(join(root, 'docs/RELEASE_MANIFEST.json'));
    expectProblem(validateReleaseManifest({ ...legacy, server_sha: 'cf82c68' }, { profile: 'legacy' }), 'server_sha', 'invalid_sha');
    expectProblem(validateReleaseManifest({ ...legacy, production_ready: true }, { profile: 'legacy' }), 'production_ready', 'status_contradiction');
    expectProblem(validateReleaseManifest({ ...legacy, schema_version: 99 }, { profile: 'legacy' }), 'schema_version', 'unsupported_schema_version');
  });

  it('accepts a prose migration pin only under legacy, and only as a note', () => {
    const prose = 'Server candidate migrations through 054 passed on an isolated loopback database.';
    const current = validateReleaseManifest(validManifest({ database_migration: prose }));
    expectProblem(current, 'database_migration', 'invalid_pin');
    const legacy = validateReleaseManifest(validManifest({ database_migration: prose }), { profile: 'legacy' });
    assert.equal(legacy.ok, true);
    assert.deepEqual(legacy.notes.map((note) => note.path), ['database_migration']);
  });
});

describe('release manifest validator — negative control on the migrated evidence', () => {
  it('fails again when an abbreviated head_sha is restored to the live manifest', () => {
    const manifest = readReleaseManifest(join(root, 'RELEASE_MANIFEST.json'));
    assert.equal(validateReleaseManifest(manifest).ok, true, 'the migrated manifest must be exact first');
    manifest.search_latency_2026_10_31_part2.head_sha = '2c2342f (local commit on qoder/search-latency-20261031, not yet pushed)';
    const result = validateReleaseManifest(manifest);
    assert.equal(result.ok, false);
    expectProblem(result, 'search_latency_2026_10_31_part2.head_sha', 'invalid_sha');
  });

  it('fails again when a prose source_sha is restored to the live manifest', () => {
    const manifest = readReleaseManifest(join(root, 'RELEASE_MANIFEST.json'));
    manifest.canonical_carpool_lifecycle_2026_11_01.source_sha =
      '44f954b3ce6099dde86cebfe7984079a078a5872 + фікс 8cc634a (.qoder гілка qoder/uploads-perm-fix-20261101)';
    expectProblem(validateReleaseManifest(manifest), 'canonical_carpool_lifecycle_2026_11_01.source_sha', 'invalid_sha');
  });

  it('preserves the original narrative strings in the migrated manifest', () => {
    const text = readFileSync(join(root, 'RELEASE_MANIFEST.json'), 'utf8');
    for (const original of [
      '48ab36b (perf(journey): stop the largest GTFS feed from evicting itself on every search)',
      '1e26b9f (chore(journey): time GTFS feed loading and group search behind the debug flag)',
      '2c2342f (local commit on qoder/search-latency-20261031, not yet pushed)',
      '2c2342f perf(journey): stop rebuilding stop-pair projections and attribute segments-built',
      '44f954b3ce6099dde86cebfe7984079a078a5872 + фікс 8cc634a (.qoder гілка qoder/uploads-perm-fix-20261101)',
    ]) {
      assert.ok(text.includes(original), `migration must preserve the original evidence string: ${original}`);
    }
  });

  it('expands abbreviations only to SHAs already recorded elsewhere in the manifest', () => {
    const manifest = readReleaseManifest(join(root, 'RELEASE_MANIFEST.json'));
    assert.equal(
      manifest.search_latency_2026_10_31_part1.commits[0],
      manifest.search_latency_2026_10_31_part1.head_sha,
    );
    assert.equal(
      manifest.canonical_carpool_lifecycle_2026_11_01.source_fix_sha,
      manifest.canonical_carpool_rc2_2026_11_01.image_revision_label,
    );
  });
});

describe('release manifest validator — CLI and diagnostics', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'marshgo-manifest-gate-'));
  after(() => rmSync(temporary, { recursive: true, force: true }));

  function runCli(args) {
    try {
      const stdout = execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { status: 0, stdout, stderr: '' };
    } catch (error) {
      return { status: error.status, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
    }
  }

  it('exits 0 on the canonical manifest and names the verified pin count', () => {
    const result = runCli([join(root, 'RELEASE_MANIFEST.json')]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /6\/6 pins verified, status NOT_RELEASED, production_ready=false/);
  });

  it('exits 1 with field-specific diagnostics on a bad manifest', () => {
    const bad = join(temporary, 'bad.json');
    writeFileSync(bad, JSON.stringify(validManifest({ server_sha: '44f954b', production_ready: true })));
    const result = runCli([bad]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /server_sha: \[invalid_sha\]/);
    assert.match(result.stderr, /production_ready: \[status_contradiction\]/);
    // An unsupported production claim must also name every missing piece of evidence.
    assert.match(result.stderr, /deployed_site_sha: \[missing_evidence\]/);
    assert.match(result.stderr, /verification\.production_deployment: \[missing_evidence\]/);
    assert.match(result.stderr, /staging\.staging_ready: \[missing_evidence\]/);
    assert.match(result.stderr, /5 problems/);
  });

  it('exits 1 on an unreadable manifest instead of passing silently', () => {
    const result = runCli([join(temporary, 'does-not-exist.json')]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot read release manifest/);
  });

  it('exits 1 on malformed JSON', () => {
    const broken = join(temporary, 'broken.json');
    writeFileSync(broken, '{ "schema_version": 1, ');
    const result = runCli([broken]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot read release manifest/);
  });

  it('honours --profile for the legacy snapshot', () => {
    const legacyPath = join(root, 'docs/RELEASE_MANIFEST.json');
    assert.equal(runCli([legacyPath, '--profile', 'legacy']).status, 0);
    assert.equal(runCli([legacyPath, '--profile=legacy']).status, 0);
    assert.equal(runCli([legacyPath]).status, 1);
  });

  it('renders every diagnostic with its path, code and message', () => {
    const result = validateReleaseManifest(validManifest({ server_sha: 'TBD', api_version: '1' }));
    const lines = formatDiagnostics(result);
    assert.equal(lines.length, result.problems.length);
    assert.ok(lines.some((line) => line.includes('server_sha: [placeholder]')));
    assert.ok(lines.some((line) => line.includes('api_version: [invalid_pin]')));
  });

  it('renders legacy notes without turning them into failures', () => {
    const result = validateReleaseManifest(validManifest({ database_migration: 'prose pin' }), { profile: 'legacy' });
    assert.equal(result.ok, true);
    assert.ok(formatDiagnostics(result).some((line) => line.includes('(legacy note)')));
  });
});