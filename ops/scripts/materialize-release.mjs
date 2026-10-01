import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { assertMaterializedWorktreeClean } from './materialized-worktree.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = join(root, 'RELEASE_MANIFEST.json');
const releaseRoot = join(root, '.release');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sha = (name) => {
  const value = manifest[name];
  if (!/^[a-f0-9]{40}$/.test(value ?? '')) throw new Error(`RELEASE_MANIFEST.json has invalid ${name}`);
  return value;
};

function git(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

function checkout(name, repository, revision) {
  const destination = join(releaseRoot, `${name}-${revision}`);
  if (!existsSync(destination)) {
    execFileSync('git', ['clone', '--no-checkout', `https://github.com/dima1203oleg/${repository}.git`, destination], { stdio: 'inherit' });
    git(destination, ['checkout', '--detach', revision]);
  }
  const actual = git(destination, ['rev-parse', 'HEAD']);
  if (actual !== revision) throw new Error(`${name} checkout SHA mismatch: expected ${revision}, got ${actual}`);
  return destination;
}

function installGeneratedFile(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  try {
    const existing = lstatSync(destination);
    if (!existing.isFile() || existing.isSymbolicLink()) {
      throw new Error(`Refusing non-regular generated build input: ${destination}`);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  copyFileSync(source, destination);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256File(path) {
  return sha256(readFileSync(path));
}

mkdirSync(releaseRoot, { recursive: true });
const serverSha = sha('server_sha');
const siteSha = sha('site_sha');
const server = checkout('server', 'MarshGO-Server', serverSha);
const site = checkout('site', 'MarshGO-Site', siteSha);

installGeneratedFile(join(root, 'ops/docker/Dockerfile.server'), join(server, 'Dockerfile.marshgo'));
installGeneratedFile(join(root, 'ops/docker/server.dockerignore'), join(server, '.dockerignore'));
installGeneratedFile(join(root, 'ops/docker/Dockerfile.site'), join(site, 'Dockerfile.marshgo'));
installGeneratedFile(join(root, 'ops/docker/site.dockerignore'), join(site, '.dockerignore'));
const siteDeploy = join(site, 'deploy');
try {
  const deployDirectory = lstatSync(siteDeploy);
  if (!deployDirectory.isDirectory() || deployDirectory.isSymbolicLink()) {
    throw new Error(`Refusing non-directory Site deploy path: ${siteDeploy}`);
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
mkdirSync(siteDeploy, { recursive: true });
installGeneratedFile(join(root, 'deploy/nginx.conf'), join(siteDeploy, 'nginx.conf'));

const generatedInputs = {
  server: ['Dockerfile.marshgo', '.dockerignore'],
  site: ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf'],
};
for (const [name, directory] of [['Server', server], ['Site', site]]) {
  assertMaterializedWorktreeClean(
    git(directory, ['status', '--porcelain=v1', '--untracked-files=all']),
    generatedInputs[name.toLowerCase()],
    name,
  );
}

let compose = readFileSync(join(root, 'compose.production.yml'), 'utf8');
compose = compose.replaceAll('context: .\n      dockerfile: Dockerfile.api', `context: ${JSON.stringify(server)}\n      dockerfile: Dockerfile.marshgo`);
compose = compose.replace('context: .\n      dockerfile: Dockerfile.web', `context: ${JSON.stringify(site)}\n      dockerfile: Dockerfile.marshgo`);
compose = compose.replace('./deploy/Caddyfile:/etc/caddy/Caddyfile:ro', `${join(root, 'deploy/Caddyfile')}:/etc/caddy/Caddyfile:ro`);
if (compose.includes('context: .\n      dockerfile: Dockerfile.') || compose.includes('./deploy/Caddyfile')) {
  throw new Error('Could not bind every production build and proxy config to the pinned release source/configuration.');
}
writeFileSync(join(releaseRoot, 'compose.production.yml'), compose);
const materialization = {
  schemaVersion: 2,
  source: { serverSha, siteSha, integrationSha: manifest.integration_sha },
  sourceTrees: {
    server: {
      generatedInputs: generatedInputs.server,
      dockerfileSha256: sha256File(join(server, 'Dockerfile.marshgo')),
      dockerignoreSha256: sha256File(join(server, '.dockerignore')),
    },
    site: {
      generatedInputs: generatedInputs.site,
      dockerfileSha256: sha256File(join(site, 'Dockerfile.marshgo')),
      dockerignoreSha256: sha256File(join(site, '.dockerignore')),
      nginxConfigSha256: sha256File(join(siteDeploy, 'nginx.conf')),
    },
  },
  composeSha256: sha256(compose),
  pinnedSourceTreesClean: true,
};
writeFileSync(join(releaseRoot, 'materialized.json'), `${JSON.stringify(materialization, null, 2)}\n`);
process.stdout.write(`Materialized canonical source: Server ${serverSha}, Site ${siteSha}\n`);
