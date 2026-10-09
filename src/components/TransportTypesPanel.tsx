import { useState } from 'react';
import {
  ArrowRight,
  Bike,
  Bus,
  CarFront,
  CarTaxiFront,
  Check,
  ChevronDown,
  ChevronRight,
  Footprints,
  KeyRound,
  MapPin,
  Plane,
  Repeat,
  Search,
  Ship,
  Ticket,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  choiceFor,
  isAllActive,
  selectAll,
  toggleProvider,
  toggleType,
  transportTypes,
  type TransportSelection,
  type TransportTypeId,
} from '../domain/transportPreferences';
import { transportGroups, type TransportGroup } from '../domain/transportCatalog';
import type { ApiTransportProviders } from '../services/productionApi';

const tileIcons: Record<TransportTypeId, LucideIcon> = {
  carpool: CarFront,
  taxi: CarTaxiFront,
  carsharing: Users,
  car_rental: KeyRound,
  transfer: Repeat,
  bus: Bus,
  marshrutka: Users,
  trolleybus: Bus,
  tram: TramFront,
  metro: TrainFront,
  city_train: TrainFrontTunnel,
  funicular: TrainFront,
  train: TrainFront,
  suburban_train: TrainFrontTunnel,
  intercity_bus: Ticket,
  bike: Bike,
  scooter: Zap,
  moped: Bike,
  plane: Plane,
  ferry: Ship,
  walk: Footprints,
};

const groupDescriptions: Record<TransportGroup, string> = {
  'Спільні поїздки': 'Діліться поїздками та подорожуйте разом',
  'Міський транспорт': 'Швидко та зручно містом',
  'Міжміський транспорт': 'Комфортні поїздки між містами',
  'Легкий транспорт': 'Для коротких поїздок містом',
  'Інше': 'Альтернативні способи пересування',
};

const tileColors: Record<TransportTypeId, { bg: string; text: string }> = {
  carpool: { bg: 'bg-[#EAF2FF] dark:bg-blue-950/60', text: 'text-[#175CD3] dark:text-blue-400' },
  taxi: { bg: 'bg-[#FEF3C7] dark:bg-amber-950/60', text: 'text-[#D97706] dark:text-amber-400' },
  carsharing: { bg: 'bg-[#F3E8FF] dark:bg-purple-950/60', text: 'text-[#9333EA] dark:text-purple-300' },
  car_rental: { bg: 'bg-[#ECFDF5] dark:bg-emerald-950/60', text: 'text-[#059669] dark:text-emerald-400' },
  transfer: { bg: 'bg-[#E0F2FE] dark:bg-sky-950/60', text: 'text-[#0284C7] dark:text-sky-300' },
  bus: { bg: 'bg-[#E0F2FE] dark:bg-blue-950/60', text: 'text-[#2563EB] dark:text-blue-400' },
  marshrutka: { bg: 'bg-[#DCFCE7] dark:bg-emerald-950/60', text: 'text-[#16A34A] dark:text-emerald-400' },
  trolleybus: { bg: 'bg-[#FEF3C7] dark:bg-amber-950/60', text: 'text-[#CA8A04] dark:text-amber-400' },
  tram: { bg: 'bg-[#FEE2E2] dark:bg-rose-950/60', text: 'text-[#DC2626] dark:text-rose-400' },
  metro: { bg: 'bg-[#F3E8FF] dark:bg-purple-950/60', text: 'text-[#7C3AED] dark:text-purple-300' },
  city_train: { bg: 'bg-[#E2E8F0] dark:bg-slate-800', text: 'text-[#475569] dark:text-slate-300' },
  funicular: { bg: 'bg-[#E0F2FE] dark:bg-sky-950/60', text: 'text-[#0284C7] dark:text-sky-300' },
  train: { bg: 'bg-[#DBEAFE] dark:bg-blue-950/60', text: 'text-[#1D4ED8] dark:text-blue-400' },
  suburban_train: { bg: 'bg-[#FEF3C7] dark:bg-amber-950/60', text: 'text-[#B45309] dark:text-amber-400' },
  intercity_bus: { bg: 'bg-[#E0E7FF] dark:bg-indigo-950/60', text: 'text-[#4F46E5] dark:text-indigo-400' },
  bike: { bg: 'bg-[#DCFCE7] dark:bg-emerald-950/60', text: 'text-[#16A34A] dark:text-emerald-400' },
  scooter: { bg: 'bg-[#DCFCE7] dark:bg-emerald-950/60', text: 'text-[#15803D] dark:text-emerald-400' },
  moped: { bg: 'bg-[#E0F2FE] dark:bg-sky-950/60', text: 'text-[#0284C7] dark:text-sky-300' },
  plane: { bg: 'bg-[#E0F2FE] dark:bg-sky-950/60', text: 'text-[#0284C7] dark:text-sky-300' },
  ferry: { bg: 'bg-[#E0F2FE] dark:bg-sky-950/60', text: 'text-[#0284C7] dark:text-sky-300' },
  walk: { bg: 'bg-[#FFE4E6] dark:bg-rose-950/60', text: 'text-[#E11D48] dark:text-rose-400' },
};

