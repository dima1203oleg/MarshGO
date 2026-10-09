import React from 'react';
import {
  ArrowLeft,
  MapPin,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import type { RouteSearchResultItem, SearchTransportMode } from '../model/types';

interface SearchResultsListProps {
  originTitle: string;
  destTitle: string;
  dateStr: string;
  timeStr: string;
  passengers: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  items: RouteSearchResultItem[];
  selectedFilterMode: SearchTransportMode;
  onSelectFilterMode: (mode: SearchTransportMode) => void;
  onOpenFiltersModal: () => void;
  onSelectResultItem: (item: RouteSearchResultItem) => void;
  onOpenMapView: () => void;
  onBackToSearchForm: () => void;
  onOpenReverseMarketplace: () => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  originTitle,
  destTitle,
  dateStr,
  timeStr,
  passengers,
  isLoading,
  error,
  onRetry,
  items,
  selectedFilterMode,
  onSelectFilterMode,
  onOpenFiltersModal,
  onSelectResultItem,
  onOpenMapView,
  onBackToSearchForm,
  onOpenReverseMarketplace,
}) => {
  // Counts by mode
  const modeCounts: Record<string, number> = {
    all: items.length,
    carpool: items.filter((i) => i.type === 'carpool').length,
    bus: items.filter((i) => i.type === 'bus').length,
    train: items.filter((i) => i.type === 'train').length,
    taxi: items.filter((i) => i.type === 'taxi').length,
  };

  const filteredItems =
    selectedFilterMode === 'all'
      ? items
      : items.filter((i) => i.type === selectedFilterMode);

  return (
    <div className="mx-auto flex flex-col min-h-[100svh] w-full max-w-md overflow-x-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBackToSearchForm}
          className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-black tracking-tight text-[#081B35] dark:text-white">
            {originTitle.split(',')[0]} → {destTitle.split(',')[0]}
          </h1>
          <p className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
            {new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: 'Europe/Kyiv' }).format(new Date(`${dateStr}T12:00:00Z`))}, {timeStr} · {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}
          </p>
        </div>

        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800" role="group" aria-label="Вигляд результатів">
          <button type="button" aria-pressed="true" className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[#0866F5] shadow-sm dark:bg-[#14233C]">Список</button>
          <button type="button" onClick={onOpenMapView} disabled={filteredItems.length === 0} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-500 disabled:opacity-40 dark:text-slate-400">Карта</button>
        </div>
      </header>

      {/* Filter Chips Strip (Усі 32, Попутки 8, Автобуси 6...) */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white dark:bg-[#0B1730] border-b border-slate-100/80 dark:border-slate-800/80 scrollbar-none">
        {(
          [
            ['all', 'Усі', modeCounts.all ?? 0],
            ['carpool', 'Попутки', modeCounts.carpool ?? 0],
            ['bus', 'Автобуси', modeCounts.bus ?? 0],
            ['train', 'Поїзди', modeCounts.train ?? 0],
            ['taxi', 'Таксі', modeCounts.taxi ?? 0],
          ] as const
        ).map(([modeId, label, count]) => {
          const active = selectedFilterMode === modeId;

          return (
            <button
              key={modeId}
              type="button"
              onClick={() => onSelectFilterMode(modeId as SearchTransportMode)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition shrink-0 ${
                active
                  ? 'bg-[#0866F5] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sorting & Filters Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-xs font-bold text-[#63738C] dark:text-slate-400">За часом відправлення</span>

        <button
          type="button"
          onClick={onOpenFiltersModal}
          className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#111e36] px-3 py-1.5 text-xs font-bold text-[#081B35] dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-800"
        >
          <SlidersHorizontal size={13} className="text-[#0866F5]" />
          <span>Фільтри</span>
        </button>
      </div>

      {/* Results Cards List */}
      <div className="px-4 space-y-3 mt-1">
        {isLoading ? (
          <div role="status" className="rounded-[24px] bg-white p-8 text-center shadow-sm dark:bg-[#111e36]">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Шукаємо доступні оголошення…</p>
          </div>
        ) : error ? (
          <div role="alert" className="rounded-[24px] border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-900 dark:bg-[#111e36]">
            <h3 className="text-base font-black text-rose-800 dark:text-rose-300">Не вдалося виконати пошук</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
            <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-[#0866F5] px-4 py-2.5 text-xs font-bold text-white">Спробувати ще раз</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[24px] bg-white dark:bg-[#111e36] p-8 text-center shadow-sm">
            <MapPin className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
            <h3 className="text-base font-black text-[#081B35] dark:text-white">
              За вашим запитом рейсів не знайдено
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              Спробуйте змінити дату або види транспорту, або створіть індивідуальну заявку.
            </p>
            <button
              type="button"
              onClick={onOpenReverseMarketplace}
              className="mt-4 rounded-xl bg-[#0866F5] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20"
            >
              Запропонувати свою ціну
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelectResultItem(item)}
              className="group block w-full cursor-pointer rounded-[24px] bg-white p-4 text-left shadow-sm border border-slate-100/90 transition hover:shadow-md hover:border-blue-200 active:scale-[0.99] dark:border-slate-800 dark:bg-[#111e36] dark:hover:border-blue-900"
            >
              {/* Badges row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10.5px] font-black text-[#16B87A] dark:text-emerald-400">
                      ★ {item.badge}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                      item.type === 'carpool'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : item.type === 'bus'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : item.type === 'train'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {item.modeLabel}
                  </span>
                </div>

                {item.driver && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {item.driver.rating == null ? (
                      <span>Ще немає відгуків</span>
                    ) : (
                      <>
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{item.driver.rating.toFixed(1)}</span>
                        <span className="text-slate-400">({item.driver.reviewCount})</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Middle: Photo + Price */}
              <div className="flex items-center justify-between gap-3">
                {/* Vehicle photo / carrier preview */}
                <div className="relative h-13 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {item.vehiclePhoto ? (
                    <img
                      src={item.vehiclePhoto}
                      alt={item.carrierName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-black text-slate-400">
                      {item.modeLabel}
                    </div>
                  )}
                </div>

                {/* Price block */}
                <div className="text-right shrink-0">
                  <div className="text-[20px] font-black tracking-tight text-[#081B35] dark:text-white leading-none">
                    {item.priceLabel}
                  </div>
                  <span className="text-[10.5px] font-semibold text-[#63738C] dark:text-slate-400">
                    {item.priceUnit}
                  </span>
                </div>
              </div>

              {/* Route Schedule row */}
              <div className="mt-3.5 flex items-center justify-between">
                <div className="shrink-0 min-w-[65px]">
                  <span className="text-[16px] font-black text-[#081B35] dark:text-white leading-none">
                    {item.departureTime}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.departureCity}
                  </span>
                </div>

                <div className="flex flex-col items-center px-1 flex-1 max-w-[130px]">
                  <span className="text-[10px] font-bold text-slate-500">
                    {item.durationLabel}
                  </span>
                  <div className="relative my-1 flex w-full items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0866F5]" />
                    <span className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E73C59]" />
                  </div>
                  <span className="text-[9.5px] font-medium text-slate-400">
                    {item.distanceLabel}
                  </span>
                </div>

                <div className="text-right shrink-0 min-w-[65px]">
                  <span className="text-[16px] font-black text-[#081B35] dark:text-white leading-none">
                    {item.arrivalTime}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.arrivalCity}
                  </span>
                </div>
              </div>

              {item.driver && (
                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
                  <span
                    aria-hidden="true"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    {item.driver.name.trim().charAt(0).toLocaleUpperCase('uk-UA') || 'В'}
                  </span>
                  <span className="min-w-0 truncate text-xs font-bold text-[#14243B] dark:text-slate-100">
                    Водій · {item.driver.name}
                  </span>
                </div>
              )}

              {/* Features Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                {item.features.map((feature, fIdx) => (
                  <span
                    key={fIdx}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))
        )}

        {/* Reverse Marketplace Callout */}
        <div className="mt-4 rounded-[24px] bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Reverse Marketplace
              </p>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Не знайшли поїздку? Запропонуйте свою ціну
              </h3>
              <p className="text-xs text-blue-100/90 mt-1">
                Водії за вашим маршрутом отримають запит і запропонують авто.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenReverseMarketplace}
            className="mt-3 w-full rounded-xl bg-white py-2.5 text-center text-xs font-black text-[#0866F5] shadow-sm transition hover:bg-blue-50 active:scale-95"
          >
            Створити запит з моєю ціною
          </button>
        </div>
      </div>
    </div>
  );
};
