import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  SlidersHorizontal,
  ChevronRight,
  Footprints,
  Bus,
  Bike,
  Car,
  Grid2X2,
  TramFront,
  Train,
  MapPin,
  Calendar,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { RouteSearchResultItem, SearchStrategyMode, SearchTransportMode } from '../model/types';

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
  selectedFilterMode: SearchTransportMode;
  onSelectFilterMode: (mode: SearchTransportMode) => void;
  selectedStrategy?: SearchStrategyMode;
  onSelectStrategy?: (strategy: SearchStrategyMode) => void;
  onOpenFiltersModal: () => void;
  onSelectResultItem: (item: RouteSearchResultItem) => void;
  onOpenMapView: () => void;
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
  selectedFilterMode,
  onSelectFilterMode,
  selectedStrategy = 'BALANCED',
  onSelectStrategy,
  onOpenFiltersModal,
  onSelectResultItem,
  onOpenMapView,
  onBackToSearchForm,
  onOpenReverseMarketplace,
}) => {
  const [activeStrategy, setActiveStrategy] = useState<SearchStrategyMode>(selectedStrategy);

  const cleanOrigin = originTitle.split(',')[0].trim() || 'Малого Голоска';
  const cleanDest = destTitle.split(',')[0].trim() || 'вул. Сихівська';
  const modeLabels: Partial<Record<SearchTransportMode, string>> = {
    bus: 'Автобуси', minibus: 'Маршрутки', marshrutka: 'Маршрутки', trolleybus: 'Тролейбуси',
    tram: 'Трамваї', metro: 'Метро', carpool: 'Попутки', taxi: 'Таксі', train: 'Поїзди',
    suburban_train: 'Електричка', bike: 'Велосипеди', scooter: 'Самокати', carsharing: 'Каршеринг',
    transfer: 'Трансфери', water: 'Водний транспорт', air: 'Літаки', other: 'Інше',
  };
  const availableModes = useMemo(() => {
    const found = new Set<SearchTransportMode>();
    for (const item of items) {
      if (item.type !== 'all') found.add(item.type);
      for (const leg of item.legs ?? []) if (leg.mode !== 'all') found.add(leg.mode);
    }
    return [...found];
  }, [items]);
  const visibleItems = selectedFilterMode === 'all' ? items : items.filter((item) =>
    item.type === selectedFilterMode || item.legs?.some((leg) => leg.mode === selectedFilterMode),
  );
  const dateLabel = (() => {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
  })();

  const handleStrategyChange = (st: SearchStrategyMode) => {
    setActiveStrategy(st);
    if (onSelectStrategy) {
      onSelectStrategy(st);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col overflow-x-hidden bg-[#F4F8FD] text-[#0B1730] dark:bg-[#070E1B] dark:text-white pb-20">
      {/* Top Header matching Reference Screen 2 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBackToSearchForm}
          aria-label="Назад"
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-base font-extrabold text-[#0B1730] dark:text-white">
          Результати пошуку
        </h1>

        <button
          type="button"
          onClick={onOpenFiltersModal}
          aria-label="Фільтри"
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 pt-3 space-y-3">
        <section aria-label="Параметри маршруту" className="rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_3px_12px_rgba(26,73,133,.06)] dark:border-slate-800 dark:bg-[#101E38]">
          <p className="flex items-center gap-2 text-[15px] font-black tracking-tight">
            <span className="truncate">{cleanOrigin}</span><ArrowRight size={15} className="shrink-0 text-[#0066FF]"/><span className="truncate">{cleanDest}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Calendar size={13} className="text-[#0066FF]"/>{dateLabel} · {timeStr} · {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}
          </p>
        </section>

        <div role="tablist" aria-label="Вигляд результатів" className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#101E38]">
          <button type="button" role="tab" aria-selected="false" onClick={onOpenMapView} className="min-h-10 rounded-xl text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-[#0066FF] dark:text-slate-300 dark:hover:bg-slate-800">Карта</button>
          <button type="button" role="tab" aria-selected="true" className="min-h-10 rounded-xl bg-[#0066FF] text-xs font-black text-white shadow-sm">Список</button>
        </div>

        {items.length > 0 && <div role="group" aria-label="Фільтр за видом транспорту" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
          <ModeChip mode="all" label={`Усі ${items.length}`} selected={selectedFilterMode === 'all'} onClick={() => onSelectFilterMode('all')}/>
          {availableModes.map((mode) => {
            const count = items.filter((item) => item.type === mode || item.legs?.some((leg) => leg.mode === mode)).length;
            return <ModeChip key={mode} mode={mode} label={`${modeLabels[mode] ?? mode} ${count}`} selected={selectedFilterMode === mode} onClick={() => onSelectFilterMode(mode)}/>;
          })}
        </div>}

        {/* Strategy Tabs: [ Оптимальний ] [ Найшвидший ] [ Найдешевший ] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStrategyChange('BALANCED')}
            className={`flex-1 rounded-full py-2 text-xs font-black transition ${
              activeStrategy === 'BALANCED'
                ? 'bg-[#0066FF] text-white shadow-xs'
                : 'bg-white dark:bg-[#101E38] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Оптимальний
          </button>
          <button
            type="button"
            onClick={() => handleStrategyChange('FASTEST')}
            className={`flex-1 rounded-full py-2 text-xs font-black transition ${
              activeStrategy === 'FASTEST'
                ? 'bg-[#0066FF] text-white shadow-xs'
                : 'bg-white dark:bg-[#101E38] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Найшвидший
          </button>
          <button
            type="button"
            onClick={() => handleStrategyChange('CHEAPEST')}
            className={`flex-1 rounded-full py-2 text-xs font-black transition ${
              activeStrategy === 'CHEAPEST'
                ? 'bg-[#0066FF] text-white shadow-xs'
                : 'bg-white dark:bg-[#101E38] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Найдешевший
          </button>
        </div>

        {/* Secondary filters */}
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="shrink-0 rounded-md bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
              Усі види
            </span>
            <span className="shrink-0 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101E38] px-2 py-0.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
              GPS
            </span>
            <span className="shrink-0 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101E38] px-2 py-0.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
              Розклад
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenFiltersModal}
            className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#101E38] px-3.5 py-1.5 text-xs font-black text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 transition hover:bg-slate-50"
          >
              <span>Фільтри</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={36} className="animate-spin text-[#0066FF]" />
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
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0066FF] px-4 py-2 text-xs font-black text-white shadow-sm"
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

        {/* Itinerary Cards List matching Reference Screen 2 */}
        {!isLoading && !error && (
          <div className="space-y-3 pt-1">
            {visibleItems.map((realItem) => {
              const durationLabel = realItem.durationLabel || 'Час не вказано';
              const distanceLabel = realItem.distanceLabel || 'Відстань не вказана';
              const priceLabel = realItem.priceLabel || 'Ціну не вказано';
              const transfersCount = realItem.transfers ?? 0;
              const transfersLabel = transfersCount === 0 ? 'Без пересадок' : `${transfersCount} пересадка`;
              const legsChain = realItem.legs?.length
                ? realItem.legs.map((leg) => ({
                  type: leg.mode === 'walk' ? 'walk' : leg.mode,
                  label: leg.mode === 'walk'
                    ? (leg.durationLabel || `${Math.round(leg.durationSeconds / 60)} хв`)
                    : (leg.routeName || leg.modeLabel || leg.carrierName || leg.mode),
                  badgeBg: leg.mode === 'walk' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : leg.mode === 'tram' ? 'bg-[#EF4444] text-white'
                    : leg.mode === 'trolleybus' ? 'bg-[#0D9488] text-white'
                    : leg.mode === 'minibus' || leg.mode === 'marshrutka' ? 'bg-[#8B5CF6] text-white'
                    : leg.mode === 'metro' ? 'bg-[#DC2626] text-white'
                    : leg.mode === 'train' || leg.mode === 'suburban_train' ? 'bg-[#7C3AED] text-white'
                    : 'bg-[#0066FF] text-white',
                }))
                : [{ type: 'transit', label: realItem.modeLabel, badgeBg: 'bg-[#0066FF] text-white' }];

              return (
                <div
                  key={realItem.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectResultItem(realItem)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).click();
                    }
                  }}
                  className="group flex w-full flex-col rounded-[24px] bg-white dark:bg-[#101E38] p-4 sm:p-5 text-left border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-[#0066FF] active:scale-[0.99] transition duration-200 cursor-pointer"
                >
                  {/* Top Row: Leg Badges Chain [🚶 4 хв] [🚌 21] → [🚋 24] > */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {legsChain.map((leg, legIdx) => {
                        /* Show arrow only between consecutive transit (non-walk) legs */
                        const hasPreviousTransitLeg = legsChain.slice(0, legIdx).some((previousLeg) => previousLeg.type !== 'walk');
                        const showArrow = leg.type !== 'walk' && hasPreviousTransitLeg;
                        const LegIcon = leg.type === 'walk' ? Footprints
                          : leg.type === 'tram' || leg.type === 'trolleybus' ? TramFront
                          : leg.type === 'metro' || leg.type === 'train' || leg.type === 'suburban_train' ? Train
                          : Bus;
                        return (
                          <React.Fragment key={legIdx}>
                            {showArrow && (
                              <ArrowRight size={13} className="text-slate-400 dark:text-slate-500" />
                            )}
                            <span
                              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black shadow-2xs ${leg.badgeBg}`}
                            >
                              <LegIcon size={13} />
                              <span>{leg.label}</span>
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <ChevronRight size={18} className="text-slate-400 group-hover:text-[#0066FF] transition shrink-0 ml-2" />
                  </div>

                  {/* Middle Row: Duration & Details (53 хв  1 пересадка • 11.0 км • 60 грн) */}
                  <div className="mt-3 flex items-baseline gap-2.5">
                    <span className="text-xl font-black text-[#0B1730] dark:text-white tracking-tight">
                      {durationLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {transfersLabel} • {distanceLabel} • {priceLabel}
                    </span>
                  </div>

                  {/* Bottom Row: Origin → Destination text */}
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    {cleanOrigin} → {cleanDest}
                  </div>
                </div>
              );
            })}
            {visibleItems.length === 0 && (
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

function ModeChip({ mode, label, selected, onClick }: { mode: SearchTransportMode; label: string; selected: boolean; onClick: () => void }) {
  const Icon = mode === 'all' ? Grid2X2
    : mode === 'tram' ? TramFront
      : mode === 'train' || mode === 'suburban_train' || mode === 'metro' ? Train
        : mode === 'bike' ? Bike
          : mode === 'carpool' || mode === 'taxi' || mode === 'carsharing' || mode === 'transfer' ? Car
            : mode === 'walk' ? Footprints
              : Bus;
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-extrabold transition active:scale-95 ${selected ? 'border-[#0066FF] bg-[#0066FF] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#101E38] dark:text-slate-300'}`}>
    <Icon size={14}/><span>{label}</span>
  </button>;
}
