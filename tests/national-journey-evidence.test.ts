import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { auditNationalJourneyEvidence } from '../tools/audit-national-journey-evidence.ts';

const sha = 'a'.repeat(40);

function fixture() {
  return {
    runtime: { commitSha: sha, sourceState: 'clean', buildId: 'fixture-only' },
    urban: [{
      input: { origin: { coordinates: [30.5, 50.4] }, destination: { coordinates: [30.6, 50.5] }, departureAt: '2026-11-17T08:00:00+02:00', modes: ['bus', 'tram'] as string[] | null },
      http: 200, journeys: 1, returnedCount: 1,
      itinerarySummaries: [{ id: 'fixture-journey', modes: ['WALK', 'BUS', 'WALK', 'TRAM', 'WALK'], transitModes: ['BUS', 'TRAM'], departureAt: '2026-11-17T06:01:00Z', arrivalAt: '2026-11-17T07:00:00Z' }],
    }],
    intercity: [], strategies: [], modeControls: [], negativeControls: [],
  };
}

function codes(archive: unknown) {
  return auditNationalJourneyEvidence(archive, sha).findings.map(finding => finding.code);
}

test('labeled fixture summary passes integrity but never certifies release or leg geometry', () => {
  const result = auditNationalJourneyEvidence(fixture(), sha);
  assert.equal(result.summaryIntegrity, 'VERIFIED');
  assert.equal(result.releaseStatus, 'NOT_RELEASED');
  assert.equal(result.witnessCount, 1);
  assert.deepEqual(result.witnesses[0].modes, ['WALK', 'BUS', 'WALK', 'TRAM', 'WALK']);
  assert.ok(result.limitations.includes('SUMMARY_ONLY_NOT_RAW_LEG_GEOMETRY'));
});

test('aggregate category union cannot substitute for an individual itinerary', () => {
  const archive = fixture();
  archive.urban[0].itinerarySummaries = [];
  assert.ok(codes(archive).includes('INDIVIDUAL_WITNESSES_INCOMPLETE'));
  assert.ok(codes(archive).includes('NO_INDIVIDUAL_JOURNEY_WITNESSES'));
});

test('no probes and empty successful responses cannot pass by empty-equals-empty', () => {
  const archive = fixture();
  archive.urban = [];
  assert.ok(codes(archive).includes('NO_PROBES'));
  archive.urban = fixture().urban;
  archive.urban[0].journeys = 0;
  archive.urban[0].returnedCount = 0;
  archive.urban[0].itinerarySummaries = [];
  assert.ok(codes(archive).includes('NO_INDIVIDUAL_JOURNEY_WITNESSES'));
});

test('a walking-only itinerary cannot establish transport coverage', () => {
  const archive = fixture();
  archive.urban[0].itinerarySummaries[0].modes = ['WALK'];
  archive.urban[0].itinerarySummaries[0].transitModes = [];
  const result = auditNationalJourneyEvidence(archive, sha);
  assert.equal(result.witnessCount, 0);
  assert.ok(result.findings.some(finding => finding.code === 'NO_INDIVIDUAL_JOURNEY_WITNESSES'));
});

test('exact per-request departure is required, not inherited from archive prose', () => {
  const archive = fixture();
  Reflect.deleteProperty(archive.urban[0].input, 'departureAt');
  assert.ok(codes({ ...archive, departureAt: '2026-11-17T08:00:00+02:00' }).includes('REQUEST_DEPARTURE_NOT_RECORDED'));
});

test('timezone-aware chronology rejects pre-request departure and reversed arrival', () => {
  const archive = fixture();
  archive.urban[0].itinerarySummaries[0].departureAt = '2026-11-17T05:59:00Z';
  assert.ok(codes(archive).includes('DEPARTURE_BEFORE_REQUEST'));
  archive.urban[0].itinerarySummaries[0].arrivalAt = '2026-11-17T05:00:00Z';
  assert.ok(codes(archive).includes('JOURNEY_CHRONOLOGY_INVALID'));
  archive.urban[0].input.departureAt = '2026-11-17T08:00:00';
  assert.ok(codes(archive).includes('REQUEST_DEPARTURE_NOT_RECORDED'));
});

test('excluded bus is rejected while train and bicycle categories map to RAIL and BICYCLE', () => {
  const archive = fixture();
  archive.urban[0].input.modes = ['tram'];
  assert.ok(codes(archive).includes('EXCLUDED_MODE_RETURNED'));
  archive.urban[0].input.modes = ['train', 'bike'];
  archive.urban[0].itinerarySummaries[0].modes = ['BICYCLE', 'RAIL'];
  archive.urban[0].itinerarySummaries[0].transitModes = ['BICYCLE', 'RAIL'];
  assert.equal(auditNationalJourneyEvidence(archive, sha).summaryIntegrity, 'VERIFIED');
});

