import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const groups = ['urban', 'intercity', 'strategies', 'modeControls', 'negativeControls'] as const;
const modeForCategory: Record<string, string> = { bus: 'BUS', marshrutka: 'MARSHRUTKA', trolleybus: 'TROLLEYBUS', tram: 'TRAM', metro: 'METRO', carpool: 'CARPOOL', taxi: 'TAXI', train: 'RAIL', bike: 'BICYCLE', scooter: 'SCOOTER', carsharing: 'CARSHARING', transfer: 'TRANSFER' };
const modes = new Set(['WALK', ...Object.values(modeForCategory)]);

type JsonObject = Record<string, unknown>;
type Finding = { location: string; code: string };

function object(value: unknown, location: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${location} must be an object`);
  return value as JsonObject;
}

function coordinates(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)
    && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
}

function timestamp(value: unknown): number {
  return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
}

export function auditNationalJourneyEvidence(value: unknown, expectedServerSha: string) {
  if (!/^[a-f0-9]{40}$/.test(expectedServerSha)) throw new Error('Expected Server SHA must contain 40 lowercase hex characters');
  const archive = object(value, 'archive');
  const runtime = object(archive.runtime, 'runtime');
  const findings: Finding[] = [];
  const add = (location: string, code: string) => findings.push({ location, code });
  if (runtime.commitSha !== expectedServerSha) add('runtime', 'SERVER_SHA_MISMATCH');
  if (runtime.sourceState !== 'clean') add('runtime', 'SERVER_SOURCE_NOT_CLEAN');
  if (typeof runtime.buildId !== 'string' || !runtime.buildId) add('runtime', 'BUILD_ID_MISSING');
  const witnesses: { location: string; journeyId: string; modes: string[] }[] = [];
  let probeCount = 0;
  let emptyResponses = 0;
  let nonemptyResponses = 0;

  for (const group of groups) {
    if (!Array.isArray(archive[group])) throw new Error(`${group} must be an array`);
    for (const [index, raw] of archive[group].entries()) {
      probeCount++;
      const location = `${group}[${index}]`;
      const probe = object(raw, location);
      const input = object(probe.input, `${location}.input`);
      for (const endpoint of ['origin', 'destination']) {
        const place = object(input[endpoint], `${location}.input.${endpoint}`);
        if (!coordinates(place.coordinates)) add(location, 'REQUEST_COORDINATES_INVALID');
      }
      const requestedDeparture = timestamp(input.departureAt);
      if (!Number.isFinite(requestedDeparture)) add(location, 'REQUEST_DEPARTURE_NOT_RECORDED');
      const selectedModes = input.modes;
      if (selectedModes !== null && (!Array.isArray(selectedModes) || selectedModes.some(mode => typeof mode !== 'string' || !Object.hasOwn(modeForCategory, mode)))) {
        add(location, 'REQUEST_MODES_INVALID');
      }
      if (!Number.isInteger(probe.journeys) || Number(probe.journeys) < 0) throw new Error(`${location}.journeys must be a nonnegative integer`);
      if (!Array.isArray(probe.itinerarySummaries)) throw new Error(`${location}.itinerarySummaries must be an array`);
      if (probe.journeys !== probe.itinerarySummaries.length) add(location, 'INDIVIDUAL_WITNESSES_INCOMPLETE');
      if (probe.returnedCount !== undefined && probe.returnedCount !== probe.journeys) add(location, 'RETURNED_COUNT_MISMATCH');
      if (probe.http !== 200) {
        if (probe.journeys !== 0) add(location, 'JOURNEYS_ON_ERROR_RESPONSE');
        if (!(probe.http === 400 && Array.isArray(selectedModes) && selectedModes.length === 0)) add(location, 'HTTP_NOT_SUCCESS');
      } else if (Array.isArray(selectedModes) && selectedModes.length === 0) {
        add(location, 'EMPTY_MODE_SELECTION_ACCEPTED');
      }
      if (probe.journeys === 0) emptyResponses++; else nonemptyResponses++;
      const ids = new Set<string>();
      for (const [journeyIndex, rawJourney] of probe.itinerarySummaries.entries()) {
        const journeyLocation = `${location}.itinerarySummaries[${journeyIndex}]`;
        const journey = object(rawJourney, journeyLocation);
        const id = journey.id;
        if (typeof id !== 'string' || !id) {
          add(journeyLocation, 'JOURNEY_ID_MISSING');
        } else if (ids.has(id)) {
          add(journeyLocation, 'DUPLICATE_JOURNEY_ID');
        } else {
          ids.add(id);
        }
        const sequence = journey.modes;
        if (!Array.isArray(sequence) || sequence.length === 0 || sequence.some(mode => !modes.has(mode))) {
          add(journeyLocation, 'INDIVIDUAL_MODE_SEQUENCE_MISSING');
        } else {
          const transit = sequence.filter(mode => mode !== 'WALK');
          if (Array.isArray(selectedModes) && transit.some(mode => !selectedModes.some(category => modeForCategory[category] === mode))) add(journeyLocation, 'EXCLUDED_MODE_RETURNED');
          if (!Array.isArray(journey.transitModes) || JSON.stringify(journey.transitModes) !== JSON.stringify(transit)) add(journeyLocation, 'TRANSIT_MODE_SEQUENCE_MISMATCH');
          if (typeof id === 'string' && id && transit.length > 0) witnesses.push({ location: journeyLocation, journeyId: id, modes: sequence });
        }
        const departure = timestamp(journey.departureAt);
        const arrival = timestamp(journey.arrivalAt);
        if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival < departure) add(journeyLocation, 'JOURNEY_CHRONOLOGY_INVALID');
        if (Number.isFinite(requestedDeparture) && departure < requestedDeparture) add(journeyLocation, 'DEPARTURE_BEFORE_REQUEST');
      }
    }
  }
  if (probeCount === 0) add('archive', 'NO_PROBES');
  if (witnesses.length === 0) add('archive', 'NO_INDIVIDUAL_JOURNEY_WITNESSES');
  return {
    summaryIntegrity: findings.length === 0 ? 'VERIFIED' : 'FAIL',
    releaseStatus: 'NOT_RELEASED',
    expectedServerSha,
    observedServerSha: runtime.commitSha,
    probeCount,
    emptyResponses,
    nonemptyResponses,
    witnessCount: witnesses.length,
    findings,
    witnesses,
    limitations: ['SUMMARY_ONLY_NOT_RAW_LEG_GEOMETRY', 'SOURCE_RIGHTS_AND_CALENDARS_NOT_ATTESTED', 'UI_ACCEPTANCE_NOT_ATTESTED', 'NO_NATIONWIDE_COMPLETENESS_PROOF'],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file, sha] = process.argv.slice(2);
  if (!file || !sha || process.argv.length !== 4) {
    console.error('Usage: tsx tools/audit-national-journey-evidence.ts <archive.json> <expected-server-sha>');
    process.exitCode = 1;
  } else {
    try {
      const result = auditNationalJourneyEvidence(JSON.parse(readFileSync(file, 'utf8')), sha);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.summaryIntegrity === 'VERIFIED' ? 0 : 1;
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Invalid national journey evidence');
      process.exitCode = 1;
    }
  }
}
