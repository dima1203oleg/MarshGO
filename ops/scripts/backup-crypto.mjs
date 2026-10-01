import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, readFile, rename, rm } from 'node:fs/promises';
import { once } from 'node:events';
import process from 'node:process';

const [operation, keyFile, inputPath, outputPath] = process.argv.slice(2);
const magic = Buffer.from('MGBACKUP1');
const headerBytes = magic.length + 16 + 12;
if (!['encrypt', 'decrypt'].includes(operation) || !keyFile || !inputPath || !outputPath || outputPath === '-') {
  process.stderr.write('Usage: node backup-crypto.mjs <encrypt|decrypt> <passphrase-file> <input-file|-> <output-file>\n');
  process.exit(2);
}

const passphrase = (await readFile(keyFile)).toString('utf8').replace(/\r?\n$/, '');
if (Buffer.byteLength(passphrase) < 32) throw new Error('Backup passphrase must be at least 32 bytes.');
const writeChunk = async (stream, chunk) => {
  if (stream.write(chunk)) return;
  await once(stream, 'drain');
};

if (operation === 'encrypt') {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', scryptSync(passphrase, salt, 32), iv);
  const temporary = `${outputPath}.tmp`;
  const output = createWriteStream(temporary, { mode: 0o600 });
  try {
    await writeChunk(output, Buffer.concat([magic, salt, iv]));
    const input = inputPath === '-' ? process.stdin : createReadStream(inputPath);
    for await (const chunk of input) await writeChunk(output, cipher.update(chunk));
    await writeChunk(output, cipher.final());
    await writeChunk(output, cipher.getAuthTag());
    output.end();
    await once(output, 'finish');
    await rename(temporary, outputPath);
  } catch (error) {
    output.destroy();
    await rm(temporary, { force: true });
    throw error;
  }
} else {
  const handle = await open(inputPath, 'r');
  const temporary = `${outputPath}.tmp`;
  try {
    const stats = await handle.stat();
    if (stats.size < headerBytes + 16) throw new Error('Encrypted backup is truncated.');
    const header = Buffer.alloc(headerBytes);
    const tail = Buffer.alloc(16);
    await handle.read(header, 0, headerBytes, 0);
    await handle.read(tail, 0, 16, stats.size - 16);
    if (!header.subarray(0, magic.length).equals(magic)) throw new Error('Encrypted backup has an unsupported format.');
    const salt = header.subarray(magic.length, magic.length + 16);
    const iv = header.subarray(magic.length + 16, headerBytes);
    const decipher = createDecipheriv('aes-256-gcm', scryptSync(passphrase, salt, 32), iv);
    decipher.setAuthTag(tail);
    const output = createWriteStream(temporary, { mode: 0o600 });
    try {
      const ciphertext = createReadStream(inputPath, { start: headerBytes, end: stats.size - 17 });
      for await (const chunk of ciphertext) await writeChunk(output, decipher.update(chunk));
      await writeChunk(output, decipher.final());
      output.end();
      await once(output, 'finish');
      await rename(temporary, outputPath);
    } catch (error) {
      output.destroy();
      await rm(temporary, { force: true });
      throw error;
    }
  } finally {
    await handle.close();
  }
}
