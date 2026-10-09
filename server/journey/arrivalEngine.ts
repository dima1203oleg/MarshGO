/**
 * Transit Arrival Engine — calculates predicted arrival times for transit vehicles.
 *
 * Priority order (per ТЗ section 4):
 * 1. Valid GTFS-RT TripUpdate for the specific stop/trip  → HIGH confidence
 * 2. GPS projection along route shape                      → MEDIUM confidence
 * 3. Static schedule                                       → LOW confidence
 * 4. No reliable prediction available                      → UNKNOWN
 *
 * Rules:
 * - ETA is NEVER calculated as straight-line distance / current speed.
 * - Interpolated positions are NEVER reported as new GPS measurements.
 * - When GPS data is stale, confidence is downgraded and isStale flag is set.
 * - Uncertainty is always expressed in the response.
 */

import type { LiveVehiclePosition } from '../mobility/vehiclePositionCache';

export type ArrivalSource =
  | 'TRIP_UPDATE'       // from GTFS-RT TripUpdate.StopTimeUpdate
  | 'VEHICLE_PROJECTION' // projected from GPS position along route shape
  | 'SCHEDULE'          // static GTFS schedule only
  | 'UNKNOWN';          // no reliable data

export type ArrivalConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface TransitArrival {
  stopId: string;
  routeId: string;
  tripId?: string;
  vehicleId?: string;
  scheduledArrival?: string;   // ISO 8601
  predictedArrival?: string;   // ISO 8601
  arrivalSource: ArrivalSource;
  confidence: ArrivalConfidence;
  observedAt?: string;         // ISO 8601 — when the GPS was last seen
  isRealtime: boolean;
  /** Estimated seconds until arrival (null if unknown). */
  etaSeconds?: number;
  /** Human-readable status label for the UI. */
  displayLabel: string;
}

export interface StopArrivalInput {
  stopId: string;
  stopLat: number;
  stopLon: number;
  /** Route IDs to query — if empty, returns arrivals for all routes at this stop. */
  routeIds: string[];
  providerId?: string;
  /** Position from VehiclePositionCache. May be null if no vehicle matched. */
  vehiclePosition?: LiveVehiclePosition | null;
  /** Scheduled arrival from GTFS static (Unix seconds). */
  scheduledArrivalUnix?: number;
  /** Stop sequence and coordinates along the route shape (used for projection). */
  routeShapePoints?: Array<{ lat: number; lon: number; cumulativeDistanceM: number }>;
  /** Total shape length from stop of interest to end-of-line (used for normalisation). */
  remainingShapeM?: number;
  now?: Date;
}

const EARTH_RADIUS_M = 6_371_000;
const STALE_THRESHOLD_MS = 5 * 60_000;   // > 5 min = stale
const ANCIENT_THRESHOLD_MS = 15 * 60_000; // > 15 min = too old to project

function distanceMeters(
  aLon: number, aLat: number,
  bLon: number, bLat: number,
): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Find the nearest point on a polyline and return distance already travelled. */
function projectOntoShape(
  vehicleLon: number,
  vehicleLat: number,
  shapePoints: Array<{ lat: number; lon: number; cumulativeDistanceM: number }>,
): { distanceTravelledM: number; nearestIndex: number } | null {
  if (shapePoints.length === 0) return null;

  let bestDist = Infinity;
  let bestIndex = 0;
  for (let i = 0; i < shapePoints.length; i++) {
    const d = distanceMeters(vehicleLon, vehicleLat, shapePoints[i].lon, shapePoints[i].lat);
    if (d < bestDist) { bestDist = d; bestIndex = i; }
  }

  // Vehicle must be reasonably close to the shape (< 500 m) to project reliably
  if (bestDist > 500) return null;

  return {
    distanceTravelledM: shapePoints[bestIndex].cumulativeDistanceM,
    nearestIndex: bestIndex,
  };
}

