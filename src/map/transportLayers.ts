import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';
import { productionApi, type GeoJsonCollection } from '../services/productionApi';

/**
 * 2D information layers. They are MapLibre sources/layers (no DOM markers), loaded per viewport and only for the layers the user switched on.
 * Static geometry is cached on the server for hours; vehicle positions are polled every 15 s only while a line layer is visible.
 */
export type TransportLayerId = 'PUBLIC_TRANSPORT' | 'METRO' | 'BUS' | 'MARSHRUTKA' | 'TRAM' | 'TROLLEYBUS' | 'CITY_TRAIN' | 'FUNICULAR' | 'STOPS' | 'BICYCLE' | 'SCOOTER' | 'RENTAL_POINTS';
export const transportLayerList: Array<{ id: TransportLayerId; label: string; group: 'Транспорт' | 'Мікромобільність' }> = [
  { id: 'PUBLIC_TRANSPORT', label: 'Громадський транспорт', group: 'Транспорт' },
  { id: 'METRO', label: 'Метро', group: 'Транспорт' },
  { id: 'TRAM', label: 'Трамваї', group: 'Транспорт' },
  { id: 'TROLLEYBUS', label: 'Тролейбуси', group: 'Транспорт' },
  { id: 'BUS', label: 'Автобуси', group: 'Транспорт' },
  { id: 'MARSHRUTKA', label: 'Маршрутки', group: 'Транспорт' },
  { id: 'CITY_TRAIN', label: 'Міська електричка', group: 'Транспорт' },
  { id: 'FUNICULAR', label: 'Фунікулер', group: 'Транспорт' },
  { id: 'STOPS', label: 'Зупинки', group: 'Транспорт' },
  { id: 'BICYCLE', label: 'Велосипеди', group: 'Мікромобільність' },
  { id: 'SCOOTER', label: 'Електросамокати', group: 'Мікромобільність' },
  { id: 'RENTAL_POINTS', label: 'Пункти прокату', group: 'Мікромобільність' },
];

export const ALL_MAP_LAYERS: readonly TransportLayerId[] = [
  'PUBLIC_TRANSPORT',
  'BUS',
  'MARSHRUTKA',
  'TROLLEYBUS',
  'TRAM',
  'METRO',
  'CITY_TRAIN',
  'STOPS',
  'BICYCLE',
  'SCOOTER',
];

// ---- selection store (all layers are off by default) ----
const selected = new Set<TransportLayerId>();
const listeners = new Set<(layers: ReadonlySet<TransportLayerId>) => void>();
export const getTransportLayers = (): ReadonlySet<TransportLayerId> => new Set(selected);

export function isAllTransportLayersSelected(): boolean {
  return ALL_MAP_LAYERS.every((id) => selected.has(id));
}

export function toggleTransportLayer(id: TransportLayerId) {
  if (id === 'PUBLIC_TRANSPORT') {
    if (isAllTransportLayersSelected()) {
      selected.clear();
    } else {
      for (const layerId of ALL_MAP_LAYERS) selected.add(layerId);
    }
  } else {
    if (selected.has(id)) {
      selected.delete(id);
      selected.delete('PUBLIC_TRANSPORT');
    } else {
      selected.add(id);
      if (ALL_MAP_LAYERS.filter((l) => l !== 'PUBLIC_TRANSPORT').every((l) => selected.has(l))) {
        selected.add('PUBLIC_TRANSPORT');
      }
    }
  }
  listeners.forEach((listener) => listener(getTransportLayers()));
}

