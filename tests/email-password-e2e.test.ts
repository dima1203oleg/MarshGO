import assert from 'node:assert/strict';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import test from 'node:test';
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
