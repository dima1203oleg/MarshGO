import React from 'react';
import { CarFront, X } from 'lucide-react';
import type { SearchFiltersState } from '../model/types';

interface SearchFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFiltersState;
  onChangeFilters: (filters: SearchFiltersState) => void;
  totalResultsCount: number;
}

export const SearchFiltersModal: React.FC<SearchFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onChangeFilters,
  totalResultsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90svh] w-full max-w-md mx-auto flex-col rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#0B1730] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1769ED]">MARSHGO Community</p><h2 className="mt-0.5 text-[17px] font-black text-[#142642] dark:text-white">Фільтри поїздок</h2></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onChangeFilters({ modes: new Set(['all']), maxPrice: 2000, maxDurationHours: 12, maxTransfers: 'any', minRating: 0, onlyVerified: false, airConditioning: false, wifi: false })} className="rounded-full px-2 py-2 text-xs font-bold text-[#1769ED] dark:text-blue-300">Скинути</button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити фільтри"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-300"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 dark:border-blue-900/50 dark:bg-blue-950/40">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#1769ED] shadow-sm dark:bg-[#101E38] dark:text-blue-300"><CarFront size={20}/></span>
            <span><b className="block text-sm text-[#142642] dark:text-white">Попутки від водіїв MARSHGO</b><span className="mt-0.5 block text-xs text-[#63738C] dark:text-slate-400">Фільтри враховують дані з оголошень</span></span>
          </div>

          {/* Fare limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-black text-[#142642] dark:text-white">
                Ціна
              </span>
              <span className="text-xs font-extrabold text-[#1769ED] dark:text-blue-400">
                До {filters.maxPrice.toLocaleString('uk-UA')} ₴ / місце
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
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1769ED]"
            />
          </div>

          {/* Duration limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-black text-[#142642] dark:text-white">
                Час у дорозі
              </span>
              <span className="text-xs font-extrabold text-[#1769ED] dark:text-blue-400">
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
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1769ED]"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
              <span>1 год</span>
              <span>4 год</span>
              <span>8 год</span>
              <span>12+ год</span>
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between"><span className="text-[13px] font-black text-[#142642] dark:text-white">Рейтинг водія</span><button type="button" onClick={() => onChangeFilters({ ...filters, minRating: 0 })} className="text-xs font-bold text-[#1769ED]">Скинути</button></div>
            <label className="block text-xs font-bold text-[#142642] dark:text-white">{filters.minRating ? `${filters.minRating.toFixed(1)}+ зірок` : 'Будь-який рейтинг'}<input aria-label="Мінімальний рейтинг водія" type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={(event) => onChangeFilters({ ...filters, minRating: Number(event.target.value) })} className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#1769ED] dark:bg-slate-700"/><span className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400"><span>Без оцінки</span><span>5 зірок</span></span></label>
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">Оголошення без зазначеної тривалості залишаються у видачі, якщо інші фільтри їм відповідають.</p>
        </div>

        {/* Footer Fixed Button */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-[#0B1730]">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-[18px] bg-[#1769ED] py-3.5 text-center text-sm font-black text-white shadow-lg shadow-blue-500/25 transition active:scale-[0.98]"
          >
            Показати {totalResultsCount} {totalResultsCount === 1 ? 'варіант' : 'варіанти'}
          </button>
        </div>
      </div>
    </div>
  );
};
