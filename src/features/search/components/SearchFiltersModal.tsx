import React from 'react';
import { X } from 'lucide-react';
import type { SearchFiltersState, SearchTransportMode } from '../model/types';
import { CANONICAL_TRANSPORT_MODES } from '../../../domain/transportCatalog';

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
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1769ED]">MARSHGO</p><h2 className="mt-0.5 text-[17px] font-black text-[#142642] dark:text-white">Фільтри маршрутів</h2></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onChangeFilters({ modes: new Set(['all']), maxPrice: 5000, maxDurationHours: 24, maxTransfers: 'any', minRating: 0, onlyVerified: false, airConditioning: false, wifi: false })} className="rounded-full px-2 py-2 text-xs font-bold text-[#1769ED] dark:text-blue-300">Скинути</button>
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
          <section aria-label="Види транспорту">
            <h3 className="mb-2 text-[13px] font-black text-[#142642] dark:text-white">Види транспорту</h3>
            <div className="flex flex-wrap gap-2">
              {CANONICAL_TRANSPORT_MODES.map((mode) => {
                const modeId = mode.id as SearchTransportMode;
                const selected = filters.modes.has('all') || filters.modes.has(modeId);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      const next = new Set(filters.modes);
                      if (next.has('all')) {
                        next.clear();
                        next.add(modeId);
                      } else if (next.has(modeId)) {
                        next.delete(modeId);
                        if (next.size === 0) next.add('all');
                      } else {
                        next.add(modeId);
                      }
                      onChangeFilters({ ...filters, modes: next });
                    }}
                    className={`min-h-9 rounded-full border px-3 text-xs font-bold transition ${selected
                      ? 'border-[#1769ED] bg-blue-50 text-[#1769ED] dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#101E38] dark:text-slate-300'}`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Кількість пересадок">
            <h3 className="mb-2 text-[13px] font-black text-[#142642] dark:text-white">Пересадки</h3>
            <div className="grid grid-cols-4 gap-2">
              {([
                ['any', 'Будь-які'], ['direct', 'Без'], ['one', 'До 1'], ['two_plus', '2+'],
              ] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={filters.maxTransfers === value}
                  onClick={() => onChangeFilters({ ...filters, maxTransfers: value })}
                  className={`min-h-9 rounded-full border px-2 text-xs font-bold ${filters.maxTransfers === value
                    ? 'border-[#1769ED] bg-blue-50 text-[#1769ED] dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#101E38] dark:text-slate-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Fare limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-black text-[#142642] dark:text-white">
                Ціна
              </span>
              <span className="text-xs font-extrabold text-[#1769ED] dark:text-blue-400">
                {filters.maxPrice >= 5000 ? 'Будь-яка ціна' : `До ${filters.maxPrice.toLocaleString('uk-UA')} ₴ за маршрут`}
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
                {filters.maxDurationHours >= 24 ? 'Будь-яка тривалість' : `До ${filters.maxDurationHours} год`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
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
              <span>24 год</span>
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between"><span className="text-[13px] font-black text-[#142642] dark:text-white">Рейтинг водія</span><button type="button" onClick={() => onChangeFilters({ ...filters, minRating: 0 })} className="text-xs font-bold text-[#1769ED]">Скинути</button></div>
            <label className="block text-xs font-bold text-[#142642] dark:text-white">{filters.minRating ? `${filters.minRating.toFixed(1)}+ зірок` : 'Будь-який рейтинг'}<input aria-label="Мінімальний рейтинг водія" type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={(event) => onChangeFilters({ ...filters, minRating: Number(event.target.value) })} className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#1769ED] dark:bg-slate-700"/><span className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400"><span>Без оцінки</span><span>5 зірок</span></span></label>
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">Маршрути з непідтвердженою ціною або часом залишаються у видачі, якщо інші фільтри їм відповідають.</p>
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
