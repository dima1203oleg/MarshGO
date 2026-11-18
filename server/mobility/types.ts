/** Unified MARSHGO mobility model: every external source (GBFS, GTFS, partner API...) is normalised into these shapes. */
export type MobilityAssetType = 'BIKE' | 'EBIKE' | 'SCOOTER' | 'MOPED' | 'CARSHARING' | 'TAXI';
export interface MobilityAsset {
  id: string;
  providerId: string;
  type: MobilityAssetType;
  location: [number, number]; // [longitude, latitude]
  available: boolean;
  batteryPercent?: number;
  rangeMeters?: number;
  stationId?: string;
  lastUpdated?: string;
}
export interface MobilityStation {
  id: string;
  providerId: string;
  name: string;
  location: [number, number];
  capacity?: number;
  availableAssets?: number;
  returnAllowed?: boolean;
}
export type ProviderHealth = 'healthy' | 'degraded' | 'offline';
export interface ConnectionReport {
  health: ProviderHealth;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
  counts: Record<string, number>;
  responseMs: number;
  /** Coverage of the source: [minLon, minLat, maxLon, maxLat] from its real coordinates. */
  bbox?: [number, number, number, number];
  error?: string;
}

export type Bbox = [number, number, number, number];
export function bboxOf(points: Array<[number, number]>): Bbox | undefined {
  if (points.length === 0) return undefined;
  let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
  for (const [lon, lat] of points) { if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon; if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat; }
  return [minLon, minLat, maxLon, maxLat];
}
/** True when the point is inside the box expanded by `marginKm` (a city feed also serves its surroundings). */
export function bboxContains(box: Bbox, lon: number, lat: number, marginKm = 15): boolean {
  const dLat = marginKm / 111, dLon = marginKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return lon >= box[0] - dLon && lon <= box[2] + dLon && lat >= box[1] - dLat && lat <= box[3] + dLat;
}

/** Ukraine's rough bounding box: a feed catalogued for a Ukrainian city whose positions lie elsewhere is not that city's data. */
export const UKRAINE_BBOX: Bbox = [22, 44, 41, 53];
export function centerInUkraine(box: Bbox | undefined): boolean {
  if (!box) return true; // no positions to judge by
  const lon = (box[0] + box[2]) / 2, lat = (box[1] + box[3]) / 2;
  return lon >= UKRAINE_BBOX[0] && lon <= UKRAINE_BBOX[2] && lat >= UKRAINE_BBOX[1] && lat <= UKRAINE_BBOX[3];
}