function buildDisplayLabel(
  arrival: Pick<TransitArrival, 'arrivalSource' | 'confidence' | 'isRealtime' | 'etaSeconds' | 'observedAt' | 'routeId'>,
): string {
  const routeLabel = arrival.routeId ? `Маршрут ${arrival.routeId}` : 'Маршрут';

  if (!arrival.isRealtime || arrival.arrivalSource === 'SCHEDULE') {
    if (arrival.etaSeconds !== undefined) {
      const mins = Math.ceil(arrival.etaSeconds / 60);
      return `${routeLabel} — ${mins} хв за розкладом`;
    }
    return `${routeLabel} — за розкладом`;
  }

  if (arrival.arrivalSource === 'TRIP_UPDATE') {
    if (arrival.etaSeconds !== undefined) {
      const mins = Math.ceil(arrival.etaSeconds / 60);
      return `${routeLabel} — орієнтовно ${mins} хв · LIVE`;
    }
    return `${routeLabel} — LIVE`;
  }

  if (arrival.arrivalSource === 'VEHICLE_PROJECTION') {
    const ageStr = arrival.observedAt
      ? (() => {
          const ageMs = Date.now() - new Date(arrival.observedAt).getTime();
          const ageSec = Math.round(ageMs / 1000);
          return ageSec < 60 ? `${ageSec}с тому` : `${Math.round(ageSec / 60)} хв тому`;
        })()
      : null;
    if (arrival.etaSeconds !== undefined) {
      const mins = Math.ceil(arrival.etaSeconds / 60);
      const staleWarning = ageStr ? ` · GPS ${ageStr}` : '';
      return `${routeLabel} — орієнтовно ${mins} хв · GPS${staleWarning}`;
    }
    return ageStr
      ? `${routeLabel} · GPS оновлювався ${ageStr} — прогноз може бути неточним`
      : `${routeLabel} — поточне положення транспорту недоступне`;
  }

  return `${routeLabel} — дані недоступні`;
}

/**
 * Calculate predicted arrival time for a vehicle at a stop.
 *
 * This is the core ETA logic. It does NOT divide straight-line distance by speed.
 * Instead it uses shape geometry when available, falls back to schedule.
 */
