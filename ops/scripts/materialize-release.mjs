import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

mkdirSync(releaseRoot, { recursive: true });
const serverSha = sha('server_sha');
const siteSha = sha('site_sha');
const server = checkout('server', 'MarshGO-Server', serverSha);
const site = checkout('site', 'MarshGO-Site', siteSha);

copyFileSync(join(root, 'ops/docker/Dockerfile.server'), join(server, 'Dockerfile.marshgo'));
copyFileSync(join(root, 'ops/docker/Dockerfile.site'), join(site, 'Dockerfile.marshgo'));
const siteDeploy = join(site, 'deploy');
mkdirSync(siteDeploy, { recursive: true });
copyFileSync(join(root, 'deploy/nginx.conf'), join(siteDeploy, 'nginx.conf'));

let compose = readFileSync(join(root, 'compose.production.yml'), 'utf8');
compose = compose.replaceAll('context: .\n      dockerfile: Dockerfile.api', `context: ${JSON.stringify(server)}\n      dockerfile: Dockerfile.marshgo`);
compose = compose.replace('context: .\n      dockerfile: Dockerfile.web', `context: ${JSON.stringify(site)}\n      dockerfile: Dockerfile.marshgo`);
compose = compose.replace('./deploy/Caddyfile:/etc/caddy/Caddyfile:ro', `${join(root, 'deploy/Caddyfile')}:/etc/caddy/Caddyfile:ro`);
if (compose.includes('context: .\n      dockerfile: Dockerfile.') || compose.includes('./deploy/Caddyfile')) {
  throw new Error('Could not bind every production build and proxy config to the pinned release source/configuration.');
}
writeFileSync(join(releaseRoot, 'compose.production.yml'), compose);
writeFileSync(join(releaseRoot, 'materialized.json'), `${JSON.stringify({ serverSha, siteSha, integrationSha: manifest.integration_sha }, null, 2)}\n`);
console.log(`Materialized canonical source: Server ${serverSha}, Site ${siteSha}`);
