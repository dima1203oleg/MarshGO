/**
 * Navigation camera engine: pure, framework-free maths and state for a driving camera.
 * It turns noisy GPS (course, speed) into a calm camera: smoothed bearing that never spins the long way round,
 * speed- and context-based zoom with hysteresis, look-ahead padding, tilt, and North-Up / Heading-Up / Manual modes.
 * Nothing here talks to MapLibre or to the server: camera state is local UI state.
 */
export const cameraConfig = {
  /** Below this speed (km/h) the GPS course is unreliable: keep the last stable heading instead of following noise. */
  headingMinimumSpeedKmh: 4,
  /** Ignore bearing changes smaller than this (degrees): kills the 87°/91°/85°/93° jitter. */
  headingUpdateThresholdDeg: 2.5,
  /** Exponential smoothing of the heading (0..1, higher = faster). Scaled up a little with speed. */
  headingSmoothing: 0.22,
  /** Piecewise-linear zoom by speed: [km/h, zoom]. */
  zoomBySpeed: [[0, 18], [10, 17.6], [30, 16.9], [60, 15.9], [90, 14.9], [120, 14.2]] as ReadonlyArray<readonly [number, number]>,
  urbanZoomBonus: 0.4,
  highwayZoomPenalty: 0.3,
  highwayMinimumSpeedKmh: 90,
  /** Extra zoom as a manoeuvre gets close: [metres, bonus]. */
  maneuverZoom: [[200, 0.9], [500, 0.45]] as ReadonlyArray<readonly [number, number]>,
  maxZoom: 18.6,
  minZoom: 12.5,
  /** The zoom target only moves when it differs from the current zoom by more than this (hysteresis). */
  zoomHysteresis: 0.25,
  zoomSmoothing: 0.18,
  /** Minimum time between camera updates (ms): no stutter, less battery. */
  minUpdateIntervalMs: 700,
  manualTimeoutMs: 10_000,
  pitch: { min: 45, max: 62, speedForMaxKmh: 100 },
  /** Share of the screen height kept free above the car (look-ahead). */
  lookAhead: { base: 0.28, maxExtra: 0.1, speedForMaxKmh: 100 },
} as const;

export type Orientation = 'NORTH_UP' | 'HEADING_UP';
export type CameraMode = Orientation | 'MANUAL';

