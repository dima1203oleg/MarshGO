#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { open, readFile, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const queueFile = path.join(root, 'docs/AI_AGENT_QUEUE.json');
const canonicalRepos = new Set(['MarshGO', 'MarshGO-Server', 'MarshGO-Site', 'MarshGO-iOS', 'MarshGO-Admin', 'MarshGO-Partner']);
const models = new Set([
  'gemini-4-argon-medium', 'gemini-4-argon-high', 'gemini-4-argon-low',
  'gemini-3.8-flash-high', 'gemini-3.8-flash-medium', 'gemini-3.8-flash-low',
  'claude-opus-5-5-low', 'claude-opus-5-5-medium', 'claude-opus-5-5-high',
  'claude-sonnet-5-5-low', 'claude-sonnet-5-5-medium', 'claude-sonnet-5-5-high',
  'gpt-oss-120b-medium',
]);

function usage() {
  process.stdout.write('Usage: node scripts/antigravity-dispatch.mjs --self-check\n');
  process.stdout.write('       node scripts/antigravity-dispatch.mjs --task-id <READY_TASK_ID>\n');
}

function git(cwd, args) {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || `git ${args[0]} failed`).trim());
  return result.stdout.trim();
}

async function loadQueue() {
  return JSON.parse(await readFile(queueFile, 'utf8'));
}

