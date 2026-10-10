import React, { useState } from 'react';
import { Check, ChevronRight, Layers, X } from 'lucide-react';
import {
  choiceFor,
  hasJourneySearchProvider,
  isAllActive,
  isJourneySearchSupported,
  providersForJourneySearch,
  selectAll,
  toggleProvider,
  toggleType,
  transportTypes,
  type TransportSelection,
  type TransportTypeId,
} from '../domain/transportPreferences';
import type { ApiTransportProviders } from '../services/productionApi';
import { TransportVehicleIcon } from './common/TransportVehicleIcon';

interface TransportTypesPanelProps {
  selection: TransportSelection;
  groups?: ApiTransportProviders[] | null;
  onChange: (selection: TransportSelection) => void;
  onOpenMap?: () => void;
  onSearch?: () => void;
}

// Exactly ordered as in the reference screenshot (4 x 3)
const GRID_MODES: Array<{ id: TransportTypeId; label: string }> = [
  // Row 1
  { id: 'bus', label: 'Автобуси' },
  { id: 'marshrutka', label: 'Маршрутки' },
  { id: 'trolleybus', label: 'Тролейбуси' },
  { id: 'tram', label: 'Трамваї' },
  // Row 2
  { id: 'metro', label: 'Метро' },
  { id: 'carpool', label: 'Попутки' },
  { id: 'taxi', label: 'Таксі' },
  { id: 'train', label: 'Поїзди' },
  // Row 3
  { id: 'bike', label: 'Велосипеди' },
  { id: 'scooter', label: 'Самокати' },
  { id: 'carsharing', label: 'Каршеринг' },
  { id: 'transfer', label: 'Трансфери' },
];

