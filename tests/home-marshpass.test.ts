import assert from 'node:assert/strict';
import test from 'node:test';
import { selectActiveMarshPasses, type HomeTrip } from '../src/views/HomeV5';

const trip = (overrides: Partial<HomeTrip>): HomeTrip => ({
  id: 'trip-1',
  kind: 'booking',
  origin_name: 'Львів',
  destination_name: 'Київ',
  departure_at: '2026-10-13T07:00:00.000Z',
  status: 'confirmed',
  ...overrides,
});

test('Home MarshPass slot only accepts a confirmed private-ride passenger booking', () => {
  const eligible = trip({ id: 'eligible' });
  const journeysNeverBecomePasses = trip({ id: 'journey', kind: 'journey' });
  const driverBooking = trip({ id: 'driver-booking', currentUserIsDriver: true });
  const cancelled = trip({ id: 'cancelled', status: 'cancelled' });
  const complete = trip({ id: 'complete', status: 'completed' });

  assert.deepEqual(
    selectActiveMarshPasses([eligible, journeysNeverBecomePasses, driverBooking, cancelled, complete]),
    [eligible],
  );
});

test('boarding and in-progress private rides remain in the MarshPass slot', () => {
  const boarding = trip({ id: 'boarding', status: 'boarding' });
  const inProgress = trip({ id: 'in-progress', status: 'in_progress' });

  assert.deepEqual(selectActiveMarshPasses([boarding, inProgress]).map(({ id }) => id), ['boarding', 'in-progress']);
});
