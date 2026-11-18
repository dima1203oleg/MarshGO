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
  Clock3,
  CarFront,
  Bike,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { RouteLegItem, RouteSearchResultItem, SearchStrategyMode } from '../model/types';
import { transportColor } from '../../../domain/transportVisuals';

function formatClock(value: string): string {
  const clock = value.match(/(?:T|\s)(\d{1,2}:\d{2})/);
  if (clock) return clock[1];
  return value.match(/^\d{1,2}:\d{2}$/)?.[0] ?? '—';
}

function formatLegPrice(leg: RouteLegItem): string | null {
  const label = leg.priceLabel?.trim();
  if (label && !/не надан|не вказан|невідом|unknown/i.test(label)) {
    return label.replace(' UAH', ' грн').replace(' ₴', ' грн');
  }
  if (leg.mode !== 'walk' && leg.priceMinor != null && Number.isFinite(leg.priceMinor)) {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency', currency: 'UAH', maximumFractionDigits: 0,
    }).format(leg.priceMinor / 100);
  }
  return null;
}

function transferLabel(count: number): string {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  if (remainder100 >= 11 && remainder100 <= 14) return `${count} пересадок`;
  if (remainder10 === 1) return `${count} пересадка`;
  if (remainder10 >= 2 && remainder10 <= 4) return `${count} пересадки`;
  return `${count} пересадок`;
}

function segmentIcon(mode: string) {
  const LegIcon = mode === 'walk' ? Footprints
    : mode === 'tram' || mode === 'trolleybus' ? TramFront
      : mode === 'metro' || mode === 'train' || mode === 'suburban_train' ? Train
        : mode === 'carpool' || mode === 'taxi' || mode === 'carsharing' || mode === 'transfer' ? CarFront
          : mode === 'bike' ? Bike
            : mode === 'scooter' ? Zap : Bus;
  return <LegIcon size={13} aria-hidden="true"/>;
}

function segmentChain(item: RouteSearchResultItem) {
  if (item.legs?.length) return item.legs.map((leg) => ({
    id: leg.id,
    mode: leg.mode,
    label: leg.mode === 'walk' ? 'Пішки' : leg.routeName?.trim() || leg.modeLabel || 'Транспорт',
    modeLabel: leg.modeLabel,
  }));
  return [{ id: item.id, mode: item.type, label: item.modeLabel || item.type, modeLabel: item.modeLabel || item.type }];
}

