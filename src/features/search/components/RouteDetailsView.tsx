import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  Clock,
  Route,
  Coins,
  ChevronRight,
  Footprints,
  BusFront,
  TramFront,
  TrainFront,
  CarFront,
  CarTaxiFront,
  Bike,
  Zap,
  Map,
} from 'lucide-react';
import type { RouteSearchResultItem, RouteLegItem } from '../model/types';

import { StopDeparturesModal } from './StopDeparturesModal';
import { transportColor } from '../../../domain/transportVisuals';
import type { Coordinate } from '../../../../shared/navigation/contracts';

interface RouteDetailsViewProps {
  item: RouteSearchResultItem;
  originTitle: string;
  destTitle: string;
  onBackToResults: () => void;
  onOpenMap: () => void;
  onBook?: () => void;
  onShare?: () => void;
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Час не вказано';
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} год ${minutes % 60} хв` : `${minutes} хв`;
};

function TransportLegIcon({ mode, size = 13 }: { mode: string; size?: number }) {
  const Icon = mode === 'walk' ? Footprints
    : mode === 'tram' || mode === 'trolleybus' ? TramFront
      : mode === 'metro' || mode === 'train' || mode === 'suburban_train' ? TrainFront
        : mode === 'carpool' || mode === 'carsharing' ? CarFront
          : mode === 'taxi' ? CarTaxiFront
            : mode === 'bike' ? Bike
              : mode === 'scooter' ? Zap : BusFront;
  return <Icon size={size} aria-hidden="true"/>;
}

const formatTime = (value: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes('T')) {
    return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(parsed);
  }
  return value;
};

export const RouteDetailsView: React.FC<RouteDetailsViewProps> = ({
  item,
  originTitle,
  destTitle,
  onBackToResults,
  onOpenMap,
  onBook,
  onShare,
}) => {
  const [inspectedStop, setInspectedStop] = useState<{ name: string; coordinate: Coordinate | null } | null>(null);
  const inspectStop = (name: string, coordinate?: Coordinate) => {
    setInspectedStop({ name, coordinate: coordinate ?? null });
  };
  const durationText = item.durationLabel || formatDuration(item.durationSeconds);
  const distanceText = item.distanceLabel || 'Відстань не надана';
  const priceText = item.priceLabel ? item.priceLabel.replace(' UAH', ' грн').replace(' ₴', ' грн') : 'Ціну не надано';
  const legs: RouteLegItem[] = item.legs?.length ? item.legs : [{
    id: item.id,
    mode: item.type,
    modeLabel: item.modeLabel,
    carrierName: item.carrierName,
    originName: item.departureAddress,
    destinationName: item.arrivalAddress,
    departureTime: item.departureTime,
    arrivalTime: item.arrivalTime,
    durationLabel: durationText,
    durationSeconds: item.durationSeconds,
    priceMinor: item.priceMinor ?? undefined,
  }];

  const handleShare = () => {
    if (onShare) return onShare();
    if (navigator.share) {
      void navigator.share({
        title: `Маршрут ${originTitle} → ${destTitle}`,
        text: `Поїздка MARSHGO: ${durationText}; ${distanceText}; ${priceText}`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <div className="route-details-screen mx-auto flex min-h-[100svh] w-full max-w-md flex-col overflow-x-hidden bg-[#F4F8FD] pb-[calc(6rem+env(safe-area-inset-bottom))] text-[#0B1730] dark:bg-[#070E1B] dark:text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 pt-[max(4.75rem,calc(env(safe-area-inset-top)+2rem))] backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0B1730]/95">
        <button type="button" onClick={onBackToResults} aria-label="Назад" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition active:scale-95 dark:bg-slate-800 dark:text-slate-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-extrabold">Деталі маршруту</h1>
        <button type="button" onClick={handleShare} aria-label="Поділитися" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 transition active:scale-95 dark:bg-slate-800 dark:text-slate-200">
          <Share2 size={18} />
        </button>
      </header>

      <section aria-label="Підсумок маршруту" className="mx-4 mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-[20px] border border-slate-100 bg-white px-2 py-3 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-[#101E38]">
        <Metric icon={<Clock size={16} />} value={durationText} label={`Прибуття ${formatTime(item.arrivalTime)}`} />
        <Metric icon={<Route size={16} />} value={distanceText} label="Відстань" />
        <Metric icon={<Coins size={16} />} value={priceText} label={item.isPriceFixed ? 'Підтверджена ціна' : 'Ціна з джерела'} />
      </section>

      <section className="route-details-timeline flex-1 px-4 pb-20 pt-4" aria-label="Відрізки маршруту">
        <ol className="relative space-y-1">
          {/* Origin Point A */}
          <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
            <time className="pt-1.5 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(item.departureTime)}</time>
            <div className="relative flex justify-center">
              <span className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-[#007AFF] text-white text-[11px] font-black shadow-xs">
                A
              </span>
              <span className="absolute top-4 bottom-0 w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-700" />
            </div>
            <div className="pb-3 pt-0.5">
              <p className="text-sm font-black text-[#0B1730] dark:text-white">{legs[0]?.originName || originTitle}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Початок маршруту</p>
            </div>
          </li>

          {legs.map((leg, index) => {
            const isWalk = leg.mode === 'walk';
            const routeBadgeLabel = leg.routeName ? `${leg.modeLabel} ${leg.routeName}` : leg.modeLabel;

            const legColor = transportColor(leg.mode);

            const distanceText = leg.distanceMeters != null && Number.isFinite(leg.distanceMeters)
              ? leg.distanceMeters >= 1000 ? `${(leg.distanceMeters / 1000).toFixed(1)} км` : `${Math.round(leg.distanceMeters)} м`
              : 'Відстань не надана';

            const durationText = leg.durationLabel || formatDuration(leg.durationSeconds);
            const stopsLabel = legs.length === 1 && item.stopsCount > 0
              ? `${item.stopsCount} зупинок`
              : 'Кількість зупинок не надана';

            return (
              <React.Fragment key={leg.id}>
                {isWalk ? (
                  /* Walk segment with dotted line and footprint */
                  <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2 py-1">
                    <span />
                    <div className="relative flex justify-center">
                      <span className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 shadow-2xs">
                        <Footprints size={12} />
                      </span>
                      <span className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-700" />
                    </div>
                    <div className="pb-3 pt-0.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {durationText} • {distanceText}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                        {index === legs.length - 1 ? 'Пішки до пункту призначення' : 'Пішки до зупинки'}
                      </p>
                    </div>
                  </li>
                ) : (
                  /* Transit Boarding Stop & Card */
                  <>
                    <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
                      <time className="pt-1.5 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(leg.departureTime)}</time>
                      <div className="relative flex justify-center">
                        <span className="relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 bg-white shadow-xs dark:bg-[#070E1B]" style={{ borderColor: legColor }} />
                        <span className="absolute top-0 bottom-0 w-0.5" style={{ backgroundColor: legColor }} />
                      </div>
                      <div className="pb-1 pt-0.5">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => inspectStop(leg.originName, leg.coordinates?.[0])}
                          onKeyDown={(e) => { if (e.key === 'Enter') inspectStop(leg.originName, leg.coordinates?.[0]); }}
                          className="cursor-pointer group"
                        >
                          <p className="text-sm font-black text-[#0B1730] dark:text-white group-hover:text-[#007AFF] transition">{leg.originName}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Сісти на маршрут · Торкніться для розкладу зупинки</p>
                        </div>

                        {/* Transit Subcard matching Screen 3 */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => inspectStop(leg.originName || 'Зупинка', leg.coordinates?.[0])}
                          onKeyDown={(e) => { if (e.key === 'Enter') inspectStop(leg.originName || 'Зупинка', leg.coordinates?.[0]); }}
                          className="mt-2.5 mb-2 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_10px_rgba(26,73,133,.05)] dark:border-slate-800 dark:bg-[#101E38] cursor-pointer hover:border-[#007AFF] transition active:scale-[0.99]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black text-white shadow-2xs" style={{ backgroundColor: legColor }}>
                                <TransportLegIcon mode={leg.mode} />
                                <span>{routeBadgeLabel}</span>
                              </span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {durationText} • {stopsLabel}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                              У напрямку: {leg.destinationName?.split(',')[0]}
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-slate-400 shrink-0 ml-2" />
                        </div>
                      </div>
                    </li>

                    {/* Transit Alight Stop */}
                    <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
                      <time className="pt-1.5 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(leg.arrivalTime)}</time>
                      <div className="relative flex justify-center">
                        <span className="relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 bg-white shadow-xs dark:bg-[#070E1B]" style={{ borderColor: legColor }} />
                        <span className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-700" />
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => inspectStop(leg.destinationName, leg.coordinates?.at(-1))}
                        onKeyDown={(e) => { if (e.key === 'Enter') inspectStop(leg.destinationName, leg.coordinates?.at(-1)); }}
                        className="pb-3 pt-0.5 cursor-pointer group"
                      >
                        <p className="text-sm font-black text-[#0B1730] dark:text-white group-hover:text-[#007AFF] transition">{leg.destinationName}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Вийти з транспорту</p>
                      </div>
                    </li>
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* Destination Point B */}
          <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
            <time className="pt-1.5 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(item.arrivalTime)}</time>
            <div className="relative flex justify-center">
              <span className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-[#EF4444] text-white text-[11px] font-black shadow-xs">
                B
              </span>
            </div>
            <div className="pb-2 pt-0.5">
              <p className="text-sm font-black text-[#0B1730] dark:text-white">{destTitle}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Кінець маршруту</p>
            </div>
          </li>
        </ol>

        {/* Floating bottom action button matching Screen 3 */}
        <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md gap-2">
          {item.offerId && onBook && (
            <button
              type="button"
              onClick={onBook}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#007AFF] px-3 py-3.5 text-sm font-black text-white shadow-[0_6px_20px_rgba(0,122,255,.3)] transition active:scale-[0.99]"
            >
              <span>Перейти до бронювання</span>
              <ArrowRight size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenMap}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#007AFF] px-3 py-3.5 text-sm font-black text-white shadow-[0_6px_20px_rgba(0,122,255,.3)] transition active:scale-[0.99] ${item.offerId && onBook ? 'min-w-0 flex-1 text-xs' : 'w-full'}`}
            aria-label={item.offerId && onBook ? 'Показати маршрут на карті' : undefined}
            data-testid="show-route-on-map"
          >
            <Map size={18} />
            <span>Показати на карті</span>
          </button>
        </div>
      </section>

      {/* Stop Departures Modal */}
      <StopDeparturesModal
        isOpen={Boolean(inspectedStop)}
        stopName={inspectedStop?.name ?? ''}
        stopCoordinates={inspectedStop?.coordinate ?? null}
        onClose={() => setInspectedStop(null)}
      />
    </div>
  );
};

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-2 text-center">
      <span className="flex items-center gap-1.5 text-[#007AFF]">
        {icon}
        <b className="truncate text-[13px] font-black leading-tight text-[#0B1730] dark:text-white">{value}</b>
      </span>
      <span className="mt-1 truncate text-[10px] font-bold text-slate-400">{label}</span>
    </div>
  );
}