export function setTransportLayers(layers: Iterable<TransportLayerId>) {
  selected.clear();
  for (const id of layers) selected.add(id);
  listeners.forEach((listener) => listener(getTransportLayers()));
}
export function clearTransportLayers() { selected.clear(); listeners.forEach((listener) => listener(getTransportLayers())); }
export function subscribeTransportLayers(listener: (layers: ReadonlySet<TransportLayerId>) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

export interface SelectedVehicle {
  id: string;
  route: string;
  transport: string;
  bearing: number | null;
  speed: number | null;
  observedAt: string | null;
  stopId: string | null;
  providerId?: string;
  coordinates: [number, number];
}

export interface SelectedStop {
  id: string;
  name: string;
  transports: string[];
  provider?: string;
  coordinates: [number, number];
}

let activeVehicle: SelectedVehicle | null = null;
const vehicleListeners = new Set<(vehicle: SelectedVehicle | null) => void>();
export const getSelectedVehicle = (): SelectedVehicle | null => activeVehicle;
export function setSelectedVehicle(vehicle: SelectedVehicle | null) {
  activeVehicle = vehicle;
  vehicleListeners.forEach((l) => l(activeVehicle));
}
export function subscribeSelectedVehicle(listener: (vehicle: SelectedVehicle | null) => void) {
  vehicleListeners.add(listener);
  return () => { vehicleListeners.delete(listener); };
}

let activeStop: SelectedStop | null = null;
const stopListeners = new Set<(stop: SelectedStop | null) => void>();
export const getSelectedStop = (): SelectedStop | null => activeStop;
export function setSelectedStop(stop: SelectedStop | null) {
  activeStop = stop;
  stopListeners.forEach((l) => l(activeStop));
}
export function subscribeSelectedStop(listener: (stop: SelectedStop | null) => void) {
  stopListeners.add(listener);
  return () => { stopListeners.delete(listener); };
}

let followingVehicleId: string | null = null;
const followListeners = new Set<(id: string | null) => void>();
export const getFollowedVehicleId = (): string | null => followingVehicleId;
export function setFollowedVehicleId(id: string | null) {
  followingVehicleId = id;
  followListeners.forEach((l) => l(followingVehicleId));
}
export function subscribeFollowedVehicle(listener: (id: string | null) => void) {
  followListeners.add(listener);
  return () => { followListeners.delete(listener); };
}

let highlightedRouteName: string | null = null;
const highlightListeners = new Set<(name: string | null) => void>();
export const getHighlightedRoute = (): string | null => highlightedRouteName;
export function setHighlightedRoute(name: string | null) {
  highlightedRouteName = name;
  highlightListeners.forEach((l) => l(highlightedRouteName));
}
export function subscribeHighlightedRoute(listener: (name: string | null) => void) {
  highlightListeners.add(listener);
  return () => { highlightListeners.delete(listener); };
}

if (typeof window !== 'undefined') {
  (window as any).__MARSHGO_TRANSPORT__ = {
    setSelectedVehicle,
    setSelectedStop,
    setFollowedVehicleId,
    setHighlightedRoute,
    getSelectedVehicle,
    getSelectedStop,
  };
}


// ---- what each selection asks the server for ----
export function lineTypesFor(layers: ReadonlySet<TransportLayerId>): string[] {
  const types = new Set<string>();
  if (layers.has('PUBLIC_TRANSPORT')) ['bus', 'marshrutka', 'trolleybus', 'tram', 'metro', 'city_train', 'funicular'].forEach((type) => types.add(type));
  if (layers.has('BUS')) types.add('bus');
  if (layers.has('MARSHRUTKA')) types.add('marshrutka');
  if (layers.has('TRAM')) types.add('tram');
  if (layers.has('TROLLEYBUS')) types.add('trolleybus');
  if (layers.has('METRO')) types.add('metro');
  if (layers.has('CITY_TRAIN')) types.add('city_train');
  if (layers.has('FUNICULAR')) types.add('funicular');
  return [...types];
}
export function stopTypesFor(layers: ReadonlySet<TransportLayerId>): string[] {
  const lines = lineTypesFor(layers);
  return lines.length ? lines : ['bus', 'marshrutka', 'trolleybus', 'tram', 'metro', 'city_train', 'funicular'];
}
export function microTypesFor(layers: ReadonlySet<TransportLayerId>): string[] {
  return [layers.has('BICYCLE') ? 'bike' : '', layers.has('SCOOTER') ? 'scooter' : '', layers.has('RENTAL_POINTS') ? 'stations' : ''].filter(Boolean);
}

// ---- level of detail: below these zooms a layer is not requested at all ----
export const minZoom = { routes: 10, vehicles: 10, stops: 13, micro: 12 } as const;
const maxSpan = { routes: 2, vehicles: 2, stops: 0.5, micro: 0.6 } as const;

/** Viewport box as "west,south,east,north", shrunk around the centre when it exceeds what the server serves in one request. */
export function viewportBbox(bounds: { west: number; south: number; east: number; north: number }, span: number): string {
  const clamp = (low: number, high: number) => { const middle = (low + high) / 2; return high - low > span ? [middle - span / 2, middle + span / 2] : [low, high]; };
  const [west, east] = clamp(bounds.west, bounds.east); const [south, north] = clamp(bounds.south, bounds.north);
  return [west, south, east, north].map((value) => value.toFixed(5)).join(',');
}

const colors: Record<string, string> = {
  bus: '#0284C7',        // Sky Blue
  marshrutka: '#F59E0B', // Amber / Orange for marshrutka
  trolleybus: '#10B981', // Emerald Green
  tram: '#EF4444',       // Vibrant Red
  metro: '#8B5CF6',      // Purple
  city_train: '#0D9488', // Teal
  funicular: '#B45309',  // Brown
  other: '#64748B'
};
const empty: GeoJsonCollection = { type: 'FeatureCollection', features: [] };
const SOURCES = { routes: 'mg-t-routes', stops: 'mg-t-stops', vehicles: 'mg-t-vehicles', micro: 'mg-t-micro' } as const;
const lineColor = ['match', ['get', 'transport'], 'bus', colors.bus, 'marshrutka', colors.marshrutka, 'trolleybus', colors.trolleybus, 'tram', colors.tram, 'metro', colors.metro, 'city_train', colors.city_train, 'funicular', colors.funicular, colors.other] as never;

function ensureVehicleArrowImage(map: MapLibreMap) {
  if (map.hasImage('mg-vehicle-arrow')) return;
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 36;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.moveTo(18, 5);
  ctx.lineTo(27, 27);
  ctx.lineTo(18, 21);
  ctx.lineTo(9, 27);
  ctx.closePath();
  ctx.fill();
  const imageData = ctx.getImageData(0, 0, 36, 36);
  map.addImage('mg-vehicle-arrow', imageData, { pixelRatio: 2 });
}

export class TransportLayerController {
  private enabled: ReadonlySet<TransportLayerId> = new Set();
  private data: Record<keyof typeof SOURCES, GeoJsonCollection> = { routes: empty, stops: empty, vehicles: empty, micro: empty };
  private aborters = new Map<string, AbortController>();
  private moveTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private vehicleAnimFrame: number | null = null;
  private prevVehiclePositions = new Map<string, [number, number]>();
  private popup: maplibregl.Popup | null = null;
  private readonly onMove = () => { if (this.moveTimer) clearTimeout(this.moveTimer); this.moveTimer = setTimeout(() => void this.refresh(), 350); };
  private readonly onVisibility = () => { if (document.visibilityState === 'visible') void this.refreshVehicles(); };

  constructor(private readonly map: MapLibreMap, private readonly onHint: (message: string | null) => void) {}

  private hasGlyphs() { return Boolean(this.map.getStyle()?.glyphs); }

  /** Called whenever the user's selection changes (an empty set removes everything and stops all polling). */
  apply(layers: ReadonlySet<TransportLayerId>) {
    this.enabled = layers;
    if (layers.size === 0) { this.teardown(); this.onHint(null); return; }
    this.install();
    this.map.off('moveend', this.onMove); this.map.on('moveend', this.onMove);
    document.removeEventListener('visibilitychange', this.onVisibility); document.addEventListener('visibilitychange', this.onVisibility);
    this.restartPolling();
    void this.refresh();
  }

  /** A style change (2D ↔ 3D ↔ satellite) drops custom sources; rebuild them from the cached data and refresh. */
  reinstall() { if (this.enabled.size) { this.install(); this.pushData(); void this.refresh(); } }

  destroy() { this.teardown(); }

  private unsubHighlight: (() => void) | null = null;

  private teardown() {
    this.unsubHighlight?.();
    this.unsubHighlight = null;
    this.map.off('moveend', this.onMove);
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.moveTimer) clearTimeout(this.moveTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.vehicleAnimFrame) cancelAnimationFrame(this.vehicleAnimFrame);
    this.vehicleAnimFrame = null;
    this.pollTimer = null; this.moveTimer = null;
    this.aborters.forEach((controller) => controller.abort()); this.aborters.clear();
    this.popup?.remove(); this.popup = null;
    this.prevVehiclePositions.clear();
    this.data = { routes: empty, stops: empty, vehicles: empty, micro: empty };
    for (const id of ['mg-t-micro-count', 'mg-t-micro-clusters', 'mg-t-micro-points', 'mg-t-vehicle-label', 'mg-t-vehicles-arrow', 'mg-t-vehicles', 'mg-t-vehicles-halo', 'mg-t-stop-label', 'mg-t-stops', 'mg-t-routes-highlight', 'mg-t-route-label', 'mg-t-routes']) if (this.map.getLayer(id)) this.map.removeLayer(id);
    for (const id of Object.values(SOURCES)) if (this.map.getSource(id)) this.map.removeSource(id);
    this.map.getContainer().dataset.marshgoTransportLayers = '';
  }

  private pushData() { for (const key of Object.keys(SOURCES) as Array<keyof typeof SOURCES>) (this.map.getSource(SOURCES[key]) as GeoJSONSource | undefined)?.setData(this.data[key] as never); }

  private install() {
    const map = this.map;
    if (!map.isStyleLoaded()) return; // reinstall() runs again on style.load
    ensureVehicleArrowImage(map);
    map.getContainer().dataset.marshgoTransportLayers = [...this.enabled].join(',');
    const add = (id: string, cluster = false) => { if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: empty as never, ...(cluster ? { cluster: true, clusterRadius: 44, clusterMaxZoom: 15 } : {}) }); };
    add(SOURCES.routes); add(SOURCES.stops); add(SOURCES.vehicles); add(SOURCES.micro, true);
    const glyphs = this.hasGlyphs();
    const before = map.getLayer('marshgo-route-casing') ? 'marshgo-route-casing' : undefined; // transport layers sit under the user's own route
    if (!map.getLayer('mg-t-routes')) map.addLayer({ id: 'mg-t-routes', type: 'line', source: SOURCES.routes, minzoom: minZoom.routes, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': lineColor, 'line-opacity': 0.85, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 15, 4] } }, before);
    if (!map.getLayer('mg-t-routes-highlight')) map.addLayer({
      id: 'mg-t-routes-highlight',
      type: 'line',
      source: SOURCES.routes,
      filter: ['==', ['get', 'name'], highlightedRouteName ?? '___none___'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#2563EB', 'line-opacity': 0.95, 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 15, 7] }
    }, before);
    this.unsubHighlight?.();
    this.unsubHighlight = subscribeHighlightedRoute((name) => {
      if (this.map.getLayer('mg-t-routes-highlight')) {
        this.map.setFilter('mg-t-routes-highlight', name ? ['==', ['get', 'name'], name] : ['==', ['get', 'name'], '___none___']);
      }
    });
    if (glyphs && !map.getLayer('mg-t-route-label')) map.addLayer({ id: 'mg-t-route-label', type: 'symbol', source: SOURCES.routes, minzoom: 13, layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-size': 11, 'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': lineColor, 'text-halo-color': '#fff', 'text-halo-width': 2 } }, before);
    if (!map.getLayer('mg-t-stops')) map.addLayer({ id: 'mg-t-stops', type: 'circle', source: SOURCES.stops, minzoom: minZoom.stops, paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 17, 7], 'circle-color': '#ffffff', 'circle-stroke-color': '#0E1F35', 'circle-stroke-width': 1.5 } }, before);
    if (glyphs && !map.getLayer('mg-t-stop-label')) map.addLayer({ id: 'mg-t-stop-label', type: 'symbol', source: SOURCES.stops, minzoom: 15.5, layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': '#0E1F35', 'text-halo-color': '#fff', 'text-halo-width': 2 } }, before);

    // 1. Radar glow halo around moving vehicles
    if (!map.getLayer('mg-t-vehicles-halo')) map.addLayer({
      id: 'mg-t-vehicles-halo',
      type: 'circle',
      source: SOURCES.vehicles,
      minzoom: minZoom.vehicles,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 7, 14, 15, 17, 23],
        'circle-color': lineColor,
        'circle-opacity': 0.22,
        'circle-stroke-color': lineColor,
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': 0.4
      }
    });

    // 2. Primary vehicle marker dot with sharp white outline
    if (!map.getLayer('mg-t-vehicles')) map.addLayer({
      id: 'mg-t-vehicles',
      type: 'circle',
      source: SOURCES.vehicles,
      minzoom: minZoom.vehicles,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 13, 8.5, 16, 13],
        'circle-color': lineColor,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2.5
      }
    });

    // 3. Direction of travel arrow pointer
    if (!map.getLayer('mg-t-vehicles-arrow')) map.addLayer({
      id: 'mg-t-vehicles-arrow',
      type: 'symbol',
      source: SOURCES.vehicles,
      minzoom: 11,
      filter: ['has', 'bearing'],
      layout: {
        'icon-image': 'mg-vehicle-arrow',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 14, 0.65, 16, 0.85],
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      }
    });

    // 4. Route number badge
    if (glyphs && !map.getLayer('mg-t-vehicle-label')) map.addLayer({
      id: 'mg-t-vehicle-label',
      type: 'symbol',
      source: SOURCES.vehicles,
      minzoom: 12,
      layout: {
        'text-field': ['get', 'route'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 14, 12, 16, 13],
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-font': ['Noto Sans Bold'],
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#0E1F35',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2.5
      }
    });

    if (!map.getLayer('mg-t-micro-clusters')) map.addLayer({ id: 'mg-t-micro-clusters', type: 'circle', source: SOURCES.micro, minzoom: minZoom.micro, filter: ['has', 'point_count'], paint: { 'circle-color': '#0EA5E9', 'circle-opacity': 0.85, 'circle-radius': ['step', ['get', 'point_count'], 14, 25, 18, 100, 24], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    if (glyphs && !map.getLayer('mg-t-micro-count')) map.addLayer({ id: 'mg-t-micro-count', type: 'symbol', source: SOURCES.micro, minzoom: minZoom.micro, filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 11, 'text-font': ['Noto Sans Bold'] }, paint: { 'text-color': '#fff' } });
    if (!map.getLayer('mg-t-micro-points')) map.addLayer({ id: 'mg-t-micro-points', type: 'circle', source: SOURCES.micro, minzoom: minZoom.micro, filter: ['!', ['has', 'point_count']], paint: { 'circle-radius': 6, 'circle-color': ['match', ['get', 'kind'], 'scooter', '#F59E0B', 'station', '#1789F4', '#16A34A'], 'circle-stroke-width': 2 } });
    for (const layer of ['mg-t-vehicles', 'mg-t-vehicles-arrow', 'mg-t-stops', 'mg-t-micro-points']) { map.off('click', layer, this.onClick); map.on('click', layer, this.onClick); }
  }

  private readonly onClick = (event: MapMouseEvent & { features?: Array<{ properties: Record<string, unknown>; geometry: { type: string; coordinates?: unknown } }> }) => {
    const feature = event.features?.[0]; if (!feature) return;
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates as [number, number];

    const names: Record<string, { label: string; icon: string }> = {
      bus: { label: 'Автобус', icon: '🚌' },
      marshrutka: { label: 'Маршрутка', icon: '🚐' },
      trolleybus: { label: 'Тролейбус', icon: '🚎' },
      tram: { label: 'Трамвай', icon: '🚋' },
      metro: { label: 'Метро', icon: '🚇' },
      city_train: { label: 'Міська електричка', icon: '🚆' },
      funicular: { label: 'Фунікулер', icon: '🚡' },
      scooter: { label: 'Електросамокат', icon: '🛴' },
      bike: { label: 'Велосипед', icon: '🚲' },
      station: { label: 'Пункт прокату', icon: '🅿️' }
    };

    if (properties.route !== undefined) {
      setSelectedStop(null);
      setSelectedVehicle({
        id: String(properties.id ?? ''),
        route: String(properties.route || ''),
        transport: String(properties.transport ?? 'bus'),
        bearing: properties.bearing != null ? Number(properties.bearing) : null,
        speed: properties.speed != null ? Number(properties.speed) : null,
        observedAt: properties.observedAt ? String(properties.observedAt) : null,
        stopId: properties.stopId ? String(properties.stopId) : null,
        providerId: properties.providerId ? String(properties.providerId) : undefined,
        coordinates,
      });
      return;
    }

    if (properties.transports !== undefined || (properties.name && !properties.kind)) {
      setSelectedVehicle(null);
      setSelectedStop({
        id: String(properties.id ?? ''),
        name: String(properties.name ?? 'Зупинка'),
        transports: String(properties.transports ?? '').split(',').filter(Boolean),
        provider: properties.provider ? String(properties.provider) : undefined,
        coordinates,
      });
      return;
    }

    if (properties.kind) {
      const node = document.createElement('div');
      node.style.cssText = 'font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0E1F35; padding: 4px; min-width: 180px; max-width: 240px;';
      const title = document.createElement('div');
      title.style.cssText = 'font-weight: 800; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;';
      const detail = document.createElement('div');
      detail.style.cssText = 'font-weight: 500; font-size: 11px; color: #64748B; line-height: 1.4;';
      const info = names[String(properties.kind)] ?? { label: 'Мікромобільність', icon: '🛴' };
      title.innerHTML = `<span>${info.icon}</span> <span>${properties.name ?? info.label}</span>`;
      detail.textContent = [properties.provider, properties.available !== null && properties.available !== undefined ? `Доступно: ${properties.available}` : ''].filter(Boolean).join(' · ');
      node.append(title, detail);
      this.popup?.remove();
      this.popup = new maplibregl.Popup({ closeButton: true, offset: 12, className: 'marshgo-custom-popup' }).setLngLat(coordinates).setDOMContent(node).addTo(this.map);
    }
  };

  private bounds() { const b = this.map.getBounds(); return { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() }; }

  private animateVehiclesTo(newCollection: GeoJsonCollection) {
    if (this.vehicleAnimFrame) {
      cancelAnimationFrame(this.vehicleAnimFrame);
      this.vehicleAnimFrame = null;
    }

    const startPositions = new Map<string, [number, number]>(this.prevVehiclePositions);
    const targetFeatures = newCollection.features;
    const startTime = performance.now();
    const duration = 1600;

    for (const f of targetFeatures) {
      const id = String(f.properties?.id ?? '');
      if (id && f.geometry.type === 'Point') {
        this.prevVehiclePositions.set(id, f.geometry.coordinates as [number, number]);
      }
    }

    if (startPositions.size === 0) {
      this.data.vehicles = newCollection;
      (this.map.getSource(SOURCES.vehicles) as GeoJSONSource | undefined)?.setData(newCollection as never);
      return;
    }

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // smooth ease-in-out
      const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const interpolatedFeatures = targetFeatures.map((f) => {
        const id = String(f.properties?.id ?? '');
        const targetCoord = f.geometry.coordinates as [number, number];
        const startCoord = startPositions.get(id);

        if (startCoord && (Math.abs(startCoord[0] - targetCoord[0]) > 0.000001 || Math.abs(startCoord[1] - targetCoord[1]) > 0.000001)) {
          const dLon = targetCoord[0] - startCoord[0];
          const dLat = targetCoord[1] - startCoord[1];
          if (Math.abs(dLon) < 0.02 && Math.abs(dLat) < 0.02) {
            const curLon = startCoord[0] + dLon * t;
            const curLat = startCoord[1] + dLat * t;
            return {
              ...f,
              geometry: { ...f.geometry, coordinates: [curLon, curLat] }
            };
          }
        }
        return f;
      });

      const frameCollection = { type: 'FeatureCollection' as const, features: interpolatedFeatures };
      this.data.vehicles = frameCollection;
      (this.map.getSource(SOURCES.vehicles) as GeoJSONSource | undefined)?.setData(frameCollection as never);

      if (followingVehicleId) {
        const followed = interpolatedFeatures.find((f) => String(f.properties?.id ?? '') === followingVehicleId);
        if (followed && followed.geometry.type === 'Point') {
          const coords = followed.geometry.coordinates as [number, number];
          this.map.easeTo({ center: coords, duration: 250, essential: false });
        }
      }

      if (progress < 1) {
        this.vehicleAnimFrame = requestAnimationFrame(step);
      } else {
        this.vehicleAnimFrame = null;
      }
    };

    this.vehicleAnimFrame = requestAnimationFrame(step);
  }

  private async load(key: keyof typeof SOURCES, task: (signal: AbortSignal) => Promise<GeoJsonCollection>) {
    this.aborters.get(key)?.abort();
    const controller = new AbortController(); this.aborters.set(key, controller);
    try {
      const collection = await task(controller.signal);
      if (controller.signal.aborted) return;
      if (key === 'vehicles') {
        this.animateVehiclesTo(collection);
      } else {
        this.data[key] = collection;
        (this.map.getSource(SOURCES[key]) as GeoJSONSource | undefined)?.setData(collection as never);
      }
    } catch (error) {
      if (!controller.signal.aborted && !(error instanceof DOMException)) this.onHint('Не вдалося завантажити частину шарів. Спробуйте ще раз.');
    }
  }

  private clear(key: keyof typeof SOURCES) { this.aborters.get(key)?.abort(); this.data[key] = empty; (this.map.getSource(SOURCES[key]) as GeoJSONSource | undefined)?.setData(empty as never); }

  async refresh() {
    if (this.enabled.size === 0) return;
    const zoom = this.map.getZoom(); const bounds = this.bounds();
    const lines = lineTypesFor(this.enabled); const micro = microTypesFor(this.enabled);
    const hints: string[] = [];
    this.onHint(null);
    const tasks: Array<Promise<void>> = [];
    if (lines.length) {
      if (zoom >= minZoom.routes) tasks.push(this.load('routes', (signal) => productionApi.transportRoutes(viewportBbox(bounds, maxSpan.routes), lines, signal)));
      else { this.clear('routes'); hints.push('лінії'); }
      if (zoom >= minZoom.vehicles) tasks.push(this.refreshVehicles()); else { this.clear('vehicles'); }
    } else { this.clear('routes'); this.clear('vehicles'); }
    if (this.enabled.has('STOPS')) {
      if (zoom >= minZoom.stops) tasks.push(this.load('stops', (signal) => productionApi.transportStops(viewportBbox(bounds, maxSpan.stops), stopTypesFor(this.enabled), signal)));
      else { this.clear('stops'); hints.push('зупинки'); }
    } else this.clear('stops');
    if (micro.length) {
      if (zoom >= minZoom.micro) tasks.push(this.load('micro', (signal) => productionApi.transportMicromobility(viewportBbox(bounds, maxSpan.micro), micro, signal)));
      else { this.clear('micro'); hints.push('велосипеди й самокати'); }
    } else this.clear('micro');
    if (hints.length) this.onHint(`Наблизьте карту, щоб побачити: ${hints.join(', ')}.`);
    await Promise.all(tasks);
  }

  async refreshVehicles() {
    const lines = lineTypesFor(this.enabled);
    if (!lines.length || this.map.getZoom() < minZoom.vehicles || document.visibilityState !== 'visible') return;
    await this.load('vehicles', (signal) => productionApi.transportVehicles(viewportBbox(this.bounds(), maxSpan.vehicles), lines, signal));
  }

  private restartPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = lineTypesFor(this.enabled).length ? setInterval(() => void this.refreshVehicles(), 8_000) : null;
  }
}
