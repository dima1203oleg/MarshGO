import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

test('production stack serves every pinned web interface through the central Server', () => {
  const compose = read('compose.production.yml');
  const caddy = read('deploy/Caddyfile');
  const materializer = read('ops/scripts/materialize-release.mjs');

  for (const service of ['api', 'web', 'admin', 'partner', 'proxy']) {
    assert.match(compose, new RegExp(`^  ${service}:`, 'm'), `${service} service is declared`);
  }
  assert.match(compose, /admin\.\$\{APP_DOMAIN\}/, 'Admin origin is permitted by the API CORS configuration');
  assert.match(compose, /partner\.\$\{APP_DOMAIN\}/, 'Partner origin is permitted by the API CORS configuration');
  assert.match(caddy, /admin\.\{\$APP_DOMAIN\}[\s\S]*reverse_proxy admin:8080/);
  assert.match(caddy, /partner\.\{\$APP_DOMAIN\}[\s\S]*reverse_proxy partner:8080/);
  assert.match(materializer, /sha\('admin_sha'\)/);
  assert.match(materializer, /sha\('partner_sha'\)/);
  assert.match(materializer, /MarshGO-Admin/);
  assert.match(materializer, /MarshGO-Partner/);
});

test('bootstrap, update, and CI build and roll back the same portal set', () => {
  const bootstrap = read('ops/scripts/bootstrap.sh');
  const update = read('ops/scripts/update.sh');
  const ci = read('.github/workflows/ci.yml');

  for (const script of [bootstrap, update, ci]) {
    assert.match(script, /api web admin partner/);
  }
  assert.match(update, /for service in api web admin partner; do/);
  assert.match(update, /compose up -d api web admin partner proxy/);
});

test('release manifest pins all five repositories and keeps the candidate unreleased', () => {
  const manifest = JSON.parse(read('RELEASE_MANIFEST.json')) as Record<string, unknown>;
  for (const component of ['server', 'site', 'admin', 'partner', 'ios']) {
    assert.match(String(manifest[`${component}_sha`]), /^[a-f0-9]{40}$/, `${component} SHA is immutable`);
  }
  assert.equal(manifest.status, 'NOT_RELEASED');
  assert.equal(manifest.production_ready, false);
  assert.equal(manifest.ready_for_server_deployment, false);
});
