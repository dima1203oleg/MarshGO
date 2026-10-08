import * as maplibregl from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import type { Coordinate } from '../../shared/navigation/contracts';
import type { CameraMode, MapAdapter, MapStatus, MapTheme } from './MapAdapter';
import { mapStyleTokens } from './style/tokens';
import { Protocol } from 'pmtiles';
import { mapLayers, mapModes, styleForLayer, type MapLayer, type MapMode } from './mapMode';
import { TransportLayerController, type TransportLayerId } from './transportLayers';
import { CameraModeState, HeadingFilter, ZoomController, lookAheadShare, pitchFor, targetZoom, type Orientation } from '../navigation/cameraEngine';
import { configuredMapStyleUrl } from './mapConfig';

const ORIENTATION_KEY = 'marshgo.navigation.orientation';
const cameraIntervalMs = 700;
function readOrientation(): Orientation { try { return localStorage.getItem(ORIENTATION_KEY) === 'NORTH_UP' ? 'NORTH_UP' : 'HEADING_UP'; } catch { return 'HEADING_UP'; } }

const pmtilesProtocol = new Protocol();
let pmtilesProtocolRegistered = false;

export class MapLibreAdapter implements MapAdapter {
  private map: MapLibreMap;
  private status: MapStatus = 'loading';
  private route: Coordinate[] = [];
  private vehicle: Coordinate | null = null;
  private waypoints: Array<{ coordinate: Coordinate; kind: string }> = [];
  private cameraMode: CameraMode = 'OVERVIEW';
  private theme: MapTheme = 'MARSHGO_NAVIGATION_LIGHT';
  private seenTileError = false;
  private mode: MapMode = 'google';
  private layer: MapLayer = 'standard';
  private transport: TransportLayerController | null = null;
  private heading: number | null = null;
  private readonly headingFilter = new HeadingFilter();
  private readonly zoomController = new ZoomController();
  private readonly modeState = new CameraModeState(readOrientation());
  private speedKmh = 0;
  private urban = false;
  private maneuverDistance: number | null = null;
  private lastCameraUpdate = 0;
  private autoReturnTimer: ReturnType<typeof setInterval> | null = null;
  onOrientationChange: (orientation: Orientation, bearing: number) => void = () => undefined;
  private marker: maplibregl.Marker | null = null;
  /** Lets the UI highlight the "my location" button while the camera follows the driver. */
  onCameraModeChange: (mode: CameraMode) => void = () => undefined;
  private transportLayers: ReadonlySet<TransportLayerId> = new Set();
  /** Shown when a layer needs a closer zoom or fails to load. */
  onTransportHint: (message: string | null) => void = () => undefined;