test('runtime identity, coordinates, IDs and response counts are checked independently', () => {
  const archive = fixture();
  archive.runtime.commitSha = 'b'.repeat(40);
  archive.runtime.sourceState = 'dirty';
  archive.urban[0].input.origin.coordinates = [181, 50];
  archive.urban[0].returnedCount = 2;
  archive.urban[0].itinerarySummaries.push(archive.urban[0].itinerarySummaries[0]);
  for (const code of ['SERVER_SHA_MISMATCH', 'SERVER_SOURCE_NOT_CLEAN', 'REQUEST_COORDINATES_INVALID', 'RETURNED_COUNT_MISMATCH', 'DUPLICATE_JOURNEY_ID']) assert.ok(codes(archive).includes(code));
});

test('malformed archive and expected SHA fail closed', () => {
  assert.throws(() => auditNationalJourneyEvidence({}, 'main'), /40 lowercase hex/);
  assert.throws(() => auditNationalJourneyEvidence(null, sha), /archive must/);
  assert.throws(() => auditNationalJourneyEvidence({ runtime: {} }, sha), /urban must/);
});

test('historical national archive is rejected without rewriting its missing request facts', () => {
  const archive = JSON.parse(readFileSync(new URL('../docs/evidence/national-api-chain-probe-2026-11-16.json', import.meta.url), 'utf8'));
  const result = auditNationalJourneyEvidence(archive, archive.runtime.commitSha);
  assert.equal(result.summaryIntegrity, 'FAIL');
  assert.ok(result.probeCount > 0);
  assert.ok(result.witnessCount > 0);
  assert.ok(result.findings.some(finding => finding.code === 'SERVER_SOURCE_NOT_CLEAN'));
  assert.ok(result.findings.some(finding => finding.code === 'REQUEST_DEPARTURE_NOT_RECORDED'));
  assert.equal(result.findings.filter(finding => finding.code === 'INDIVIDUAL_WITNESSES_INCOMPLETE').length, 0);
  assert.equal(result.witnessCount, result.witnesses.length);
  assert.equal(result.releaseStatus, 'NOT_RELEASED');
});

test('recorded Qoder bus-only request preserves exact date and stable dirty runtime', () => {
  const probe = JSON.parse(readFileSync(new URL('../docs/evidence/qoder-kyiv-bus-exact-request-2026-11-16.json', import.meta.url), 'utf8'));
  assert.equal(probe.status, 'complete');
  assert.equal(probe.http, 200);
  assert.equal(probe.requests.length, 1);
  assert.deepEqual(probe.runtimeBefore, probe.runtimeAfter);
  assert.equal(probe.runtimeBefore.data.sourceState, 'dirty');
  const request = probe.requests[0].body;
  assert.equal(request.departureAt, '2026-11-18T06:00:00.000Z');
  assert.deepEqual(request.preferences.allowedTransportTypes, ['bus']);
  const data = probe.response.data;
  assert.equal(data.returnedCount, data.journeys.length);
  assert.equal(data.journeys.length, 2);
  assert.equal(data.partial, true);
  for (const journey of data.journeys) {
    assert.equal(journey.requestedDepartureAt, request.departureAt);
    assert.deepEqual(journey.legs.map((leg: { mode: string }) => leg.mode), ['WALK', 'BUS', 'WALK']);
    let previousArrival = Date.parse(request.departureAt);
    for (const leg of journey.legs) {
      const departure = Date.parse(leg.departureAt);
      const arrival = Date.parse(leg.arrivalAt);
      assert.ok(Number.isFinite(departure) && Number.isFinite(arrival));
      assert.ok(departure >= previousArrival);
      assert.ok(arrival >= departure);
      assert.equal(leg.durationSeconds, (arrival - departure) / 1000);
      assert.ok(Array.isArray(leg.routeGeometry) && leg.routeGeometry.length >= 2);
      for (const point of leg.routeGeometry) {
        assert.equal(point.length, 2);
        assert.ok(point.every(Number.isFinite));
        assert.ok(Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90);
      }
      if (leg.mode === 'WALK') assert.equal(leg.source, 'osrm-foot-route');
      if (leg.mode === 'BUS') assert.equal(leg.liveStatus, 'SCHEDULED');
      previousArrival = arrival;
    }
    assert.equal(journey.totalDurationSeconds, (previousArrival - Date.parse(request.departureAt)) / 1000);
    assert.equal(journey.priceStatus, 'ESTIMATED');
  }
});

