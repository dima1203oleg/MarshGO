import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import * as ts from 'typescript';
import { assertMaterializedWorktreeClean } from '../ops/scripts/materialized-worktree.mjs';

const generated = ['Dockerfile.marshgo', '.dockerignore', 'deploy/nginx.conf'];

test('accepts a clean pinned checkout', () => {
  assert.doesNotThrow(() => assertMaterializedWorktreeClean('', generated, 'Site'));
});

test('accepts only the known generated deployment files', () => {
  assert.doesNotThrow(() => assertMaterializedWorktreeClean(
    '?? Dockerfile.marshgo\n?? .dockerignore\n?? deploy/nginx.conf',
    generated,
    'Site',
  ));
  assert.doesNotThrow(() => assertMaterializedWorktreeClean(
    '?? Dockerfile.marshgo\n M .dockerignore\n M deploy/nginx.conf',
    generated,
    'Site',
  ));
});

test('rejects tracked edits in a pinned checkout', () => {
  assert.throws(
    () => assertMaterializedWorktreeClean(' M server/index.ts', generated, 'Server'),
    /Server pinned release checkout is dirty/,
  );
});

test('rejects unrelated untracked files such as local environment files', () => {
  assert.throws(
    () => assertMaterializedWorktreeClean('?? .env.production', generated, 'Site'),
    /\.env\.production/,
  );
});

test('rejects staged files and deletions', () => {
  assert.throws(() => assertMaterializedWorktreeClean('A  server/new.ts', generated, 'Server'));
  assert.throws(() => assertMaterializedWorktreeClean(' D shared/contracts.ts', generated, 'Server'));
  assert.throws(() => assertMaterializedWorktreeClean('M  .dockerignore', generated, 'Server'));
  assert.throws(() => assertMaterializedWorktreeClean(' D .dockerignore', generated, 'Server'));
});

const serverPin = 'a'.repeat(40);

