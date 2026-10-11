import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isFreshVehicleObservation, normalizeObservedAt } from '../server/mobility/transportLayers';

describe('live transport timestamp normalization', () => {
  it('preserves valid epoch seconds and milliseconds', () => {
    const expected = '2026-10-10T12:00:00.000Z';
    assert.equal(normalizeObservedAt(Date.parse(expected) / 1000), expected);
    assert.equal(normalizeObservedAt(Date.parse(expected)), expected);
    assert.equal(normalizeObservedAt({ toNumber: () => Date.parse(expected) / 1000 }), expected);
  });

  it('keeps missing or malformed provider timestamps unknown', () => {
    assert.equal(normalizeObservedAt(undefined), null);
    assert.equal(normalizeObservedAt(null), null);
    assert.equal(normalizeObservedAt(''), null);
    assert.equal(normalizeObservedAt('not-a-timestamp'), null);
    assert.equal(normalizeObservedAt(0), null);
  });
});

describe('live transport freshness', () => {
  const now = Date.parse('2026-10-11T12:00:00.000Z');

  it('keeps only timestamped fixes up to three minutes old and within clock skew tolerance', () => {
    assert.equal(isFreshVehicleObservation('2026-10-11T11:59:00.000Z', now), true);
    assert.equal(isFreshVehicleObservation('2026-10-11T11:57:00.000Z', now), true);
    assert.equal(isFreshVehicleObservation('2026-10-11T11:56:59.000Z', now), false);
    assert.equal(isFreshVehicleObservation('2026-10-11T12:00:20.000Z', now), true);
    assert.equal(isFreshVehicleObservation('2026-10-11T12:00:31.000Z', now), false);
    assert.equal(isFreshVehicleObservation(null, now), false);
    assert.equal(isFreshVehicleObservation('invalid', now), false);
  });
});
