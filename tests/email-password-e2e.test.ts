import assert from 'node:assert/strict';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import * as fixtureCrypto from 'node:crypto';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as ts from 'typescript';
import type { Page } from '@playwright/test';
import { E2E_AUTH_PASSWORD, e2eEmailForPhone, hashE2ePassword, signInWithEmailPassword } from '../e2e/support/emailPasswordAuth.ts';

test('email fixtures normalize phone formatting deterministically', () => {
  assert.equal(e2eEmailForPhone('+380 (92) 123-45-67'), '380921234567@e2e.marshgo.test');
});

test('password fixtures use salted server-compatible scrypt keys and reject a wrong password', () => {
  const hash = hashE2ePassword();
  const secondHash = hashE2ePassword();
  assert.notEqual(hash, secondHash);
  const [algorithm, n, r, p, salt, keyHex] = hash.split('$');
  assert.equal(algorithm, 'scrypt');
  assert.deepEqual([n, r, p], ['16384', '8', '1']);
  assert.match(salt, /^[a-f0-9]{32}$/);
  assert.match(keyHex, /^[a-f0-9]{128}$/);
  const expected = Buffer.from(keyHex, 'hex');
  const options = { N: Number(n), r: Number(r), p: Number(p) };
  assert.equal(timingSafeEqual(scryptSync(E2E_AUTH_PASSWORD, salt, 64, options), expected), true);
  assert.equal(timingSafeEqual(scryptSync('WrongFixture!2026', salt, 64, options), expected), false);
});

test('email sign-in rejects unsafe database targets before browser or database work', async () => {
  const original = process.env.E2E_DATABASE_URL;
  let navigations = 0;
  const page = { goto: async () => { navigations += 1; throw new Error('Unexpected navigation'); } } as unknown as Page;
  try {
    for (const target of [
      'postgres://192.0.2.1:5434/marshgo_e2e',
      'postgres://127.0.0.1:5434/marshgo',
      'postgres://localhost:5434/marshgo_e2e_bad-name',
      'postgres://127.0.0.1:5434/marshgo_e2e/extra',
    ]) {
      process.env.E2E_DATABASE_URL = target;
      await assert.rejects(signInWithEmailPassword(page, 'Fixture', '+380921234567'), /loopback marshgo_e2e-prefixed database/);
    }
    delete process.env.E2E_DATABASE_URL;
    await assert.rejects(signInWithEmailPassword(page, 'Fixture', '+380921234567'), /E2E_DATABASE_URL must point/);
    assert.equal(navigations, 0);
  } finally {
    if (original === undefined) delete process.env.E2E_DATABASE_URL;
    else process.env.E2E_DATABASE_URL = original;
  }
});

test('email fixtures reject canonical and remote browser origins before registration', async () => {
  const original = process.env.E2E_DATABASE_URL;
  try {
    process.env.E2E_DATABASE_URL = 'postgres://127.0.0.1:5434/marshgo_e2e';
    for (const url of ['http://127.0.0.1:7777/', 'https://example.test:3300/']) {
      const page = { goto: async () => {}, url: () => url } as unknown as Page;
      await assert.rejects(signInWithEmailPassword(page, 'Fixture', '+380921234567'), /isolated loopback browser on port 3300/);
    }
  } finally {
    if (original === undefined) delete process.env.E2E_DATABASE_URL;
    else process.env.E2E_DATABASE_URL = original;
  }
});

test('email sign-in accepts named isolated loopback databases before navigating', async () => {
  const original = process.env.E2E_DATABASE_URL;
  let navigations = 0;
  const page = { goto: async () => { navigations += 1; throw new Error('Reached isolated browser'); } } as unknown as Page;
  try {
    for (const target of [
      'postgres://127.0.0.1:5434/marshgo_e2e',
      'postgres://localhost:5434/marshgo_e2e_auth_01',
    ]) {
      process.env.E2E_DATABASE_URL = target;
      await assert.rejects(signInWithEmailPassword(page, 'Fixture', '+380921234567'), /Reached isolated browser/);
    }
    assert.equal(navigations, 2);
  } finally {
    if (original === undefined) delete process.env.E2E_DATABASE_URL;
    else process.env.E2E_DATABASE_URL = original;
  }
});