export const TransportTypesPanel: React.FC<TransportTypesPanelProps> = ({
  selection,
  groups = null,
  onChange,
}) => {
  const [showProvidersSheet, setShowProvidersSheet] = useState(false);
  const allActive = isAllActive(selection);

  const isConnected = (type: TransportTypeId) => isJourneySearchSupported(type) && hasJourneySearchProvider(type, groups);

  const handleTileClick = (typeId: TransportTypeId) => {
    if (!isConnected(typeId)) return;
    const updated = toggleType(selection, typeId);
    onChange(updated);
  };
  const providerRows = selection.active.flatMap((type) => providersForJourneySearch(type, groups)
    .map((provider) => ({ type, provider })));

  return (
    <section aria-label="Види транспорту" className="mt-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[15px] font-black tracking-tight text-[#0B1730] dark:text-white">
          Види транспорту
        </h2>
        <button type="button" aria-pressed={allActive}
          onClick={() => onChange(allActive ? { ...selection, active: [] } : selectAll(selection))}
          className={`rounded-full border px-3 py-1 text-[11px] font-bold ${allActive ? 'border-[#0066FF] bg-[#0066FF] text-white' : 'border-slate-200 bg-white text-[#0066FF] dark:border-slate-700 dark:bg-slate-900'}`}>
          Усі
        </button>
      </div>

      {/* 4x3 Grid matching reference screenshot */}
      <div className="grid grid-cols-4 gap-2">
        {GRID_MODES.map((mode) => {
          const connected = isConnected(mode.id);
          const isSelected = connected && selection.active.includes(mode.id);
          const disabledReason = !isJourneySearchSupported(mode.id)
            ? 'Для цієї категорії ще немає маршрутизатора.'
            : groups === null ? 'Оберіть місто, щоб перевірити доступність.' : 'Немає доступного розкладу в цій зоні.';

          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={connected && isSelected}
              aria-label={connected ? mode.label : `${mode.label} — ${disabledReason}`}
              title={connected ? undefined : disabledReason}
              disabled={!connected}
              onClick={() => handleTileClick(mode.id)}
              className={`relative flex flex-col items-center justify-between rounded-2xl p-2 pt-2.5 pb-2 text-center transition-all active:scale-95 min-h-[78px] ${
                isSelected
                  ? 'border-2 border-[#0066FF] bg-white shadow-xs dark:border-[#0066FF] dark:bg-[#101E38]'
                  : connected
                  ? 'border border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#101E38]'
                  : 'border border-slate-200/60 bg-slate-50/70 opacity-60 dark:border-slate-800/60 dark:bg-slate-900/40'
              }`}
            >
              {/* Checkmark badge on upper right corner when selected */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#0066FF] text-white shadow-xs">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}

              {/* Vehicle illustration */}
              <div className="grid h-9 w-9 place-items-center">
                <TransportVehicleIcon type={mode.id} className="h-8 w-8 object-contain" />
              </div>

              {/* Mode title */}
              <span
                className={`mt-1 block w-full truncate text-[11px] font-bold ${
                  isSelected
                    ? 'text-[#0066FF] dark:text-blue-400 font-extrabold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section: Провайдери */}
      <div className="mt-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#101E38] p-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-[#0066FF]" />
            <h3 className="text-xs font-black text-[#0B1730] dark:text-white">
              Провайдери
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowProvidersSheet(true)}
            className="flex items-center gap-0.5 text-[11px] font-bold text-[#0066FF] hover:underline"
          >
            <span>Усі доступні</span>
            <ChevronRight size={13} />
          </button>
        </div>
        <p className="mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
          Провайдери, доступні для вибраного міста та категорій
        </p>

        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {groups === null ? <span className="text-xs text-slate-500">Оберіть місце відправлення, щоб перевірити джерела.</span>
            : providerRows.length > 0 ? [...new Map(providerRows.map(({ type, provider }) => [`${type}:${provider.id}`, { type, provider }])).values()].map(({ type, provider }) => (
              <span key={`${type}:${provider.id}`} className="shrink-0 rounded-xl border border-blue-100 bg-blue-50/70 px-2.5 py-1.5 text-xs font-bold text-[#0066FF] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                {provider.name}
              </span>
            )) : <span className="text-xs text-slate-500">Для вибраних категорій у цій зоні немає підключених провайдерів.</span>}
        </div>
      </div>

      {/* Providers Sheet Modal if clicked */}
      {showProvidersSheet && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowProvidersSheet(false)}
        >
          <div
            className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-[#0B1730] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-[#0B1730] dark:text-white">
                Підключені провайдери
              </h3>
              <button
                type="button"
                onClick={() => setShowProvidersSheet(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-4 space-y-2.5">
              {groups === null ? <p className="text-sm text-slate-500">Джерела з'являться після вибору міста.</p>
                : transportTypes.filter((type) => selection.active.includes(type.id) && isConnected(type.id)).map((type) => {
                  const providers = providersForJourneySearch(type.id, groups);
                  const choice = choiceFor(selection, type.id);
                  return <div key={type.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/60">
                    <b className="mb-2 block text-xs font-bold text-[#0B1730] dark:text-white">{type.label}</b>
                    {providers.length === 0 ? <p className="text-[10px] text-slate-500">Для цієї категорії немає окремого зовнішнього провайдера.</p>
                      : <div className="flex flex-wrap gap-2">
                        <button type="button" aria-pressed={choice.all} onClick={() => onChange(toggleProvider(selection, type.id, 'all'))}
                          className="rounded-full border border-blue-200 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:border-blue-900 dark:text-blue-300">Усі провайдери</button>
                        {providers.map((provider) => <button key={provider.id} type="button" aria-pressed={!choice.all && choice.ids.includes(provider.id)}
                          title={provider.cities.join(', ') || undefined} onClick={() => onChange(toggleProvider(selection, type.id, provider.id))}
                          className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">{provider.name}</button>)}
                      </div>}
                  </div>;
                })}
            </div>
            <button
              type="button"
              onClick={() => setShowProvidersSheet(false)}
              className="w-full rounded-2xl bg-[#0066FF] py-3 text-xs font-black text-white"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
