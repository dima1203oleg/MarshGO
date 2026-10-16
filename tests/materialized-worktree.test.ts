import test from 'node:test';
import assert from 'node:assert/strict';
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
});
