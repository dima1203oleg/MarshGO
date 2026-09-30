import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { initialMapTileStatus, reduceMapTileStatus } from '../src/services/mapTileStatus';

describe('map tile health status', () => {
  it('distinguishes a missing provider from a configured provider loading tiles', () => {
    assert.equal(initialMapTileStatus(false), 'unconfigured');
    assert.equal(initialMapTileStatus(true), 'loading');
  });

  it('reports tile failures and partial outages without hiding route geometry', () => {
    assert.equal(reduceMapTileStatus('loading', 'tileerror'), 'failed');
    assert.equal(reduceMapTileStatus('available', 'tileerror'), 'degraded');
    assert.equal(reduceMapTileStatus('degraded', 'tileload'), 'available');
  });
});
