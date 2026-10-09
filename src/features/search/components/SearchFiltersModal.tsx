import React from 'react';
import {
  Bike,
  Bus,
  CarFront,
  CarTaxiFront,
  Grid,
  Plane,
  Repeat,
  Ship,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { SearchFiltersState, SearchTransportMode } from '../model/types';

interface SearchFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  onChangeFilters: (filters: SearchFiltersState) => void;
  totalResultsCount: number;
}

const ALL_MODES_GRID: Array<{
  id: SearchTransportMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}> = [
  { id: 'all', label: 'Усі', icon: Grid },
  { id: 'carpool', label: 'Попутки', icon: CarFront },
  { id: 'taxi', label: 'Таксі', icon: CarTaxiFront },
  { id: 'carsharing', label: 'Каршеринг', icon: Users },
  { id: 'transfer', label: 'Трансфер', icon: Repeat },
  { id: 'bus', label: 'Автобуси', icon: Bus },
  { id: 'minibus', label: 'Маршрутки', icon: Users },
  { id: 'train', label: 'Поїзди', icon: TrainFront },
  { id: 'suburban_train', label: 'Електрички', icon: TrainFrontTunnel },
  { id: 'metro', label: 'Метро', icon: TrainFront },
  { id: 'tram', label: 'Трамвай', icon: TramFront },
  { id: 'trolleybus', label: 'Тролейбуси', icon: Bus },
  { id: 'bike', label: 'Велосипеди', icon: Bike },
  { id: 'scooter', label: 'Самокати', icon: Zap },
  { id: 'water', label: 'Водний', icon: Ship },
  { id: 'air', label: 'Літаки', icon: Plane },
];

export const SearchFiltersModal: React.FC<SearchFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  totalResultsCount,
}) => {
  if (!isOpen) return null;

  const handleToggleMode = (mode: SearchTransportMode) => {
    const next = new Set(filters.modes);
    if (mode === 'all') {
      next.clear();
      next.add('all');
    } else {
      next.delete('all');
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      if (next.size === 0) next.add('all');
    }
    onChangeFilters({ ...filters, modes: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90svh] w-full max-w-md mx-auto flex-col rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#0B1730] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <h2 className="text-[17px] font-black text-[#081B35] dark:text-white">
            Фільтри маршруту
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Section 1: Transport Types */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[13px] font-black text-[#081B35] dark:text-white">
                Тип транспорту
              </span>
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, modes: new Set(['all']) })}
                className="text-xs font-bold text-[#0866F5] dark:text-blue-400"
              >
                Скинути
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {ALL_MODES_GRID.map((item) => {
                const Icon = item.icon;
                const active =
                  item.id === 'all'
                    ? filters.modes.has('all') || filters.modes.size === 0
                    : filters.modes.has(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleMode(item.id)}
                    className={`flex flex-col items-center justify-center rounded-[18px] py-2 px-1 transition active:scale-95 ${
                      active
                        ? 'bg-[#EAF3FF] dark:bg-blue-950/80 border-2 border-[#0866F5] text-[#0866F5] dark:text-blue-400 font-extrabold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold'
                    }`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                    <span className="text-[9.5px] leading-tight text-center mt-1">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-black text-[#081B35] dark:text-white">
                Ціна
              </span>
              <span className="text-xs font-extrabold text-[#0866F5] dark:text-blue-400">
                Від 0 ₴ до {filters.maxPrice.toLocaleString('uk-UA')} ₴ ⚙️
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={filters.maxPrice}
              onChange={(e) =>
                onChangeFilters({ ...filters, maxPrice: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0866F5]"
            />
          </div>

          {/* Section 3: Duration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-black text-[#081B35] dark:text-white">
                Час у дорозі
              </span>
              <span className="text-xs font-extrabold text-[#0866F5] dark:text-blue-400">
                Будь-який
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={filters.maxDurationHours}
              onChange={(e) =>
                onChangeFilters({ ...filters, maxDurationHours: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0866F5]"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
              <span>15 хв</span>
              <span>1 год</span>
              <span>3 год</span>
              <span>6 год</span>
              <span>12++</span>
            </div>
          </div>

          {/* Section 4: Transfers */}
          <div>
            <span className="block text-[13px] font-black text-[#081B35] dark:text-white mb-2">
              Пересадки
            </span>
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1">
              {(
                [
                  ['any', 'Будь-яка'],
                  ['direct', 'Без пересадок'],
                  ['one', 'До 1'],
                  ['two_plus', 'До 2+'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, maxTransfers: val })}
                  className={`rounded-xl py-2 text-[10.5px] font-extrabold transition ${
                    filters.maxTransfers === val
                      ? 'bg-white dark:bg-[#0B1730] text-[#0866F5] dark:text-blue-400 shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Additional Parameters */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="block text-[13px] font-black text-[#081B35] dark:text-white">
                Додаткові параметри
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    minRating: 4.0,
                    onlyVerified: false,
                    airConditioning: false,
                    wifi: false,
                  })
                }
                className="text-xs font-bold text-[#0866F5] dark:text-blue-400"
              >
                Скинути
              </button>
            </div>

            {/* Rating row */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-amber-500">⭐</span>
                <span>Рейтинг перевізника</span>
              </div>
              <span className="text-xs font-extrabold text-[#0866F5] dark:text-blue-400">
                Від 4.0++ ⌵
              </span>
            </div>

            {/* Verified Only Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-[#0866F5]">🛡️</span>
                <span>Тільки перевірені</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeFilters({ ...filters, onlyVerified: !filters.onlyVerified })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  filters.onlyVerified ? 'bg-[#0866F5]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    filters.onlyVerified ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* A/C Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>❄️</span>
                <span>Кондиціонер</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    airConditioning: !filters.airConditioning,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  filters.airConditioning ? 'bg-[#0866F5]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    filters.airConditioning ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Wi-Fi Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-[#0866F5]">📶</span>
                <span>Wi-Fi</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeFilters({ ...filters, wifi: !filters.wifi })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  filters.wifi ? 'bg-[#0866F5]' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    filters.wifi ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Fixed Button */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-[#0B1730]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-[18px] bg-[#0866F5] py-3.5 text-center text-sm font-black text-white shadow-lg shadow-blue-500/25 transition active:scale-[0.98]"
          >
            Показати {totalResultsCount} {totalResultsCount === 1 ? 'варіант' : 'варіанти'}
          </button>
        </div>
      </div>
    </div>
  );
};
