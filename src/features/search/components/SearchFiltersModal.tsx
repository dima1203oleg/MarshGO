import React from 'react';
import { CarFront, Grid, X } from 'lucide-react';
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
                До {filters.maxPrice.toLocaleString('uk-UA')} ₴ за місце
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
                До {filters.maxDurationHours} год
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

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">Фільтри працюють лише з полями, які є в оголошенні водія.</p>
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
