import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalSourceLabel } from '../src/components/mobility/stopArrivalMapping';

test('labels GTFS realtime predictions separately from GPS projections', () => {
  assert.equal(arrivalSourceLabel('TRIP_UPDATE'), 'GTFS-RT');
  assert.equal(arrivalSourceLabel('VEHICLE_PROJECTION'), 'GPS');
  assert.equal(arrivalSourceLabel('SCHEDULE'), 'Розклад');
  assert.equal(arrivalSourceLabel('UNKNOWN'), 'Прогноз недоступний');
});