type IntegrationFile = 'api-bookings.integration.test.ts' | 'realtime-cluster.integration.test.ts';
const isolatedEnvironment = {
  API_TEST_URL: 'http://127.0.0.1:3306',
  API_TEST_SECONDARY_URL: 'http://127.0.0.1:3307',
  API_TEST_DATABASE_URL: 'postgres://fixture:offline@127.0.0.1:5434/marshgo_e2e',
};

// Replace I/O imports before executing the actual integration guards and auth blocks.
function integrationHarness(file: IntegrationFile, env = isolatedEnvironment, options: {
  loginStatus?: number; fixtureRowCount?: number; fixtureError?: boolean;
} = {}) {
  let source = readFileSync(new URL(file, import.meta.url), 'utf8');
  if (file === 'api-bookings.integration.test.ts') {
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    let authBlock: ts.Block | undefined;
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'it'
        && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text.startsWith('registers with')) {
        const callback = node.arguments[1];
        if (ts.isArrowFunction(callback) && ts.isBlock(callback.body)) authBlock = callback.body;
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
    assert.ok(authBlock, 'booking auth scenario must exist');
    const first = authBlock.statements.find((statement) => statement.getText(parsed).startsWith('const phone ='));
    const last = authBlock.statements.find((statement) => statement.getText(parsed).startsWith('const authHeaders ='));
    assert.ok(first && last, 'booking registration block boundaries must exist');
    source = source.slice(0, authBlock.getStart(parsed))
      + `{ ${source.slice(first.getStart(parsed), last.getStart(parsed))} return auth; }`
      + source.slice(authBlock.end);
  }
  const callbacks: Array<{ name: string; run: () => Promise<any> }> = [];
  const teardowns: Array<() => Promise<void>> = [];
  const calls: Array<{ path: string; body: Record<string, string> }> = [];
  const sql: Array<{ text: string; values: any[] }> = [];
  const events: string[] = [];
  const userId = '00000000-0000-4000-8000-000000000001';
  let poolConstructions = 0;
  let registeredBody: Record<string, string> | undefined;
  let setupVerified = false;
  class OfflinePool {
    constructor() { poolConstructions += 1; }
    async query(text: string, values: any[] = []) {
      sql.push({ text, values });
      events.push('sql');
      if (text.startsWith('UPDATE users')) {
        if (options.fixtureError) throw new Error('Offline fixture update failed');
        setupVerified = true;
      }
      return { rowCount: options.fixtureRowCount ?? 1, rows: [] };
    }
    async end() {}
  }
  const poolInstances: OfflinePool[] = [];
  const exports: Record<string, any> = {};
  const response = (status: number, data = {}) => ({ status, json: async () => ({ data }) });
  const context = {
    exports,
    process: { env, pid: 12345 }, URL,
    fetch: async (url: string, init: { body?: string; method?: string } = {}) => {
      const path = new URL(url).pathname;
      const body = JSON.parse(init.body ?? '{}') as Record<string, string>;
      calls.push({ path, body });
      events.push(path);
      if (path.includes('/otp/')) return response(410);
      if (path === '/api/v1/auth/register') {
        registeredBody = body;
        return response(201, { user: { id: userId, roles: body.role === 'driver' ? ['driver', 'passenger'] : ['passenger'], phone_e164: null, is_verified: false }, accessToken: 'offline-registration-token' });
      }
      if (path === '/api/v1/auth/login') {
        assert.ok(registeredBody && body.email === registeredBody.email && body.password === registeredBody.password,
          'login must use the newly generated fixture credentials');
        assert.ok(setupVerified, 'verified phone fixture must be seeded before login');
        return response(options.loginStatus ?? 200, { user: { id: userId, roles: registeredBody.role === 'driver' ? ['driver', 'passenger'] : ['passenger'] }, accessToken: 'offline-login-token' });
      }
      throw new Error(`Unexpected offline fetch path: ${path}`);
    },
    require: (name: string) => {
      if (name === 'node:test') return {
        describe: (_name: string, _options: unknown, callback: () => void) => callback(),
        before: () => {},
        after: (callback: () => Promise<void>) => teardowns.push(callback),
        it: (name: string, run: () => Promise<any>) => callbacks.push({ name, run }),
      };
      if (name === 'node:assert/strict') return {
        ...assert,
        // JSON arrays from injected responses and source literals belong to different VM realms.
        deepEqual: (actual: unknown, expected: unknown, message?: string) =>
          assert.deepEqual(structuredClone(actual), structuredClone(expected), message),
      };
      if (name === 'node:crypto') return { ...fixtureCrypto };
      if (name === 'pg') return { Pool: class extends OfflinePool {
        constructor() { super(); poolInstances.push(this); }
      } };
      if (name === 'ws') return class { constructor() { throw new Error('Unexpected offline socket'); } };
      if (name === '../server/proposals/expiry') return { expireDueProposals: () => { throw new Error('Unexpected offline expiry'); } };
      throw new Error(`Unexpected offline import: ${name}`);
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  let loadError: unknown;
  try {
    runInNewContext(`${compiled}\nif (typeof register === 'function') exports.registerFixture = register;`, context, { timeout: 2000 });
  } catch (error) { loadError = error; }
  return {
    loadError, calls, sql, events, userId,
    get poolConstructions() { return poolConstructions; },
    async register(role: 'driver' | 'passenger') {
      if (loadError) throw loadError;
      if (file === 'api-bookings.integration.test.ts') return callbacks.find(({ name }) => name.startsWith('registers with'))!.run();
      return exports.registerFixture(poolInstances[0], '+380990000001', 'Offline fixture', role);
    },
    async cleanup() { for (const teardown of teardowns) await teardown(); },
  };
}

for (const file of ['api-bookings.integration.test.ts', 'realtime-cluster.integration.test.ts'] as const) {
  for (const role of file === 'api-bookings.integration.test.ts' ? ['passenger'] as const : ['driver', 'passenger'] as const) {
    test(`offline ${file}: ${role} uses email register/login and exact-ID verified fixture`, async () => {
      const harness = integrationHarness(file);
      assert.equal(harness.loadError, undefined);
      const auth = await harness.register(role);
      assert.deepEqual(harness.calls.map(({ path }) => path), ['/api/v1/auth/register', '/api/v1/auth/login']);
      const registration = harness.calls[0].body;
      assert.ok(/^[^@]+@[^@]+\.test$/.test(registration.email), 'registration must use a synthetic email');
      assert.ok(registration.password?.length >= 12, 'registration must generate a fixture password');
      assert.ok(registration.displayName);
      if (file === 'realtime-cluster.integration.test.ts') assert.equal(registration.role, role);
      assert.equal(auth.data.user.id, harness.userId);
      assert.ok(auth.data.accessToken === 'offline-login-token', 'return the login session, not the registration session');
      assert.ok(auth.data.user.roles.includes(role));
      assert.deepEqual(harness.events, ['/api/v1/auth/register', 'sql', '/api/v1/auth/login']);
      const update = harness.sql[0];
      assert.match(update.text, /SET\s+phone_e164=\$1,\s*is_verified=true\s+WHERE\s+id=\$2/i);
      assert.equal(update.values.length, 2);
      assert.equal(update.values[1], harness.userId);
      assert.match(update.values[0], /^\+380\d+$/);
      if (file === 'realtime-cluster.integration.test.ts') assert.equal(update.values[0], '+380990000001');
      await harness.cleanup();
      const deletes = harness.sql.filter(({ text }) => text.startsWith('DELETE'));
      assert.ok(deletes.every(({ text }) => !text.includes('otp_challenges') && !text.includes('phone_e164 LIKE')),
        'cleanup must never use OTP or broad phone-prefix matching');
      for (const table of ['audit_events', 'sessions', 'user_roles', 'users', ...(file === 'api-bookings.integration.test.ts' ? ['vehicles'] : [])]) {
        const exact = deletes.find(({ text, values }) => text.startsWith(`DELETE FROM ${table} `)
          && values.flat().includes(harness.userId));
        assert.ok(exact, `cleanup must address the registered fixture ID in ${table}`);
        if (file === 'realtime-cluster.integration.test.ts') assert.deepEqual(Array.from(exact.values[0]), [harness.userId]);
        else assert.deepEqual(Array.from(exact.values), [harness.userId]);
      }
      const second = integrationHarness(file);
      await second.register(role);
      assert.ok(second.calls[0].body.email !== registration.email, 'fixture emails must be unique');
      assert.ok(second.calls[0].body.password !== registration.password, 'fixture passwords must be generated per registration');
    });
  }

  for (const failure of ['login', 'fixture-error', 'fixture-zero', 'fixture-many'] as const) {
    test(`offline ${file}: ${failure} retains the registered ID for cleanup`, async () => {
      const harness = integrationHarness(file, isolatedEnvironment, {
        loginStatus: failure === 'login' ? 401 : 200,
        fixtureError: failure === 'fixture-error',
        fixtureRowCount: failure === 'fixture-zero' ? 0 : failure === 'fixture-many' ? 2 : 1,
      });
      await assert.rejects(harness.register('driver'));
      assert.equal(harness.calls[0]?.path, '/api/v1/auth/register');
      assert.equal(harness.calls.length, failure === 'login' ? 2 : 1);
      await harness.cleanup();
      for (const table of ['sessions', 'user_roles', 'users']) {
        assert.ok(harness.sql.some(({ text, values }) => text.startsWith(`DELETE FROM ${table} `) && values.flat().includes(harness.userId)),
          `${table} cleanup must retain the registration ID after failure`);
      }
    });
  }

  test(`offline ${file}: unsafe targets fail before fetch or Pool/SQL`, () => {
    const unsafeDatabases = [
      'postgres://192.0.2.1:5434/marshgo_e2e',
      'postgres://127.0.0.1:5434/marshgo',
      'postgres://localhost:5434/marshgo_e2e_bad-name',
      'postgres://localhost:5434/marshgo_e2e/extra',
      'postgres://localhost:5434/marshgo_e2e?options=unsafe',
      'postgres://localhost:5434/marshgo_e2e#unsafe',
      'http://localhost:5434/marshgo_e2e',
      'not-a-url',
    ];
    const unsafeOrigins = (port: number, wrongPort: number) => [
      'http://127.0.0.1:3002', 'http://127.0.0.1:7777', `http://192.0.2.1:${port}`,
      `https://localhost:${port}`, `http://localhost:${wrongPort}`, `http://localhost:${port}/extra`,
      `http://localhost:${port}?unsafe`, `http://localhost:${port}#unsafe`,
      `http://fixture:fixture@localhost:${port}`, 'not-a-url',
    ];
    const environments = [
      ...unsafeDatabases.map((API_TEST_DATABASE_URL) => ({ ...isolatedEnvironment, API_TEST_DATABASE_URL })),
      ...unsafeOrigins(3306, 3307).map((API_TEST_URL) => ({ ...isolatedEnvironment, API_TEST_URL })),
      ...(file === 'realtime-cluster.integration.test.ts' ? unsafeOrigins(3307, 3306).map((API_TEST_SECONDARY_URL) => ({
        ...isolatedEnvironment, API_TEST_SECONDARY_URL,
      })) : []),
    ];
    for (const env of environments) {
      const harness = integrationHarness(file, env);
      assert.ok(harness.loadError instanceof Error || Object.prototype.toString.call(harness.loadError) === '[object Error]',
        'unsafe integration target must throw during module evaluation');
      assert.match(String(harness.loadError), /isolated|loopback|API_TEST_/i);
      assert.equal(harness.poolConstructions, 0, 'guard must run before Pool construction');
      assert.equal(harness.calls.length, 0, 'guard must run before fetch');
      assert.equal(harness.sql.length, 0, 'guard must run before SQL');
    }
  });

  test(`offline ${file}: default and IPv6 named isolated targets are accepted`, () => {
    for (const env of [isolatedEnvironment, {
      API_TEST_URL: 'http://[::1]:3306/', API_TEST_SECONDARY_URL: 'http://[::1]:3307/',
      API_TEST_DATABASE_URL: 'postgres://[::1]:5434/marshgo_e2e_auth_01',
    }]) {
      const harness = integrationHarness(file, env);
      assert.equal(harness.loadError, undefined);
      assert.equal(harness.poolConstructions, 1);
      assert.equal(harness.calls.length, 0);
      assert.equal(harness.sql.length, 0);
    }
  });
}
