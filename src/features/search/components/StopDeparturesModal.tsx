import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Wifi,
  Accessibility,
  Bus,
  TramFront,
  Navigation,
  X,
  MapPin,
  Clock,
  Info,
} from 'lucide-react';

export interface StopDepartureItem {
  id: string;
  routeNumber: string;
  type: 'bus' | 'tram' | 'trolleybus' | 'minibus';
  headsign: string;
  etaMinutes: number; // 0 means 'Зараз'
  isRealtime: boolean;
  statusBadge: 'GPS' | 'Прогноз' | 'Розклад';
  isLowFloor: boolean;
  badgeBg: string;
}

const DEFAULT_DEPARTURES: StopDepartureItem[] = [
  {
    id: 'dep-48',
    routeNumber: '48',
    type: 'bus',
    headsign: 'Площа Різні',
    etaMinutes: 0,
    isRealtime: true,
    statusBadge: 'GPS',
    isLowFloor: true,
    badgeBg: 'bg-[#0066FF]',
  },
  {
    id: 'dep-2',
    routeNumber: '2',
    type: 'tram',
    headsign: 'вул. Коновальця',
    etaMinutes: 2,
    isRealtime: true,
    statusBadge: 'Прогноз',
    isLowFloor: true,
    badgeBg: 'bg-[#EF4444]',
  },
  {
    id: 'dep-24',
    routeNumber: '24',
    type: 'trolleybus',
    headsign: 'вул. Сихівська',
    etaMinutes: 7,
    isRealtime: true,
    statusBadge: 'GPS',
    isLowFloor: true,
    badgeBg: 'bg-[#0D9488]',
  },
  {
    id: 'dep-112',
    routeNumber: '112',
    type: 'minibus',
    headsign: 'АС-2',
    etaMinutes: 12,
    isRealtime: false,
    statusBadge: 'Розклад',
    isLowFloor: true,
    badgeBg: 'bg-[#8B5CF6]',
  },
  {
    id: 'dep-1',
    routeNumber: '1',
    type: 'tram',
    headsign: 'Залізничний вокзал',
    etaMinutes: 14,
    isRealtime: false,
    statusBadge: 'Прогноз',
    isLowFloor: false,
    badgeBg: 'bg-[#EF4444]',
  },
  {
    id: 'dep-52',
    routeNumber: '52',
    type: 'bus',
    headsign: 'вул. Наукова',
    etaMinutes: 18,
    isRealtime: false,
    statusBadge: 'Розклад',
    isLowFloor: false,
    badgeBg: 'bg-[#0066FF]',
  },
];

interface StopDeparturesModalProps {
  isOpen: boolean;
  stopName: string;
  directionLabel?: string;
  onClose: () => void;
}

export const StopDeparturesModal: React.FC<StopDeparturesModalProps> = ({
  isOpen,
  stopName,
  directionLabel = 'у напрямку центру',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'departures' | 'about'>('departures');
  const [selectedType, setSelectedType] = useState<'all' | 'bus' | 'tram' | 'trolleybus'>('all');
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen) return null;

  const filteredDepartures = DEFAULT_DEPARTURES.filter((d) => {
    if (selectedType === 'all') return true;
    if (selectedType === 'bus') return d.type === 'bus' || d.type === 'minibus';
    if (selectedType === 'tram') return d.type === 'tram';
    if (selectedType === 'trolleybus') return d.type === 'trolleybus';
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Розклад зупинки ${stopName}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="flex h-[92svh] sm:h-auto sm:max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] sm:rounded-3xl bg-white dark:bg-[#0B1730] text-[#0B1730] dark:text-white shadow-2xl border-t sm:border border-slate-200/80 dark:border-slate-800">
        {/* Grab Handle */}
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        {/* Top Header matching Reference Screen 4 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 px-3 text-left">
            <div className="flex items-center gap-1.5">
              <Bus size={18} className="text-slate-700 dark:text-slate-300 shrink-0" />
              <h2 className="text-base font-extrabold text-[#0B1730] dark:text-white leading-tight truncate">
                {stopName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Зупинка • {directionLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            aria-label="В обране"
            className={`grid h-10 w-10 place-items-center rounded-full transition active:scale-95 ${
              isFavorite
                ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Segmented Control: Відправлення / Про зупинку */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('departures')}
              className={`flex-1 rounded-xl py-2 text-xs font-black transition ${
                activeTab === 'departures'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Відправлення
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`flex-1 rounded-xl py-2 text-xs font-black transition ${
                activeTab === 'about'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Про зупинку
            </button>
          </div>
        </div>

        {activeTab === 'departures' ? (
          <>
            {/* Filter Chips: Усі / Автобуси / Трамваї / Тролейбуси */}
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                  selectedType === 'all'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Усі
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('bus')}
                className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                  selectedType === 'bus'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bus size={14} />
                <span>Автобуси</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('tram')}
                className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                  selectedType === 'tram'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <TramFront size={14} />
                <span>Трамваї</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('trolleybus')}
                className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                  selectedType === 'trolleybus'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Bus size={14} />
                <span>Тролейбуси</span>
              </button>
            </div>

            {/* Departures List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredDepartures.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3.5">
                  {/* Left: Badge + Destination */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-8 min-w-[36px] px-2 place-items-center rounded-xl font-black text-xs text-white shadow-xs ${item.badgeBg}`}
                    >
                      {item.routeNumber}
                    </span>
                    <span className="font-extrabold text-sm text-[#0B1730] dark:text-white truncate">
                      {item.headsign}
                    </span>
                  </div>

                  {/* Right: ETA & Status Badges */}
                  <div className="flex items-center gap-2.5 shrink-0 pl-2">
                    {/* Live ETA indicator */}
                    <div className="flex items-center gap-1 text-right">
                      {item.isRealtime && (
                        <Wifi size={14} className="text-emerald-500 animate-pulse stroke-[2.5]" />
                      )}
                      <span
                        className={`text-xs font-black ${
                          item.etaMinutes <= 2
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[#0B1730] dark:text-white'
                        }`}
                      >
                        {item.etaMinutes === 0 ? 'Зараз' : `${item.etaMinutes} хв`}
                      </span>
                    </div>

                    {/* Status Pill Badge (GPS / Прогноз / Розклад) */}
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {item.statusBadge}
                    </span>

                    {/* Wheelchair accessible icon */}
                    {item.isLowFloor && (
                      <Accessibility size={15} className="text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Accessibility Banner matching Screen 4 */}
            <div className="p-4 bg-slate-50 dark:bg-[#070E1B] border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 p-3 text-xs font-semibold text-blue-800 dark:text-blue-300">
                <Accessibility size={18} className="shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="leading-snug">
                  Низькопідлоговий транспорт позначено відповідною іконкою.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* About Stop Tab */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Інформація про зупинку
              </h3>
              <p className="mt-2 text-sm font-bold text-[#0B1730] dark:text-white">
                {stopName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Обслуговується комунальним підприємством «Львівелектротранс» та приватними перевізниками.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Оплата:</span>
                <span className="font-bold text-[#0B1730] dark:text-white">Е-квиток ЛеоКарт, банківська картка</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Вартість проїзду:</span>
                <span className="font-bold text-[#0B1730] dark:text-white">15 ₴ (ЛеоКарт) / 20 ₴ (картка)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Інтервал руху:</span>
                <span className="font-bold text-[#0B1730] dark:text-white">3 – 8 хв у пікові години</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
