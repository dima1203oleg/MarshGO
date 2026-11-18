import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BusFront, Clock3, Info, MapPin, RefreshCw, TramFront, X } from 'lucide-react';
import type { Coordinate } from '../../../../shared/navigation/contracts';
import { productionApi, type TransitArrival } from '../../../services/productionApi';
import { transportColor } from '../../../domain/transportVisuals';

interface StopDeparturesModalProps {
  isOpen: boolean;
  stopName: string;
  stopCoordinates: Coordinate | null;
  onClose: () => void;
}

type StopTab = 'departures' | 'about';
type StopMode = 'all' | 'bus' | 'tram' | 'trolleybus';

function normalizedMode(mode?: string): StopMode | 'other' {
  const value = (mode ?? '').toLocaleLowerCase('uk-UA');
  if (value.includes('trolley')) return 'trolleybus';
  if (value.includes('tram')) return 'tram';
  if (value.includes('bus') || value.includes('minibus') || value.includes('маршрут')) return 'bus';
  return 'other';
}

function arrivalTime(arrival: TransitArrival): string {
  if (typeof arrival.etaSeconds === 'number' && Number.isFinite(arrival.etaSeconds)) {
    if (arrival.etaSeconds <= 30) return 'Зараз';
    const minutes = Math.max(1, Math.round(arrival.etaSeconds / 60));
    return `${minutes} хв`;
  }
  const value = arrival.predictedArrival ?? arrival.scheduledArrival;
  if (!value) return 'Час не надано';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(date);
}

function arrivalSource(arrival: TransitArrival): string {
  if (arrival.isRealtime) return 'GPS · наживо';
  if (arrival.arrivalSource === 'SCHEDULE') return 'Розклад';
  if (arrival.arrivalSource === 'TRIP_UPDATE') return 'Оновлення рейсу';
  if (arrival.arrivalSource === 'VEHICLE_PROJECTION') return 'Оцінка за рухом';
  return 'Джерело не уточнене';
}

function modeIcon(mode: StopMode | 'other') {
  if (mode === 'tram') return TramFront;
  if (mode === 'trolleybus' || mode === 'bus') return BusFront;
  return MapPin;
}

