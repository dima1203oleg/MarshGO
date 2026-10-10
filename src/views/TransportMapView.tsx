import { useEffect, useMemo, useRef, useState } from 'react';
import type { Coordinate } from '../../shared/navigation/contracts';
import {
  ArrowLeft,
  Clock3,
  Compass,
  Gauge,
  LocateFixed,
  Navigation,
  Route as RouteIcon,
  X,
} from 'lucide-react';
import { MarshGoMap } from '../map/MarshGoMap';
import { MapLayersControl } from '../components/MapLayersControl';
import type { MapAdapter, MapStatus } from '../map/MapAdapter';
import { getMapLayer, setMapLayer } from '../map/mapMode';
import {
  clearTransportLayers,
  getFollowedVehicleId,
  getHighlightedRoute,
  getSelectedStop,
  getSelectedVehicle,
  getTransportLayers,
  setFollowedVehicleId,
  setHighlightedRoute,
  setSelectedStop,
  setSelectedVehicle,
  setTransportLayers,
  subscribeFollowedVehicle,
  subscribeHighlightedRoute,
  subscribeSelectedStop,
  subscribeSelectedVehicle,
  subscribeTransportLayers,
  toggleTransportLayer,
  ALL_MAP_LAYERS,
  type SelectedStop,
  type SelectedVehicle,
  type TransportLayerId,
} from '../map/transportLayers';
import { productionApi, type ApiJourney, type TransitArrival } from '../services/productionApi';
import { StopArrivalsSheet, type StopArrivalItem } from '../components/mobility/StopArrivalsSheet';
import { mapTransitArrivalToStopArrival } from '../components/mobility/stopArrivalMapping';

export interface CityPreset {
  name: string;
  coords: [number, number];
  zoom: number;
  badge?: string;
}

export const PRIORITY_CITIES: CityPreset[] = [
  { name: 'Київ', coords: [30.5234, 50.4501], zoom: 12.5, badge: 'Столиця' },
  { name: 'Львів', coords: [24.0311, 49.8429], zoom: 13 },
  { name: 'Івано-Франківськ', coords: [24.7111, 48.9226], zoom: 13.5 },
  { name: 'Дніпро', coords: [35.0462, 48.4647], zoom: 12.5 },
  { name: 'Рівне', coords: [26.2516, 50.6199], zoom: 13.5 },
  { name: 'Ужгород', coords: [22.2879, 48.6208], zoom: 14 },
  { name: "Кам\u2019янець-Подільський", coords: [26.5828, 48.6811], zoom: 14 },
  { name: 'Біла Церква', coords: [30.1317, 49.7989], zoom: 13.5 },
];

const LAYER_CHIPS: Array<{ label: string; id: TransportLayerId; icon: string }> = [
  { label: 'Увесь транспорт', id: 'PUBLIC_TRANSPORT', icon: '🚊' },
  { label: 'Автобуси', id: 'BUS', icon: '🚌' },
  { label: 'Маршрутки', id: 'MARSHRUTKA', icon: '🚐' },
  { label: 'Тролейбуси', id: 'TROLLEYBUS', icon: '🚎' },
  { label: 'Трамваї', id: 'TRAM', icon: '🚋' },
  { label: 'Метро', id: 'METRO', icon: '🚇' },
  { label: 'Електричка', id: 'CITY_TRAIN', icon: '🚆' },
  { label: 'Зупинки', id: 'STOPS', icon: '🚏' },
  { label: 'Велосипеди', id: 'BICYCLE', icon: '🚲' },
  { label: 'Самокати', id: 'SCOOTER', icon: '🛴' },
];

