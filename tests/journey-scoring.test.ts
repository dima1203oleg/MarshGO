import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JOURNEY_SCORE_WEIGHTS, scoreJourneys, selectRepresentativeJourneys, selectStrategyAlternatives, strategiesWithComparablePrices } from '../server/journey/scoring';
import type { JourneyOption } from '../server/journey/types';

const candidates: JourneyOption[] = [
  { id: 'bus', durationSeconds: 6600, priceMinor: 12000, transfers: 0, walkingMeters: 200, reliability: 0.82, transferRisk: 0, comfort: 0.6, legs: [{ mode: 'BUS' }] },
  { id: 'community', durationSeconds: 5100, priceMinor: 25000, transfers: 0, walkingMeters: 0, reliability: 0.91, transferRisk: 0, comfort: 0.8, legs: [{ mode: 'COMMUNITY' }] },
  { id: 'community-taxi', durationSeconds: 3900, priceMinor: 42000, transfers: 1, walkingMeters: 300, reliability: 0.88, transferRisk: 0.12, comfort: 0.95, legs: [{ mode: 'COMMUNITY' }, { mode: 'TAXI' }] },
];

describe('Journey strategy scoring', () => {
  it('uses the documented normalized starting weights for optimal search', () => {
    assert.deepEqual(JOURNEY_SCORE_WEIGHTS.BALANCED, {
      time: 0.35, price: 0.25, transfers: 0.10, walking: 0.10, risk: 0.20, comfort: 0,
    });
  });

  it('ranks door-to-door FASTEST and CHEAPEST alternatives by their strategy', () => {
    assert.equal(scoreJourneys(candidates, 'FASTEST')[0].journey.id, 'community-taxi');
    assert.equal(scoreJourneys(candidates, 'CHEAPEST')[0].journey.id, 'bus');
  });

  it('keeps every distinct route and scheduled alternative while ordering strategy winners first', () => {
    const similar: JourneyOption = { ...candidates[2], id: 'community-taxi-similar', durationSeconds: 3980, priceMinor: 43000 };
    const selected = selectRepresentativeJourneys([...candidates, similar]);
    assert.equal(new Set(selected.map((item) => item.journey.id)).size, selected.length);
    assert.ok(selected.some((item) => item.journey.id === 'community-taxi'));
    assert.ok(selected.some((item) => item.journey.id === 'community-taxi-similar'));
    assert.equal(selected.length, 4);
    assert.equal(selected[0]?.journey.id, 'community-taxi');
  });

  it('keeps results within the planner result bound', () => {
    const many = Array.from({ length: 25 }, (_, index): JourneyOption => ({
      ...candidates[0], id: `bus-${index}`, durationSeconds: 3600 + index * 60,
    }));
    assert.equal(selectRepresentativeJourneys(many, ['BALANCED'], 8).length, 8);
  });

  it('returns bounded Pareto alternatives with a rank for each strategy', () => {
    const options: JourneyOption[] = [
      { ...candidates[0], id: 'balanced', durationSeconds: 6000, priceMinor: 12000, transfers: 0 },
      { ...candidates[1], id: 'fast', durationSeconds: 3000, priceMinor: 40000 },
      { ...candidates[0], id: 'cheap', durationSeconds: 12000, priceMinor: 3000, transfers: 1 },
      { ...candidates[0], id: 'dominated', durationSeconds: 13000, priceMinor: 4000, transfers: 2 },
    ];
    const selected = selectStrategyAlternatives(options, ['BALANCED', 'FASTEST', 'CHEAPEST'], 2);
    assert.ok(selected.length >= 3);
    assert.equal(selected.some((item) => item.journey.id === 'dominated'), false);
    assert.ok(selected.every((item) => item.recommendedStrategies.every((strategy) =>
      Number.isInteger(item.strategyRanks?.[strategy]) && (item.strategyRanks?.[strategy] ?? 0) <= 2)));
  });

  it('rejects an excessive per-strategy result limit', () => {
    assert.throws(() => selectStrategyAlternatives(candidates, ['FASTEST'], 51), /between 1 and 50/);
  });

  it('penalizes fragile connections for the RELIABLE strategy', () => {
    const tightConnection: JourneyOption = { ...candidates[0], id: 'tight', durationSeconds: 6000, priceMinor: 10000, reliability: 0.9, transferRisk: 1 };
    const bufferedConnection: JourneyOption = { ...candidates[1], id: 'buffered', durationSeconds: 7200, priceMinor: 30000, reliability: 0.95, transferRisk: 0.05 };
    assert.equal(scoreJourneys([tightConnection, bufferedConnection], 'RELIABLE')[0].journey.id, 'buffered');
  });

  it('rejects incomplete or invalid option measurements instead of inventing values', () => {
    assert.throws(() => scoreJourneys([{ ...candidates[0], reliability: 1.2 }], 'RELIABLE'), /invalid scoring features/);
    assert.throws(() => scoreJourneys([{ ...candidates[0], priceMinor: -1 }], 'CHEAPEST'), /invalid scoring features/);
  });

  it('does not claim a cheapest route when any candidate has no fare', () => {
    const withUnknownFare: JourneyOption[] = [
      candidates[0],
      { ...candidates[1], id: 'unknown-fare', priceMinor: null },
    ];
    assert.deepEqual(
      strategiesWithComparablePrices(withUnknownFare, ['FASTEST', 'CHEAPEST', 'BALANCED']),
      ['FASTEST', 'BALANCED'],
    );
  });
});
