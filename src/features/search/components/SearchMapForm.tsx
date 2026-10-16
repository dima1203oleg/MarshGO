import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import type { ApiTransportProviders } from '../../../services/productionApi';
import type { TransportSelection } from '../../../domain/transportPreferences';
import type { RoutePlace } from '../model/types';
import { DateTimePassengers } from './DateTimePassengers';
import { RouteInputs } from './RouteInputs';
import { TransportTypesPanel } from '../../../components/TransportTypesPanel';

interface SearchMapFormProps {
  origin: RoutePlace;
  destination: RoutePlace;
  onOriginChange: (place: RoutePlace) => void;
  onDestinationChange: (place: RoutePlace) => void;
  onOpenMapPicker?: (field: 'origin' | 'destination') => void;
  onBackToHome?: () => void;
  dateStr: string;
  timeStr: string;
  timeMode: 'now' | 'depart_at' | 'arrive_by';
  passengers: number;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTimeModeChange: (mode: 'now' | 'depart_at' | 'arrive_by') => void;
  onPassengersChange: (count: number) => void;
  selection: TransportSelection;
  groups: ApiTransportProviders[] | null;
  onSelectionChange: (selection: TransportSelection) => void;
  onSearch: () => void;
  isSearching: boolean;
  isResolvingPlaces: boolean;
  error: string | null;
}

export const SearchMapForm: React.FC<SearchMapFormProps> = ({
  origin, destination, onOriginChange, onDestinationChange, onOpenMapPicker, onBackToHome,
  dateStr, timeStr, timeMode, passengers, onDateChange, onTimeChange, onTimeModeChange, onPassengersChange,
  selection, groups, onSelectionChange, onSearch, isSearching, isResolvingPlaces, error,
}) => (
  <main className="search-route-form-screen mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden bg-[#F4F8FD] text-[#0B1730] dark:bg-[#070E1B] dark:text-white">
    <header className="search-route-form-header z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-4 pb-2.5 pt-[max(3.5rem,calc(env(safe-area-inset-top)+.75rem))] backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1730]/95">
      <button type="button" onClick={onBackToHome} aria-label="Назад на головну" className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition active:scale-95 dark:text-slate-200">
        <ArrowLeft size={20}/>
      </button>
      <h1 className="text-base font-extrabold">Пошук маршруту</h1>
      <span aria-hidden="true" className="h-10 w-10" />
    </header>

    <div className="search-route-form-content min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-3">
      <section aria-label="Маршрут і час поїздки" className="overflow-hidden rounded-[22px] border border-[#E3EBF4] bg-white shadow-[0_2px_12px_rgba(26,73,133,.06)] dark:border-slate-800 dark:bg-[#101E38]">
        <RouteInputs origin={origin} destination={destination} onOriginChange={onOriginChange} onDestinationChange={onDestinationChange} onOpenMapPicker={onOpenMapPicker}/>
        <DateTimePassengers dateStr={dateStr} timeStr={timeStr} timeMode={timeMode} passengers={passengers} onDateChange={onDateChange} onTimeChange={onTimeChange} onTimeModeChange={onTimeModeChange} onPassengersChange={onPassengersChange}/>
      </section>

      <section className="mt-4" aria-label="Види транспорту для пошуку">
        <TransportTypesPanel selection={selection} groups={groups} onChange={onSelectionChange} showProviders={false}/>
      </section>

      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    </div>

    <div className="search-route-form-footer z-20 shrink-0 border-t border-slate-100 bg-white/95 px-4 pb-3 pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1730]/95">
      <button type="button" onClick={onSearch} disabled={isSearching || isResolvingPlaces} className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0879F9] px-4 text-sm font-black text-white shadow-[0_5px_16px_rgba(0,102,255,.25)] transition active:scale-[.99] disabled:opacity-50">
        <Search size={18}/>{isSearching ? 'Шукаємо маршрути…' : isResolvingPlaces ? 'Підбираємо точки…' : 'Знайти маршрут'}<span aria-hidden="true">→</span>
      </button>
    </div>
  </main>
);
