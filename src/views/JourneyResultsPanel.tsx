import React from 'react';
import {
  ArrowRight,
  Bike,
  BusFront,
  CableCar,
  CarFront,
  Clock3,
  Footprints,
  MapPin,
  Ship,
  Sparkles,
  Ticket,
  TrainFront,
  Zap,
} from 'lucide-react';
import type { ApiJourney, ApiJourneySearchResult, ApiJourneyStrategy } from '../services/productionApi';

const strategyLabels: Record<ApiJourneyStrategy, string> = {
  FASTEST: 'Найшвидше',
  CHEAPEST: 'Найдешевше',
  BALANCED: 'Оптимально',
  PREMIUM: 'Преміум',
  RELIABLE: 'Найнадійніше',
  CUSTOM: 'Ваш пріоритет',
};

const formatPrice = (minor: number) =>
  new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(minor / 100);

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

function getModeTheme(mode: string) {
  switch (mode) {
    case 'METRO':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-900',
        dot: 'bg-rose-500',
      };
    case 'RAIL':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-900',
        dot: 'bg-indigo-600',
      };
    case 'TRAM':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-900',
        dot: 'bg-amber-500',
      };
    case 'TROLLEYBUS':
    case 'BUS':
    case 'MINIBUS':
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-900',
        dot: 'bg-sky-500',
      };
    case 'SCOOTER':
      return {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'BIKE':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-800 dark:text-emerald-200',
        border: 'border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'TAXI':
    case 'TRANSFER':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/40',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-900',
        dot: 'bg-yellow-500',
      };
    case 'COMMUNITY':
    case 'COMMUNITY_DEMAND':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-900',
        dot: 'bg-emerald-500',
      };
    case 'FUNICULAR':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-900',
        dot: 'bg-teal-500',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

