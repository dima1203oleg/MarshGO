import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bindReleaseBuildMetadata, createReleaseBuildMetadata } from './release-build-metadata.mjs';

const serverSha = 'a'.repeat(40);
const buildTime = new Date('2026-10-29T10:00:00.000Z');

describe('release build metadata', () => {
  it('binds the exact pinned SHA and clean-source assertion to the workflow build identity', () => {
    assert.deepEqual(createReleaseBuildMetadata(serverSha, {
      runId: '123456',
      runAttempt: '2',
      builtAt: buildTime,
    }), {
      buildId: 'github-123456-2',
      commitSha: serverSha,
      builtAt: '2026-10-29T10:00:00.000Z',
      sourceState: 'clean',
    });
  });

  it('uses an explicit local build identity when no GitHub run is available', () => {
    const metadata = createReleaseBuildMetadata(serverSha, { builtAt: buildTime });
    assert.equal(metadata.buildId, 'local-aaaaaaaaaaaa-20261029T100000000Z');
    assert.equal(metadata.commitSha, serverSha);
  });

  it('rejects incomplete or malformed build inputs', () => {
    assert.throws(() => createReleaseBuildMetadata('short', { builtAt: buildTime }), /full pinned Server commit SHA/);
    assert.throws(() => createReleaseBuildMetadata(serverSha, { builtAt: 'not a date' }), /valid build timestamp/);
  });

  it('renders all four exact metadata fields and rejects missing compose placeholders', () => {
    const metadata = createReleaseBuildMetadata(serverSha, { runId: '123456', builtAt: buildTime });
    const compose = [
      '  MARSHGO_BUILD_ID: ${MARSHGO_BUILD_ID:-unknown}',
      '  MARSHGO_BUILD_SHA: ${MARSHGO_BUILD_SHA:-unknown}',
      '  MARSHGO_BUILD_TIME: ${MARSHGO_BUILD_TIME:-unknown}',
      '  MARSHGO_SOURCE_STATE: ${MARSHGO_SOURCE_STATE:-unknown}',
    ].join('\n');

    const rendered = bindReleaseBuildMetadata(compose, metadata);
    assert.match(rendered, /MARSHGO_BUILD_ID: "github-123456-1"/);
    assert.match(rendered, new RegExp(`MARSHGO_BUILD_SHA: "${serverSha}"`));
    assert.match(rendered, /MARSHGO_BUILD_TIME: "2026-10-29T10:00:00\.000Z"/);
    assert.match(rendered, /MARSHGO_SOURCE_STATE: "clean"/);
    assert.throws(() => bindReleaseBuildMetadata(compose.replace('MARSHGO_BUILD_SHA', 'MISSING_SHA'), metadata), /exactly one build metadata placeholder/);
  });
});