function routeTitle(item: RouteSearchResultItem): string {
  const labels = (item.legs ?? [])
    .filter((leg) => leg.mode !== 'walk')
    .map((leg) => leg.modeLabel)
    .filter((label, index, all) => Boolean(label) && all.indexOf(label) === index);
  return labels.join(' + ') || item.modeLabel;
}

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
      {/* Canonical results header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(4.75rem,calc(env(safe-area-inset-top)+2rem))]">
        <button
          type="button"
          onClick={onBackToSearchForm}
          aria-label="Назад"
          className="grid h-11 w-11 place-items-center rounded-full text-slate-700 dark:text-slate-200 transition active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-sm font-extrabold text-[#0B1730] dark:text-white">Результати пошуку</h1>
          <p className="sr-only">{cleanOrigin} → {cleanDest} · {displayDate} · {timeStr || 'Час не вказано'} · {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}</p>
        </div>

        <button
          type="button"
          onClick={onOpenFiltersModal}
          aria-label="Фільтри"
          className="grid h-11 w-11 place-items-center rounded-full text-slate-700 dark:text-slate-200 transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
      </header>

      {/* Main Content */}
      <div className="search-results-content flex-1 space-y-3 px-4 pt-3">
        {/* Sort tabs from the MarshGO2 reference */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStrategyChange('BALANCED')}
            className={`min-h-10 flex-1 rounded-2xl px-2 py-2 text-xs font-black transition ${
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
            className={`min-h-10 flex-1 rounded-2xl px-2 py-2 text-xs font-black transition ${
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
            className={`min-h-10 flex-1 rounded-2xl px-2 py-2 text-xs font-black transition ${
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
          <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <summary className="flex min-h-6 cursor-pointer list-none items-center gap-2 font-bold marker:content-none">
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black dark:bg-amber-900/60">Частково</span>
              <span className="min-w-0 flex-1 truncate">{notice}</span>
              <ChevronRight size={14} className="shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true"/>
            </summary>
            <p className="mt-2 border-t border-amber-200 pt-2 dark:border-amber-800">{notice}</p>
          </details>
        )}

        {/* Itinerary Cards List matching Screen 2 */}
        {!isLoading && !error && (
          <div className="space-y-3 pt-1">
            {items.map((realItem, itemIdx) => {
              const durationLabel = realItem.durationLabel || 'Час не вказано';
              const hasDistance = realItem.distanceMeters != null && realItem.distanceMeters > 0
                && realItem.distanceLabel && !/не надана|не вказана|невідом/i.test(realItem.distanceLabel);
              const itemPrice = realItem.priceLabel && !/не надан|не вказан|невідом|unknown/i.test(realItem.priceLabel)
                ? realItem.priceLabel.replace(' UAH', ' грн').replace(' ₴', ' грн')
                : null;
              const transitLegCount = realItem.legs?.filter((leg) => leg.mode !== 'walk').length ?? 1;
              const transfersCount = realItem.transfers ?? Math.max(0, transitLegCount - 1);
              const legsChain = segmentChain(realItem);

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
                  className={`group flex w-full flex-col rounded-[22px] bg-white p-3.5 text-left shadow-[0_2px_10px_rgba(26,73,133,.05)] transition duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.99] dark:bg-[#101E38] ${
                    isFirst
                      ? 'border-2 border-[#007AFF] shadow-blue-500/10'
                      : 'border border-[#E3EBF4] dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold text-[#0B1730] dark:text-white">
                        {routeTitle(realItem)}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Clock3 size={13} className="shrink-0 text-[#007AFF]"/>
                        {formatClock(realItem.departureTime)} – {formatClock(realItem.arrivalTime)}
                        <span className="mx-0.5">·</span>{durationLabel}
                      </p>
                    </div>
                    <span className={`shrink-0 text-right ${itemPrice ? 'text-[#0B1730] dark:text-white' : 'text-slate-400'}`}>
                      <span className="block text-[15px] font-black">{itemPrice ?? '—'}</span>
                      <span className="block text-[9px] font-semibold text-slate-400">{itemPrice ? realItem.priceUnit : 'Ціну не надано'}</span>
                    </span>
                    <ChevronRight size={17} className="mt-1 shrink-0 text-slate-400 group-hover:text-[#0066FF] transition" />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5" aria-label="Послідовність видів транспорту">
                    {legsChain.map((leg, legIdx) => (
                      <React.Fragment key={leg.id}>
                        {legIdx > 0 && <ArrowRight size={12} className="shrink-0 text-slate-300 dark:text-slate-600"/>}
                        <span aria-label={`${leg.modeLabel}: ${leg.label}`} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-black ${leg.mode === 'walk' ? 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'text-white shadow-2xs'}`}
                          style={leg.mode === 'walk' ? undefined : { backgroundColor: transportColor(leg.mode) }}>
                          {segmentIcon(leg.mode)}{leg.label}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>

                  {realItem.legs?.length ? (
                    <div className="mt-2 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${realItem.legs.length}, minmax(0, 1fr))` }} aria-label="Тривалість і ціна сегментів">
                      {realItem.legs.map((leg) => {
                        const isWalk = leg.mode === 'walk';
                        const price = isWalk ? null : formatLegPrice(leg);
                        return (
                          <div key={leg.id} className="min-w-0 overflow-hidden rounded-lg bg-slate-50 px-1.5 py-1.5 text-center dark:bg-slate-900/70">
                            <span className="mb-1 block h-1 rounded-full" style={{ backgroundColor: isWalk ? '#94A3B8' : transportColor(leg.mode), borderBottom: isWalk ? '1px dashed white' : undefined }}/>
                            <span className="block truncate text-[9px] font-bold text-slate-600 dark:text-slate-300">{leg.durationLabel || leg.modeLabel}</span>
                            <span className={`block truncate text-[9px] font-extrabold ${price ? 'text-[#0B1730] dark:text-white' : 'text-slate-400'}`}>{price ?? (isWalk ? 'Пішки' : 'Ціна не надана')}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{transfersCount === 0 ? 'Без пересадок' : transferLabel(transfersCount)}</span>
                    {hasDistance && <><span aria-hidden="true">·</span><span>{realItem.distanceLabel}</span></>}
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-right text-slate-400">
                      <span>{cleanOrigin}</span><ArrowRight size={10} aria-hidden="true"/><span>{cleanDest}</span>
                    </span>
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
