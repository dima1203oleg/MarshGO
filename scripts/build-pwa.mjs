import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// E2E serves the web bundle from dist. Never reuse the simulator build, which embeds
// an HTTP localhost API origin that is cross-origin and unavailable to browser runs.
const env = { ...process.env };
delete env.CAPACITOR_BUILD;
delete env.VITE_API_BASE_URL;
// The tile provider used by Playwright is an isolated local fixture. Keep it in
// the test build only; production/site/native release builds use provider config.
env.VITE_MAP_TILE_URL = 'http://127.0.0.1:3306/tiles/{z}/{x}/{y}.png';
env.VITE_MAP_TILE_ATTRIBUTION = 'MARSHGO isolated E2E map fixture';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'RELEASE_MANIFEST.json'), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(manifest.site_sha ?? '')) throw new Error('RELEASE_MANIFEST.json must contain an immutable Site SHA for browser tests.');
const siteDirectory = join(root, '.release', `site-${manifest.site_sha}`);
const materialize = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (!existsSync(join(siteDirectory, 'package.json'))) materialize('node', ['ops/scripts/materialize-release.mjs']);
if (!existsSync(join(siteDirectory, 'package.json'))) throw new Error(`Pinned Site checkout is missing: ${siteDirectory}`);
const siteHead = spawnSync('git', ['-C', siteDirectory, 'rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
if (siteHead.status !== 0) throw new Error(`Could not verify pinned Site checkout: ${siteHead.stderr ?? ''}`);
if (siteHead.stdout.trim() !== manifest.site_sha) throw new Error(`Pinned Site SHA mismatch: expected ${manifest.site_sha}, got ${siteHead.stdout.trim()}`);
if (!existsSync(join(siteDirectory, 'node_modules', '.package-lock.json'))) {
  materialize('npm', ['ci', '--prefix', siteDirectory, '--no-audit', '--no-fund']);
}
const result = spawnSync('npm', ['run', 'build'], { cwd: siteDirectory, env, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
process.stdout.write(`Built canonical Site ${manifest.site_sha} for browser acceptance.\n`);
