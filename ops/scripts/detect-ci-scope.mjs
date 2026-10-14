import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const fullRunPatterns = [
  /^\.github\//,
  /^ops\//,
  /^server\//,
  /^src\//,
  /^shared\//,
  /^tests\//,
  /^e2e\//,
  /^scripts\//,
  /^schemas\//,
  /^docs\/openapi\//,
  /^Dockerfile(?:\.|$)/,
  /^compose\.production\.yml$/,
  /^RELEASE_MANIFEST\.json$/,
  /^bun\.lock(?:b)?$/,
  /^package(?:-lock)?\.json$/,
  /^vite\.config\./,
  /^playwright(?:\.[^/]+)?\.config\./,
];

export function requiresFullVerification(paths) {
  return paths.some((path) => fullRunPatterns.some((pattern) => pattern.test(path)));
}

function runCli() {
  const { EVENT_NAME: eventName, BASE_SHA: baseSha, HEAD_SHA: headSha, GITHUB_OUTPUT: outputPath } = process.env;
  if (!eventName || !headSha || !outputPath) {
    throw new Error('EVENT_NAME, HEAD_SHA and GITHUB_OUTPUT are required.');
  }

  let integration = true;
  if (eventName === 'pull_request' && /^[a-f0-9]{40}$/.test(baseSha ?? '') && /^[a-f0-9]{40}$/.test(headSha)) {
    const changedPaths = execFileSync('git', ['diff', '--name-only', `${baseSha}...${headSha}`], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    integration = requiresFullVerification(changedPaths);
  } else if (eventName === 'push' && /^[a-f0-9]{40}$/.test(baseSha ?? '') && /^[a-f0-9]{40}$/.test(headSha)) {
    const changedPaths = execFileSync('git', ['diff', '--name-only', `${baseSha}..${headSha}`], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    integration = requiresFullVerification(changedPaths);
  }

  appendFileSync(outputPath, `integration=${integration}\n`);
  process.stdout.write(`Central integration verification ${integration ? 'required' : 'skipped'} for ${eventName}.\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli();
