import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { assertMaterializedWorktreeClean } from './materialized-worktree.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const releaseRoot = join(root, '.release');
const manifest = JSON.parse(readFileSync(join(root, 'RELEASE_MANIFEST.json'), 'utf8'));
const materializedPath = join(releaseRoot, 'materialized.json');
const composePath = join(releaseRoot, 'compose.production.yml');

function fail(message) {
  throw new Error(`Release materialization check failed: ${message}`);
}

function git(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function assertDirectory(path, label) {
  try {
    const stat = lstatSync(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`${label} is not a real directory`);
  } catch (error) {
    if (error?.code === 'ENOENT') fail(`${label} does not exist`);
    throw error;
  }
}

function assertRegularFile(path, label) {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} is not a regular file`);
  } catch (error) {
    if (error?.code === 'ENOENT') fail(`${label} is missing`);
    throw error;
  }
}

function assertFileHash(path, expected, label) {
  assertRegularFile(path, label);
  if (sha256File(path) !== expected) fail(`${label} hash does not match materialization record`);
}

if (!existsSync(releaseRoot) || !existsSync(materializedPath) || !existsSync(composePath)) {
  fail('run ops/scripts/materialize-release.mjs first; refusing the root Compose template');
}
assertDirectory(releaseRoot, 'release directory');
assertRegularFile(materializedPath, 'materialization record');
assertRegularFile(composePath, 'generated release Compose file');

const record = JSON.parse(readFileSync(materializedPath, 'utf8'));
if (record.schemaVersion !== 2 || record.pinnedSourceTreesClean !== true) fail('unsupported or incomplete materialization record');
for (const key of ['server_sha', 'site_sha']) {
  if (!/^[a-f0-9]{40}$/.test(manifest[key] ?? '')) fail(`manifest ${key} is not a full commit SHA`);
}
if (record.source?.serverSha !== manifest.server_sha || record.source?.siteSha !== manifest.site_sha || record.source?.integrationSha !== manifest.integration_sha) {
  fail('materialized source SHAs do not match RELEASE_MANIFEST.json');
}

const server = join(releaseRoot, `server-${manifest.server_sha}`);
const site = join(releaseRoot, `site-${manifest.site_sha}`);
assertDirectory(server, 'pinned Server checkout');
assertDirectory(site, 'pinned Site checkout');

const expectedRemotes = [
  [server, 'https://github.com/dima1203oleg/MarshGO-Server.git', manifest.server_sha, 'Server', ['Dockerfile.marshgo', '.dockerignore']],
  [site, 'https://github.com/dima1203oleg/MarshGO-Site.git', manifest.site_sha, 'Site', ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf']],
];
for (const [directory, remote, revision, name, generated] of expectedRemotes) {
  if (git(directory, ['remote', 'get-url', 'origin']) !== remote) fail(`${name} origin is unexpected`);
  if (git(directory, ['rev-parse', 'HEAD']) !== revision) fail(`${name} HEAD does not match manifest`);
  assertMaterializedWorktreeClean(git(directory, ['status', '--porcelain=v1', '--untracked-files=all']), generated, name);
}

assertFileHash(join(server, 'Dockerfile.marshgo'), record.sourceTrees?.server?.dockerfileSha256, 'Server Dockerfile');
assertFileHash(join(server, '.dockerignore'), record.sourceTrees?.server?.dockerignoreSha256, 'Server .dockerignore');
assertFileHash(join(site, 'Dockerfile.marshgo'), record.sourceTrees?.site?.dockerfileSha256, 'Site Dockerfile');
assertFileHash(join(site, '.dockerignore'), record.sourceTrees?.site?.dockerignoreSha256, 'Site .dockerignore');
assertFileHash(join(site, 'deploy/nginx.conf'), record.sourceTrees?.site?.nginxConfigSha256, 'Site nginx config');
assertFileHash(composePath, record.composeSha256, 'generated release Compose file');

const compose = readFileSync(composePath, 'utf8');
if (!compose.includes(`context: ${JSON.stringify(server)}\n      dockerfile: Dockerfile.marshgo`)) fail('API build context is not the pinned Server checkout');
if (!compose.includes(`context: ${JSON.stringify(site)}\n      dockerfile: Dockerfile.marshgo`)) fail('Web build context is not the pinned Site checkout');
if (compose.includes('context: .\n      dockerfile: Dockerfile.api') || compose.includes('context: .\n      dockerfile: Dockerfile.web')) {
  fail('generated Compose still points at the central checkout');
}

process.stdout.write(`Verified production Compose contexts: Server ${manifest.server_sha}, Site ${manifest.site_sha}\n`);
