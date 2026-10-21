import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { assertMaterializedWorktreeClean } from './materialized-worktree.mjs';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** @param {string | null} [releaseRoot] */
export function verifyMaterializedRelease(manifest, materialized, composeContents, releaseRoot = null) {
  if (!materialized || typeof materialized !== 'object') {
    throw new Error('Materialized release metadata is missing or malformed; rerun the release materializer.');
  }
  const expected = {
    serverSha: manifest.server_sha,
    siteSha: manifest.site_sha,
    adminSha: manifest.admin_sha,
    partnerSha: manifest.partner_sha,
    integrationSha: manifest.integration_sha,
  };
  for (const [name, value] of Object.entries(expected)) {
    if (!/^[a-f0-9]{40}$/.test(value ?? '')) {
      throw new Error(`Release manifest has an invalid ${name} pin.`);
    }
    if (materialized?.source?.[name] !== value) {
      throw new Error(`Materialized ${name} does not match RELEASE_MANIFEST.json; rerun the release materializer.`);
    }
  }

  const actualComposeSha = sha256(composeContents);
  if (materialized.composeSha256 !== actualComposeSha) {
    throw new Error('Generated Compose file does not match materialized.json; rerun the release materializer.');
  }

  if (releaseRoot) {
    const resolvedReleaseRoot = resolve(releaseRoot);
    const components = [
      ['server', 'MarshGO-Server', expected.serverSha, ['Dockerfile.marshgo', '.dockerignore']],
      ['site', 'MarshGO-Site', expected.siteSha, ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
      ['admin', 'MarshGO-Admin', expected.adminSha, ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
      ['partner', 'MarshGO-Partner', expected.partnerSha, ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
    ];
    const composeText = composeContents.toString('utf8');
    for (const [name, repository, pinnedSha, generatedInputs] of components) {
      const directory = join(resolvedReleaseRoot, `${name}-${pinnedSha}`);
      let stat;
      try {
        stat = lstatSync(directory);
      } catch {
        throw new Error(`Pinned ${name} build context is missing; rerun the release materializer.`);
      }
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error(`Pinned ${name} build context is not a regular directory.`);
      }
      const head = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      if (head !== pinnedSha) throw new Error(`Pinned ${name} build context HEAD has changed.`);
      const expectedRemote = `https://github.com/dima1203oleg/${repository}.git`;
      const remote = execFileSync('git', ['-C', directory, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
      if (remote !== expectedRemote) throw new Error(`Pinned ${name} build context origin is not canonical.`);
      assertMaterializedWorktreeClean(
        execFileSync('git', ['-C', directory, 'status', '--porcelain=v1', '--untracked-files=all'], { encoding: 'utf8' }),
        generatedInputs,
        name,
      );

      const inputs = materialized.sourceTrees?.[name];
      for (const [path, digestName] of [['Dockerfile.marshgo', 'dockerfileSha256'], ['.dockerignore', 'dockerignoreSha256'],
        ...(generatedInputs.includes('deploy/nginx.conf') ? [['deploy/nginx.conf', 'nginxConfigSha256']] : [])]) {
        const inputPath = join(directory, path);
        if (!existsSync(inputPath) || inputs?.[digestName] !== sha256(readFileSync(inputPath))) {
          throw new Error(`Pinned ${name} generated build input ${path} changed; rerun the release materializer.`);
        }
      }
      if (!composeText.includes(`context: ${JSON.stringify(directory)}`)) {
        throw new Error(`Generated Compose does not reference the pinned ${name} build context.`);
      }
    }
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [manifestPath, materializedPath, composePath] = process.argv.slice(2);
  if (!manifestPath || !materializedPath || !composePath) {
    process.stderr.write('Usage: verify-materialized-release.mjs <manifest> <materialized> <compose>\n');
    process.exitCode = 2;
  } else {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const materialized = JSON.parse(readFileSync(materializedPath, 'utf8'));
      const composeContents = readFileSync(composePath);
      verifyMaterializedRelease(manifest, materialized, composeContents, resolve(materializedPath, '..'));
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : 'Unable to verify materialized release.'}\n`);
      process.exitCode = 1;
    }
  }
}