async function atomicSaveQueue(queue) {
  const temp = `${queueFile}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(queue, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  await rename(temp, queueFile);
}

function processExists(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function processGroupExists(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(-pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}

function signalProcessGroup(child, signal) {
  if (!child.pid) return;
  try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') child.kill(signal); }
}

async function acquireLock(kind = 'dispatch') {
  const lockId = createHash('sha256').update(root).digest('hex').slice(0, 12);
  const lockPath = path.join(os.tmpdir(), `marshgo-agy-${kind}-${lockId}.lock`);
  const lockLabel = kind === 'dispatch' ? 'Antigravity task' : 'agent queue update';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(lockPath, fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY, 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      await handle.close();
      return async () => { await unlink(lockPath).catch(() => {}); };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let lock;
      try { lock = JSON.parse(await readFile(lockPath, 'utf8')); } catch { throw new Error(`${lockLabel} lock exists and cannot be verified; leave it untouched.`); }
      if (processExists(lock.pid)) throw new Error(`${lockLabel} lock is held by PID ${lock.pid}.`);
      await unlink(lockPath);
    }
  }
  throw new Error('Could not acquire Antigravity dispatch lock.');
}

async function updateQueue(mutator) {
  const release = await acquireLock('queue');
  try {
    const queue = await loadQueue();
    const result = mutator(queue);
    await atomicSaveQueue(queue);
    return result;
  } finally {
    await release();
  }
}

function isAllowedPath(file, allowed) {
  return allowed.some((prefix) => file === prefix || file.startsWith(`${prefix.replace(/\/$/, '')}/`));
}

async function validateWorktree(task) {
  if (!task.repo_root || !task.worktree || !task.base_sha) throw new Error('Task needs repo_root, worktree, and base_sha.');
  const repoRoot = await realpath(task.repo_root);
  const worktree = await realpath(task.worktree);
  if (!canonicalRepos.has(task.repository) || path.basename(repoRoot) !== task.repository) throw new Error('Task must target one of the six canonical repository roots.');
  const repoTop = await realpath(git(repoRoot, ['rev-parse', '--show-toplevel']));
  const workTop = await realpath(git(worktree, ['rev-parse', '--show-toplevel']));
  if (repoTop === workTop) throw new Error('Refusing the primary checkout; use an isolated registered worktree.');
  const commonA = path.resolve(repoRoot, git(repoRoot, ['rev-parse', '--git-common-dir']));
  const commonB = path.resolve(worktree, git(worktree, ['rev-parse', '--git-common-dir']));
  if (commonA !== commonB) throw new Error('Task worktree does not belong to the stated repository.');
  const listed = git(repoRoot, ['worktree', 'list', '--porcelain']).split('\n').filter((line) => line.startsWith('worktree ')).map((line) => path.resolve(line.slice(9)));
  if (!listed.includes(worktree)) throw new Error('Task path is not a registered Git worktree.');
  const branch = git(worktree, ['branch', '--show-current']);
  if (!(branch.startsWith('codex/agy/') || branch.startsWith('codex/antigravity/'))) throw new Error('Delegated worktree branch must start codex/agy/ or codex/antigravity/.');
  if (git(worktree, ['rev-parse', 'HEAD']) !== task.base_sha) throw new Error('Worktree HEAD differs from task base_sha.');
  if (git(worktree, ['status', '--porcelain', '--untracked-files=all'])) throw new Error('Worktree is dirty; refusing to mix pre-existing work.');
  return { repoRoot, worktree, branch };
}

async function selfCheck() {
  const queue = await loadQueue();
  if (queue.schema_version !== 1 || !Array.isArray(queue.tasks)) throw new Error('Task queue schema is invalid.');
  const help = spawnSync('agy', ['help'], { cwd: root, encoding: 'utf8', timeout: 10000 });
  const helpText = `${help.stdout || ''}${help.stderr || ''}`;
  for (const flag of ['--model', '--mode', '--sandbox', '--output-format', '--print-timeout']) {
    if (!helpText.includes(flag)) throw new Error(`Installed agy help does not document ${flag}.`);
  }
  process.stdout.write(JSON.stringify({ result: 'PASS', queue_tasks: queue.tasks.length, models_configured: models.size, cli_flags_verified: true, model_calls: 0 }) + '\n');
}

function readArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--self-check') result.selfCheck = true;
    else if (args[i] === '--task-id') result.taskId = args[++i];
    else if (args[i] === '--help' || args[i] === '-h') result.help = true;
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  return result;
}

async function runTask(task) {
  if (task.owner !== 'antigravity-cli' || task.status !== 'READY') throw new Error('Only READY Antigravity CLI tasks may be dispatched.');
  if (!models.has(task.model)) throw new Error(`Unverified model ID: ${task.model}`);
  const timeout = Number(task.resource_limits?.timeout_seconds ?? 120);
  if (!Number.isInteger(timeout) || timeout < 10 || timeout > 900) throw new Error('timeout_seconds must be between 10 and 900.');
  const mode = task.resource_limits?.mode ?? 'plan';
  if (mode !== 'plan' && mode !== 'accept-edits') throw new Error('Only documented plan or accept-edits modes are supported.');
  const allowedPaths = task.allowed_paths ?? [];
  if (!Array.isArray(allowedPaths) || (mode === 'accept-edits' && allowedPaths.length === 0)) throw new Error('Edit tasks must declare allowed_paths.');
  if (typeof task.prompt !== 'string' || task.prompt.length < 30 || task.prompt.length > 4000) throw new Error('Prompt must be 30–4000 characters.');
  const { repoRoot, worktree, branch } = await validateWorktree(task);
  task = await updateQueue((queue) => {
    const entry = queue.tasks.find((item) => item.task_id === task.task_id);
    if (!entry || entry.status !== 'READY') throw new Error('Queue task changed before claim.');
    entry.status = 'CLAIMED';
    entry.attempts = (entry.attempts ?? 0) + 1;
    entry.claimed_at = new Date().toISOString();
    return structuredClone(entry);
  });
  await updateQueue((queue) => {
    const entry = queue.tasks.find((item) => item.task_id === task.task_id);
    if (!entry || entry.status !== 'CLAIMED') throw new Error('Task claim changed before execution.');
    entry.status = 'RUNNING';
    entry.started_at = new Date().toISOString();
  });

  const args = [
    '--print', `--model=${task.model}`, `--effort=${task.reasoning_effort ?? 'low'}`,
    `--mode=${mode}`, '--sandbox', '--output-format=json',
    `--print-timeout=${timeout}s`, '--prompt', task.prompt,
  ];
  const started = Date.now();
  let stdout = '';
  let stderr = '';
  let outputTooLarge = false;
  let timedOut = false;
  const child = spawn('agy', args, { cwd: worktree, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.setEncoding('utf8').on('data', (chunk) => {
    if (stdout.length + chunk.length > 2_000_000) { outputTooLarge = true; child.kill('SIGTERM'); }
    else stdout += chunk;
  });
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr = (stderr + chunk).slice(-2000); });
  let killHandle;
  let escalationPromise;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    signalProcessGroup(child, 'SIGTERM');
    escalationPromise = new Promise((resolve) => {
      killHandle = setTimeout(() => {
        signalProcessGroup(child, 'SIGKILL');
        resolve();
      }, 5000);
    });
  }, timeout * 1000 + 5000);
  let exitCode;
  try {
    exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
  } catch (error) {
    await updateQueue((updated) => {
      const saved = updated.tasks.find((item) => item.task_id === task.task_id);
      if (saved) {
        saved.status = 'FAILED';
        saved.failure = String(error.message).slice(0, 500);
        saved.finished_at = new Date().toISOString();
      }
    });
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
    if (killHandle) {
      if (timedOut && processGroupExists(child.pid)) await escalationPromise;
      else clearTimeout(killHandle);
    }
  }
  let payload;
  try { payload = JSON.parse(stdout.trim()); } catch { payload = null; }
  const sha = git(worktree, ['rev-parse', 'HEAD']);
  const changed = [...new Set([
    ...git(worktree, ['diff', '--name-only', '--no-renames', task.base_sha]).split('\n').filter(Boolean),
    ...git(worktree, ['diff', '--cached', '--name-only', '--no-renames', task.base_sha]).split('\n').filter(Boolean),
    ...git(worktree, ['diff', '--name-only', '--no-renames']).split('\n').filter(Boolean),
    ...git(worktree, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
  ])];
  const outOfScope = changed.filter((file) => !isAllowedPath(file, allowedPaths));
  const validPayload = payload && typeof payload.conversation_id === 'string'
    && payload.status === 'SUCCESS' && typeof payload.response === 'string'
    && Number.isInteger(payload.num_turns) && payload.usage && typeof payload.usage.total_tokens === 'number';
  let result = exitCode === 0 && validPayload && !timedOut && !outputTooLarge ? 'REVIEW' : 'FAILED';
  if (mode === 'plan' && changed.length) result = 'REVIEW_SCOPE_VIOLATION';
  if (outOfScope.length) result = 'REVIEW_SCOPE_VIOLATION';
  const saved = await updateQueue((updated) => {
    const item = updated.tasks.find((candidate) => candidate.task_id === task.task_id);
    if (!item) throw new Error('Task disappeared from the queue during execution.');
    item.status = result;
    item.branch = branch;
    item.result_sha = sha;
    item.finished_at = new Date().toISOString();
    item.runtime_seconds = Math.round((Date.now() - started) / 1000);
    item.usage = payload?.usage ?? null;
    item.tests = 'NOT_RUN; Codex review required';
    item.changed_paths = changed;
    item.out_of_scope_paths = outOfScope;
    item.failure = result === 'FAILED' ? (timedOut ? 'timeout' : outputTooLarge ? 'output limit exceeded' : (stderr.slice(0, 500) || `exit ${exitCode}`)) : null;
    return item;
  });
  process.stdout.write(JSON.stringify({ task_id: task.task_id, status: result, branch, result_sha: sha, runtime_seconds: saved.runtime_seconds, usage: saved.usage, changed_paths: changed, tests: saved.tests }) + '\n');
  if (result !== 'REVIEW') process.exitCode = 1;
}

try {
  const args = readArgs(process.argv.slice(2));
  if (args.help) { usage(); process.exit(0); }
  if (args.selfCheck) await selfCheck();
  else if (args.taskId) {
    const queue = await loadQueue();
    const task = queue.tasks.find((item) => item.task_id === args.taskId);
    if (!task) throw new Error('Task ID was not found in docs/AI_AGENT_QUEUE.json.');
    const release = await acquireLock();
    try { await runTask(task); } finally { await release(); }
  } else usage();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
