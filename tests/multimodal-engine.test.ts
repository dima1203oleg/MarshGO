import test from 'node:test';
import assert from 'node:assert/strict';
import {
  composeMultimodalJourneys,
  rankSearchResults,
} from '../src/features/search/model/multimodalEngine';
import type { RouteSearchResultItem } from '../src/features/search/model/types';

const result = (id: string, durationSeconds: number, priceMinor: number): RouteSearchResultItem => ({
  id,
  type: 'carpool',
  modeLabel: 'Попутка',
  source: 'community',
  carrierName: 'Community offer',
  departureTime: '08:00',
  arrivalTime: '09:00',
  departureCity: 'Львів',
  arrivalCity: 'Стрий',
  departureAddress: 'Львів',
  arrivalAddress: 'Стрий',
  durationLabel: `${durationSeconds} с`,
  distanceLabel: '50 км',
  distanceMeters: 50_000,
  durationSeconds,
  priceMinor,
  priceLabel: `${priceMinor} коп.`,
  priceUnit: 'за місце',
  isPriceFixed: true,
  features: [],
  stopsCount: 0,
});

test('route result ranking changes order using provider-returned facts only', () => {
  const providerResults = [result('slow-cheap', 7200, 10000), result('fast-expensive', 3600, 20000)];
  assert.deepEqual(rankSearchResults(providerResults, 'FASTEST').map((item) => item.id), ['fast-expensive', 'slow-cheap']);
  assert.deepEqual(rankSearchResults(providerResults, 'CHEAPEST').map((item) => item.id), ['slow-cheap', 'fast-expensive']);
  assert.equal(rankSearchResults([], 'BALANCED').length, 0);
  assert.equal(rankSearchResults(providerResults, 'BALANCED').length, providerResults.length);
});

test('ranking never invents entries or assigns a non-provider route type', () => {
  const providerResults = [result('offer-a', 3600, 12000)];
  const ranked = rankSearchResults(providerResults, 'BALANCED');
  assert.deepEqual(ranked.map((item) => item.id), ['offer-a']);
  assert.equal(ranked[0].type, 'carpool');
  assert.equal(ranked[0].source, 'community');
});

test('composeMultimodalJourneys never invents routes when no provider returned results', () => {
  const journeys = composeMultimodalJourneys({
    origin: { label: 'Київ, Центр', latitude: 50.4501, longitude: 30.5234, providerId: 'kyiv' },
    destination: { label: 'Львів, Центр', latitude: 49.8397, longitude: 24.0297, providerId: 'lviv' },
    dateStr: '2026-10-10',
    timeStr: '09:00',
    passengers: 1,
    strategy: 'BALANCED',
  });
  assert.deepEqual(journeys, []);
});

test('composeMultimodalJourneys ranks only the provider records it receives', () => {
  const providerResults = [result('slow-cheap', 7200, 10000), result('fast-expensive', 3600, 20000)];
  const journeys = composeMultimodalJourneys({
    origin: { label: 'Київ, Центр', latitude: 50.4501, longitude: 30.5234, providerId: 'kyiv' },
    destination: { label: 'Львів, Центр', latitude: 49.8397, longitude: 24.0297, providerId: 'lviv' },
    dateStr: '2026-10-10',
    timeStr: '09:00',
    passengers: 1,
    strategy: 'FASTEST',
    realOffers: providerResults,
  });
  assert.deepEqual(journeys.map((journey) => journey.id), ['fast-expensive', 'slow-cheap']);
  assert.equal(journeys.length, providerResults.length);
  assert.ok(journeys.every((journey) => journey.type === 'carpool' && journey.source === 'community'));
  assert.equal(journeys[0].badge, 'Найшвидший серед знайдених');
});