export const StopDeparturesModal: React.FC<StopDeparturesModalProps> = ({
  isOpen,
  stopName,
  stopCoordinates,
  onClose,
}) => {
  const [tab, setTab] = useState<StopTab>('departures');
  const [mode, setMode] = useState<StopMode>('all');
  const [arrivals, setArrivals] = useState<TransitArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  const loadArrivals = useCallback(async (signal: AbortSignal) => {
    if (!stopCoordinates) {
      setArrivals([]);
      setError('Для цієї зупинки джерело не передало координати, тому прибуття неможливо запитати.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [lon, lat] = stopCoordinates;
      const response = await productionApi.transitStopArrivals(stopName, lat, lon, signal);
      if (!signal.aborted) setArrivals(response.arrivals);
    } catch (caught) {
      if (!signal.aborted) {
        setArrivals([]);
        setError(caught instanceof Error ? caught.message : 'Не вдалося отримати дані про прибуття.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [stopCoordinates, stopName]);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    void loadArrivals(controller.signal);
    return () => controller.abort();
  }, [isOpen, loadArrivals, reloadIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const visibleArrivals = useMemo(() => arrivals.filter((arrival) => {
    return mode === 'all' || normalizedMode(arrival.mode) === mode;
  }), [arrivals, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-departures-title"
        className="flex max-h-[min(84svh,48rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-[#F7FAFE] shadow-[0_-12px_48px_rgba(12,32,61,.2)] dark:border-slate-800 dark:bg-[#0B1730] sm:rounded-[28px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200/80 bg-white px-4 pb-3 pt-4 dark:border-slate-800 dark:bg-[#101E38]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"><BusFront size={22} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Зупинка</p>
            <h2 id="stop-departures-title" className="mt-0.5 truncate text-base font-black text-[#0B1730] dark:text-white">{stopName}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрити табло" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-200"><X size={19} /></button>
        </header>

        <div className="grid shrink-0 grid-cols-2 gap-1 bg-white px-4 pb-3 dark:bg-[#101E38]" role="tablist" aria-label="Інформація про зупинку">
          <button type="button" role="tab" aria-selected={tab === 'departures'} onClick={() => setTab('departures')} className={`rounded-full px-3 py-2.5 text-xs font-extrabold transition ${tab === 'departures' ? 'bg-[#1769ED] text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Відправлення</button>
          <button type="button" role="tab" aria-selected={tab === 'about'} onClick={() => setTab('about')} className={`rounded-full px-3 py-2.5 text-xs font-extrabold transition ${tab === 'about' ? 'bg-[#1769ED] text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Про зупинку</button>
        </div>

        {tab === 'departures' ? <>
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-y border-slate-200/70 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-[#101E38]">
            {([
              ['all', 'Усі'], ['bus', 'Автобуси'], ['tram', 'Трамваї'], ['trolleybus', 'Тролейбуси'],
            ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-extrabold transition ${mode === id ? 'bg-[#1769ED] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{label}</button>)}
            <button type="button" onClick={() => setReloadIndex((value) => value + 1)} disabled={loading} aria-label="Оновити прибуття" className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            {loading && <div role="status" className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-slate-500 dark:bg-[#101E38]">Завантажуємо реальні прибуття…</div>}
            {!loading && error && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p className="font-bold">Немає даних табло</p><p className="mt-1">{error}</p></div>}
            {!loading && !error && visibleArrivals.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-[#101E38]">
              <Clock3 className="mx-auto text-slate-400" size={28} />
              <p className="mt-2 text-sm font-extrabold text-slate-800 dark:text-white">Підтверджених прибуттів поки немає</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Табло показує лише дані, які надійшли від транспортного джерела. Спробуйте оновити трохи пізніше.</p>
            </div>}
            {!loading && visibleArrivals.map((arrival) => {
              const kind = normalizedMode(arrival.mode);
              const Icon = modeIcon(kind);
              const color = transportColor(kind);
              return <article key={`${arrival.routeId}:${arrival.tripId ?? ''}:${arrival.vehicleId ?? ''}`} className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-[0_2px_10px_rgba(26,73,133,.05)] dark:border-slate-800 dark:bg-[#101E38]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: color }}><Icon size={20} /></span>
                <span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-900 dark:text-white">{arrival.displayLabel || arrival.routeId}</b><span className="mt-1 block truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{arrivalSource(arrival)}{arrival.confidence !== 'UNKNOWN' ? ` · точність ${arrival.confidence.toLocaleLowerCase('uk-UA')}` : ''}</span></span>
                <span className="shrink-0 text-right"><b className={`block text-lg font-black tabular-nums ${arrival.isRealtime ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#0B1730] dark:text-white'}`}>{arrivalTime(arrival)}</b><span className="text-[9px] font-bold text-slate-400">{arrival.isRealtime ? 'зараз' : 'прибуття'}</span></span>
              </article>;
            })}
          </div>
        </> : <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#101E38]">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"><MapPin size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Назва з даних маршруту</p><p className="text-sm font-extrabold text-slate-900 dark:text-white">{stopName}</p></div></div>
            {stopCoordinates ? <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 dark:border-slate-800">Координати джерела: {stopCoordinates[1].toFixed(5)}, {stopCoordinates[0].toFixed(5)}</p> : <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-amber-700 dark:border-slate-800 dark:text-amber-300">Координати зупинки не надані провайдером.</p>}
          </div>
          <div className="mt-3 flex gap-2 rounded-2xl bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"><Info size={16} className="mt-0.5 shrink-0" /><p>Фактичні розклади, доступність і доступність для маломобільних пасажирів показуються лише тоді, коли ці поля передає транспортне джерело.</p></div>
        </div>}
      </section>
    </div>
  );
};
