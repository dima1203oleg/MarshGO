import type { LocationFix, RouteResult } from '../../shared/navigation/contracts';
import { encodePolyline6, boundsOf } from '../../shared/navigation/geometry';
import { BasicRouteMapMatchingProvider } from '../../src/navigation/BasicRouteMapMatchingProvider';
import { validateLocationFix } from '../../src/platform/LocationProvider';

export type ReplayFix = { t: number; lat: number; lon: number; accuracy: number; speed?: number; online?: boolean };
export type ReplaySummary = { totalFixes: number; acceptedFixes: number; matchedFixes: number; rejected: Record<string, number>; offRouteIntervals: number; offlineFixes: number; meanConfidence: number | null };

const routePoints: [number, number][] = [[24, 49], [24.25, 49.25], [24.5, 49.5], [24.75, 49.75], [25, 50]];
const replayRoute: RouteResult = {
  id: 'synthetic-replay-route', provider: 'replay-fixture', geometry: { encoding: 'polyline6', value: encodePolyline6(routePoints) },
  bounds: boundsOf(routePoints), distanceMeters: 1000, durationSeconds: 100, trafficAware: false, legs: [], maneuvers: [],
  confidence: 'BASELINE', calculatedAt: '2026-01-01T00:00:00.000Z', routeVersion: 1,
};

export async function runReplay(fixes: ReplayFix[]): Promise<ReplaySummary> {
  const matcher = new BasicRouteMapMatchingProvider();
  let previous: LocationFix | undefined;
  let acceptedFixes = 0; let matchedFixes = 0; let offRouteIntervals = 0; let inOffRouteInterval = false; let offlineFixes = 0;
  const rejected: Record<string, number> = {}; const confidences: number[] = [];
  for (const sample of fixes) {
    const fix: LocationFix = {
      longitude: sample.lon, latitude: sample.lat, accuracyMeters: sample.accuracy, speedMps: sample.speed,
      capturedAtClient: new Date(Date.parse('2026-01-01T00:00:00.000Z') + sample.t).toISOString(), source: 'simulated',
    };
    if (sample.online === false) offlineFixes += 1;
    const checked = validateLocationFix(fix, Date.parse(fix.capturedAtClient), previous);
    if (!checked.accepted) { rejected[checked.code] = (rejected[checked.code] ?? 0) + 1; continue; }
    acceptedFixes += 1; previous = checked.fix;
    const matched = await matcher.match([checked.fix], { route: replayRoute });
    matchedFixes += 1; confidences.push(matched.confidence);
    const offRoute = matched.location.distanceFromRouteMeters > 500;
    if (offRoute && !inOffRouteInterval) offRouteIntervals += 1;
    inOffRouteInterval = offRoute;
  }
  return {
    totalFixes: fixes.length, acceptedFixes, matchedFixes, rejected, offRouteIntervals, offlineFixes,
    meanConfidence: confidences.length ? Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(4)) : null,
  };
}

export function parseReplayJsonl(text: string): ReplayFix[] {
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    let value: unknown;
    try { value = JSON.parse(line); } catch { throw new Error(`Invalid JSON on replay line ${index + 1}`); }
    if (!value || typeof value !== 'object') throw new Error(`Invalid replay sample on line ${index + 1}`);
    const sample = value as Record<string, unknown>;
    if (![sample.t, sample.lat, sample.lon, sample.accuracy].every((part) => typeof part === 'number' && Number.isFinite(part))) throw new Error(`Invalid replay sample on line ${index + 1}`);
    return sample as ReplayFix;
  });
}