function serverLauncher(env: Record<string, string> = {}, options: { head?: string; gitStatus?: number; dependencies?: boolean; preflight?: boolean; manifestPin?: string } = {}) {
  const calls: { command: string; args: string[]; cwd?: string }[] = [];
  const stopped = {};
  let exitCode = 0;
  const offlineProcess = {
    env, argv: ['node', 'run-e2e-server.mjs', ...(options.preflight ? ['--preflight'] : [])],
    platform: 'darwin', cwd: () => '/offline',
    stderr: { write: () => {} }, on: () => {},
    exit: (code: number) => { exitCode = code; throw stopped; },
  };
  const source = readFileSync(new URL('../scripts/run-e2e-server.mjs', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const imports: Record<string, unknown> = {
    'node:process': offlineProcess,
    'node:path': { resolve },
    'node:fs': { readFileSync: () => JSON.stringify({ server_sha: options.manifestPin ?? serverPin }), existsSync: () => options.dependencies ?? true },
    'node:child_process': {
      spawn: (command: string, args: string[], config: { cwd?: string }) => {
        calls.push({ command, args: [...args], cwd: config.cwd });
        return {
          stdout: { on: (_event: string, callback: (head: string) => void) => callback(`${options.head ?? serverPin}\n`) },
          on: (event: string, callback: (code: number) => void) => { if (command === 'git' && event === 'close') callback(options.gitStatus ?? 0); },
          killed: false, kill: () => {},
        };
      },
    },
  };
  try {
    runInNewContext(compiled, {
      exports: {}, require: (name: string) => {
        assert.ok(name in imports, `Unexpected launcher import: ${name}`);
        return imports[name];
      },
    }, { timeout: 2000 });
  } catch (error) {
    if (error !== stopped) throw error;
  }
  return { calls, exitCode };
}

function e2eSetup(env: Record<string, string> = {}, failPreflight = false) {
  const source = readFileSync(new URL('../scripts/run-e2e.sh', import.meta.url), 'utf8');
  const end = source.indexOf('if [[ -n "${E2E_DIST_DIR:-}" ]]');
  assert.ok(end > 0);
  const stubs = `
node() {
  if [[ "$1" == "-e" ]]; then
    case "$2" in
      *hostname*) printf '127.0.0.1' ;;
      *pathname*) printf 'marshgo_e2e' ;;
      *server_sha*) printf '%s' "$OFFLINE_PIN" ;;
      *) return 99 ;;
    esac
    return
  fi
  case "$1" in
    ops/scripts/materialize-release.mjs) printf 'materialize\\n' ;;
    scripts/run-e2e-server.mjs)
      printf 'preflight:%s:%s\\n' "\${E2E_SERVER_PINNED_SHA:-missing}" "\${2:-missing}"
      [[ "$OFFLINE_FAIL" != "true" ]] || return 2 ;;
    scripts/ensure-e2e-database.ts) printf 'database\\n' ;;
    scripts/reset-e2e-auth.ts) printf 'reset\\n' ;;
    *) return 99 ;;
  esac
}
npm() { printf 'npm:%s\\n' "$*"; }
`;
  return spawnSync('/bin/bash', ['-c', stubs + source.slice(0, end)], {
    encoding: 'utf8', timeout: 5000,
    env: { PATH: '/usr/bin:/bin', E2E_API_PORT: '3302', OFFLINE_PIN: serverPin, OFFLINE_FAIL: String(failPreflight), ...env },
  });
}

for (const pin of ['', 'main', 'A'.repeat(40), 'a'.repeat(39)]) {
  test(`override launcher rejects invalid immutable pin ${pin || '(missing)'} before git or API`, () => {
    const result = serverLauncher({ E2E_SERVER_DIR: '/offline/reviewed', E2E_SERVER_PINNED_SHA: pin });
    assert.equal(result.exitCode, 2);
    assert.equal(result.calls.length, 0);
  });
}

test('default launcher enforces manifest SHA without an environment pin', () => {
  const rejected = serverLauncher({}, { head: 'b'.repeat(40) });
  assert.equal(rejected.exitCode, 2);
  assert.deepEqual(rejected.calls.map((call) => call.command), ['git']);
  assert.equal(serverLauncher({}, { manifestPin: 'main' }).calls.length, 0);
  const accepted = serverLauncher();
  assert.equal(accepted.exitCode, 0);
  assert.deepEqual(accepted.calls.map((call) => call.command), ['git', 'npm']);
  assert.deepEqual(accepted.calls[1].args, ['run', 'api']);
  assert.equal(accepted.calls[1].cwd, `/offline/.release/server-${serverPin}`);
});

test('override launcher rejects git failure and SHA mismatch before API', () => {
  for (const options of [{ gitStatus: 128 }, { head: 'b'.repeat(40) }]) {
    const result = serverLauncher({ E2E_SERVER_DIR: '/offline/reviewed', E2E_SERVER_PINNED_SHA: serverPin }, options);
    assert.equal(result.exitCode, 2);
    assert.deepEqual(result.calls.map((call) => call.command), ['git']);
  }
});

test('preflight checks SHA without dependencies or starting an API', () => {
  const result = serverLauncher({ E2E_SERVER_DIR: '/offline/reviewed', E2E_SERVER_PINNED_SHA: serverPin }, { preflight: true, dependencies: false });
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.calls.map((call) => call.command), ['git']);
  const missingDependencies = serverLauncher({}, { dependencies: false });
  assert.equal(missingDependencies.exitCode, 2);
  assert.deepEqual(missingDependencies.calls.map((call) => call.command), ['git']);
});

test('shell setup retains explicit pin and verifies it before database or npm work', () => {
  const result = e2eSetup({ E2E_SERVER_DIR: '/offline/reviewed', E2E_SERVER_PINNED_SHA: serverPin });
  assert.equal(result.status, 0, result.stderr);
  const events = result.stdout.trim().split('\n');
  assert.deepEqual(events.slice(0, 3), ['materialize', `preflight:${serverPin}:--preflight`, 'database']);
  assert.equal(events[3], 'npm:ci --prefix /offline/reviewed --no-audit --no-fund');
  assert.equal(events[4], 'npm:run db:migrate --prefix /offline/reviewed');
  assert.equal(events[5], 'reset');
});

test('shell setup missing or malformed override pin stops before materialization and DB', () => {
  for (const pin of ['', 'main', 'A'.repeat(40)]) {
    const result = e2eSetup({ E2E_SERVER_DIR: '/offline/reviewed', E2E_SERVER_PINNED_SHA: pin });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
  }
});

test('shell setup preflight failure stops before database, dependencies and migrations', () => {
  const result = e2eSetup({ E2E_SERVER_DIR: '/offline/reviewed', E2E_SERVER_PINNED_SHA: serverPin }, true);
  assert.equal(result.status, 2);
  assert.deepEqual(result.stdout.trim().split('\n'), ['materialize', `preflight:${serverPin}:--preflight`]);
});

test('shell default selects manifest pin before any database setup', () => {
  const result = e2eSetup();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split('\n').slice(0, 3), ['materialize', `preflight:${serverPin}:--preflight`, 'database']);
});

