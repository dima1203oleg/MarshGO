import React, { useState } from 'react';
import {
  ArrowLeft,
  Menu,
  Star,
  Bus,
  TramFront,
  Accessibility,
  AlertTriangle,
  RefreshCw,
  Route,
} from 'lucide-react';

export interface StopArrivalItem {
  id: string;
  routeId: string;
  type: 'bus' | 'tram' | 'trolleybus' | 'marshrutka' | 'metro' | 'unknown';
  typeLetter: string;
  badgeBgColor: string; // e.g. '#65A30D' (green), '#DC2626' (red), '#0284C7' (blue), '#CA8A04' (olive)
  destination?: string;
  statusLabel: string;
  vehiclePlate?: string;
  isAccessible?: boolean; // Wheelchair accessible
  arrivalSource: 'TRIP_UPDATE' | 'VEHICLE_PROJECTION' | 'SCHEDULE' | 'UNKNOWN';
  observedAt?: string;
  isRealtime: boolean;
  etaMinutes: number | null;
  nextEtaMinutes?: number;
  alertNote?: string;
  intervalLabel?: string; // e.g. 'Інтервал 10-15 хв'
  crowdLevel?: 'low' | 'medium' | 'high';
}

interface StopArrivalsSheetProps {
  stopName: string;
  subtitle?: string;
  arrivals: StopArrivalItem[];
  isLoading?: boolean;
  error?: string | null;
  onBack?: () => void;
  onMenuClick?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  onSelectArrival?: (arrival: StopArrivalItem) => void;
  onOpenFullTimetable?: (routeId: string) => void;
  onRefresh?: () => void;
}

type StopArrivalModeFilter = 'all' | 'gps' | 'schedule';
type StopTransportFilter = 'all' | StopArrivalItem['type'];

