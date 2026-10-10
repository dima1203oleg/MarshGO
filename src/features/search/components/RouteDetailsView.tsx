import React from 'react';
import {
  ArrowLeft,
  Share2,
  Clock,
  Route,
  Coins,
  ChevronRight,
  Footprints,
  Bus,
  Bike,
  Car,
  Train,
  Map,
} from 'lucide-react';
import type { RouteSearchResultItem, RouteLegItem } from '../model/types';

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

const formatTime = (value: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && value.includes('T')) {
    return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(parsed);
  }
  return value;
};

function legPresentation(leg: RouteLegItem) {
  if (leg.mode === 'walk') return { Icon: Footprints, color: 'text-slate-600', badge: 'bg-slate-100 text-slate-700', rail: 'bg-slate-300', prefix: '' };
  if (leg.mode === 'tram') return { Icon: Bus, color: 'text-red-700', badge: 'bg-[#EF4444] text-white', rail: 'bg-[#EF4444]', prefix: 'Тр' };
  if (leg.mode === 'trolleybus') return { Icon: Bus, color: 'text-teal-700', badge: 'bg-[#0D9488] text-white', rail: 'bg-[#0D9488]', prefix: 'Тл' };
  if (leg.mode === 'bus') return { Icon: Bus, color: 'text-blue-700', badge: 'bg-[#0066FF] text-white', rail: 'bg-[#0066FF]', prefix: 'Ав' };
  if (leg.mode === 'minibus' || leg.mode === 'marshrutka') return { Icon: Bus, color: 'text-violet-700', badge: 'bg-[#8B5CF6] text-white', rail: 'bg-[#8B5CF6]', prefix: 'Мт' };
  if (leg.mode === 'metro') return { Icon: Train, color: 'text-red-700', badge: 'bg-[#DC2626] text-white', rail: 'bg-[#DC2626]', prefix: 'М' };
  if (leg.mode === 'train' || leg.mode === 'suburban_train') return { Icon: Train, color: 'text-blue-700', badge: 'bg-blue-600 text-white', rail: 'bg-blue-500', prefix: 'Пз' };
  if (leg.mode === 'bike' || leg.mode === 'scooter') return { Icon: Bike, color: 'text-teal-700', badge: 'bg-teal-600 text-white', rail: 'bg-teal-500', prefix: '' };
  if (['carpool', 'taxi', 'carsharing', 'transfer'].includes(leg.mode)) return { Icon: Car, color: 'text-violet-700', badge: 'bg-violet-600 text-white', rail: 'bg-violet-500', prefix: '' };
  return { Icon: Bus, color: 'text-blue-700', badge: 'bg-blue-600 text-white', rail: 'bg-blue-500', prefix: '' };
}

