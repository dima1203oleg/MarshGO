import React, { useEffect, useRef, useState } from 'react';
import { Bus, Compass, LocateFixed, Minus, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import type { ApiTransportProviders } from '../../../services/productionApi';
import { themeService } from '../../../services/theme';
import type { TransportSelection } from '../../../domain/transportPreferences';
import { transportTypes } from '../../../domain/transportPreferences';
import type { RoutePlace, SearchStrategyMode } from '../model/types';
import { DateTimePassengers } from './DateTimePassengers';
import { RouteInputs } from './RouteInputs';
import { StrategySelector } from './StrategySelector';
import { TransportTypesPanel } from '../../../components/TransportTypesPanel';
import { MarshGoMap } from '../../../map/MarshGoMap';
import type { MapAdapter, MapStatus } from '../../../map/MapAdapter';

const MAP_PREVIEW_CENTER: [number, number] = [24.0311, 49.8429];

interface SearchMapFormProps {
  origin: RoutePlace;
  destination: RoutePlace;
  onOriginChange: (place: RoutePlace) => void;
  onDestinationChange: (place: RoutePlace) => void;
  onOpenMapPicker?: (field: 'origin' | 'destination') => void;
  dateStr: string;
  timeStr: string;
  timeMode: 'now' | 'depart_at' | 'arrive_by';
  passengers: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTimeModeChange: (mode: 'now' | 'depart_at' | 'arrive_by') => void;
  onPassengersChange: (count: number) => void;
  selection: TransportSelection;
  groups: ApiTransportProviders[] | null;
  onSelectionChange: (selection: TransportSelection) => void;
  strategy: SearchStrategyMode;
  onStrategyChange: (strategy: SearchStrategyMode) => void;
  onSearch: () => void;
  isSearching: boolean;
  isResolvingPlaces: boolean;
  error: string | null;
}

export const SearchMapForm: React.FC<SearchMapFormProps> = ({
  origin, destination, onOriginChange, onDestinationChange, onOpenMapPicker,
  dateStr, timeStr, timeMode, passengers, onDateChange, onTimeChange, onTimeModeChange, onPassengersChange,
  selection, groups, onSelectionChange, strategy, onStrategyChange, onSearch, isSearching, isResolvingPlaces, error,
}) => {
  const mapAdapter = useRef<MapAdapter | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');
  const [mapZoom, setMapZoom] = useState(12);
  const [showTransportTypes, setShowTransportTypes] = useState(false);
  const [isDark, setIsDark] = useState(() => themeService.isDark());
  const activeNames = transportTypes.filter((type) => selection.active.includes(type.id)).map((type) => type.label);

  useEffect(() => themeService.subscribe((_theme, dark) => setIsDark(dark)), []);
  useEffect(() => {
    if (origin.latitude == null || origin.longitude == null) return;
    mapAdapter.current?.focus([origin.longitude, origin.latitude], 13);
    setMapZoom(13);
  }, [origin.latitude, origin.longitude]);

  const zoom = (amount: number) => {
    const next = Math.max(5, Math.min(18, mapZoom + amount));
    setMapZoom(next);
    const center: [number, number] = origin.latitude != null && origin.longitude != null
      ? [origin.longitude, origin.latitude]
      : MAP_PREVIEW_CENTER;
    mapAdapter.current?.focus(center, next);
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => mapAdapter.current?.focus([coords.longitude, coords.latitude], 14),
      () => setMapStatus((current) => current === 'available' ? current : 'degraded'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15_000 },
    );
  };

  return <main className="relative mx-auto h-[calc(100svh-4rem)] min-h-[560px] w-full max-w-3xl overflow-hidden bg-[#E8F2FA] text-[#0B1730] dark:bg-[#070E1B] dark:text-white">
    <div className="absolute inset-0">
      <MarshGoMap route={[]} routeSegments={[]} overlays onStatus={setMapStatus} theme={isDark ? 'MARSHGO_DARK' : 'MARSHGO_LIGHT'} onAdapter={(adapter) => {
        mapAdapter.current = adapter;
        // Open the map over the reference city until the user chooses their own origin.
        // This is only a camera default; it is never used as a trip endpoint or GPS fix.
        if (adapter && origin.latitude == null && origin.longitude == null) {
          adapter.focus(MAP_PREVIEW_CENTER, 12.5);
          setMapZoom(12.5);
        }
      }} />
    </div>

    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-center">
      <section aria-label="Параметри маршруту" className="pointer-events-auto w-full max-w-md overflow-hidden rounded-[24px] border border-white/80 bg-white/95 shadow-[0_8px_28px_rgba(20,49,87,.15)] backdrop-blur-xl dark:border-slate-700 dark:bg-[#0B1730]/95">
        <RouteInputs compact origin={origin} destination={destination} onOriginChange={onOriginChange} onDestinationChange={onDestinationChange} onOpenMapPicker={onOpenMapPicker}/>
        <DateTimePassengers dateStr={dateStr} timeStr={timeStr} timeMode={timeMode} passengers={passengers} onDateChange={onDateChange} onTimeChange={onTimeChange} onTimeModeChange={onTimeModeChange} onPassengersChange={onPassengersChange} showTimeModeToggle={false}/>
      </section>
    </div>

    <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
      <button type="button" onClick={() => mapAdapter.current?.toggleOrientation()} aria-label="Повернути карту на північ" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg transition active:scale-95 dark:border-slate-700 dark:bg-[#0B1730]/95 dark:text-white"><Compass size={19}/></button>
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg dark:border-slate-700 dark:bg-[#0B1730]/95">
        <button type="button" onClick={() => zoom(1)} aria-label="Збільшити карту" className="grid h-10 w-11 place-items-center border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-white"><Plus size={17}/></button>
        <button type="button" onClick={() => zoom(-1)} aria-label="Зменшити карту" className="grid h-10 w-11 place-items-center text-slate-700 dark:text-white"><Minus size={17}/></button>
      </div>
      <button type="button" onClick={locate} aria-label="Моє місцезнаходження на карті" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/95 text-[#0066FF] shadow-lg transition active:scale-95 dark:border-slate-700 dark:bg-[#0B1730]/95"><LocateFixed size={19}/></button>
    </div>

    {mapStatus !== 'available' && <div role={mapStatus === 'failed' || mapStatus === 'degraded' ? 'alert' : 'status'} className="pointer-events-none absolute left-3 right-16 top-[14.5rem] z-10 mx-auto max-w-md rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-600 shadow dark:border-slate-700 dark:bg-[#0B1730]/95 dark:text-slate-300">
      {mapStatus === 'loading' && 'Завантажуємо карту…'}
      {mapStatus === 'unconfigured' && 'Базова карта не налаштована для цього середовища.'}
      {mapStatus === 'degraded' && 'Карту завантажено частково. Перевірте підключення.'}
      {mapStatus === 'failed' && 'Не вдалося завантажити карту. Перевірте підключення або джерело карти.'}
    </div>}

    <div className="pointer-events-none absolute inset-x-3 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-30 flex justify-center">
      <section className="pointer-events-auto w-full max-w-md rounded-[24px] border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_10px_34px_rgba(10,38,77,.18)] backdrop-blur-xl dark:border-slate-700 dark:bg-[#0B1730]/95">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div><h1 className="text-sm font-black">Знайти маршрут</h1><p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{activeNames.length ? `${activeNames.length} категорій · ` : ''}Оптимальний за часом і ціною</p></div>
          <button type="button" onClick={() => setShowTransportTypes(true)} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold text-[#0066FF] dark:border-slate-700 dark:bg-[#101E38]" aria-label={`Види транспорту та провайдери: ${selection.active.length} вибрано`}><Bus size={14}/>{groups === null ? 'Джерела' : `${selection.active.length} видів`}<SlidersHorizontal size={13}/></button>
        </div>
        <StrategySelector selectedStrategy={strategy} onSelectStrategy={onStrategyChange}/>
        {error && <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        <button type="button" onClick={onSearch} disabled={isSearching || isResolvingPlaces} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0879F9] px-4 text-sm font-black text-white shadow-[0_5px_16px_rgba(0,102,255,.25)] transition active:scale-[.99] disabled:opacity-50">
          <Search size={18}/>{isSearching ? 'Шукаємо маршрути…' : isResolvingPlaces ? 'Підбираємо точки…' : 'Знайти маршрут'}<span aria-hidden="true">→</span>
        </button>
      </section>
    </div>

    {showTransportTypes && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowTransportTypes(false); }}>
      <section aria-label="Види транспорту та провайдери" className="max-h-[78svh] w-full max-w-md overflow-hidden rounded-[26px] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-[#0B1730]">
        <div className="flex items-center justify-between"><div><h2 className="text-base font-black">Види транспорту</h2><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Оберіть категорії та провайдерів для одного пошуку</p></div><button type="button" aria-label="Закрити види транспорту" onClick={() => setShowTransportTypes(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><X size={18}/></button></div>
        <div className="max-h-[calc(78svh-8rem)] overflow-y-auto pb-3"><TransportTypesPanel selection={selection} groups={groups} onChange={onSelectionChange}/></div>
        <button type="button" onClick={() => setShowTransportTypes(false)} className="min-h-11 w-full rounded-xl bg-[#0066FF] text-sm font-bold text-white">Застосувати</button>
      </section>
    </div>}
  </main>;
};
