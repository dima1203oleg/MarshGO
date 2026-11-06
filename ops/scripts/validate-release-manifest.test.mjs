import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import {
  NULLABLE_SHA_FIELDS,
  REQUIRED_PINS,
  SCHEMA_VERSION,
  readReleaseManifest,
  validateReleaseManifest,
} from './validate-release-manifest.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const EXACT = 'a'.repeat(40);

function validManifest() {
  return {
    schema_version: SCHEMA_VERSION,
    status: 'NOT_RELEASED',
    production_ready: false,
    ready_for_server_deployment: false,
    deployed_site_sha: null,
    server_sha: 'a'.repeat(40),
    site_sha: 'b'.repeat(40),
    admin_sha: 'c'.repeat(40),
    partner_sha: 'd'.repeat(40),
    ios_sha: 'e'.repeat(40),
    integration_sha: 'f'.repeat(40),
  };
}

/** Copy the release scripts into a throwaway root so the real one is untouched. */
function sandboxTree(manifest) {
  const sandbox = mkdtempSync(join(tmpdir(), 'marshgo-manifest-'));
  const sandboxScripts = join(sandbox, 'ops/scripts');
  mkdirSync(sandboxScripts, { recursive: true });
  for (const entry of readdirSync(scriptsDir)) {
    if (!entry.endsWith('.mjs') || entry.endsWith('.test.mjs')) continue;
    copyFileSync(join(scriptsDir, entry), join(sandboxScripts, entry));
  }
  writeFileSync(join(sandbox, 'RELEASE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return sandbox;
}

function runMaterializer(sandbox) {
  try {
    execFileSync(process.execPath, [join(sandbox, 'ops/scripts/materialize-release.mjs')], {
      cwd: sandbox,
      // An empty PATH makes git unresolvable, so a manifest that passes the
      // gate cannot reach the network or clone a pinned repository.
      env: { ...process.env, PATH: '' },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stderr: '' };
  } catch (error) {
    return { status: error.status ?? 1, stderr: `${error.stderr ?? ''}${error.message}` };
  }
}

describe('validateReleaseManifest', () => {
  it('accepts the committed RELEASE_MANIFEST.json', () => {
    assert.deepEqual(validateReleaseManifest(readReleaseManifest()), []);
  });

  it('accepts a minimal exact manifest', () => {
    assert.deepEqual(validateReleaseManifest(validManifest()), []);
  });

  it('rejects a manifest that is not an object', () => {
    assert.deepEqual(validateReleaseManifest(['not', 'a', 'manifest']), [
      'RELEASE_MANIFEST.json must be a JSON object',
    ]);
  });

  it('rejects an unexpected schema_version', () => {
    const problems = validateReleaseManifest({ ...validManifest(), schema_version: 2 });
    assert.ok(problems.some((p) => p.startsWith('schema_version: expected 1, got 2')), problems.join('\n'));
  });

  it('rejects every required pin that is not an exact 40-char lowercase SHA', () => {
    for (const pin of REQUIRED_PINS) {
      for (const [label, value] of [
        ['missing', undefined],
        ['truncated', 'a'.repeat(39)],
        ['too long', 'a'.repeat(41)],
        ['uppercase', 'A'.repeat(40)],
        ['non-hex', 'z'.repeat(40)],
        ['prose', `${'a'.repeat(7)} (local commit, not yet pushed)`],
      ]) {
        const manifest = validManifest();
        if (value === undefined) delete manifest[pin];
        else manifest[pin] = value;
        const problems = validateReleaseManifest(manifest);
        assert.ok(
          problems.some((p) => p.startsWith(`${pin}:`)),
          `${pin} ${label} was not rejected: ${JSON.stringify(value)}`,
        );
      }
    }
  });

  it('rejects integration_sha specifically, the pin the materializer used to pass through raw', () => {
    const problems = validateReleaseManifest({ ...validManifest(), integration_sha: 'a5e2004' });
    assert.ok(problems.some((p) => p.startsWith('integration_sha:')), problems.join('\n'));
  });

  it('rejects prose stored in a nested field whose name claims an exact SHA', () => {
    const problems = validateReleaseManifest({
      ...validManifest(),
      evidence_block: { head_sha: '2c2342f (local commit, not yet pushed)' },
    });
    assert.ok(problems.some((p) => p.startsWith('evidence_block.head_sha:')), problems.join('\n'));
  });

  it('rejects an abbreviated entry in a commits array', () => {
    const problems = validateReleaseManifest({
      ...validManifest(),
      evidence_block: { commits: [EXACT, '48ab36b (perf: something)'] },
    });
    assert.match(problems.join('\n'), /evidence_block\.commits\[1\]/);
  });

  it('rejects a wrong-width sha256 and tree hash', () => {
    const problems = validateReleaseManifest({
      ...validManifest(),
      artifact: { compose_sha256: 'a'.repeat(63), site_uncommitted_tree_hash12: 'a'.repeat(11) },
    });
    assert.match(problems.join('\n'), /artifact\.compose_sha256: sha256 digest must be 64/);
    assert.match(problems.join('\n'), /artifact\.site_uncommitted_tree_hash12: 12-char tree hash must be 12/);
  });

  it('accepts a pin correction record only when it names the exact commit', () => {
    const base = { ...validManifest(), pins_corrected: { server_sha: { was: 'fc5b589ca395', now: '44f954b3ce60', now_full: EXACT } } };
    assert.deepEqual(validateReleaseManifest(base), []);

    const problems = validateReleaseManifest({
      ...validManifest(),
      pins_corrected: { server_sha: { was: 'fc5b589ca395', now: '44f954b3ce60', now_full: '44f954b3ce60' } },
    });
    assert.match(problems.join('\n'), /pins_corrected\.server_sha\.now_full/);
  });

  it('allows null only for the fields listed as nullable', () => {
    assert.deepEqual(validateReleaseManifest(validManifest()), []);
    for (const field of NULLABLE_SHA_FIELDS) {
      assert.deepEqual(validateReleaseManifest({ ...validManifest(), [field]: null }), []);
    }
    const problems = validateReleaseManifest({ ...validManifest(), ios_sha: null });
    assert.ok(problems.some((p) => p.startsWith('ios_sha:')), problems.join('\n'));
  });

  it('keeps the candidate unreleased: NOT_RELEASED forbids readiness flags', () => {
    assert.match(
      validateReleaseManifest({ ...validManifest(), production_ready: true, deployed_site_sha: validManifest().site_sha }).join('\n'),
      /production_ready: must be false while status is NOT_RELEASED/,
    );
    assert.match(
      validateReleaseManifest({ ...validManifest(), ready_for_server_deployment: true }).join('\n'),
      /ready_for_server_deployment: must be false while status is NOT_RELEASED/,
    );
  });

  it('refuses production_ready without an exact deployed SHA matching the pin', () => {
    const released = { ...validManifest(), status: 'RELEASED', production_ready: true };

    assert.match(
      validateReleaseManifest({ ...released, deployed_site_sha: null }).join('\n'),
      /deployed_site_sha: must be an exact 40-char commit SHA when production_ready is true/,
    );
    assert.match(
      validateReleaseManifest({ ...released, deployed_site_sha: 'c'.repeat(40) }).join('\n'),
      /deployed_site_sha: deployed .* does not match pinned site_sha/,
    );
    assert.deepEqual(validateReleaseManifest({ ...released, deployed_site_sha: 'b'.repeat(40) }), []);
  });

  it('rejects a manifest missing its release status fields', () => {
    const manifest = validManifest();
    delete manifest.status;
    assert.match(validateReleaseManifest(manifest).join('\n'), /status: required release status field is missing/);
  });
});

describe('materialize-release fail-fast gate', () => {
  it('stops before creating .release when the manifest is not exact', () => {
    const sandbox = sandboxTree({ ...validManifest(), integration_sha: 'a5e2004' });
    try {
      const result = runMaterializer(sandbox);
      assert.notEqual(result.status, 0, 'an inexact manifest must fail materialization');
      assert.match(result.stderr, /not an exact-SHA release manifest/);
      assert.match(result.stderr, /integration_sha/);
      assert.equal(existsSync(join(sandbox, '.release')), false, 'no release work may start on an inexact manifest');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('passes the gate on an exact manifest and only then reaches the git checkout step', () => {
    const sandbox = sandboxTree(validManifest());
    try {
      const result = runMaterializer(sandbox);
      assert.notEqual(result.status, 0, 'the sandbox has no git on PATH, so the checkout must fail');
      assert.doesNotMatch(result.stderr, /not an exact-SHA release manifest/, 'the gate must not reject an exact manifest');
      assert.match(result.stderr, /ENOENT|git/, 'execution must advance past the gate to the git checkout');
      assert.equal(existsSync(join(sandbox, '.release')), true, 'an exact manifest is allowed to start materialization');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
