import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import process from 'node:process';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'backup-crypto.mjs');
const passphrase = 'backup-crypto-unit-test-passphrase-0123456789';
const otherPassphrase = 'backup-crypto-unit-test-passphrase-abcdefgh';

let workDir;
let keyFile;
let otherKeyFile;

before(() => {
  workDir = mkdtempSync(join(tmpdir(), 'marshgo-backup-crypto-'));
  keyFile = join(workDir, 'passphrase.key');
  otherKeyFile = join(workDir, 'other-passphrase.key');
  writeFileSync(keyFile, `${passphrase}\n`, { mode: 0o600 });
  writeFileSync(otherKeyFile, `${otherPassphrase}\n`, { mode: 0o600 });
});

after(() => {
  rmSync(workDir, { force: true, recursive: true });
});

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

function assertFailedRun(result, outputPath) {
  assert.notEqual(result.status, 0, 'backup-crypto must exit non-zero');
  assert.ok(!existsSync(outputPath), 'plaintext or archive output must not be published');
  assert.ok(!existsSync(`${outputPath}.tmp`), 'partial temporary output must be removed');
}

describe('backup-crypto.mjs', () => {
  it('round-trips binary archive bytes through encrypt and decrypt', () => {
    const plain = join(workDir, 'roundtrip.dump');
    const archive = join(workDir, 'roundtrip.dump.gpg');
    const restored = join(workDir, 'roundtrip.restored.dump');
    const payload = Buffer.concat([Buffer.from('%PGDMP\n'), randomBytes(2 * 1024 * 1024), Buffer.from([0, 255, 13, 10])]);
    writeFileSync(plain, payload);

    assert.equal(run(['encrypt', keyFile, plain, archive]).status, 0);
    const encrypted = readFileSync(archive);
    assert.equal(encrypted.subarray(0, 9).toString('utf8'), 'MGBACKUP1');
    assert.ok(!encrypted.includes(Buffer.from('%PGDMP')));
    assert.equal(statSync(archive).mode & 0o077, 0, 'archive must not be group or world readable');

    assert.equal(run(['decrypt', keyFile, archive, restored]).status, 0);
    assert.deepEqual(readFileSync(restored), payload);
  });

  it('round-trips an empty input and a stdin stream', () => {
    const emptyPlain = join(workDir, 'empty.dump');
    const emptyArchive = join(workDir, 'empty.dump.gpg');
    const emptyRestored = join(workDir, 'empty.restored.dump');
    writeFileSync(emptyPlain, Buffer.alloc(0));

    assert.equal(run(['encrypt', keyFile, emptyPlain, emptyArchive]).status, 0);
    assert.equal(run(['decrypt', keyFile, emptyArchive, emptyRestored]).status, 0);
    assert.equal(readFileSync(emptyRestored).length, 0);

    const piped = spawnSync(process.execPath, [script, 'encrypt', keyFile, '-', join(workDir, 'stdin.dump.gpg')], {
      input: 'piped-stdin-payload',
      encoding: 'utf8',
    });
    assert.equal(piped.status, 0, piped.stderr);
    const restoredFromStdin = join(workDir, 'stdin.restored.dump');
    assert.equal(run(['decrypt', keyFile, join(workDir, 'stdin.dump.gpg'), restoredFromStdin]).status, 0);
    assert.equal(readFileSync(restoredFromStdin, 'utf8'), 'piped-stdin-payload');
  });

  it('rejects a wrong passphrase without writing plaintext', () => {
    const plain = join(workDir, 'secret.dump');
    const archive = join(workDir, 'secret.dump.gpg');
    const restored = join(workDir, 'secret.restored.dump');
    writeFileSync(plain, 'do-not-leak');

    assert.equal(run(['encrypt', keyFile, plain, archive]).status, 0);
    assertFailedRun(run(['decrypt', otherKeyFile, archive, restored]), restored);
  });

  it('rejects tampered ciphertext without writing plaintext', () => {
    const plain = join(workDir, 'tampered-source.dump');
    const archive = join(workDir, 'tampered.dump.gpg');
    const restored = join(workDir, 'tampered.restored.dump');
    writeFileSync(plain, 'tamper-me-payload');
    assert.equal(run(['encrypt', keyFile, plain, archive]).status, 0);

    const tampered = readFileSync(archive);
    tampered[20] ^= 0xff;
    writeFileSync(archive, tampered);

    assertFailedRun(run(['decrypt', keyFile, archive, restored]), restored);
  });

  it('rejects a truncated archive before deriving a key', () => {
    const truncated = join(workDir, 'truncated.dump.gpg');
    writeFileSync(truncated, randomBytes(40));

    const result = run(['decrypt', keyFile, truncated, join(workDir, 'truncated.out')]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Encrypted backup is truncated\./);
  });

  it('rejects an unsupported format magic', () => {
    const plain = join(workDir, 'foreign-source.dump');
    const archive = join(workDir, 'foreign.dump.gpg');
    writeFileSync(plain, 'foreign-format-payload');
    assert.equal(run(['encrypt', keyFile, plain, archive]).status, 0);

    const bytes = readFileSync(archive);
    Buffer.from('MGBACKUP2').copy(bytes, 0);
    writeFileSync(archive, bytes);

    const result = run(['decrypt', keyFile, archive, join(workDir, 'foreign.out')]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Encrypted backup has an unsupported format\./);
  });

  it('refuses a passphrase shorter than 32 bytes for both operations', () => {
    const weakKeyFile = join(workDir, 'weak-passphrase.key');
    writeFileSync(weakKeyFile, 'too-short-passphrase');

    for (const operation of ['encrypt', 'decrypt']) {
      const result = run([operation, weakKeyFile, join(workDir, 'secret.dump'), join(workDir, `weak.${operation}.out`)]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Backup passphrase must be at least 32 bytes\./);
    }
  });

  it('exits 2 on a missing or unusable invocation', () => {
    for (const args of [[], ['encrypt', keyFile], ['rotate', keyFile, join(workDir, 'secret.dump'), join(workDir, 'rotate.out')], ['decrypt', keyFile, join(workDir, 'secret.dump'), '-']]) {
      const result = run(args);
      assert.equal(result.status, 2);
      assert.match(result.stderr, /Usage: node backup-crypto\.mjs/);
    }
  });
});
