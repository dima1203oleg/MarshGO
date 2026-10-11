import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bike,
  BusFront,
  CableCar,
  CarFront,
  ChevronRight,
  Footprints,
  MapPin,
  Ship,
  TrainFront,
  Zap,
} from 'lucide-react';
import type { ApiJourney, ApiJourneySearchResult, ApiJourneyStrategy } from '../services/productionApi';
import { transportColor } from '../domain/transportVisuals';

const strategyLabels: Record<ApiJourneyStrategy, string> = {
  FASTEST: 'Найшвидший', CHEAPEST: 'Найдешевший', BALANCED: 'Оптимальний',
  PREMIUM: 'Premium', RELIABLE: 'Найнадійніший', CUSTOM: 'Ваш пріоритет',
};

const formatDuration = (seconds: number) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} год ${minutes % 60} хв` : `${minutes} хв`;
};

const modeLabels: Record<string, string> = {
  WALK: 'Пішки',
  COMMUNITY: 'Попутка',
  COMMUNITY_DEMAND: 'Попутка',
  TAXI: 'Таксі',
  TRANSFER: 'Трансфер',
  BUS: 'Автобус',
  MINIBUS: 'Маршрутка',
  RAIL: 'Поїзд / Інтерсіті+',
  TRAM: 'Трамвай',
  TROLLEYBUS: 'Тролейбус',
  METRO: 'Метро',
  URBAN_BUS: 'Міський автобус',
  CARSHARING: 'Каршеринг',
  FERRY: 'Пором',
  FUNICULAR: 'Фунікулер',
  BIKE: 'Велосипед',
  SCOOTER: 'Самокат',
};

function getModeIcon(mode: string, size = 15) {
  switch (mode) {
    case 'METRO':
    case 'RAIL':
      return <TrainFront size={size} />;
    case 'TRAM':
    case 'FUNICULAR':
      return <CableCar size={size} />;
    case 'BUS':
    case 'MINIBUS':
    case 'TROLLEYBUS':
    case 'URBAN_BUS':
      return <BusFront size={size} />;
    case 'SCOOTER':
      return <Zap size={size} />;
    case 'BIKE':
      return <Bike size={size} />;
    case 'TAXI':
    case 'COMMUNITY':
    case 'COMMUNITY_DEMAND':
    case 'CARSHARING':
    case 'TRANSFER':
      return <CarFront size={size} />;
    case 'FERRY':
      return <Ship size={size} />;
    case 'WALK':
      return <Footprints size={size} />;
    default:
      return <TrainFront size={size} />;
  }
}

function JourneyCard({
  journey,
  onOpenOffer,
  onViewOnMap,
  activeStrategy,
}: {
  journey: ApiJourney;
  onOpenOffer: (offerId: string) => void;
  onViewOnMap?: (journey: ApiJourney) => void;
  activeStrategy: ApiJourneyStrategy;
}) {
  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs.at(-1);
  const primaryLeg = journey.legs.find((candidate) => candidate.mode !== 'WALK') ?? firstLeg;
  if (!firstLeg || !lastLeg || !primaryLeg) return null;

  const time = (value: string) =>
    new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(new Date(value));

  const shownPrice = journey.confirmedPriceMinor ?? journey.totalPriceMinor;
  const estimatedPrice = journey.estimatedPriceMinMinor != null && journey.estimatedPriceMaxMinor != null
    ? `${Math.round(journey.estimatedPriceMinMinor / 100)}–${Math.round(journey.estimatedPriceMaxMinor / 100)} грн · оцінка`
    : null;
  const bookingLeg = journey.legs.find((candidate) => candidate.offerId);
  const bookingOfferId = journey.offerId ?? bookingLeg?.offerId ?? null;

  // Filter actionable legs for top ribbon (keep walks that are >= 1 min or only leg)
  const ribbonLegs = journey.legs.filter((l) => l.mode !== 'WALK' || l.durationSeconds >= 45 || journey.legs.length === 1);

  // Accurately compute total route distance
  const distanceIsComplete = journey.legs.every((leg) => leg.distanceMeters != null && Number.isFinite(leg.distanceMeters));
  const totalDistanceMeters = distanceIsComplete ? journey.legs.reduce((acc, leg) => acc + (leg.distanceMeters ?? 0), 0) : 0;
  const distanceLabel = totalDistanceMeters > 0
    ? `${(totalDistanceMeters / 1000).toFixed(1)} км`
    : journey.walkingMeters > 0
      ? `${journey.walkingMeters} м пішки`
      : 'Відстань не надана';

  const departureTimeStr = time(firstLeg.departureAt);
  const arrivalTimeStr = time(lastLeg.arrivalAt);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${modeLabels[primaryLeg.mode] ?? 'Маршрут'}: ${firstLeg.origin.name} — ${lastLeg.destination.name}, ${formatDuration(journey.totalDurationSeconds)}${shownPrice != null ? `, ${Math.round(shownPrice / 100)} гривень` : estimatedPrice ? `, ${estimatedPrice}` : ', ціна не надана'}. Відкрити деталі.`}
      onClick={() => {
        if (bookingOfferId) onOpenOffer(bookingOfferId);
        else if (onViewOnMap) onViewOnMap(journey);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      className="block min-h-11 cursor-pointer rounded-[22px] border border-[#D5DFEB] bg-white p-4 shadow-[0_3px_12px_rgba(20,38,66,0.07)] transition-all hover:border-[#1769ED]/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.99] dark:border-slate-700 dark:bg-[#101E38]"
    >
      {/* Top Multi-Segment Ribbon: 🚶 4 хв → 🚌 21 → 🚋 24 */}
      <div className="flex items-center justify-between gap-2">
        <span className="mb-1 inline-flex shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
          {strategyLabels[activeStrategy]}{journey.strategyRanks?.[activeStrategy] ? ` · №${journey.strategyRanks[activeStrategy]}` : ''}
        </span>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {ribbonLegs.map((leg, idx) => {
            const isWalk = leg.mode === 'WALK';
            const badgeColor = isWalk ? null : transportColor(leg.mode);

            return (
              <React.Fragment key={leg.id || idx}>
                {isWalk ? (
                  <div className="flex items-center gap-1 rounded-[8px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-bold text-[#6A7F98] dark:text-slate-300 shrink-0">
                    <Footprints size={12} />
                    <span>{Math.max(1, Math.round(leg.durationSeconds / 60))} хв</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-0.5 text-[11.5px] font-extrabold text-white shadow-2xs shrink-0" style={{ backgroundColor: badgeColor ?? undefined }}>
                    {getModeIcon(leg.mode, 12)}
                    <span>{leg.routeName || modeLabels[leg.mode] || 'Транспорт'}</span>
                  </div>
                )}
                {idx < ribbonLegs.length - 1 && (
                  <ArrowRight size={12} className="text-[#B5C4D8] dark:text-slate-600 shrink-0 mx-0.5" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="shrink-0 text-[#B5C4D8] dark:text-slate-500">
          <ChevronRight size={18} />
        </div>
      </div>

      {/* Main Duration & Departure-Arrival time + Price */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-black tracking-tight text-[#142642] dark:text-white">
            {formatDuration(journey.totalDurationSeconds)}
          </span>
          <span className="text-[13px] font-bold text-[#526781] dark:text-slate-300">
            {departureTimeStr} – {arrivalTimeStr}
          </span>
        </div>

        <div className={`max-w-[46%] shrink-0 text-right text-[13px] font-extrabold ${shownPrice != null ? 'text-[#142642] dark:text-white' : estimatedPrice ? 'text-amber-800 dark:text-amber-200' : 'text-[#526781] dark:text-slate-300'}`}>
          {shownPrice != null ? <><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#10B981]" />{Math.round(shownPrice / 100)} грн</> : estimatedPrice ?? 'Ціна не надана'}
        </div>
      </div>

      {/* Subtitle Details: Transfers · Distance · Source */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-[#526781] dark:text-slate-300">
        <span>{journey.transfers > 0 ? `${journey.transfers} ${journey.transfers === 1 ? 'пересадка' : 'пересадки'}` : 'Без пересадок'}</span>
        {distanceLabel && (
          <>
            <span className="h-1 w-1 rounded-full bg-[#B5C4D8] dark:bg-slate-600 shrink-0" />
            <span>{distanceLabel}</span>
          </>
        )}
        {journey.source === 'gtfs-static' && (
          <>
            <span className="h-1 w-1 rounded-full bg-[#B5C4D8] dark:bg-slate-600 shrink-0" />
            <span className="text-[#1458C8] dark:text-sky-300 font-bold">Розклад · GTFS</span>
          </>
        )}
      </div>
      {journey.legs.some((leg) => leg.priceStatus === 'UNKNOWN' || leg.availabilityStatus === 'UNKNOWN') && (
        <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-semibold text-[#526781] dark:bg-slate-800/70 dark:text-slate-300">
          {journey.legs.some((leg) => leg.priceStatus === 'UNKNOWN') ? 'Тариф не надано джерелом' : ''}
          {journey.legs.some((leg) => leg.priceStatus === 'UNKNOWN' && leg.availabilityStatus === 'UNKNOWN') ? ' · ' : ''}
          {journey.legs.some((leg) => leg.availabilityStatus === 'UNKNOWN') ? 'Наявність місць не підтверджена' : ''}
        </p>
      )}

      {/* Origin → Destination footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-[#6A7F98] dark:text-slate-400 truncate flex items-center gap-1.5">
        <span className="truncate">{firstLeg.origin.name.split(',')[0]}</span>
        <ArrowRight size={10} className="text-[#B5C4D8] dark:text-slate-600 shrink-0" />
        <span className="truncate">{lastLeg.destination.name.split(',')[0]}</span>
      </div>
    </article>
  );
}

export function JourneyResultsPanel({
  result,
  onOpenOffer,
  onViewOnMap,
}: {
  result: ApiJourneySearchResult;
  onOpenOffer: (offerId: string, journeyId: string, journeyLegId: string) => void;
  onViewOnMap?: (journey: ApiJourney) => void;
}) {
  const strategyOptions = result.availableStrategies?.length
    ? result.availableStrategies
    : [...new Set(result.journeys.flatMap((journey) => journey.recommendedStrategies ?? [journey.strategy]))];
  const defaultStrategy = result.requestedStrategy && strategyOptions.includes(result.requestedStrategy)
    ? result.requestedStrategy
    : strategyOptions.includes('BALANCED') ? 'BALANCED' : strategyOptions[0] ?? 'BALANCED';
  const [activeStrategy, setActiveStrategy] = useState<ApiJourneyStrategy>(defaultStrategy);
  useEffect(() => setActiveStrategy(defaultStrategy), [result, defaultStrategy]);
  const visibleJourneys = result.journeys
    .filter((journey) => journey.strategyRanks
      ? typeof journey.strategyRanks[activeStrategy] === 'number'
      : (journey.recommendedStrategies ?? [journey.strategy]).includes(activeStrategy))
    .sort((a, b) => (a.strategyRanks?.[activeStrategy] ?? Number.MAX_SAFE_INTEGER)
      - (b.strategyRanks?.[activeStrategy] ?? Number.MAX_SAFE_INTEGER)
      || a.totalDurationSeconds - b.totalDurationSeconds);
  return (
    <section aria-label="План маршруту" className="mt-4">

      {strategyOptions.some((strategy) => ['BALANCED', 'FASTEST', 'CHEAPEST'].includes(strategy)) && (
        <div role="group" aria-label="Ранжування маршрутів" className="mb-3 grid grid-cols-3 gap-2">
          {strategyOptions.filter((strategy) => ['BALANCED', 'FASTEST', 'CHEAPEST'].includes(strategy)).map((strategy) => {
            const count = result.journeys.filter((journey) => journey.strategyRanks
              ? typeof journey.strategyRanks[strategy] === 'number'
              : (journey.recommendedStrategies ?? [journey.strategy]).includes(strategy)).length;
            return <button key={strategy} type="button" aria-pressed={activeStrategy === strategy}
              onClick={() => setActiveStrategy(strategy)}
              className={`min-h-11 rounded-xl border px-2 py-2 text-[11px] font-bold ${activeStrategy === strategy ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
              {strategyLabels[strategy]} · {count}
            </button>;
          })}
        </div>
      )}

      {result.resultsTruncated && (
        <p className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
          Показано до {result.alternativeLimitPerStrategy ?? 12} варіантів на режим із {result.paretoCount ?? result.candidateCount ?? 'знайдених'} Pareto-варіантів.
        </p>
      )}

      {result.candidateGenerationTruncated && (
        <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          Пошук досяг ліміту обробки джерел; частина маршрутів могла не потрапити до результатів. Уточніть час або види транспорту й повторіть пошук.
        </p>
      )}

      {result.partial && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          Показані підключені офіційні розклади транспорту та поїздки MARSHGO Community.
        </div>
      )}

      {result.providerErrors.length > 0 && (
        <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Деякі розклади тимчасово недоступні: {result.providerErrors.join('; ')}.
        </div>
      )}

      {result.journeys.length ? (
        <div className="space-y-4">
          {visibleJourneys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              onOpenOffer={(offerId) => onOpenOffer(offerId, journey.id, journey.legs[0]?.id ?? '')}
              onViewOnMap={onViewOnMap}
              activeStrategy={activeStrategy}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-[#E3EBF4] bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-[#101E38]">
          <MapPin className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
          <p className="mt-3 font-extrabold text-[#142642] dark:text-white">Маршрутів не знайдено</p>
          <p className="mt-1 text-xs text-[#6A7F98] dark:text-slate-400">
            Спробуйте інший час або увімкніть «Усі» види транспорту.
          </p>
        </div>
      )}
    </section>
  );
}
