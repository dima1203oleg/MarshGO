/**
 * VehiclePositionCache — in-memory store for GTFS-RT and JSON vehicle positions.
 *
 * Design rules:
 * - Positions are fetched only on the server (backend), never directly from clients.
 * - Each source has a configurable freshness threshold; stale positions are flagged,
 *   NOT removed, so the UI can show STALE status instead of disappearing vehicles.
 * - GPS coordinates are stored as-received and validated before insertion.
 * - Interpolated / extrapolated positions are never returned as new GPS measurements.
 * - Cache keys use `${providerId}:${vehicleId}` to avoid cross-provider collisions.
 */

import bindings from 'gtfs-realtime-bindings';
import { fetchBinary, fetchJson } from './safeFetch';
import { extractVehicleList, vehicleTransportLabel } from './jsonVehicles';

const { transit_realtime } = bindings;

export interface LiveVehiclePosition {
  /** Provider-namespaced key: `${providerId}:${vehicleId}` */
  key: string;
  vehicleId: string;
  providerId: string;
  /** GTFS route_id if available. */
  routeId: string | null;
  /** GTFS trip_id if available. */
  tripId: string | null;
  /** Direction (0 or 1) from GTFS-RT VehiclePosition.trip.direction_id */
  directionId: number | null;
  lat: number;
  lon: number;
  /** True bearing in degrees (0–360), null if not provided. */
  bearing: number | null;
  /** Speed in m/s, null if not provided. */
  speedMs: number | null;
  /** Transport mode label (bus, marshrutka, tram, etc.) */
  mode: string;
  /** UTC timestamp of the GPS measurement from the source. */
  observedAt: Date;
  /** UTC timestamp of when we fetched this record. */
  fetchedAt: Date;
  /** True if observedAt is older than the provider's stale threshold. */
  isStale: boolean;
  /** Distance in meters to a query stop (filled in by callers). */
  distanceToStopM?: number;
}

interface ProviderConfig {
  providerId: string;
  sourceType: 'gtfs_rt' | 'json';
  feedUrl: string;
  /** Time before a position is considered STALE (ms). Defaults to 5 minutes. */
  stalenessThresholdMs?: number;
  /** Mode hint for JSON feeds that don't carry route_type. */
  defaultMode?: string;
}

const DEFAULT_STALE_MS = 5 * 60_000; // 5 minutes
const MAX_RT_BYTES = 10 * 1024 * 1024;
const EARTH_RADIUS_M = 6_371_000;

