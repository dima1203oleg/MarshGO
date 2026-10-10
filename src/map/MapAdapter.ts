import type { MapLayer, MapMode } from './mapMode';
import type { Coordinate } from '../../shared/navigation/contracts';
export type MapStatus = 'unconfigured' | 'loading' | 'available' | 'degraded' | 'failed';
export type MapTheme = 'MARSHGO_LIGHT' | 'MARSHGO_DARK' | 'MARSHGO_NAVIGATION_LIGHT' | 'MARSHGO_NAVIGATION_DARK';
export type CameraMode = 'OVERVIEW' | 'FOLLOW' | 'FOLLOW_HEADING' | 'MANEUVER' | 'FREE' | 'RECENTER_PENDING';

export interface RouteSegment {
  coordinates: Coordinate[];
  color: string;
  dashed?: boolean;
}

export interface CustomMapMarker {
  coordinate: Coordinate;
  html: string;
  anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface MapAdapter {
  setRoute(points: Coordinate[]): void;
  setRouteSegments?(segments: RouteSegment[]): void;
  setCustomMarkers?(markers: CustomMapMarker[]): void;
  getMap?(): unknown;
  setVehicle(point: Coordinate, heading?: number | null, speedMps?: number | null, label?: string | null): void;
  startNavigationCamera(point: Coordinate, initialBearing?: number | null): void;
  setMeetingPoints(points: { pickup?: Coordinate | null; driver?: Coordinate | null; passenger?: Coordinate | null } | null, fit?: boolean): void;
  setRouteProgress(vertex: number, position?: Coordinate | null): void;
  setGuidanceContext(maneuverDistanceMeters: number | null, urban: boolean): void;
  toggleOrientation(): 'NORTH_UP' | 'HEADING_UP';
  getOrientation(): 'NORTH_UP' | 'HEADING_UP';
  onOrientationChange: (orientation: 'NORTH_UP' | 'HEADING_UP', bearing: number) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  setWaypoints(points: Array<{ coordinate: Coordinate; kind: string }>): void;
  fitRoute(padding?: { top?: number; right?: number; bottom?: number; left?: number }): void;
  recenter(point?: Coordinate): void;
  setCameraMode(mode: CameraMode): void;
  setTheme(theme: MapTheme): void;
  setMode(mode: MapMode): void;
  setLayer(layer: MapLayer): void;
  setTransportLayers(layers: ReadonlySet<import('./transportLayers').TransportLayerId>): void;
  focus(point: Coordinate, zoom?: number): void;
  onTransportHint: (message: string | null) => void;
  retry(): void;
  destroy(): void;
  getStatus(): MapStatus;
}