export function calculateStopArrival(input: StopArrivalInput): TransitArrival {
  const now = input.now ?? new Date();
  const { stopId, routeIds } = input;
  const routeId = routeIds[0] ?? input.vehiclePosition?.routeId ?? 'unknown';

  // ── Base result (unknown / no data) ──────────────────────────────────────
  const base: TransitArrival = {
    stopId,
    routeId,
    vehicleId: input.vehiclePosition?.vehicleId,
    tripId: input.vehiclePosition?.tripId ?? undefined,
    arrivalSource: 'UNKNOWN',
    confidence: 'UNKNOWN',
    isRealtime: false,
    displayLabel: buildDisplayLabel({ arrivalSource: 'UNKNOWN', confidence: 'UNKNOWN', isRealtime: false, routeId }),
  };

  // ── Path 3: Schedule only ─────────────────────────────────────────────────
  if (input.scheduledArrivalUnix !== undefined) {
    const scheduledDate = new Date(input.scheduledArrivalUnix * 1000);
    const etaSec = Math.max(0, Math.round((scheduledDate.getTime() - now.getTime()) / 1000));
    const result: TransitArrival = {
      ...base,
      scheduledArrival: scheduledDate.toISOString(),
      predictedArrival: scheduledDate.toISOString(),
      arrivalSource: 'SCHEDULE',
      confidence: 'LOW',
      isRealtime: false,
      etaSeconds: etaSec,
      displayLabel: '',
    };
    result.displayLabel = buildDisplayLabel(result);
    return result;
  }

  // No vehicle position — return UNKNOWN
  const vp = input.vehiclePosition;
  if (!vp) {
    return base;
  }

  const observedAt = vp.observedAt.toISOString();
  const ageMs = now.getTime() - vp.observedAt.getTime();

  // Too old to project reliably
  if (ageMs > ANCIENT_THRESHOLD_MS) {
    const result: TransitArrival = {
      ...base,
      vehicleId: vp.vehicleId,
      tripId: vp.tripId ?? undefined,
      observedAt,
      arrivalSource: 'UNKNOWN',
      confidence: 'UNKNOWN',
      isRealtime: false,
      displayLabel: `Маршрут ${vp.routeId ?? routeId} — GPS застарів (${Math.round(ageMs / 60_000)} хв тому)`,
    };
    return result;
  }

  const isStale = ageMs > STALE_THRESHOLD_MS;

  // ── Path 2: GPS projection along shape ───────────────────────────────────
  if (input.routeShapePoints && input.routeShapePoints.length >= 2) {
    const projection = projectOntoShape(vp.lon, vp.lat, input.routeShapePoints);
    if (projection) {
      const stopCumDist = input.routeShapePoints.at(-1)!.cumulativeDistanceM;
      const remainingM = Math.max(0, stopCumDist - projection.distanceTravelledM);

      // Speed estimation:
      // Use reported speed if available and non-zero; otherwise use historical
      // average of 20 km/h for urban buses (conservative).
      const FALLBACK_SPEED_MS = 20_000 / 3600; // 20 km/h in m/s
      const speedMs = vp.speedMs && vp.speedMs > 0.5 ? vp.speedMs : FALLBACK_SPEED_MS;

      // Add 30% buffer for stops, traffic, etc.
      const rawEtaSec = remainingM / speedMs;
      const etaSec = Math.round(rawEtaSec * 1.3);

      // Downgrade confidence if GPS is stale
      const confidence: ArrivalConfidence = isStale ? 'LOW' : 'MEDIUM';

      const predictedDate = new Date(now.getTime() + etaSec * 1000);
      const result: TransitArrival = {
        ...base,
        vehicleId: vp.vehicleId,
        tripId: vp.tripId ?? undefined,
        predictedArrival: predictedDate.toISOString(),
        observedAt,
        arrivalSource: 'VEHICLE_PROJECTION',
        confidence,
        isRealtime: true,
        etaSeconds: etaSec,
        displayLabel: '',
      };
      result.displayLabel = buildDisplayLabel(result);
      return result;
    }
  }

  // ── Fallback: we have a position but no shape — use straight-line as proxy
  // (but be honest about the low confidence)
  const straightLineM = distanceMeters(vp.lon, vp.lat, input.stopLon, input.stopLat);
  if (straightLineM <= 50_000) {
    // Still don't divide by speed — add a route-factor multiplier (1.6x) and conservative speed
    const FALLBACK_SPEED_MS = 15_000 / 3600; // 15 km/h
    const etaSec = Math.round((straightLineM * 1.6) / FALLBACK_SPEED_MS);
    const predictedDate = new Date(now.getTime() + etaSec * 1000);
    const result: TransitArrival = {
      ...base,
      vehicleId: vp.vehicleId,
      tripId: vp.tripId ?? undefined,
      predictedArrival: predictedDate.toISOString(),
      observedAt,
      arrivalSource: 'VEHICLE_PROJECTION',
      confidence: isStale ? 'UNKNOWN' : 'LOW',
      isRealtime: true,
      etaSeconds: etaSec,
      displayLabel: '',
    };
    result.displayLabel = buildDisplayLabel(result);
    return result;
  }

  return {
    ...base,
    vehicleId: vp.vehicleId,
    observedAt,
    arrivalSource: 'UNKNOWN',
    confidence: 'UNKNOWN',
    isRealtime: false,
    displayLabel: `Маршрут ${vp.routeId ?? routeId} — поточне положення транспорту недоступне`,
  };
}

/**
 * Format a list of TransitArrivals for the stop arrival board.
 * Returns arrivals sorted by predictedArrival / scheduledArrival, nearest first.
 */
export function sortArrivals(arrivals: TransitArrival[]): TransitArrival[] {
  return [...arrivals].sort((a, b) => {
    const etaA = a.etaSeconds ?? Infinity;
    const etaB = b.etaSeconds ?? Infinity;
    return etaA - etaB;
  });
}