function distanceMeters(a: [number, number], b: [number, number]): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export class VehiclePositionCache {
  private static instance: VehiclePositionCache;
  /** key → position */
  private readonly positions = new Map<string, LiveVehiclePosition>();
  /** providerId → fetch promise (prevents parallel fetches for the same provider) */
  private readonly inflight = new Map<string, Promise<void>>();

  private constructor() {}

  static getInstance(): VehiclePositionCache {
    if (!VehiclePositionCache.instance) {
      VehiclePositionCache.instance = new VehiclePositionCache();
    }
    return VehiclePositionCache.instance;
  }

  /** Fetch positions from a GTFS-RT VehiclePositions protobuf endpoint. */
  async refreshGtfsRt(config: ProviderConfig): Promise<{ loaded: number; errors: string[] }> {
    if (config.sourceType !== 'gtfs_rt') return { loaded: 0, errors: ['wrong sourceType'] };
    const existing = this.inflight.get(config.providerId);
    if (existing) { await existing; return { loaded: 0, errors: [] }; }

    const errors: string[] = [];
    let loaded = 0;
    const promise = (async () => {
      let data: Uint8Array;
      try {
        ({ data } = await fetchBinary(config.feedUrl, MAX_RT_BYTES, 20_000));
      } catch (err) {
        errors.push(`fetch failed: ${err instanceof Error ? err.message : 'unknown'}`);
        return;
      }

      let message: InstanceType<typeof bindings.transit_realtime.FeedMessage>;
      try {
        message = transit_realtime.FeedMessage.decode(data);
      } catch {
        errors.push('invalid GTFS-RT protobuf');
        return;
      }

      const fetchedAt = new Date();
      const stalenessMs = config.stalenessThresholdMs ?? DEFAULT_STALE_MS;

      for (const entity of message.entity) {
        const vp = entity.vehicle;
        if (!vp?.position) continue;
        const lat = vp.position.latitude;
        const lon = vp.position.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)
          || Math.abs(lat) > 90 || Math.abs(lon) > 180
          || (lat === 0 && lon === 0)) continue;

        const vehicleId = String(vp.vehicle?.id ?? entity.id ?? '');
        if (!vehicleId) continue;

        const ts = Number(vp.timestamp ?? message.header.timestamp ?? 0);
        const observedAt = ts > 0 ? new Date(ts * 1000) : fetchedAt;
        const isStale = fetchedAt.getTime() - observedAt.getTime() > stalenessMs;

        const position: LiveVehiclePosition = {
          key: `${config.providerId}:${vehicleId}`,
          vehicleId,
          providerId: config.providerId,
          routeId: vp.trip?.routeId ?? null,
          tripId: vp.trip?.tripId ?? null,
          directionId: vp.trip?.directionId ?? null,
          lat,
          lon,
          bearing: Number.isFinite(vp.position.bearing) ? (vp.position.bearing ?? null) : null,
          speedMs: Number.isFinite(vp.position.speed) ? (vp.position.speed ?? null) : null,
          mode: config.defaultMode ?? 'bus',
          observedAt,
          fetchedAt,
          isStale,
        };
        this.positions.set(position.key, position);
        loaded++;
      }
    })();

    this.inflight.set(config.providerId, promise);
    try {
      await promise;
    } finally {
      this.inflight.delete(config.providerId);
    }
    return { loaded, errors };
  }

  /** Fetch positions from a Dozor / EasyWay / iCity JSON feed. */
  async refreshJsonFeed(config: ProviderConfig): Promise<{ loaded: number; errors: string[] }> {
    if (config.sourceType !== 'json') return { loaded: 0, errors: ['wrong sourceType'] };
    const existing = this.inflight.get(config.providerId);
    if (existing) { await existing; return { loaded: 0, errors: [] }; }

    const errors: string[] = [];
    let loaded = 0;
    const promise = (async () => {
      let body: unknown;
      try {
        ({ data: body } = await fetchJson(config.feedUrl, 15_000));
      } catch (err) {
        errors.push(`fetch failed: ${err instanceof Error ? err.message : 'unknown'}`);
        return;
      }

      const list = extractVehicleList(body);
      if (list.length === 0) {
        errors.push('empty vehicle list');
        return;
      }

      const fetchedAt = new Date();
      const stalenessMs = config.stalenessThresholdMs ?? DEFAULT_STALE_MS;
      const isRecord = (v: unknown): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null && !Array.isArray(v);
      const num = (v: unknown): number =>
        typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;

      for (const vehicle of list) {
        if (!isRecord(vehicle)) continue;
        const lat = num(vehicle.latitude ?? vehicle.lat);
        const lon = num(vehicle.longitude ?? vehicle.lon ?? vehicle.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)
          || Math.abs(lat) > 90 || Math.abs(lon) > 180
          || (lat === 0 && lon === 0)) continue;

        const vehicleId = String(vehicle.id ?? vehicle.vehicle_id ?? vehicle.deviceId ?? '');
        if (!vehicleId) continue;

        const ts = num(vehicle.timestamp ?? vehicle.gps_time ?? vehicle.time ?? 0);
        const observedAt = ts > 1_000_000_000 ? new Date(ts * 1000) : fetchedAt;
        const isStale = fetchedAt.getTime() - observedAt.getTime() > stalenessMs;

        const routeId = String(vehicle.route_id ?? vehicle.routeId ?? vehicle.route ?? vehicle.marshrut ?? '')
          || null;
        const mode = vehicleTransportLabel(vehicle);

        const position: LiveVehiclePosition = {
          key: `${config.providerId}:${vehicleId}`,
          vehicleId,
          providerId: config.providerId,
          routeId: routeId || null,
          tripId: null,
          directionId: null,
          lat,
          lon,
          bearing: num(vehicle.bearing ?? vehicle.course ?? vehicle.direction) || null,
          speedMs: num(vehicle.speed) > 0 ? num(vehicle.speed) : null,
          mode,
          observedAt,
          fetchedAt,
          isStale,
        };
        this.positions.set(position.key, position);
        loaded++;
      }
    })();

    this.inflight.set(config.providerId, promise);
    try {
      await promise;
    } finally {
      this.inflight.delete(config.providerId);
    }
    return { loaded, errors };
  }

  /** Return all positions for a given provider. */
  getByProvider(providerId: string): LiveVehiclePosition[] {
    return [...this.positions.values()].filter((p) => p.providerId === providerId);
  }

  /** Return positions for specific route IDs (across all providers). */
  getByRoute(routeId: string, providerId?: string): LiveVehiclePosition[] {
    return [...this.positions.values()].filter(
      (p) => p.routeId === routeId && (!providerId || p.providerId === providerId),
    );
  }

  /** Return all positions within a bounding box, nearest to a point first. */
  getNearby(
    center: [number, number],
    radiusM: number,
    limit = 50,
  ): LiveVehiclePosition[] {
    return [...this.positions.values()]
      .map((p) => ({ p, d: distanceMeters(center, [p.lon, p.lat]) }))
      .filter(({ d }) => d <= radiusM)
      .sort((a, b) => a.d - b.d)
      .slice(0, limit)
      .map(({ p, d }) => ({ ...p, distanceToStopM: Math.round(d) }));
  }

  /** Return all positions within a bbox [minLon, minLat, maxLon, maxLat]. */
  getInBbox(bbox: [number, number, number, number]): LiveVehiclePosition[] {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return [...this.positions.values()].filter(
      (p) => p.lon >= minLon && p.lon <= maxLon && p.lat >= minLat && p.lat <= maxLat,
    );
  }

  /** Return a single vehicle by its provider-namespaced key. */
  get(key: string): LiveVehiclePosition | undefined {
    return this.positions.get(key);
  }

  /** All positions in the cache (debugging / admin). */
  getAll(): LiveVehiclePosition[] {
    return [...this.positions.values()];
  }

  /** Total number of positions in the cache. */
  size(): number {
    return this.positions.size;
  }

  /**
   * Re-evaluate stale flags based on current wall-clock time.
   * Call periodically (e.g., once per minute) so positions already in the cache
   * correctly reflect their age.
   */
  recomputeStale(stalenessMs = DEFAULT_STALE_MS): void {
    const now = Date.now();
    for (const p of this.positions.values()) {
      (p as { isStale: boolean }).isStale =
        now - p.observedAt.getTime() > stalenessMs;
    }
  }

  /**
   * Remove positions that haven't been refreshed in `ttlMs` (e.g., from a
   * provider that's been disabled). Prevents unbounded memory growth.
   */
  evictStale(ttlMs = 30 * 60_000): number {
    const cutoff = Date.now() - ttlMs;
    let removed = 0;
    for (const [key, p] of this.positions) {
      if (p.fetchedAt.getTime() < cutoff) {
        this.positions.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /** Clear all positions for a specific provider (e.g., when it's disabled). */
  clearProvider(providerId: string): number {
    let removed = 0;
    for (const [key, p] of this.positions) {
      if (p.providerId === providerId) {
        this.positions.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

export const vehiclePositionCache = VehiclePositionCache.getInstance();
