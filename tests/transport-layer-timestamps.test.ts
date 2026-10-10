import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeObservedAt } from '../server/mobility/transportLayers';

describe('live transport timestamp normalization', () => {
  it('preserves valid epoch seconds and milliseconds', () => {
    const expected = '2026-10-10T12:00:00.000Z';
    assert.equal(normalizeObservedAt(Date.parse(expected) / 1000), expected);
    assert.equal(normalizeObservedAt(Date.parse(expected)), expected);
  });

  it('keeps missing or malformed provider timestamps unknown', () => {
    assert.equal(normalizeObservedAt(undefined), null);
    assert.equal(normalizeObservedAt(null), null);
    assert.equal(normalizeObservedAt(''), null);
    assert.equal(normalizeObservedAt('not-a-timestamp'), null);
    assert.equal(normalizeObservedAt(0), null);
  });
});
