import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, 'RELEASE_MANIFEST.json'), 'utf8'));
const serverDirectory = resolve(root, '.release', `server-${manifest.server_sha}`);
const actual = spawn('git', ['-C', serverDirectory, 'rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'inherit'] });
let head = '';
actual.stdout.on('data', (chunk) => { head += chunk; });
actual.on('close', (code) => {
  if (code !== 0 || head.trim() !== manifest.server_sha || !existsSync(resolve(serverDirectory, 'node_modules/.package-lock.json'))) {
    process.stderr.write('Pinned canonical Server checkout or dependencies are unavailable. Run npm run test:e2e to materialize it.\n');
    process.exit(2);
  }
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'api'], {
    cwd: serverDirectory,
    env: process.env,
    stdio: 'inherit',
  });
  const stop = (signal) => { if (!child.killed) child.kill(signal); };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
  child.on('error', (error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
  child.on('exit', (status, signal) => {
    process.exitCode = status ?? (signal ? 1 : 0);
  });
});