export function TransportTypesPanel({
  selection,
  groups,
  onChange,
  onOpenMap,
  onSearch,
}: {
  selection: TransportSelection;
  groups: ApiTransportProviders[] | null;
  onChange: (selection: TransportSelection) => void;
  onOpenMap?: () => void;
  onSearch?: () => void;
}) {
  const [showProvidersSheet, setShowProvidersSheet] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    bus: true,
    train: true,
    suburban_train: true,
    intercity_bus: true,
    scooter: true,
    carpool: true,
  });

  const allActive = isAllActive(selection);

  const isConnected = (type: TransportTypeId) =>
    type === 'carpool' ||
    type === 'walk' ||
    groups === null ||
    (groups.find((group) => group.transportType === type)?.providers.some((p) => p.available) ?? false);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <section aria-label="Види транспорту" className="mt-4">
      {/* Header matching Mockup 4 */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-black tracking-tight text-[#0B1730] dark:text-white">
            Види транспорту
          </h2>
          <p className="text-xs text-[#65748B] dark:text-slate-400">
            {transportTypes.length} видів у одному застосунку
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProvidersSheet(true)}
            className="rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-[#175CD3] dark:text-blue-400 shadow-2xs hover:bg-slate-50 transition"
          >
            Провайдери
          </button>
          <button
            type="button"
            aria-pressed={allActive}
            onClick={() => onChange(allActive ? { ...selection, active: [] } : selectAll(selection))}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              allActive
                ? 'bg-[#175CD3] text-white shadow-2xs'
                : 'border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {allActive ? '✓ Усі' : 'Усі'}
          </button>
        </div>
      </div>

      {/* "Карта транспорту" Banner matching Mockup 4 */}
      {onOpenMap && (
        <div className="relative mb-4 mt-2 overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-950/40 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/60 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 p-4 shadow-2xs">
          <div className="max-w-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#175CD3] dark:text-blue-400">
              <MapPin size={15} />
              <span>Карта транспорту</span>
            </div>
            <p className="mt-1 text-xs text-[#65748B] dark:text-slate-400 leading-snug">
              Метро, автобуси, трамваї, тролейбуси, зупинки, велосипеди та самокати
            </p>
            <button
              type="button"
              onClick={onOpenMap}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#175CD3] dark:text-blue-400 hover:underline"
            >
              <span>Відкрити карту</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Grouped 21-Transport Catalog matching Mockup 4 */}
      <div className="space-y-4">
        {transportGroups.map((group) => {
          const items = transportTypes.filter((t) => t.group === group);
          return (
            <div key={group}>
              <div className="mb-1.5 px-0.5">
                <h3 className="text-[13px] font-black text-[#0B1730] dark:text-white leading-tight">
                  {group === 'Легкий транспорт' ? 'Мікромобільність' : group}
                </h3>
                <p className="text-[11px] text-[#65748B] dark:text-slate-400">
                  {groupDescriptions[group]}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {items.map((type) => {
                  const Icon = tileIcons[type.id];
                  const selected = selection.active.includes(type.id);
                  const connected = isConnected(type.id);
                  const colors = tileColors[type.id] ?? {
                    bg: 'bg-slate-100 dark:bg-slate-800',
                    text: 'text-slate-600 dark:text-slate-300',
                  };

                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={!connected}
                      onClick={() => onChange(toggleType(selection, type.id))}
                      className={`group flex items-center justify-between rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
                        !connected
                          ? 'opacity-40 cursor-not-allowed border-slate-200/50 bg-slate-50 dark:bg-slate-900'
                          : selected
                          ? 'border-[#175CD3]/60 bg-blue-50/40 dark:border-blue-700/60 dark:bg-blue-950/30 shadow-2xs'
                          : 'border-[#E3EAF2] dark:border-slate-800 bg-white dark:bg-[#101E38] shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${colors.bg} ${colors.text}`}>
                          <Icon size={16} className="stroke-[2.2]" />
                        </span>
                        <span className="truncate text-xs font-extrabold text-[#0B1730] dark:text-white">
                          {type.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={15}
                        className={`shrink-0 ml-1 transition ${
                          selected ? 'text-[#175CD3] dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL BOTTOM SHEET: "Провайдери" (Exact Mockup #3 Alignment) */}
      {showProvidersSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-[2rem] sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1730] shadow-2xl overflow-hidden">
            {/* Grab handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <h2 className="text-[20px] font-black tracking-tight text-[#0B1730] dark:text-white">
                  Провайдери
                </h2>
                <p className="mt-0.5 text-xs text-[#65748B] dark:text-slate-400">
                  Оберіть перевізників, якими хочете користуватися
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProvidersSheet(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition"
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable Provider Categories matching Mockup 3 */}
            <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
              {([
                {
                  id: 'transit',
                  typeId: 'bus' as TransportTypeId,
                  title: 'Громадський транспорт',
                  desc: 'Метро, автобуси, трамваї та інше',
                  icon: Bus,
                  color: 'bg-blue-100 text-blue-700',
                  providers: [
                    { id: 'lvivavtodor', name: 'Львівавтодор', icon: Bus },
                    { id: 'kpt', name: 'Київпастранс', icon: TramFront },
                  ],
                },
                {
                  id: 'train',
                  typeId: 'train' as TransportTypeId,
                  title: 'Потяг',
                  desc: 'Далекі та регіональні маршрути',
                  icon: TrainFront,
                  color: 'bg-rose-100 text-rose-700',
                  providers: [{ id: 'uz', name: 'Укрзалізниця', icon: TrainFront }],
                },
                {
                  id: 'suburban_train',
                  typeId: 'suburban_train' as TransportTypeId,
                  title: 'Електричка',
                  desc: 'Міські та приміські маршрути',
                  icon: TrainFrontTunnel,
                  color: 'bg-amber-100 text-amber-700',
                  providers: [{ id: 'uz_sub', name: 'Укрзалізниця', icon: TrainFrontTunnel }],
                },
                {
                  id: 'intercity_bus',
                  typeId: 'intercity_bus' as TransportTypeId,
                  title: 'Міжміський автобус',
                  desc: 'Автобуси по Україні та за кордон',
                  icon: Bus,
                  color: 'bg-purple-100 text-purple-700',
                  providers: [
                    { id: 'vd_express', name: 'VD-Express', icon: Bus },
                    { id: 'inbus', name: 'inbus.ua', icon: Ticket },
                  ],
                },
                {
                  id: 'scooter',
                  typeId: 'scooter' as TransportTypeId,
                  title: 'Самокат',
                  desc: 'Оренда електросамокатів',
                  icon: Zap,
                  color: 'bg-emerald-100 text-emerald-700',
                  providers: [{ id: 'zelectra', name: 'Zelectra', icon: Zap }],
                },
                {
                  id: 'carpool',
                  typeId: 'carpool' as TransportTypeId,
                  title: 'Попутка',
                  desc: 'Подорожуйте разом вигідніше',
                  icon: CarFront,
                  color: 'bg-rose-100 text-rose-700',
                  providers: [{ id: 'marshgo_community', name: 'MARSHGO Community', icon: Users }],
                },
              ] as const).map((cat) => {
                const choice = choiceFor(selection, cat.typeId);
                const isExpanded = expandedCategories[cat.id] ?? true;

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-[#E3EAF2] dark:border-slate-800 bg-[#F7F9FC]/70 dark:bg-slate-900/60 p-3.5"
                  >
                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(cat.id)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${cat.color}`}>
                          <cat.icon size={17} className="stroke-[2.2]" />
                        </span>
                        <div>
                          <b className="block text-[13.5px] font-extrabold text-[#0B1730] dark:text-white leading-tight">
                            {cat.title}
                          </b>
                          <small className="block text-[10.5px] text-[#65748B] dark:text-slate-400">
                            {cat.desc}
                          </small>
                        </div>
                      </div>
                      <ChevronDown
                        size={17}
                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Chips Row */}
                    {isExpanded && (
                      <div className="mt-3 flex flex-wrap gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        {/* "Усі провайдери" chip */}
                        <button
                          type="button"
                          onClick={() => onChange(toggleProvider(selection, cat.typeId, 'all'))}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            choice.all
                              ? 'border border-[#175CD3] bg-[#EAF2FF] text-[#175CD3] dark:bg-blue-950/60 dark:text-blue-300'
                              : 'border border-[#E3EAF2] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {choice.all && <Check size={13} className="stroke-[2.8]" />}
                          <span>Усі провайдери</span>
                        </button>

                        {/* Specific provider chips */}
                        {cat.providers.map((p) => {
                          const checked = !choice.all && choice.ids.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => onChange(toggleProvider(selection, cat.typeId, p.id))}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                checked
                                  ? 'border border-[#175CD3] bg-[#175CD3] text-white shadow-2xs'
                                  : 'border border-[#E3EAF2] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                              }`}
                            >
                              <p.icon size={13} />
                              <span>{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Button matching Mockup 3 */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B1730]">
              <button
                type="button"
                onClick={() => {
                  setShowProvidersSheet(false);
                  onSearch?.();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#175CD3] hover:bg-[#1550b8] active:bg-[#114299] py-3.5 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.99]"
              >
                <Search size={17} className="stroke-[2.5]" />
                <span>Знайти маршрут</span>
                <ArrowRight size={17} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
