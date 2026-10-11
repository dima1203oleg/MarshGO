import React, { useState } from 'react';
import {
  ArrowLeft,
  MoreHorizontal,
  Heart,
  Bus,
  TramFront,
  Accessibility,
  Radio,
  RefreshCw,
} from 'lucide-react';

export interface StopArrivalItem {
  id: string;
  routeId: string;
  type: 'bus' | 'tram' | 'trolleybus' | 'marshrutka' | 'metro' | 'unknown';
  typeLetter: string;
  badgeBgColor: string; // e.g. '#1976D2' (blue), '#DC2626' (red), '#00897B' (teal), '#7B1FA2' (purple)
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
  intervalLabel?: string;
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

type StopTransportFilter = 'all' | 'bus' | 'tram' | 'trolleybus';
type StopSheetTab = 'departures' | 'about';

export const StopArrivalsSheet: React.FC<StopArrivalsSheetProps> = ({
  stopName,
  subtitle = 'Зупинка • у напрямку центру',
  arrivals,
  isLoading = false,
  error = null,
  onBack,
  onMenuClick,
  onToggleFavorite,
  isFavorite = false,
  onSelectArrival,
  onRefresh,
}) => {
  const [transportFilter, setTransportFilter] = useState<StopTransportFilter>('all');
  const [activeTab, setActiveTab] = useState<StopSheetTab>('departures');

  const filteredArrivals = arrivals.filter((item) => {
    if (transportFilter === 'all') return true;
    if (transportFilter === 'bus') return item.type === 'bus' || item.type === 'marshrutka';
    if (transportFilter === 'tram') return item.type === 'tram';
    if (transportFilter === 'trolleybus') return item.type === 'trolleybus';
    return true;
  });

  return (
    <div className="stop-arrivals-sheet flex flex-col w-full bg-white dark:bg-[#0B1730] text-[#0B1730] dark:text-white rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden border-t border-slate-200/80 dark:border-slate-800 transition-all duration-300 max-h-[85vh]">
      {/* Photo Header Banner with Lviv Architecture matching Screen 4 */}
      <div className="relative h-40 w-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
        <img
          src="/images/lviv_stop_banner.jpg"
          alt="Львів"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

        {/* Back and More Buttons on Photo */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between z-10">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Назад"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={onMenuClick || onRefresh}
            aria-label="Більше"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition active:scale-95 ml-auto"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Stop Title and Favorite Row */}
      <div className="flex items-start justify-between px-4 pt-3.5 pb-2 bg-white dark:bg-[#0B1730] border-b border-slate-100 dark:border-slate-800/80">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <Bus size={18} className="text-[#007AFF] shrink-0" />
            <h1 className="text-lg font-black tracking-tight text-[#0B1730] dark:text-white truncate">
              {stopName || 'вул. Петра Дорошенка'}
            </h1>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 truncate pl-6">
            {subtitle || 'Зупинка • у напрямку центру'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label="В обране"
          className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-rose-500 dark:border-slate-800 dark:bg-slate-800/80 transition active:scale-95 shrink-0"
        >
          <Heart size={18} className={isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
        </button>
      </div>

      {/* Tabs: [ Відправлення ] [ Про зупинку ] */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-2.5 bg-white dark:bg-[#0B1730]">
        <button
          type="button"
          onClick={() => setActiveTab('departures')}
          className={`py-2 rounded-full text-xs font-black transition ${
            activeTab === 'departures'
              ? 'bg-[#007AFF] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Відправлення
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`py-2 rounded-full text-xs font-black transition ${
            activeTab === 'about'
              ? 'bg-[#007AFF] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Про зупинку
        </button>
      </div>

      {/* Transport Filter Category Pills */}
      {activeTab === 'departures' && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white dark:bg-[#0B1730]">
          <button
            type="button"
            onClick={() => setTransportFilter('all')}
            className={`min-h-8 shrink-0 rounded-full px-4 text-xs font-black transition ${
              transportFilter === 'all'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Усі
          </button>
          <button
            type="button"
            onClick={() => setTransportFilter('bus')}
            className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
              transportFilter === 'bus'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bus size={13} />
            <span>Автобуси</span>
          </button>
          <button
            type="button"
            onClick={() => setTransportFilter('tram')}
            className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
              transportFilter === 'tram'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <TramFront size={13} />
            <span>Трамваї</span>
          </button>
          <button
            type="button"
            onClick={() => setTransportFilter('trolleybus')}
            className={`flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition ${
              transportFilter === 'trolleybus'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bus size={13} />
            <span>Тролейбуси</span>
          </button>
        </div>
      )}

      {/* Main Departures List */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2.5 bg-[#F8FAFC] dark:bg-[#070E1B] pt-2">
        {isLoading && arrivals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#007AFF]" />
            <span className="font-bold">Опитуємо GPS-трекери зупинки…</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-50 p-4 text-center text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : filteredArrivals.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs font-bold text-slate-500 dark:bg-[#101E38]">
            Відправлень для вибраного транспорту не знайдено
          </div>
        ) : (
          filteredArrivals.map((item) => {
            const isNow = item.isRealtime && item.etaMinutes === 0;
            const isRealtime = item.isRealtime;

            // Route badge color
            let badgeColor = item.badgeBgColor || '#1976D2';
            if (item.type === 'tram') badgeColor = '#DC2626';
            if (item.type === 'trolleybus') badgeColor = '#00897B';
            if (item.type === 'marshrutka') badgeColor = '#7B1FA2';

            return (
              <div
                key={item.id}
                onClick={() => onSelectArrival?.(item)}
                className="flex items-center justify-between rounded-[20px] bg-white p-3.5 shadow-[0_2px_10px_rgba(26,73,133,.05)] border border-slate-100 dark:border-slate-800 dark:bg-[#101E38] transition hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                {/* Left: Mode Icon + Route Badge + Destination */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mode Icon */}
                  <div className="text-slate-500 dark:text-slate-400 shrink-0">
                    {item.type === 'tram' ? <TramFront size={20} /> : <Bus size={20} />}
                  </div>

                  {/* Route Badge */}
                  <span
                    style={{ backgroundColor: badgeColor }}
                    className="grid min-w-[38px] h-7 place-items-center rounded-xl px-2 text-xs font-black text-white shadow-2xs shrink-0"
                  >
                    {item.routeId}
                  </span>

                  {/* Destination */}
                  <span className="text-sm font-black text-[#0B1730] dark:text-white truncate">
                    {item.destination || item.statusLabel || 'Центр'}
                  </span>
                </div>

                {/* Right: ETA & Realtime/Badge Status */}
                <div className="flex flex-col items-end shrink-0 pl-3">
                  {/* Top: Signal + ETA */}
                  <div className="flex items-center gap-1">
                    {isRealtime && <Radio size={14} className="text-[#10B981] animate-pulse" />}
                    <span
                      className={`text-sm font-black tracking-tight ${
                        isRealtime ? 'text-[#10B981]' : 'text-[#0B1730] dark:text-white'
                      }`}
                    >
                      {isNow ? 'Зараз' : `${item.etaMinutes ?? 5} хв`}
                    </span>
                  </div>

                  {/* Bottom: Pill status (GPS / Прогноз / Розклад) + ♿ */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {isRealtime ? 'GPS' : item.arrivalSource === 'SCHEDULE' ? 'Розклад' : 'Прогноз'}
                    </span>
                    {item.isAccessible && (
                      <Accessibility size={13} className="text-[#007AFF] shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Bottom Accessibility Disclaimer matching Screen 4 */}
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-[11px] font-medium text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
          <Accessibility size={15} className="text-[#007AFF] shrink-0" />
          <span>Низькопідлоговий транспорт позначено відповідною іконкою.</span>
        </div>
      </div>
    </div>
  );
};