export const RouteDetailsView: React.FC<RouteDetailsViewProps> = ({
  item,
  originTitle,
  destTitle,
  onBackToResults,
  onOpenMap,
  onBook,
  onShare,
}) => {
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
    <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col overflow-x-hidden bg-[#F4F8FD] pb-[calc(6rem+env(safe-area-inset-bottom))] text-[#0B1730] dark:bg-[#070E1B] dark:text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 pt-[max(0.6rem,env(safe-area-inset-top))] backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0B1730]/95">
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

      <section className="flex-1 px-4 pb-4 pt-4" aria-label="Відрізки маршруту">
        <ol className="relative space-y-1">
          <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
            <time className="pt-2 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(item.departureTime)}</time>
            <div className="relative flex justify-center"><span className="relative z-10 mt-2 h-4 w-4 rounded-full border-[3px] border-white bg-[#0066FF] shadow ring-1 ring-blue-200 dark:border-[#070E1B]" /></div>
            <div className="pb-3 pt-1"><p className="text-sm font-extrabold">{legs[0]?.originName || originTitle}</p><p className="mt-0.5 text-[11px] text-slate-500">Початок маршруту</p></div>
          </li>

          {legs.map((leg, index) => {
            const previous = legs[index - 1];
            const waitSeconds = previous ? (Date.parse(leg.departureTime) - Date.parse(previous.arrivalTime)) / 1000 : 0;
            const { Icon, color, badge, rail, prefix } = legPresentation(leg);
            const isWalk = leg.mode === 'walk';
            const freshnessText = leg.source === 'gtfs-static' || leg.source === 'GTFS_STATIC' ? 'Розклад · фактичний рух не підтверджено' : null;
            const routeBadgeLabel = prefix && leg.routeName ? `${prefix} ${leg.routeName}` : leg.routeName || leg.modeLabel;
            const distanceText = leg.distanceMeters != null
              ? leg.distanceMeters >= 1000 ? `${(leg.distanceMeters / 1000).toFixed(1)} км` : `${Math.round(leg.distanceMeters)} м`
              : null;
            const walkActionLabel = index === 0 ? 'Пішки до зупинки' : index === legs.length - 1 ? 'Пішки до пункту призначення' : 'Пішки до зупинки';
            const transitActionLabel = index === 0 ? 'Сісти на маршрут' : 'Сісти на транспорт';

            return <React.Fragment key={leg.id}>
              {/* Transfer wait indicator */}
              {previous && !isWalk && previous.mode !== 'walk' && waitSeconds > 0 && <li className="grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2 py-1">
                <span />
                <span className="relative flex justify-center"><span className="absolute inset-y-0 w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-600" /></span>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Пересадка · очікування {formatDuration(waitSeconds)}</p>
              </li>}

              {/* Stop point where you board / alight */}
              <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
                <time className="pt-2 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(leg.departureTime)}</time>
                <div className="relative flex justify-center">
                  <span className={`relative z-10 mt-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white shadow-sm dark:border-[#070E1B] ${isWalk ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-950'}`}><Icon size={15} className={color}/></span>
                  <span className={`absolute top-0 bottom-0 w-0.5 ${rail}`} />
                </div>
                <div className="pb-1 pt-1">
                  <p className="text-sm font-extrabold text-[#0B1730] dark:text-white">{leg.originName}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{isWalk ? walkActionLabel : transitActionLabel}</p>

                  {/* Walk leg: compact inline info */}
                  {isWalk && (
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {leg.durationLabel || formatDuration(leg.durationSeconds)}{distanceText ? ` • ${distanceText}` : ''}
                    </p>
                  )}

                  {/* Transit leg: mode badge + route info card */}
                  {!isWalk && (
                    <div className="mt-2 mb-1 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_3px_12px_rgba(26,73,133,.05)] dark:border-slate-800 dark:bg-[#101E38]">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ${badge}`}>
                          <Icon size={14}/>
                          <span>{routeBadgeLabel}</span>
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        {leg.durationLabel || formatDuration(leg.durationSeconds)}{distanceText ? ` • ${distanceText}` : ''}
                      </p>
                      {leg.destinationName && (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          У напрямку: {leg.destinationName}
                        </p>
                      )}
                      {freshnessText && <p className="mt-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{freshnessText}</p>}
                    </div>
                  )}
                </div>
              </li>

              {/* Destination stop for transit legs */}
              {!isWalk && (
                <li className="relative grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)] gap-2">
                  <time className="pt-2 text-right text-[11px] font-bold tabular-nums text-slate-500">{formatTime(leg.arrivalTime)}</time>
                  <div className="relative flex justify-center">
                    <span className={`relative z-10 mt-2 h-4 w-4 rounded-full border-[3px] border-white shadow ring-1 ring-slate-200 dark:border-[#070E1B] ${index === legs.length - 1 ? 'bg-rose-500 ring-rose-200' : 'bg-[#0066FF] ring-blue-200'}`} />
                    <span className="absolute top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="pb-2 pt-1">
                    <p className="text-sm font-extrabold text-[#0B1730] dark:text-white">{leg.destinationName}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Вийти з транспорту</p>
                  </div>
                </li>
              )}
            </React.Fragment>;
          })}
        </ol>

        {item.source === 'gtfs' && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-900">Це розклад із GTFS. Фактичний рух, наявність місць, тариф і квиток цим джерелом не підтверджені.</p>}
        <button type="button" onClick={onOpenMap} className="mt-3 flex min-h-12 w-full items-center justify-between rounded-2xl bg-[#0879F9] px-4 py-3 text-sm font-bold text-white shadow-[0_5px_16px_rgba(0,102,255,.23)] transition active:scale-[.99]">
          <span className="flex items-center gap-2"><Map size={17} />Показати на карті</span><ChevronRight size={18} />
        </button>
        {item.offerId && onBook && <button type="button" onClick={onBook} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white py-3 text-sm font-black text-[#0066FF] dark:border-blue-900 dark:bg-[#101E38]">Перейти до бронювання<ChevronRight size={16} /></button>}
      </section>
    </div>
  );
};

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="flex min-w-0 flex-col items-center justify-center px-1 text-center">
    <span className="flex items-center gap-1.5 text-[#0066FF]">{icon}<b className="truncate text-[11px] font-black leading-tight text-[#0B1730] dark:text-white">{value}</b></span>
    <span className="mt-1 truncate text-[9px] font-semibold text-slate-400">{label}</span>
  </div>;
}
