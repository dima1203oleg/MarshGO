import assert from 'node:assert/strict';
import test from 'node:test';
import { requiresFullVerification } from '../ops/scripts/detect-ci-scope.mjs';

test('skips the central integration suite for documentation-only changes', () => {
  assert.equal(requiresFullVerification(['AGENTS.md', 'docs/RELEASE_PROCESS.md']), false);
});

test('runs the central integration suite for product, manifest, workflow, and contract changes', () => {
  assert.equal(requiresFullVerification(['server/index.ts']), true);
  assert.equal(requiresFullVerification(['RELEASE_MANIFEST.json']), true);
  assert.equal(requiresFullVerification(['.github/workflows/ci.yml']), true);
  assert.equal(requiresFullVerification(['docs/openapi/api.yaml']), true);
});