  constructor(container: HTMLElement, style: string | StyleSpecification, private readonly onStatus: (status: MapStatus) => void, private readonly hasBasemap: boolean, private readonly styleUrls?: Partial<Record<MapTheme, string>>, initialTheme: MapTheme = 'MARSHGO_NAVIGATION_LIGHT') {
    this.theme = initialTheme;
    if (!pmtilesProtocolRegistered) { maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile); pmtilesProtocolRegistered = true; }
    maplibregl.setWorkerUrl(mapLibreWorkerUrl);
    container.dataset.marshgoMapRenderer = 'maplibre';
    this.map = new maplibregl.Map({ container, style, logoPosition: 'bottom-left', center: [30.5234, 50.4501], zoom: 5, pitchWithRotate: true, dragRotate: true, touchPitch: true, cooperativeGestures: false });
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: false, visualizePitch: true }), 'bottom-right');
    this.map.on('load', () => { this.installLayers(); container.dataset.marshgoMapReady = 'true'; this.publish(this.hasBasemap ? 'available' : 'unconfigured'); });
    this.map.on('style.load', () => { this.installLayers(); container.dataset.marshgoMapReady = 'true'; if (this.hasBasemap && !this.map.getSource('marshgo-basemap') && this.status !== 'failed') this.publish('available'); });
    this.map.on('error', (event) => {
      const mapError = event as typeof event & { sourceId?: string };
      container.dataset.marshgoMapError = event.error?.message ?? 'MapLibre resource error';
      if (mapError.sourceId === 'marshgo-basemap') { this.seenTileError = true; this.publish('degraded'); }
      else if (this.status === 'loading') this.publish('failed');
    });
    this.map.on('sourcedata', (event) => { if (event.sourceId === 'marshgo-basemap' && event.isSourceLoaded && !this.seenTileError) this.publish('available'); });
    // Only the user's own gestures leave follow mode; our camera animations (zoom, bearing) must not.
    const userGesture = (event: { originalEvent?: unknown }) => {
      if (!event.originalEvent || this.cameraMode === 'OVERVIEW' && !this.vehicle) return;
      this.modeState.userInteracted(Date.now());
      if (this.cameraMode !== 'FREE') this.setCameraModeInternal('FREE');
    };
    this.map.on('dragstart', userGesture);
    this.map.on('zoomstart', userGesture);
    this.map.on('rotatestart', userGesture);
    this.map.on('pitchstart', userGesture);
    this.map.on('rotate', () => { this.map.getContainer().dataset.marshgoMapBearing = this.map.getBearing().toFixed(1); this.onOrientationChange(this.modeState.orientation, this.map.getBearing()); });
    // Manual browsing ends by itself after a quiet period (any further touch restarts the clock).
    this.autoReturnTimer = setInterval(() => {
      if (this.modeState.autoReturnDue(Date.now())) { this.recenter(); return; }
      // Keep following even between GPS fixes, so a change of speed or of the next manoeuvre re-frames the camera.
      if (this.cameraMode === 'FOLLOW_HEADING' || this.cameraMode === 'FOLLOW') this.followCamera(900);
    }, 1000);
  }

  private publish(status: MapStatus) { this.status = this.seenTileError && status === 'available' ? 'degraded' : status; this.onStatus(this.status); }
  private installLayers() {
    const colors = { ...mapStyleTokens[this.theme], route: mapModes[this.mode].route, routeCasing: mapModes[this.mode].casing };
    this.map.getContainer().dataset.marshgoMapLayer = this.layer;
    if (!this.map.getSource('marshgo-route')) this.map.addSource('marshgo-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    if (!this.map.getSource('marshgo-vehicle')) this.map.addSource('marshgo-vehicle', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    if (!this.map.getSource('marshgo-waypoints')) this.map.addSource('marshgo-waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    if (!this.map.getLayer('marshgo-route-casing')) this.map.addLayer({ id: 'marshgo-route-casing', type: 'line', source: 'marshgo-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.routeCasing, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 5 * mapModes[this.mode].width, 15, 13 * mapModes[this.mode].width], 'line-opacity': 0.92 } });
    if (!this.map.getLayer('marshgo-route')) this.map.addLayer({ id: 'marshgo-route', type: 'line', source: 'marshgo-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colors.route, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 3 * mapModes[this.mode].width, 15, 8 * mapModes[this.mode].width], 'line-opacity': 0.98 } });
    if (!this.map.getLayer('marshgo-waypoints')) this.map.addLayer({ id: 'marshgo-waypoints', type: 'circle', source: 'marshgo-waypoints', paint: { 'circle-radius': 8, 'circle-color': ['match', ['get', 'kind'], 'PICKUP', colors.pickup, 'DROPOFF', colors.dropoff, colors.route], 'circle-stroke-color': colors.routeCasing, 'circle-stroke-width': 3 } });
    if (!this.map.getLayer('marshgo-vehicle-halo')) this.map.addLayer({ id: 'marshgo-vehicle-halo', type: 'circle', source: 'marshgo-vehicle', paint: { 'circle-radius': 13, 'circle-color': colors.vehicle, 'circle-opacity': 0.2 } });
    if (!this.map.getLayer('marshgo-vehicle')) this.map.addLayer({ id: 'marshgo-vehicle', type: 'circle', source: 'marshgo-vehicle', paint: { 'circle-radius': 8, 'circle-color': colors.vehicle, 'circle-stroke-color': colors.routeCasing, 'circle-stroke-width': 3 } });
    // The DOM puck (rotating arrow) replaces the old circle dot; the source stays for consumers of its data.
    for (const id of ['marshgo-vehicle-halo', 'marshgo-vehicle']) if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', 'none');
    this.transport?.reinstall();
    // 3D navigation keeps its tilt after every style load (a style swap resets the camera on some browsers).
    if (this.layer === 'navigation' && Math.abs(this.map.getPitch() - mapLayers.navigation.pitch) > 1) this.map.easeTo({ pitch: mapLayers.navigation.pitch, duration: 500, essential: true });
    this.setRoute(this.route);
    if (this.vehicle) this.setVehicle(this.vehicle);
    this.setWaypoints(this.waypoints);
  }

  setRoute(points: Coordinate[]) {
    this.route = points;
    this.map.getContainer().dataset.marshgoRoutePointCount = String(points.length);
    const source = this.map.getSource('marshgo-route') as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: points } });
  }
  setVehicle(point: Coordinate, heading?: number | null, speedMps?: number | null) {
    this.vehicle = point;
    this.speedKmh = typeof speedMps === 'number' && Number.isFinite(speedMps) ? Math.max(0, speedMps * 3.6) : this.speedKmh;
    const stable = this.headingFilter.update({ gpsCourse: heading ?? null, speedKmh: this.speedKmh });
    if (stable !== null) this.heading = stable; else if (typeof heading === 'number' && Number.isFinite(heading) && this.heading === null) this.heading = heading;
    const source = this.map.getSource('marshgo-vehicle') as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: point } });
    this.updateMarker(point);
    if (this.cameraMode === 'FOLLOW_HEADING' || this.cameraMode === 'FOLLOW') this.followCamera(900);
  }

  /** Guidance context for the camera: how far the next manoeuvre is and whether the route is urban. */
  setGuidanceContext(maneuverDistanceMeters: number | null, urban: boolean) { this.maneuverDistance = maneuverDistanceMeters; this.urban = urban; }

  /** Compass button: North Up ⇄ Heading Up. */
  toggleOrientation(): Orientation {
    const next = this.modeState.toggleOrientation();
    try { localStorage.setItem(ORIENTATION_KEY, next); } catch { /* preference is optional */ }
    this.setCameraModeInternal(next === 'HEADING_UP' ? 'FOLLOW_HEADING' : 'FOLLOW');
    this.followCamera(900, true);
    this.onOrientationChange(next, this.map.getBearing());
    return next;
  }
  getOrientation(): Orientation { return this.modeState.orientation; }

  /** The driver's puck: a blue arrow that points where the car is heading, lying flat on the (tilted) road like in Apple Maps. */
  private updateMarker(point: Coordinate) {
    if (!this.marker) {
      const element = document.createElement('div');
      element.className = 'marshgo-puck';
      element.setAttribute('aria-hidden', 'true');
      element.innerHTML = '<span class="marshgo-puck__halo"></span><svg viewBox="0 0 40 40" class="marshgo-puck__arrow"><circle cx="20" cy="20" r="17" fill="#fff"/><circle cx="20" cy="20" r="13.5" fill="#1789F4"/><path d="M20 9 L28 28 L20 23.5 L12 28 Z" fill="#fff"/></svg>';
      this.marker = new maplibregl.Marker({ element, rotationAlignment: 'map', pitchAlignment: 'map' }).setLngLat(point).addTo(this.map);
    } else this.marker.setLngLat(point);
    this.marker.setRotation(this.heading ?? 0);
    this.map.getContainer().dataset.marshgoVehicleHeading = this.heading === null ? '' : String(Math.round(this.heading));
  }

  private setCameraModeInternal(mode: CameraMode) {
    this.cameraMode = mode;
    this.map.getContainer().dataset.marshgoCameraMode = mode;
    this.onCameraModeChange(mode);
  }

  /** Follow camera driven by the camera engine: speed/context zoom with hysteresis, smoothed heading, look-ahead and tilt. */
  private followCamera(duration: number, force = false) {
    if (!this.vehicle) return;
    const now = Date.now();
    if (!force && duration < 1000 && now - this.lastCameraUpdate < cameraIntervalMs) return;
    this.lastCameraUpdate = now;
    const { clientHeight } = this.map.getContainer();
    const tilt = pitchFor(this.speedKmh, this.layer === 'navigation');
    const zoom = this.zoomController.update(targetZoom({ speedKmh: this.speedKmh, urban: this.urban, maneuverDistanceMeters: this.maneuverDistance }));
    const headingUp = this.modeState.orientation === 'HEADING_UP';
    const unwrapped = this.headingFilter.unwrapped;
    // Heading Up rotates with the car along the shortest arc (the filter's angle is continuous across north); North Up pins north.
    let bearing = 0;
    if (headingUp) {
      const current = this.map.getBearing();
      const target = unwrapped ?? current;
      bearing = current + (((target - current) % 360 + 540) % 360 - 180);
    }
    this.map.easeTo({
      center: this.vehicle, zoom, pitch: tilt, bearing,
      padding: { top: Math.round(clientHeight * lookAheadShare(this.speedKmh)), bottom: Math.round(clientHeight * 0.08), left: 0, right: 0 },
      duration: Math.max(duration, 600), essential: true,
    });
    this.map.getContainer().dataset.marshgoOrientation = this.modeState.orientation;
    this.map.getContainer().dataset.marshgoTargetZoom = zoom.toFixed(2);
  }

  setWaypoints(points: Array<{ coordinate: Coordinate; kind: string }>) {
    this.waypoints = points;
    const source = this.map.getSource('marshgo-waypoints') as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: 'FeatureCollection', features: points.map(({ coordinate, kind }) => ({ type: 'Feature' as const, properties: { kind }, geometry: { type: 'Point' as const, coordinates: coordinate } })) });
  }
  fitRoute() {
    if (this.route.length < 2) return;
    const lngs = this.route.map((point) => point[0]); const lats = this.route.map((point) => point[1]);
    this.cameraMode = 'OVERVIEW';
    // Full-screen navigation reserves room for its overlays; small previews must scale the padding down or MapLibre rejects the fit.
    const { clientWidth, clientHeight } = this.map.getContainer();
    const padding = { top: Math.min(110, clientHeight * 0.2), right: Math.min(32, clientWidth * 0.1), bottom: Math.min(270, clientHeight * 0.2), left: Math.min(32, clientWidth * 0.1) };
    this.map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding, duration: 600, maxZoom: 15 });
  }
  recenter(point?: Coordinate) {
    if (point) this.vehicle = point;
    if (!this.vehicle) { this.fitRoute(); return; }
    this.modeState.returnToNavigation();
    this.updateMarker(this.vehicle);
    this.setCameraModeInternal(this.modeState.orientation === 'HEADING_UP' ? 'FOLLOW_HEADING' : 'FOLLOW');
    this.followCamera(1100, true);
  }

  setMode(mode: MapMode) {
    if (mode === this.mode) return;
    this.mode = mode;
    const style = styleForLayer(this.layer, mode, configuredMapStyleUrl);
    if (style) { this.map.setStyle(style); return; }
    if (!this.map.getLayer('marshgo-route')) return;
    const { route, casing, width } = mapModes[mode];
    this.map.setPaintProperty('marshgo-route', 'line-color', route);
    this.map.setPaintProperty('marshgo-route-casing', 'line-color', casing);
    this.map.setPaintProperty('marshgo-route', 'line-width', ['interpolate', ['linear'], ['zoom'], 5, 3 * width, 15, 8 * width]);
    this.map.setPaintProperty('marshgo-route-casing', 'line-width', ['interpolate', ['linear'], ['zoom'], 5, 5 * width, 15, 13 * width]);
  }
  setLayer(layer: MapLayer) {
    if (layer === this.layer) return;
    this.layer = layer;
    const style = styleForLayer(layer, this.mode, configuredMapStyleUrl);
    if (style) this.map.setStyle(style);
    else if (layer === 'standard') this.map.setStyle(this.map.getStyle());
    this.map.easeTo({ pitch: mapLayers[layer].pitch, duration: 700, essential: true });
  }
  /** 2D information layers (metro, buses, bikes, ...). Passing an empty set removes them and stops their polling. */
  setTransportLayers(layers: ReadonlySet<TransportLayerId>) {
    this.transportLayers = layers;
    if (layers.size === 0 && !this.transport) return;
    this.transport ??= new TransportLayerController(this.map, (message) => this.onTransportHint(message));
    this.transport.apply(layers);
  }
  focus(point: Coordinate, zoom = 13) { this.cameraMode = 'FREE'; this.map.easeTo({ center: point, zoom, duration: 600, essential: true }); }
  setCameraMode(mode: CameraMode) { this.setCameraModeInternal(mode); }
  setTheme(theme: MapTheme) {
    const changed = this.theme !== theme;
    this.theme = theme;
    const style = this.styleUrls?.[theme];
    if (changed && style) { this.map.setStyle(style); return; }
    if (!this.map.getLayer('marshgo-route')) return;
    const colors = mapStyleTokens[theme];
    this.map.setPaintProperty('marshgo-route-casing', 'line-color', colors.routeCasing);
    this.map.setPaintProperty('marshgo-route', 'line-color', colors.route);
    this.map.setPaintProperty('marshgo-waypoints', 'circle-color', ['match', ['get', 'kind'], 'PICKUP', colors.pickup, 'DROPOFF', colors.dropoff, colors.route]);
    this.map.setPaintProperty('marshgo-waypoints', 'circle-stroke-color', colors.routeCasing);
    this.map.setPaintProperty('marshgo-vehicle-halo', 'circle-color', colors.vehicle);
    this.map.setPaintProperty('marshgo-vehicle', 'circle-color', colors.vehicle);
    this.map.setPaintProperty('marshgo-vehicle', 'circle-stroke-color', colors.routeCasing);
    if (this.map.getLayer('marshgo-background')) this.map.setPaintProperty('marshgo-background', 'background-color', colors.background);
  }
  retry() { this.seenTileError = false; this.publish(this.hasBasemap ? 'loading' : 'unconfigured'); if (this.hasBasemap) this.map.setStyle(this.map.getStyle()); else this.map.triggerRepaint(); }
  destroy() { if (this.autoReturnTimer) clearInterval(this.autoReturnTimer); this.marker?.remove(); this.transport?.destroy(); this.map.remove(); }
  getStatus() { return this.status; }
}