test('recorded interregional request preserves overnight chains without certifying estimated walking', () => {
  const probe = JSON.parse(readFileSync(new URL('../docs/evidence/qoder-kharkiv-lviv-exact-request-2026-11-16.json', import.meta.url), 'utf8'));
  assert.equal(probe.status, 'complete');
  assert.equal(probe.http, 200);
  assert.equal(probe.requests.length, 1);
  assert.deepEqual(probe.runtimeBefore, probe.runtimeAfter);
  assert.equal(probe.runtimeBefore.data.sourceState, 'dirty');
  const request = probe.requests[0].body;
  assert.equal(request.departureAt, '2026-11-18T06:00:00.000Z');
  assert.deepEqual(request.origin.coordinates, [36.2304, 49.9935]);
  assert.deepEqual(request.destination.coordinates, [24.0297, 49.8397]);
  assert.deepEqual(request.preferences.allowedTransportTypes, ['carpool', 'marshrutka', 'bus', 'taxi', 'tram', 'trolleybus', 'metro', 'train', 'bike', 'scooter', 'carsharing', 'transfer']);
  const data = probe.response.data;
  assert.equal(data.returnedCount, data.journeys.length);
  assert.equal(data.journeys.length, 12);
  assert.equal(new Set(data.journeys.map((journey: { id: string }) => journey.id)).size, 12);
  assert.equal(data.partial, true);
  assert.ok(data.partialReasons.includes('walking_routing_unavailable'));
  assert.deepEqual(data.availableStrategies, ['BALANCED', 'FASTEST']);
  for (const journey of data.journeys) {
    assert.equal(journey.requestedDepartureAt, request.departureAt);
    assert.equal(journey.priceStatus, 'UNKNOWN');
    assert.equal(journey.totalPriceMinor, null);
    let previousArrival = Date.parse(request.departureAt);
    let waitingSeconds = 0;
    let walkingMeters = 0;
    let transitLegs = 0;
    for (const leg of journey.legs) {
      const departure = Date.parse(leg.departureAt);
      const arrival = Date.parse(leg.arrivalAt);
      assert.ok(Number.isFinite(departure) && Number.isFinite(arrival));
      assert.ok(departure >= previousArrival);
      assert.ok(arrival >= departure);
      assert.equal(leg.durationSeconds, (arrival - departure) / 1000);
      waitingSeconds += (departure - previousArrival) / 1000;
      if (leg.mode === 'WALK') {
        assert.equal(leg.source, 'walking-grid-estimate');
        assert.equal(leg.liveStatus, 'UNVERIFIED');
        assert.equal(leg.routeGeometry, undefined);
        walkingMeters += leg.distanceMeters;
      } else {
        transitLegs++;
        assert.ok(['RAIL', 'TRAM', 'BUS'].includes(leg.mode));
        assert.equal(leg.source, 'gtfs-static');
        assert.equal(leg.liveStatus, 'SCHEDULED');
        assert.ok(Array.isArray(leg.routeGeometry) && leg.routeGeometry.length >= 2);
        for (const point of leg.routeGeometry) {
          assert.equal(point.length, 2);
          assert.ok(point.every(Number.isFinite));
          assert.ok(Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90);
        }
      }
      previousArrival = arrival;
    }
    assert.equal(journey.transfers, transitLegs - 1);
    assert.equal(journey.waitingSeconds, waitingSeconds);
    assert.equal(journey.walkingMeters, walkingMeters);
    assert.equal(journey.totalDurationSeconds, (previousArrival - Date.parse(request.departureAt)) / 1000);
  }
  const selected = data.journeys.find((journey: { id: string }) => journey.id === 'af9395af-8bac-49c3-bb9a-f47476ae7831');
  assert.ok(selected);
  assert.equal(selected.transfers, 4);
  assert.deepEqual(selected.legs.map((leg: { mode: string }) => leg.mode), ['WALK', 'RAIL', 'RAIL', 'WALK', 'TRAM', 'BUS', 'WALK', 'BUS', 'WALK']);
  assert.deepEqual(selected.legs.filter((leg: { mode: string }) => leg.mode !== 'WALK').map((leg: { routeName: string }) => leg.routeName), ['17', '43', 'Т06', 'А41', 'А05']);
  assert.equal(selected.legs[2].departureAt, '2026-11-18T20:34:00.000Z');
  assert.equal(selected.legs[2].arrivalAt, '2026-11-19T03:10:00.000Z');
  assert.equal(selected.legs.at(-1).arrivalAt, '2026-11-19T05:35:31.000Z');
});