function integrationSetup(env: Record<string, string> = {}) {
  const source = readFileSync(new URL('../scripts/run-integration-tests.sh', import.meta.url), 'utf8');
  const stubs = `
node() {
  if [[ "$1" == "-e" ]]; then
    case "$2" in
      *hostname*|*pathname*) "$OFFLINE_NODE" "$@" ;;
      *server_sha*) printf '%s' "$OFFLINE_PIN" ;;
      *) return 99 ;;
    esac
    return
  fi
  case "$1" in
    ops/scripts/materialize-release.mjs)
      printf 'materialize\\n'
      [[ "$OFFLINE_FAIL" != "materialize" ]] || return 17 ;;
    scripts/run-e2e-server.mjs)
      printf 'preflight:%s:%s:%s\\n' "$E2E_SERVER_DIR" "$E2E_SERVER_PINNED_SHA" "$2"
      [[ "$OFFLINE_FAIL" != "preflight" ]] || return 2 ;;
    *) return 99 ;;
  esac
}
npm() {
  printf 'npm:%s\\n' "$*"
  case "$1 \${2:-}" in
    'ci --prefix') [[ "$OFFLINE_FAIL" != "install" ]] || return 18 ;;
    'run test:integration')
      printf 'database:%s\\n' "$API_TEST_DATABASE_URL"
      [[ "$OFFLINE_FAIL" != "suite" ]] || return 19 ;;
    *) return 99 ;;
  esac
}
`;
  return spawnSync('/bin/bash', ['-c', stubs + source], {
    encoding: 'utf8', timeout: 5000,
    env: { PATH: '/usr/bin:/bin', OFFLINE_NODE: process.execPath, OFFLINE_PIN: serverPin, OFFLINE_FAIL: '', ...env },
  });
}

const integrationDirectory = resolve(`.release/server-${serverPin}`);

test('integration wrapper delegates only to the pinned canonical Server after preflight', () => {
  const result = integrationSetup({ E2E_SERVER_DIR: '/untrusted/override', E2E_SERVER_PINNED_SHA: 'b'.repeat(40) });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split('\n'), [
    'materialize', `preflight:${integrationDirectory}:${serverPin}:--preflight`,
    `npm:ci --prefix ${integrationDirectory} --no-audit --no-fund`,
    `npm:run test:integration --prefix ${integrationDirectory}`,
    'database:postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e',
  ]);
});

test('integration wrapper passes selected isolated database to canonical suite', () => {
  const database = 'postgres://test@localhost:5434/marshgo_e2e_geometry';
  const environments: Record<string, string>[] = [{ E2E_DATABASE_URL: database }, { API_TEST_DATABASE_URL: database, E2E_DATABASE_URL: 'postgres://remote/production' }];
  for (const env of environments) {
    const result = integrationSetup(env);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim().split('\n').at(-1), `database:${database}`);
  }
});

test('integration wrapper rejects non-isolated databases before materialization or npm', () => {
  for (const database of ['postgres://remote/marshgo_e2e', 'postgres://localhost/production', 'postgres://localhost/marshgo_e2e/other', 'postgres://localhost/marshgo_e2e-other']) {
    const result = integrationSetup({ API_TEST_DATABASE_URL: database });
    assert.equal(result.status, 2, database);
    assert.equal(result.stdout, '');
  }
});

test('integration wrapper rejects malformed manifest SHA before materialization', () => {
  for (const pin of ['', 'main', 'A'.repeat(40), 'a'.repeat(39)]) {
    const result = integrationSetup({ OFFLINE_PIN: pin });
    assert.equal(result.status, 2, pin);
    assert.equal(result.stdout, '');
  }
});

for (const [stage, status, eventCount] of [['materialize', 17, 1], ['preflight', 2, 2], ['install', 18, 3], ['suite', 19, 5]] as const) {
  test(`integration wrapper propagates ${stage} failure without later work`, () => {
    const result = integrationSetup({ OFFLINE_FAIL: stage });
    assert.equal(result.status, status, result.stderr);
    assert.equal(result.stdout.trim().split('\n').length, eventCount);
  });
}

test('CI configures existing repository access before canonical integration and omits root migrations', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const access = workflow.indexOf('- name: Configure read-only access to private Admin and Partner repositories');
  const integration = workflow.indexOf('- run: API_TEST_DATABASE_URL="$E2E_DATABASE_URL" npm run test:integration');
  assert.ok(access >= 0 && integration > access);
  assert.ok(!workflow.includes('- run: DATABASE_URL="$E2E_DATABASE_URL" npm run db:migrate'));
});
