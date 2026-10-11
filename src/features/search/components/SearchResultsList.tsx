import React from 'react';
import {
  ArrowLeft,
  SlidersHorizontal,
  ChevronRight,
  Footprints,
  Bus,
  TramFront,
  Train,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { RouteSearchResultItem, SearchStrategyMode } from '../model/types';
import { transportColor } from '../../../domain/transportVisuals';

interface SearchResultsListProps {
  originTitle: string;
  destTitle: string;
  dateStr: string;
  timeStr: string;
  passengers: number;
  isLoading: boolean;
  error: string | null;
  notice?: string | null;
  onRetry: () => void;
  items: RouteSearchResultItem[];
  selectedStrategy?: SearchStrategyMode;
  onSelectStrategy?: (strategy: SearchStrategyMode) => void;
  onOpenFiltersModal: () => void;
  onSelectResultItem: (item: RouteSearchResultItem) => void;
  onBackToSearchForm: () => void;
  onOpenReverseMarketplace?: () => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  originTitle,
  destTitle,
  dateStr,
  timeStr,
  passengers,
  isLoading,
  error,
  notice,
  onRetry,
  items,
  selectedStrategy = 'BALANCED',
  onSelectStrategy,
  onOpenFiltersModal,
  onSelectResultItem,
  onBackToSearchForm,
  onOpenReverseMarketplace,
}) => {
  const activeStrategy = selectedStrategy;

  const cleanOrigin = originTitle.split(',')[0].trim() || 'Малого Голоска';
  const cleanDest = destTitle.split(',')[0].trim() || 'вул. Сихівська';
  const displayDate = (() => {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return 'Дата не вказана';
    return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  })();

  const handleStrategyChange = (st: SearchStrategyMode) => {
    if (onSelectStrategy) {
      onSelectStrategy(st);
    }
  };

  return (
    <div className="search-results-screen mx-auto flex min-h-[100svh] w-full max-w-md flex-col overflow-x-hidden bg-[#F4F8FD] text-[#0B1730] dark:bg-[#070E1B] pb-20">
      {/* Results header follows the selected route and its actual search time. */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(4.75rem,calc(env(safe-area-inset-top)+2rem))]">
        <button
          type="button"
          onClick={onBackToSearchForm}
          aria-label="Назад"
          className="grid h-10 w-10 place-items-center rounded-full text-slate-700 dark:text-slate-200 transition active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-extrabold text-[#0B1730] dark:text-white">{cleanOrigin} → {cleanDest}</h1>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{displayDate} · {timeStr || 'Час не вказано'} · {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}</p>
        </div>

        <button
          type="button"
          onClick={onOpenFiltersModal}
          aria-label="Фільтри"
          className="grid h-10 w-10 place-items-center rounded-full text-slate-700 dark:text-slate-200 transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
      </header>

      {/* Main Content */}
      <div className="search-results-content flex-1 space-y-3 px-4 pt-3">
        {/* Strategy Tabs: [ Оптимальний ] [ Найшвидший ] [ Найдешевший ] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStrategyChange('BALANCED')}
            className={`flex-1 rounded-full py-2 text-xs font-black transition ${
              activeStrategy === 'BALANCED'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-white dark:bg-[#101E38] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Оптимальний
          </button>
          <button
            type="button"
            onClick={() => handleStrategyChange('FASTEST')}
            className={`flex-1 rounded-full py-2 text-xs font-black transition ${
              activeStrategy === 'FASTEST'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-white dark:bg-[#101E38] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Найшвидший
          </button>
          <button
            type="button"
            onClick={() => handleStrategyChange('CHEAPEST')}
            className={`flex-1 rounded-full py-2 text-xs font-black transition ${
              activeStrategy === 'CHEAPEST'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'bg-white dark:bg-[#101E38] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Найдешевший
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={36} className="animate-spin text-[#007AFF]" />
            <p className="mt-4 text-sm font-extrabold text-[#0B1730] dark:text-white">
              Шукаємо найкращі маршрути…
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Аналізуємо громадський транспорт та пересадки
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="rounded-3xl bg-rose-50 dark:bg-rose-950/40 p-5 text-center border border-rose-200/80 dark:border-rose-900">
            <AlertCircle size={32} className="mx-auto text-rose-500 mb-2" />
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-3">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#007AFF] px-4 py-2 text-xs font-black text-white shadow-sm"
            >
              <RefreshCw size={13} />
              <span>Спробувати знову</span>
            </button>
          </div>
        )}

        {notice && !isLoading && !error && (
          <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {notice}
          </div>
        )}

        {/* Itinerary Cards List matching Screen 2 */}
        {!isLoading && !error && (
          <div className="space-y-3 pt-1">
            {items.map((realItem, itemIdx) => {
              const durationLabel = realItem.durationLabel || 'Час не вказано';
              const distanceLabel = realItem.distanceLabel || 'Відстань не вказана';
              const priceLabel = realItem.priceLabel || 'Ціну не вказано';
              const transfersCount = realItem.transfers ?? 0;
              const transfersLabel = transfersCount === 0 ? 'Без пересадок' : `${transfersCount} пересадка`;
              const legsChain = realItem.legs?.length
                ? realItem.legs.map((leg) => ({
                  type: leg.mode === 'walk' ? 'walk' : leg.mode,
                  label: leg.mode === 'walk'
                    ? (leg.durationLabel || `${Math.max(1, Math.round(leg.durationSeconds / 60))} хв`)
                    : (leg.routeName || leg.modeLabel || leg.carrierName || leg.mode),
                  badgeColor: leg.mode === 'walk' ? null : transportColor(leg.mode),
                }))
                : [{ type: 'transit', label: realItem.modeLabel, badgeColor: transportColor(realItem.type) }];

              const isFirst = itemIdx === 0;

              return (
                <div
                  key={realItem.id}
                  data-testid="search-result-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectResultItem(realItem)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).click();
                    }
                  }}
                  className={`group flex w-full flex-col rounded-[22px] bg-white p-4 text-left shadow-[0_2px_10px_rgba(26,73,133,.05)] transition duration-200 hover:shadow-md active:scale-[0.99] dark:bg-[#101E38] ${
                    isFirst
                      ? 'border-2 border-[#007AFF] shadow-blue-500/10'
                      : 'border border-[#E3EBF4] dark:border-slate-800'
                  }`}
                >
                  {/* Top Row: Leg Badges Chain [🚶 4 хв] → [🚌 21] → [🚋 24] > */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {legsChain.map((leg, legIdx) => {
                        const LegIcon = leg.type === 'walk' ? Footprints
                          : leg.type === 'tram' || leg.type === 'trolleybus' ? TramFront
                          : leg.type === 'metro' || leg.type === 'train' || leg.type === 'suburban_train' ? Train
                          : Bus;
                        return (
                          <React.Fragment key={legIdx}>
                            {legIdx > 0 && (
                              <ArrowRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <span
                              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black shadow-2xs ${leg.type === 'walk' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'text-white'}`}
                              style={leg.badgeColor ? { backgroundColor: leg.badgeColor } : undefined}
                            >
                              <LegIcon size={12} />
                              <span>{leg.label}</span>
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <ChevronRight size={18} className="text-slate-400 group-hover:text-[#0066FF] transition shrink-0 ml-2" />
                  </div>

                  {/* Middle Row: Duration & Details Matching Screen 2 */}
                  <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-[17px] font-black text-[#0B1730] dark:text-white tracking-tight">
                      {durationLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {transfersLabel}
                      {distanceLabel && distanceLabel !== 'Відстань не вказана' ? ` • ${distanceLabel}` : ''}
                      {priceLabel && priceLabel !== 'Ціну не надано' ? ` • ${priceLabel}` : ''}
                    </span>
                  </div>

                  {/* Bottom Row: Origin → Destination text */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate flex items-center gap-1.5">
                    <span className="truncate">{cleanOrigin}</span>
                    <ArrowRight size={10} className="text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="truncate">{cleanDest}</span>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-[#101E38]">
                <MapPin size={28} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-bold">Маршрутів за цими умовами не знайдено</p>
                <p className="mt-1 text-xs text-slate-500">Змініть час або вибрані види транспорту й повторіть пошук.</p>
                {onOpenReverseMarketplace && <button type="button" onClick={onOpenReverseMarketplace} className="mt-4 min-h-10 rounded-xl border border-[#0066FF] px-4 text-xs font-bold text-[#0066FF]">Створити запит пасажира</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