const TRANSPORT_THEMES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  bus: { label: 'Автобус', icon: '🚌', bg: 'bg-sky-50 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
  marshrutka: { label: 'Маршрутка', icon: '🚐', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  trolleybus: { label: 'Тролейбус', icon: '🚎', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  tram: { label: 'Трамвай', icon: '🚋', bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
  metro: { label: 'Метро', icon: '🚇', bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  city_train: { label: 'Міська електричка', icon: '🚆', bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
  funicular: { label: 'Фунікулер', icon: '🚡', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-400' },
  other: { label: 'Громадський транспорт', icon: '🚊', bg: 'bg-slate-50 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300' },
};

function bearingToDirectionName(bearing: number | null): string {
  if (bearing == null || !Number.isFinite(bearing)) return 'Напрямок не вказано';
  const norm = ((bearing % 360) + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return 'Північ (↑)';
  if (norm >= 22.5 && norm < 67.5) return 'Північний схід (↗)';
  if (norm >= 67.5 && norm < 112.5) return 'Схід (→)';
  if (norm >= 112.5 && norm < 157.5) return 'Південний схід (↘)';
  if (norm >= 157.5 && norm < 202.5) return 'Південь (↓)';
  if (norm >= 202.5 && norm < 247.5) return 'Південний захід (↙)';
  if (norm >= 247.5 && norm < 292.5) return 'Захід (←)';
  return 'Північний захід (↖)';
}

/**
 * Returns freshness status based on the vehicle's observedAt timestamp.
 * LIVE: ≤30s, STALE: 31–90s, OLD: >90s
 */
function vehicleFreshness(observedAt: string | null): 'LIVE' | 'STALE' | 'OLD' | 'UNKNOWN' {
  if (!observedAt) return 'UNKNOWN';
  const observedAtMs = Date.parse(observedAt);
  if (!Number.isFinite(observedAtMs)) return 'UNKNOWN';
  const ageMs = Date.now() - observedAtMs;
  const ageSec = ageMs / 1000;
  if (ageSec <= 30) return 'LIVE';
  if (ageSec <= 90) return 'STALE';
  return 'OLD';
}

function formatObservedAgo(observedAt: string | null): string {
  if (!observedAt) return 'Час невідомий';
  const observedAtMs = Date.parse(observedAt);
  if (!Number.isFinite(observedAtMs)) return 'Час невідомий';
  const ageMs = Date.now() - observedAtMs;
  const ageSec = Math.round(ageMs / 1000);
  if (ageSec < 60) return `${ageSec} сек тому`;
  const ageMin = Math.round(ageSec / 60);
  if (ageMin < 60) return `${ageMin} хв тому`;
  return `${Math.round(ageMin / 60)} год тому`;
}

export function TransportMapView({
  onBack,
  route,
  activeJourney,
  originName,
  destinationName,
}: {
  onBack: () => void;
  route?: Coordinate[];
  activeJourney?: ApiJourney | null;
  originName?: string;
  destinationName?: string;
}) {
  const [status, setStatus] = useState<MapStatus>('loading');
  const [hint, setHint] = useState<string | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<ReadonlySet<TransportLayerId>>(getTransportLayers());
  const [currentCity, setCurrentCity] = useState<string>('Львів');
  const [selectedVehicle, setSelectedVehicleState] = useState<SelectedVehicle | null>(getSelectedVehicle());
  const [selectedStop, setSelectedStopState] = useState<SelectedStop | null>(getSelectedStop());
  const [followedVehicleId, setFollowedVehicleIdState] = useState<string | null>(getFollowedVehicleId());
  const [highlightedRoute, setHighlightedRouteState] = useState<string | null>(getHighlightedRoute());

  // Realtime clock for freshness badge updates
  const [now, setNow] = useState(() => Date.now());

  // Stop Arrivals State
  const [stopArrivals, setStopArrivals] = useState<TransitArrival[]>([]);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [arrivalsError, setArrivalsError] = useState<string | null>(null);

  const mappedStopArrivals: StopArrivalItem[] = useMemo(() => stopArrivals.map(mapTransitArrivalToStopArrival), [stopArrivals]);

  const adapter = useRef<MapAdapter | null>(null);
  const located = useRef(false);

  const routePoints: Coordinate[] = useMemo(() => {
    if (route && route.length >= 2) return route;
    if (!activeJourney) return [];
    const pts: Coordinate[] = [];
    for (const leg of activeJourney.legs) {
      const legPath = (leg as any).metadata?.pathCoordinates;
      if (Array.isArray(legPath) && legPath.length >= 2) {
        pts.push(...legPath);
      } else {
        if (leg.origin?.coordinates) pts.push(leg.origin.coordinates);
        if (leg.destination?.coordinates) pts.push(leg.destination.coordinates);
      }
    }
    return pts;
  }, [route, activeJourney]);

  const primaryTransitLeg = useMemo(() => {
    if (!activeJourney) return null;
    return activeJourney.legs.find((leg) => leg.mode !== 'WALK') ?? activeJourney.legs[0] ?? null;
  }, [activeJourney]);

  const hasRecentSelectedVehiclePosition = Boolean(
    selectedVehicle?.observedAt
    && Number.isFinite(Date.parse(selectedVehicle.observedAt))
    && Date.now() - Date.parse(selectedVehicle.observedAt) <= 5 * 60 * 1000
    && Date.now() >= Date.parse(selectedVehicle.observedAt),
  );
  const selectedVehiclePosition = hasRecentSelectedVehiclePosition ? selectedVehicle : null;

  useEffect(() => subscribeTransportLayers(setSelectedLayers), []);
  useEffect(() => subscribeSelectedVehicle(setSelectedVehicleState), []);
  useEffect(() => subscribeSelectedStop(setSelectedStopState), []);
  useEffect(() => subscribeFollowedVehicle(setFollowedVehicleIdState), []);
  useEffect(() => subscribeHighlightedRoute(setHighlightedRouteState), []);

  useEffect(() => {
    if (primaryTransitLeg?.routeName) {
      setHighlightedRoute(primaryTransitLeg.routeName);
      const coord = primaryTransitLeg.origin.coordinates;
      if (coord && coord[0] > 23.5 && coord[0] < 24.5) setCurrentCity('Львів');
      else if (coord && coord[0] > 30.0 && coord[0] < 31.0) setCurrentCity('Київ');
    }
  }, [primaryTransitLeg?.routeName]);

  // Follow a provider-reported position only while its GPS timestamp is recent.
  useEffect(() => {
    if (followedVehicleId && selectedVehiclePosition && adapter.current) {
      adapter.current.focus(selectedVehiclePosition.coordinates, 15);
    } else if (followedVehicleId && !selectedVehiclePosition) {
      setFollowedVehicleId(null);
    }
  }, [selectedVehiclePosition?.coordinates[0], selectedVehiclePosition?.coordinates[1], followedVehicleId]);

  // Update clock every 5s when vehicle sheet is open to keep freshness badge accurate
  useEffect(() => {
    if (!selectedVehicle) return;
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, [selectedVehicle?.id]);

  useEffect(() => {
    if (getMapLayer() === 'navigation') setMapLayer('standard');
    if (getTransportLayers().size === 0) {
      setTransportLayers(ALL_MAP_LAYERS);
    }
    return () => clearTransportLayers();
  }, []);

  // Fetch arrivals when stop is selected
  useEffect(() => {
    if (!selectedStop) {
      setStopArrivals([]);
      setLoadingArrivals(false);
      setArrivalsError(null);
      return;
    }

    let active = true;
    setLoadingArrivals(true);
    setArrivalsError(null);

    productionApi
      .transitStopArrivals(selectedStop.id, selectedStop.coordinates[1], selectedStop.coordinates[0])
      .then((res) => {
        if (!active) return;
        setStopArrivals(res.arrivals ?? []);
        setLoadingArrivals(false);
      })
      .catch((err) => {
        if (!active) return;
        setArrivalsError(err instanceof Error ? err.message : 'Не вдалося завантажити розклад');
        setLoadingArrivals(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStop?.id]);

  const onAdapter = (next: MapAdapter | null) => {
    adapter.current = next;
    if (!next) return;
    if (routePoints.length >= 2) {
      next.setRoute(routePoints);
      next.fitRoute();
      located.current = true;
      return;
    }
    if (located.current) return;
    located.current = true;
    const initialCity = PRIORITY_CITIES.find((c) => c.name === currentCity) ?? PRIORITY_CITIES[1];
    next.focus(initialCity.coords, initialCity.zoom);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          next.focus([position.coords.longitude, position.coords.latitude], 13.5);
        },
        () => {
          // Keep current city
        },
        { timeout: 4000, maximumAge: 300_000 }
      );
    }
  };

  useEffect(() => {
    if (adapter.current && routePoints.length >= 2) {
      adapter.current.setRoute(routePoints);
      adapter.current.fitRoute();
    }
  }, [routePoints]);

  const selectCity = (city: CityPreset) => {
    setCurrentCity(city.name);
    adapter.current?.focus(city.coords, city.zoom);
    setHint(`Місто ${city.name}. Увімкніть потрібні транспортні шари.`);
    setTimeout(() => setHint(null), 3500);
  };

  const closeSelection = () => {
    setSelectedVehicle(null);
    setSelectedStop(null);
    setFollowedVehicleId(null);
    setHighlightedRoute(null);
  };

  const toggleFollow = () => {
    if (followedVehicleId) {
      setFollowedVehicleId(null);
    } else if (selectedVehiclePosition) {
      setFollowedVehicleId(selectedVehiclePosition.id);
      adapter.current?.focus(selectedVehiclePosition.coordinates, 15);
    } else {
      setHint('Для стеження потрібна актуальна позиція GPS від провайдера.');
      setTimeout(() => setHint(null), 3500);
    }
  };

  const toggleRouteHighlight = () => {
    if (!selectedVehicle) return;
    if (highlightedRoute === selectedVehicle.route) {
      setHighlightedRoute(null);
    } else {
      setHighlightedRoute(selectedVehicle.route);
    }
  };

  const themeConfig = selectedVehicle ? (TRANSPORT_THEMES[selectedVehicle.transport] ?? TRANSPORT_THEMES.other) : TRANSPORT_THEMES.other;

  // Compute freshness with live clock tick
  const freshness = selectedVehicle ? vehicleFreshness(selectedVehicle.observedAt) : 'UNKNOWN';
  void now; // consumed for reactivity

  const freshnessConfig = {
    LIVE: { label: 'Live GPS', dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    STALE: { label: 'Застаріло', dot: 'bg-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
    OLD: { label: 'Дані старі', dot: 'bg-slate-400', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
    UNKNOWN: { label: 'GPS не надано', dot: 'bg-slate-400', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  }[freshness];

  return (
    <main className="relative h-[100svh] overflow-hidden bg-[#eaf3fc] dark:bg-[#0c1421] text-[#0E1F35] dark:text-slate-100 font-sans select-none">
      <MarshGoMap
        route={routePoints}
        vehicle={selectedVehiclePosition?.coordinates ?? null}
        heading={selectedVehiclePosition?.bearing ?? null}
        speedMps={selectedVehiclePosition?.speed == null ? null : selectedVehiclePosition.speed / 3.6}
        vehicleLabel={selectedVehiclePosition ? `${themeConfig.label} №${selectedVehiclePosition.route}` : null}
        overlays
        theme="MARSHGO_LIGHT"
        onStatus={setStatus}
        onTransportHint={setHint}
        onAdapter={onAdapter}
      />

      {/* Top Header & Navigation Floating Controls */}
      <div className="pointer-events-none absolute inset-x-3 sm:inset-x-5 top-[max(.8rem,env(safe-area-inset-top))] z-[500] flex flex-col gap-2">
        {/* Main Header Bar */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            aria-label="Назад"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 text-slate-700 dark:text-slate-200"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1 min-w-0 px-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-extrabold text-[#0E1F35] dark:text-white">
                {activeJourney
                  ? `${originName ? originName.split(',')[0] : activeJourney.legs[0]?.origin?.name?.split(',')[0]} → ${destinationName ? destinationName.split(',')[0] : activeJourney.legs.at(-1)?.destination?.name?.split(',')[0]}`
                  : 'Live Транспорт'}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${freshness === 'LIVE' ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800' : freshness === 'STALE' ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${freshness === 'LIVE' ? 'bg-emerald-500 animate-pulse' : freshness === 'STALE' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                {activeJourney ? (primaryTransitLeg?.routeName ? `Маршрут №${primaryTransitLeg.routeName}` : 'Маршрут на карті') : freshness === 'LIVE' ? 'Live GPS' : freshness === 'STALE' ? 'GPS застарів' : 'Транспорт на карті'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {activeJourney
                ? `${Math.round(activeJourney.totalDurationSeconds / 60)} хв в дорозі · ${activeJourney.totalPriceMinor == null ? 'вартість не вказана' : Math.round(activeJourney.totalPriceMinor / 100) + ' грн'}`
                : `${currentCity}: шари даних доступних провайдерів`}
            </p>
          </div>

          {routePoints.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                adapter.current?.setRoute(routePoints);
                adapter.current?.fitRoute();
              }}
              aria-label="Центрувати на маршруті"
              title="Центрувати на маршруті"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1789F4] hover:bg-blue-100 dark:hover:bg-blue-900/60 transition active:scale-95"
            >
              <Compass size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (adapter.current && 'geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => adapter.current?.focus([pos.coords.longitude, pos.coords.latitude], 14.5),
                  () => {
                    setHint('Не вдалося отримати геолокацію.');
                    setTimeout(() => setHint(null), 3500);
                  }
                );
              }
            }}
            aria-label="Моє місцезнаходження"
            title="Моє місцезнаходження"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-[#1789F4] hover:bg-blue-100 dark:hover:bg-blue-900/60 transition active:scale-95"
          >
            <LocateFixed size={18} />
          </button>
        </div>

        {/* City Switcher Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="group" aria-label="Вибір міста">
          {PRIORITY_CITIES.map((city) => {
            const isCurrent = currentCity === city.name;
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => selectCity(city)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                  isCurrent
                    ? 'bg-[#0E1F35] text-white ring-2 ring-blue-500'
                    : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{city.name}</span>
                {city.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isCurrent ? 'bg-blue-500 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {city.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Transport Type Layer Filter Chips */}
        <div className="pointer-events-auto flex gap-1.5 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Фільтри транспорту">
          {LAYER_CHIPS.map(({ label, id, icon }) => {
            const isPressed = selectedLayers.has(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isPressed}
                onClick={() => toggleTransportLayer(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition shadow-sm ${
                  isPressed
                    ? 'bg-[#1789F4] text-white shadow-blue-500/20'
                    : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* User Hint Toast */}
        {hint && (
          <p role="status" className="pointer-events-auto self-start rounded-xl bg-white/95 dark:bg-slate-900/95 px-3 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-md border border-slate-200/60 dark:border-slate-800 animate-fadeIn">
            {hint}
          </p>
        )}

        {status === 'failed' && (
          <p role="alert" className="pointer-events-auto self-start rounded-xl bg-amber-50 dark:bg-amber-950/80 px-3 py-2 text-[11px] font-semibold text-amber-900 dark:text-amber-200 shadow border border-amber-300 dark:border-amber-800">
            Не вдалося завантажити карту. Перевірте з'єднання з мережею.
          </p>
        )}
      </div>

      {/* Floating Follow Mode Pill */}
      {followedVehicleId && selectedVehicle && (
        <div className="pointer-events-auto absolute bottom-[18.5rem] sm:bottom-[19rem] inset-x-0 mx-auto w-fit z-[510] flex items-center gap-2 rounded-full bg-[#0E1F35] text-white px-4 py-2 shadow-2xl border border-blue-500/50 animate-bounce">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold">Стеження за {themeConfig.label} №{selectedVehicle.route}</span>
          <button
            type="button"
            onClick={() => setFollowedVehicleId(null)}
            className="ml-2 text-xs text-blue-300 hover:text-white underline font-semibold"
          >
            Зупинити
          </button>
        </div>
      )}

      {/* Bottom Sheet 1: Selected Live Vehicle */}
      {selectedVehicle && (
        <section
          aria-label="Інформація про транспорт"
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-[520] mx-auto max-w-xl rounded-t-3xl bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xl border-t border-slate-200/90 dark:border-slate-800 animate-slideUp"
        >
          {/* Drag handle */}
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${themeConfig.bg} border ${themeConfig.border} shadow-sm text-2xl`}>
                {themeConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#0E1F35] dark:text-white">
                    {themeConfig.label} №{selectedVehicle.route || '—'}
                  </span>
                  {/* Dynamic freshness badge */}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${freshnessConfig.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${freshnessConfig.dot}`} />
                    {freshnessConfig.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ID: {selectedVehicle.id.split(':').pop()?.slice(0, 8)} · {formatObservedAgo(selectedVehicle.observedAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeSelection}
              aria-label="Закрити"
              className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Telemetry Cards Grid — 3 cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/60 dark:border-slate-800">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Gauge size={15} />
              </div>
              <div className="min-w-0">
                <small className="block text-[10px] font-semibold text-slate-400">Швидкість</small>
                <b className="text-[11px] text-[#0E1F35] dark:text-slate-100 leading-tight">
                  {selectedVehicle.speed == null ? 'Немає даних' : `${selectedVehicle.speed} км/год`}
                </b>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/60 dark:border-slate-800">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Compass size={15} />
              </div>
              <div className="min-w-0">
                <small className="block text-[10px] font-semibold text-slate-400">Курс</small>
                <b className="text-[11px] text-[#0E1F35] dark:text-slate-100 truncate block leading-tight">
                  {bearingToDirectionName(selectedVehicle.bearing).split(' ')[0]}
                </b>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/60 dark:border-slate-800">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                freshness === 'LIVE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : freshness === 'STALE' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                <Clock3 size={15} />
              </div>
              <div className="min-w-0">
                <small className="block text-[10px] font-semibold text-slate-400">Дані</small>
                <b className="text-[11px] text-[#0E1F35] dark:text-slate-100 truncate block leading-tight">
                  {formatObservedAgo(selectedVehicle.observedAt)}
                </b>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleFollow}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-3 px-3 text-xs font-bold transition active:scale-98 ${
                followedVehicleId === selectedVehicle.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-[#1789F4] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
              }`}
            >
              <Navigation size={15} />
              <span>{followedVehicleId === selectedVehicle.id ? 'Стеження увімкнено' : 'Стежити на карті'}</span>
            </button>

            <button
              type="button"
              onClick={toggleRouteHighlight}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-3 px-3 text-xs font-bold transition active:scale-98 border ${
                highlightedRoute === selectedVehicle.route
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <RouteIcon size={15} />
              <span>{highlightedRoute === selectedVehicle.route ? 'Приховати лінію' : 'Показати маршрут'}</span>
            </button>
          </div>

          {/* STALE/OLD warning banner */}
          {(freshness === 'STALE' || freshness === 'OLD') && (
            <div className={`mt-3 rounded-xl px-3 py-2 text-[11px] font-semibold border ${
              freshness === 'STALE'
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
              {freshness === 'STALE'
                ? '⚠️ GPS-сигнал застарів. Позиція може бути неточною.'
                : 'Позиція GPS не оновлювалася понад 90 секунд.'}
            </div>
          )}
        </section>
      )}

      {/* Bottom Sheet 2: Selected Stop & Real-Time Arrivals Board (Matching Reference Screenshot 2) */}
      {selectedStop && (
        <section
          aria-label="Прогноз прибуття на зупинку"
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-[530] mx-auto max-w-xl animate-slideUp"
        >
          <StopArrivalsSheet
            stopName={selectedStop.name}
            subtitle={selectedStop.transports.length ? `Види транспорту: ${selectedStop.transports.join(', ')}` : 'Зупинка громадського транспорту'}
            arrivals={mappedStopArrivals}
            isLoading={loadingArrivals}
            error={arrivalsError}
            onBack={closeSelection}
            onSelectArrival={(arr) => {
              setHighlightedRoute(arr.routeId);
            }}
            onOpenFullTimetable={(routeId) => {
              setHighlightedRoute(routeId);
            }}
            onRefresh={() => {
              if (selectedStop) {
                setLoadingArrivals(true);
                productionApi
                  .transitStopArrivals(selectedStop.id, selectedStop.coordinates[1], selectedStop.coordinates[0])
                .then((res) => {
                  setStopArrivals(res.arrivals ?? []);
                })
                  .catch((error: unknown) => setArrivalsError(error instanceof Error ? error.message : 'Не вдалося оновити дані зупинки.'))
                  .finally(() => setLoadingArrivals(false));
              }
            }}
          />
        </section>
      )}

      {/* Active Route Bottom Card (Shown when navigating or viewing a journey) */}
      {activeJourney && !selectedVehicle && !selectedStop && (
        <section
          aria-label="Активний маршрут на карті"
          className="pointer-events-auto absolute inset-x-3 sm:inset-x-5 bottom-4 z-[515] mx-auto max-w-xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-slideUp"
        >
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1789F4] text-white font-black text-xs shadow-sm">
                {primaryTransitLeg?.routeName ? `№${primaryTransitLeg.routeName}` : (primaryTransitLeg?.mode?.[0] ?? 'Т')}
              </span>
              <div>
                <b className="text-xs font-black text-[#0E1F35] dark:text-white">
                  {primaryTransitLeg?.routeName ? `Транспорт №${primaryTransitLeg.routeName}` : (primaryTransitLeg?.mode ?? 'Маршрут')}
                </b>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {activeJourney.legs[0]?.origin?.name?.split(',')[0]} → {activeJourney.legs.at(-1)?.destination?.name?.split(',')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (adapter.current && routePoints.length >= 2) {
                    adapter.current.setRoute(routePoints);
                    adapter.current.fitRoute();
                  }
                }}
                className="flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition"
              >
                <Compass size={13} />
                Центрувати
              </button>

              <button
                type="button"
                disabled={!selectedVehiclePosition}
                onClick={toggleFollow}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition border disabled:cursor-not-allowed disabled:opacity-50 ${
                  followedVehicleId
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Navigation size={13} />
                <span>{followedVehicleId ? 'Стежимо' : selectedVehiclePosition ? 'Стежити за ТЗ' : 'GPS недоступний'}</span>
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock3 size={13} className="text-[#1789F4]" />
              {Math.round(activeJourney.totalDurationSeconds / 60)} хв в дорозі
              {activeJourney.transfers > 0 && <span className="opacity-75">· {activeJourney.transfers} пересадки</span>}
            </span>
            <span className="text-sm font-black text-[#0E1F35] dark:text-white tabular-nums">
              {activeJourney.totalPriceMinor == null ? 'Вартість не вказана' : `${Math.round(activeJourney.totalPriceMinor / 100)} грн`}
            </span>
          </div>
        </section>
      )}

      {/* Layer Control Settings in Right Center */}
      <div className="absolute right-4 top-1/2 z-[500] -translate-y-1/2">
        <MapLayersControl overlays />
      </div>
    </main>
  );
}
