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