export const normalizeBearing = (degrees: number) => ((degrees % 360) + 360) % 360;
/** Signed shortest rotation from one bearing to another, in (-180, 180]. 359° → 0° is +1°, not −359°. */
export function shortestDelta(from: number, to: number): number {
  const delta = normalizeBearing(to - from);
  return delta > 180 ? delta - 360 : delta;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export function compassPoint(bearing: number): (typeof COMPASS)[number] { return COMPASS[Math.round(normalizeBearing(bearing) / 45) % 8]; }
export function formatBearing(bearing: number): string { return `${compassPoint(bearing)} ${String(Math.round(normalizeBearing(bearing)) % 360).padStart(3, '0')}°`; }

/** GPS course > device heading > previous stable heading. Output is an unwrapped angle (it may exceed 360°) so the camera always takes the short way. */
export class HeadingFilter {
  private value: number | null = null;
  get current(): number | null { return this.value === null ? null : normalizeBearing(this.value); }
  /** Unwrapped value for the camera (continuous across 0°/360°). */
  get unwrapped(): number | null { return this.value; }
  reset() { this.value = null; }
  update(input: { gpsCourse?: number | null; deviceHeading?: number | null; speedKmh: number | null }): number | null {
    const moving = (input.speedKmh ?? 0) >= cameraConfig.headingMinimumSpeedKmh;
    const raw = moving && Number.isFinite(input.gpsCourse as number) ? (input.gpsCourse as number)
      : !moving && this.value === null && Number.isFinite(input.deviceHeading as number) ? (input.deviceHeading as number)
        : null;
    if (raw === null) return this.current; // standing still or no data: keep the last stable heading
    if (this.value === null) { this.value = normalizeBearing(raw); return this.current; }
    const delta = shortestDelta(this.value, raw);
    if (Math.abs(delta) < cameraConfig.headingUpdateThresholdDeg) return this.current;
    const speedBoost = Math.min(0.25, (input.speedKmh ?? 0) / 400);
    this.value += delta * Math.min(0.9, cameraConfig.headingSmoothing + speedBoost);
    return this.current;
  }
}

function interpolate(table: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= table[0][0]) return table[0][1];
  for (let index = 1; index < table.length; index++) {
    const [x1, y1] = table[index], [x0, y0] = table[index - 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return table[table.length - 1][1];
}

export interface ZoomContext { speedKmh: number; urban?: boolean; maneuverDistanceMeters?: number | null }
/** The zoom the camera wants right now: closer when slow, in towns and before a turn; wider on fast roads. */
export function targetZoom(context: ZoomContext): number {
  const speed = Math.max(0, context.speedKmh);
  let zoom = interpolate(cameraConfig.zoomBySpeed, speed);
  if (context.urban) zoom += cameraConfig.urbanZoomBonus;
  else if (speed >= cameraConfig.highwayMinimumSpeedKmh) zoom -= cameraConfig.highwayZoomPenalty;
  const distance = context.maneuverDistanceMeters;
  if (distance !== null && distance !== undefined) for (const [limit, bonus] of cameraConfig.maneuverZoom) if (distance <= limit) { zoom += bonus; break; }
  return Math.min(cameraConfig.maxZoom, Math.max(cameraConfig.minZoom, zoom));
}

/** Smooth zoom with hysteresis: small target wobbles never move the camera, big changes glide. */
export class ZoomController {
  private zoom: number | null = null;
  private target: number | null = null;
  get current(): number | null { return this.zoom; }
  update(next: number): number {
    if (this.zoom === null || this.target === null) { this.zoom = next; this.target = next; return next; }
    if (Math.abs(next - this.target) > cameraConfig.zoomHysteresis) this.target = next;
    this.zoom += (this.target - this.zoom) * cameraConfig.zoomSmoothing;
    if (Math.abs(this.target - this.zoom) < 0.02) this.zoom = this.target;
    return this.zoom;
  }
  reset() { this.zoom = null; this.target = null; }
}

export function pitchFor(speedKmh: number, tiltEnabled: boolean): number {
  if (!tiltEnabled) return 0;
  const { min, max, speedForMaxKmh } = cameraConfig.pitch;
  return min + (max - min) * Math.min(1, Math.max(0, speedKmh) / speedForMaxKmh);
}

/** Free space above the car as a share of screen height: grows with speed, and a little before manoeuvres the camera shows more road ahead. */
export function lookAheadShare(speedKmh: number): number {
  const { base, maxExtra, speedForMaxKmh } = cameraConfig.lookAhead;
  return base + maxExtra * Math.min(1, Math.max(0, speedKmh) / speedForMaxKmh);
}

/** Orientation preference (North Up / Heading Up) and the temporary manual mode with its auto-return timer. */
export class CameraModeState {
  private preferred: Orientation;
  private manual = false;
  private lastInteraction = 0;
  constructor(preferred: Orientation = 'HEADING_UP') { this.preferred = preferred; }
  get mode(): CameraMode { return this.manual ? 'MANUAL' : this.preferred; }
  get orientation(): Orientation { return this.preferred; }
  /** The user panned, zoomed or rotated the map: the camera stops following until they return (or the timeout ends). */
  userInteracted(now: number) { this.manual = true; this.lastInteraction = now; }
  /** One tap: back to following, in the chosen orientation. */
  returnToNavigation() { this.manual = false; }
  /** Compass button: toggles North Up ⇄ Heading Up (and resumes following). */
  toggleOrientation(): Orientation { this.preferred = this.preferred === 'HEADING_UP' ? 'NORTH_UP' : 'HEADING_UP'; this.manual = false; return this.preferred; }
  /** True once the user has left the map alone for the timeout — interaction restarts the clock, so browsing is never cut short. */
  autoReturnDue(now: number): boolean { return this.manual && now - this.lastInteraction >= cameraConfig.manualTimeoutMs; }
}

/** Dense manoeuvres around the driver means a town. */
export function isUrbanContext(maneuverDistancesAheadMeters: number[]): boolean {
  return maneuverDistancesAheadMeters.filter((distance) => distance <= 1500).length >= 4;
}
