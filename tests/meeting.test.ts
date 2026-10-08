import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { approachStage, etaMinutes, formatEta, formatMeters, meetingSnapshot } from '../src/navigation/meeting';

describe('driver ↔ passenger meeting maths', () => {
  const pickup: [number, number] = [24.0, 49.0];
  const north = (meters: number): [number, number] => [24.0, 49.0 + meters / 111_195];
  it('measures each side to the pickup and between them, with sensible ETAs', () => {
    const snap = meetingSnapshot({ pickup, driver: north(2400), passenger: north(-140) });
    assert.ok(Math.abs(snap.driverToPickupM! - 2400) < 15);
    assert.ok(Math.abs(snap.passengerToPickupM! - 140) < 5);
    assert.ok(Math.abs(snap.betweenM! - 2540) < 20);
    assert.equal(snap.driverEtaMin, 5, '2.4 km at ~30 km/h ≈ 5 min');
    assert.equal(snap.passengerEtaMin, 2, '140 m on foot ≈ 2 min');
    assert.equal(snap.stage, 'FAR');
  });
  it('uses the real driver speed when it is moving, and says «на місці» when there', () => {
    assert.equal(meetingSnapshot({ pickup, driver: north(2400), passenger: null, driverSpeedMps: 20 }).driverEtaMin, 2);
    const arrived = meetingSnapshot({ pickup, driver: north(10), passenger: north(-5) });
    assert.equal(arrived.driverEtaMin, 0); assert.equal(arrived.passengerEtaMin, 0);
    assert.equal(formatEta(0), 'на місці');
    assert.equal(formatEta(4), '≈ 4 хв');
  });
  it('handles one side not sharing yet', () => {
    const snap = meetingSnapshot({ pickup, driver: north(900), passenger: null });
    assert.equal(snap.passengerToPickupM, null); assert.equal(snap.betweenM, null); assert.equal(snap.stage, null);
    assert.equal(formatMeters(null), '—');
  });
  it('stages the approach by the distance between the two people', () => {
    assert.deepEqual([900, 800, 500, 200, 150, 100, 60, 50, 10].map(approachStage), ['FAR', 'APPROACHING', 'APPROACHING', 'NEAR', 'NEAR', 'VERY_NEAR', 'VERY_NEAR', 'HERE', 'HERE']);
    assert.equal(formatMeters(1260), '1,3 км');
    assert.equal(formatMeters(46), '50 м');
    assert.equal(etaMinutes(1, 10), 1);
  });
});