function JourneyCard({
  journey,
  onOpenOffer,
  onViewOnMap,
}: {
  journey: ApiJourney;
  onOpenOffer: (offerId: string) => void;
  onViewOnMap?: (journey: ApiJourney) => void;
}) {
  const firstLeg = journey.legs[0];
  const lastLeg = journey.legs.at(-1);
  const primaryLeg = journey.legs.find((candidate) => candidate.mode !== 'WALK') ?? firstLeg;
  if (!firstLeg || !lastLeg || !primaryLeg) return null;

  const time = (value: string) =>
    new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' }).format(new Date(value));

  const transit = journey.legs.some((candidate) => candidate.source === 'gtfs-static' || candidate.source === 'kyiv-open-data' || candidate.mode === 'RAIL' || candidate.mode === 'TRAM' || candidate.mode === 'METRO');
  const priceLabel = journey.confirmedPriceMinor !== null ? 'Підтверджена ціна' : transit ? 'Розрахована вартість' : 'Орієнтовна ціна';
  const shownPrice = journey.confirmedPriceMinor ?? journey.totalPriceMinor;
  const bookingLeg = journey.legs.find((candidate) => candidate.offerId);
  const bookingOfferId = journey.offerId ?? bookingLeg?.offerId ?? null;
  const isMultimodalChain = journey.legs.length > 1;

  // Filter actionable legs for top ribbon (merge walks or keep summary)
  const ribbonLegs = journey.legs.filter((l) => l.mode !== 'WALK' || l.durationSeconds >= 60 || journey.legs.length === 1);

  return (
    <article className="journey-result-card rounded-3xl border border-[#E3EBF4] bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-[#101E38]">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#F0F4F9] dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FF] px-3 py-1 text-[11px] font-extrabold text-[#0066FF] dark:bg-blue-950/60 dark:text-blue-300">
            {isMultimodalChain ? <Sparkles size={12} /> : null}
            {isMultimodalChain ? 'Мультимодальний' : primaryLeg.routeName ? `№${primaryLeg.routeName}` : modeLabels[primaryLeg.mode] ?? strategyLabels[journey.strategy]}
          </span>
          {journey.transfers > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {journey.transfers} {journey.transfers === 1 ? 'пересадка' : 'пересадки'}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {transit ? (primaryLeg.routeName ? `Маршрут №${primaryLeg.routeName}` : (journey.providerName ?? 'Офіційний розклад')) : 'MARSHGO Community'}
        </span>
      </div>

      {/* Segmented Transit Ribbon matching Reference Screenshot 1 */}
      {ribbonLegs.length > 0 && (
        <div className="my-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar rounded-2xl bg-[#EEF2F7]/80 p-2.5 dark:bg-[#0B1730]">
          {ribbonLegs.map((leg, idx) => {
            const isWalk = leg.mode === 'WALK';
            const badgeBg = leg.mode === 'TRAM' ? '#DC2626' : leg.mode === 'TROLLEYBUS' ? '#0284C7' : leg.mode === 'MINIBUS' ? '#F59E0B' : '#16A34A';
            return (
              <React.Fragment key={leg.id || idx}>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                    {getModeIcon(leg.mode, 14)}
                  </span>
                  {leg.routeName && !isWalk && (
                    <span
                      style={{ backgroundColor: badgeBg }}
                      className="grid min-w-[32px] h-6 place-items-center rounded-lg px-2 text-xs font-black text-white shadow-xs"
                    >
                      {leg.routeName}
                    </span>
                  )}
                  <div className="flex flex-col text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                    {leg.priceMinor != null && (
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {Math.round(leg.priceMinor / 100)} UAH
                      </span>
                    )}
                    <span>
                      {isWalk
                        ? `${Math.round(leg.durationSeconds / 60)} хв пішки`
                        : leg.distanceMeters != null
                        ? `${(leg.distanceMeters / 1000).toFixed(1)} км`
                        : `${Math.round(leg.durationSeconds / 60)} хв`}
                    </span>
                  </div>
                </div>
                {idx < ribbonLegs.length - 1 && (
                  <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Departure & Arrival Path Summary */}
      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3.5">
        <div className="flex flex-col items-center pt-1.5">
          <span className="h-3 w-3 rounded-full border-[3px] border-[#0066FF] bg-white dark:bg-[#101E38]" />
          <span className="my-1.5 w-0.5 flex-1 border-l-2 border-dashed border-[#BBD7FB] dark:border-blue-900" />
          <span className="h-3 w-3 rounded-full bg-[#EF4444] ring-4 ring-rose-50 dark:ring-rose-950/50" />
        </div>

        <div className="min-w-0 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Початок</span>
              <b className="mt-0.5 block truncate text-sm font-extrabold text-[#142642] dark:text-white">
                {firstLeg.origin.name}
              </b>
            </div>
            <b className="shrink-0 text-base font-extrabold tabular-nums text-[#142642] dark:text-white">
              {time(firstLeg.departureAt)}
            </b>
          </div>

          <div className="my-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock3 size={13} className="text-[#0066FF]" />
              {formatDuration(journey.totalDurationSeconds)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-slate-400" />
              {journey.transfers ? `${journey.transfers} пересадки` : 'Прямий рейс'}
            </span>
            {journey.walkingMeters > 0 && (
              <span className="flex items-center gap-1">
                <Footprints size={13} className="text-slate-400" />
                {journey.walkingMeters} м пішки
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Прибуття</span>
              <b className="mt-0.5 block truncate text-sm font-extrabold text-[#142642] dark:text-white">
                {lastLeg.destination.name}
              </b>
            </div>
            <b className="shrink-0 text-base font-extrabold tabular-nums text-[#142642] dark:text-white">
              {time(lastLeg.arrivalAt)}
            </b>
          </div>
        </div>
      </div>

      {/* Multimodal Timeline Legs */}
      {isMultimodalChain && (
        <div className="mt-4 space-y-2 rounded-2xl bg-[#F8FAFD] p-3 dark:bg-[#0B1730]">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0066FF] dark:text-blue-400 mb-2">
            Деталі маршруту та пересадок
          </p>
          <ol aria-label="Етапи маршруту" className="space-y-2">
            {journey.legs.map((routeLeg, index) => {
              const theme = getModeTheme(routeLeg.mode);
              const nextLeg = journey.legs[index + 1];
              const transferBufferMinutes = nextLeg
                ? Math.round((new Date(nextLeg.departureAt).getTime() - new Date(routeLeg.arrivalAt).getTime()) / 60_000)
                : 0;

              return (
                <li key={routeLeg.id} className="relative rounded-xl bg-white p-3 shadow-2xs dark:bg-[#101E38]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${theme.bg} ${theme.text}`}>
                        {getModeIcon(routeLeg.mode, 14)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <b className="text-xs font-extrabold text-[#142642] dark:text-white">
                            {index + 1}. {modeLabels[routeLeg.mode] ?? routeLeg.mode}
                          </b>
                          {routeLeg.routeName && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {routeLeg.routeName}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {routeLeg.origin.name} → {routeLeg.destination.name}
                        </p>
                        {routeLeg.providerName && (
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {routeLeg.providerName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-xs font-extrabold tabular-nums text-[#142642] dark:text-white">
                        {time(routeLeg.departureAt)} – {time(routeLeg.arrivalAt)}
                      </span>
                      {routeLeg.priceMinor != null && (
                        <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(routeLeg.priceMinor)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transfer buffer note */}
                  {transferBufferMinutes > 0 && nextLeg && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-50/70 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <Clock3 size={11} />
                      <span>
                        Пересадка: {transferBufferMinutes} хв (буфер платформи на {routeLeg.destination.name})
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Bottom Pricing & Action Section */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#F0F4F9] pt-3 dark:border-slate-800">
        <div className="min-w-0">
          <small className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{priceLabel}</small>
          <b className="text-xl font-black text-[#142642] dark:text-white tabular-nums">
            {shownPrice === null ? '—' : formatPrice(shownPrice)}
          </b>
        </div>

        <div className="flex items-center gap-2">
          {onViewOnMap && (
            <button
              type="button"
              onClick={() => onViewOnMap(journey)}
              className="flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs font-extrabold text-[#0066FF] hover:bg-blue-100 transition active:scale-95 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
              title="Переглянути відрізок та рух транспорту на карті"
            >
              <MapPin size={14} />
              На карті
            </button>
          )}

          {bookingOfferId ? (
            <button
              type="button"
              onClick={() => onOpenOffer(bookingOfferId)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
            >
              <Ticket size={14} />
              Забронювати
              <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <TrainFront size={14} className="text-[#0066FF]" />
              Розклад підтверджено
            </div>
          )}
        </div>
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
  return (
    <section aria-label="План маршруту" className="mt-4">
      <div className="mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0066FF] dark:text-blue-400">
          Розумний мультимодальний маршрут
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#142642] dark:text-white">
          Найкращі варіанти поїздки
        </h2>
        <p className="mt-1 text-xs text-[#6A7F98] dark:text-slate-400">
          Скомпоновано з пересадками, розкладами та розрахунком часу.
        </p>
      </div>

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
          {result.journeys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              onOpenOffer={(offerId) => onOpenOffer(offerId, journey.id, journey.legs[0]?.id ?? '')}
              onViewOnMap={onViewOnMap}
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
