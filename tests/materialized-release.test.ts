import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyMaterializedRelease } from '../ops/scripts/verify-materialized-release.mjs';

const source = {
  serverSha: 'a'.repeat(40),
  siteSha: 'b'.repeat(40),
  adminSha: 'c'.repeat(40),
  partnerSha: 'd'.repeat(40),
  integrationSha: 'e'.repeat(40),
};
const manifest = {
  server_sha: source.serverSha,
  site_sha: source.siteSha,
  admin_sha: source.adminSha,
  partner_sha: source.partnerSha,
  integration_sha: source.integrationSha,
};
const compose = Buffer.from('services:\n  api:\n    build: exact-pin\n');
const materialized = {
  source,
  composeSha256: createHash('sha256').update(compose).digest('hex'),
};

test('accepts a Compose artifact bound to every exact manifest pin', () => {
  assert.equal(verifyMaterializedRelease(manifest, materialized, compose), true);
});

test('rejects a generated Compose artifact with a stale source pin', () => {
  assert.throws(() => verifyMaterializedRelease(manifest, {
    ...materialized,
    source: { ...source, siteSha: 'f'.repeat(40) },
  }, compose), /does not match RELEASE_MANIFEST/);
});

test('rejects a Compose file changed after materialization', () => {
  assert.throws(() => verifyMaterializedRelease(manifest, materialized,
    Buffer.from('services:\n  api:\n    build: stale-context\n')), /does not match materialized.json/);
});

test('rejects missing or malformed release SHA pins', () => {
  assert.throws(() => verifyMaterializedRelease({ ...manifest, server_sha: undefined }, materialized, compose),
    /invalid serverSha/);
});

test('rechecks pinned Git trees, canonical origins, generated inputs and Compose contexts at use time', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'marshgo-release-integrity-'));
  try {
    const components = [
      ['server', 'MarshGO-Server', ['Dockerfile.marshgo', '.dockerignore']],
      ['site', 'MarshGO-Site', ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
      ['admin', 'MarshGO-Admin', ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
      ['partner', 'MarshGO-Partner', ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
    ] as const;
    const actualManifest: Record<string, string> = { integration_sha: 'e'.repeat(40) };
    const sourceTreeMetadata: Record<string, Record<string, string>> = {};
    const composeContexts: string[] = [];

    for (const [name, repository, generatedInputs] of components) {
      const directory = join(temporaryRoot, `${name}-placeholder`);
      mkdirSync(directory, { recursive: true });
      execFileSync('git', ['init', '-q', directory]);
      execFileSync('git', ['-C', directory, 'config', 'user.email', 'test@example.invalid']);
      execFileSync('git', ['-C', directory, 'config', 'user.name', 'Release Integrity Test']);
      writeFileSync(join(directory, 'source.txt'), `${repository}\n`);
      execFileSync('git', ['-C', directory, 'add', 'source.txt']);
      execFileSync('git', ['-C', directory, 'commit', '-qm', 'fixture source']);
      const pinnedSha = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      execFileSync('git', ['-C', directory, 'remote', 'add', 'origin', `https://github.com/dima1203oleg/${repository}.git`]);

      const gitDirectory = join(temporaryRoot, `${name}-${pinnedSha}`);
      execFileSync('git', ['clone', '-q', directory, gitDirectory]);
      execFileSync('git', ['-C', gitDirectory, 'remote', 'set-url', 'origin', `https://github.com/dima1203oleg/${repository}.git`]);
      actualManifest[`${name}_sha`] = pinnedSha;
      composeContexts.push(`  ${name}:\n    build:\n      context: ${JSON.stringify(gitDirectory)}\n`);

      const inputMetadata: Record<string, string> = {};
      for (const path of generatedInputs) {
        const absolutePath = join(gitDirectory, path);
        mkdirSync(join(absolutePath, '..'), { recursive: true });
        writeFileSync(absolutePath, `generated ${repository} ${path}\n`);
        const digestName = path === 'Dockerfile.marshgo' ? 'dockerfileSha256'
          : path === '.dockerignore' ? 'dockerignoreSha256' : 'nginxConfigSha256';
        inputMetadata[digestName] = createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
      }
      sourceTreeMetadata[name] = inputMetadata;
    }

    const composeContents = Buffer.from(`services:\n${composeContexts.join('')}`);
    const actualMaterialized = {
      source: {
        serverSha: actualManifest.server_sha,
        siteSha: actualManifest.site_sha,
        adminSha: actualManifest.admin_sha,
        partnerSha: actualManifest.partner_sha,
        integrationSha: actualManifest.integration_sha,
      },
      sourceTrees: sourceTreeMetadata,
      composeSha256: createHash('sha256').update(composeContents).digest('hex'),
    };

    assert.equal(verifyMaterializedRelease(actualManifest, actualMaterialized, composeContents, temporaryRoot), true);
    writeFileSync(join(temporaryRoot, `server-${actualManifest.server_sha}`, 'unexpected.txt'), 'modified after materialization');
    assert.throws(() => verifyMaterializedRelease(actualManifest, actualMaterialized, composeContents, temporaryRoot),
      /dirty outside generated files/);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