export const StopArrivalsSheet: React.FC<StopArrivalsSheetProps> = ({
  stopName,
  subtitle = 'Зупинка громадського транспорту',
  arrivals,
  isLoading = false,
  error = null,
  onBack,
  onMenuClick,
  onToggleFavorite,
  isFavorite = false,
  onSelectArrival,
  onOpenFullTimetable,
  onRefresh,
}) => {
  const [filterMode, setFilterMode] = useState<StopArrivalModeFilter>('all');
  const [transportFilter, setTransportFilter] = useState<StopTransportFilter>('all');
  const filteredArrivals = arrivals.filter((item) => {
    const matchesSource = filterMode === 'all' || (filterMode === 'gps' ? item.isRealtime : item.arrivalSource === 'SCHEDULE');
    const matchesTransport = transportFilter === 'all' || item.type === transportFilter;
    return matchesSource && matchesTransport;
  });
  const visibleTransportTypes = [...new Set(arrivals.map((item) => item.type))].filter((type) => type !== 'unknown');
  const transportLabel: Record<StopArrivalItem['type'], string> = { bus: 'Автобуси', tram: 'Трамваї', trolleybus: 'Тролейбуси', marshrutka: 'Маршрутки', metro: 'Метро', unknown: 'Інше' };

  return (
    <div className="stop-arrivals-sheet flex flex-col w-full bg-white dark:bg-[#0B1730] text-[#0B1730] dark:text-white rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden border-t border-slate-200/80 dark:border-slate-800 transition-all duration-300">
      {/* Top Grab Handle */}
      <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

      {/* Stop header */}
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5 text-[#0B1730] dark:border-slate-800 dark:bg-[#0B1730] dark:text-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Назад"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
            >
              <ArrowLeft size={20} className="stroke-[2.5]" />
            </button>
          )}

          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Меню зупинки"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
            >
              <Menu size={20} className="stroke-[2.2]" />
            </button>
          )}

          <div className="min-w-0 pl-1">
            <h1 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight">
              {stopName}
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Оновити"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}

          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label="В обране"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
            >
              <Star
                size={20}
                className={isFavorite ? 'fill-amber-300 text-amber-400' : 'text-slate-500 dark:text-slate-300'}
              />
            </button>
          )}
        </div>
      </header>

      <div className="no-scrollbar flex min-h-14 items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 dark:border-slate-800 dark:bg-[#0B1730]">
        <button type="button" aria-pressed={transportFilter === 'all'} onClick={() => setTransportFilter('all')} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-extrabold ${transportFilter === 'all' ? 'bg-[#0066FF] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>Усі</button>
        {visibleTransportTypes.map((type) => <button key={type} type="button" aria-pressed={transportFilter === type} onClick={() => setTransportFilter(type)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-extrabold ${transportFilter === type ? 'bg-[#0066FF] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{transportLabel[type]}</button>)}
      </div>

      {/* Arrivals Content List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 max-h-[62vh] sm:max-h-[520px]">
        {isLoading && arrivals.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0284C7] border-t-transparent" />
            <span className="font-bold">Опитуємо GPS-трекери та розклад зупинки...</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-5 text-center">
            <p className="text-xs font-bold text-rose-800 dark:text-rose-200">{error}</p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                Спробувати знову
              </button>
            )}
          </div>
        ) : filteredArrivals.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-8 text-center">
            <p className="text-sm font-black text-[#0B1730] dark:text-white">
              Дані для цього режиму зараз недоступні
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Показуємо тільки фактичні GPS-позиції або розклад, отримані від провайдера.
            </p>
          </div>
        ) : (
          filteredArrivals.map((item) => {
            const isNow = item.isRealtime && item.etaMinutes === 0;
            const isDelayed = Boolean(item.alertNote);

            return (
              <div
                key={item.id}
                onClick={() => onSelectArrival?.(item)}
                className="group relative flex items-center justify-between rounded-[26px] bg-[#F2F5F9]/90 hover:bg-white dark:bg-[#101E38]/90 dark:hover:bg-[#142646] p-4 border border-slate-200/80 dark:border-slate-800 hover:border-[#0284C7]/50 dark:hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md active:scale-[0.985]"
              >
                {/* Left Part: Transport Icon + Type Letter + Colored Badge + Details */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Transport Icon */}
                  <div className="text-slate-600 dark:text-slate-300 shrink-0">
                    {item.type === 'tram' ? <TramFront size={22} className="stroke-[2.2]" /> : ['bus', 'trolleybus', 'marshrutka'].includes(item.type) ? <Bus size={22} className="stroke-[2.2]" /> : <Route size={22} className="stroke-[2.2]" />}
                  </div>

                  {/* Type Letter (A, T, Тр, Мт) */}
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 shrink-0">
                    {item.typeLetter}
                  </span>

                  {/* Route Number Colored Badge */}
                  <span
                    style={{ backgroundColor: item.badgeBgColor }}
                    className="grid min-w-[36px] h-7 place-items-center rounded-xl px-2.5 text-xs font-black text-white shadow-xs shrink-0 tracking-tight"
                  >
                    {item.routeId}
                  </span>

                  {/* Low floor accessibility badge ♿ */}
                  {item.isAccessible && (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0866F5] text-white shadow-2xs shrink-0" title="Низькопідлоговий транспорт">
                      <Accessibility size={13} className="stroke-[2.5]" />
                    </span>
                  )}

                  {/* Destination & Plate */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                      {item.vehiclePlate && (
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {item.vehiclePlate}
                        </span>
                      )}
                      {item.destination ? <>
                        <span className="text-slate-400 font-bold shrink-0">➔</span>
                        <span className="truncate text-slate-800 dark:text-slate-100 font-bold">{item.destination}</span>
                      </> : <span className="truncate text-slate-600 dark:text-slate-300 font-semibold">{item.statusLabel}</span>}
                    </div>

                    {/* Subtitle Alerts / Next Run */}
                    {isDelayed ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span className="truncate">{item.alertNote}</span>
                      </div>
                    ) : item.nextEtaMinutes ? (
                      <p className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        Наступний за {item.nextEtaMinutes} хв
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Right Part: Live Arrival Status Pill (Identical to Photo 2) */}
                <div className="flex flex-col items-end shrink-0 pl-3 min-w-[70px]">
                  {item.intervalLabel ? (
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Інтервал
                      </span>
                      <b className="text-xs font-black text-[#0B1730] dark:text-white">
                        {item.intervalLabel.replace(/Інтервал\s*/i, '')}
                      </b>
                    </div>
                  ) : item.etaMinutes === null ? (
                    <span className="max-w-[88px] text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">Немає прогнозу</span>
                  ) : isNow ? (
                    <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Зараз</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-2xl font-black tracking-tight text-[#0B1730] dark:text-white leading-none">
                          {item.etaMinutes}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          хв
                        </span>
                        {item.isRealtime && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />}
                      </div>

                      {onOpenFullTimetable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFullTimetable(item.routeId);
                          }}
                          className="mt-1 text-[11px] font-extrabold text-[#0284C7] dark:text-sky-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Повний розклад</span>
                        </button>
                      )}
                    </div>
                  )}
                  {!item.intervalLabel && <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${item.isRealtime ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{item.isRealtime ? 'GPS' : item.arrivalSource === 'SCHEDULE' ? 'Розклад' : item.statusLabel}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filter by data source while retaining source labels on each row. */}
      <div className="p-3.5 bg-white/95 dark:bg-[#0B1730]/95 border-t border-slate-100 dark:border-slate-800 flex justify-center">
        <div className="inline-flex items-center rounded-full bg-[#E5E9EF] dark:bg-slate-800 p-1 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition ${filterMode === 'all' ? 'bg-white dark:bg-slate-900 text-[#0284C7] dark:text-sky-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
          >Усі</button>
          <button
            type="button"
            onClick={() => setFilterMode('gps')}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black transition ${
              filterMode === 'gps'
                ? 'bg-white dark:bg-slate-900 text-[#0284C7] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${filterMode === 'gps' ? 'bg-[#0284C7]' : 'bg-slate-400'}`} />
            <span>GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('schedule')}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black transition ${
              filterMode === 'schedule'
                ? 'bg-white dark:bg-slate-900 text-[#0284C7] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${filterMode === 'schedule' ? 'bg-[#0284C7]' : 'bg-slate-400'}`} />
            <span>Розклад</span>
          </button>
        </div>
      </div>
    </div>
  );
};
