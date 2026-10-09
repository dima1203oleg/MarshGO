import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { productionApi } from '../../services/productionApi';
import type { RoutePlace, RouteSearchResultItem, SearchFiltersState, SearchTransportMode } from './model/types';
import { SearchHeader } from './components/SearchHeader';
import { RouteInputs } from './components/RouteInputs';
import { DateTimePassengers } from './components/DateTimePassengers';
import { SearchResultsList } from './components/SearchResultsList';
import { SearchMapDetails } from './components/SearchMapDetails';
import { SearchFiltersModal } from './components/SearchFiltersModal';
import { buildSearchRoute, parseSearchRoute, type SearchRouteState } from '../../routing/searchRouteState';

interface SearchExperienceV6Props {
  onBookOfferId?: (offerId: string, passengerCount: number) => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onOpenReverseMarketplace?: (origin: string, destination: string) => void;
  onOpenJourneyPlanner?: (criteria: { origin: RoutePlace; destination: RoutePlace; date: string; time: string; passengers: number }) => void;
  initialOrigin?: string;
  initialDestination?: string;
}

function offersToSearchItems(
  offers: Awaited<ReturnType<typeof productionApi.offers>>,
  date: string,
  time: string,
  timeMode: 'now' | 'depart_at' | 'arrive_by',
): RouteSearchResultItem[] {
  const threshold = timeMode === 'now' ? Date.now() : new Date(`${date}T${time}:00`).getTime();
  return offers
    .filter((offer) => offer.other_date || new Date(offer.departure_at).getTime() >= threshold)
    .map((offer) => ({
      id: `offer-${offer.id}`,
      type: 'carpool',
      modeLabel: 'Попутка',
      badge: offer.other_date ? 'Інша дата' : undefined,
      source: 'community',
      carrierName: offer.driver_name,
      vehicleModel: 'Автомобіль',
      vehiclePhoto: offer.vehicle_photo_url ?? undefined,
      driver: {
        name: offer.driver_name,
        avatar: offer.driver_photo_url ?? undefined,
        rating: offer.average_rating == null ? null : Number(offer.average_rating),
        reviewCount: offer.review_count,
        verified: false,
      },
      departureTime: new Date(offer.departure_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: offer.arrival_at
        ? new Date(offer.arrival_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
        : '—',
      departureCity: offer.origin_name.split(',')[0].trim(),
      arrivalCity: offer.destination_name.split(',')[0].trim(),
      departureAddress: offer.origin_name,
      arrivalAddress: offer.destination_name,
      durationLabel: offer.duration_s != null
        ? `${Math.floor(offer.duration_s / 3600)} год ${Math.round((offer.duration_s % 3600) / 60)} хв`
        : 'Тривалість не вказана',
      distanceLabel: offer.distance_m != null ? `${(offer.distance_m / 1000).toFixed(0)} км` : 'Відстань не вказана',
      distanceMeters: offer.distance_m ?? 0,
      durationSeconds: offer.duration_s ?? 0,
      priceMinor: offer.price_per_seat_minor,
      priceLabel: `${Math.round(offer.price_per_seat_minor / 100)} ₴`,
      priceUnit: 'за місце',
      isPriceFixed: true,
      availableSeats: offer.available_seats,
      features: [`${offer.available_seats} вільних місць`],
      stopsCount: 0,
      offerId: offer.id,
    }));
}

export const SearchExperienceV6: React.FC<SearchExperienceV6Props> = ({
  onBookOfferId,
  onOpenNotifications,
  unreadNotificationCount = 0,
  onOpenReverseMarketplace,
  onOpenJourneyPlanner,
  initialOrigin = '',
  initialDestination = '',
}) => {
  const initialSearchRoute = parseSearchRoute(window.location.search);
  // Booking and trip lifecycle are owned by ProductionMarketplace/API.
  const [subView, setSubView] = useState<'form' | 'results' | 'map_details'>(() => {
    if (initialSearchRoute) return 'results';
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'results') return 'results';
    if (v === 'map' || v === 'map_details') return 'map_details';
    return 'form';
  });
  const [showFiltersModal, setShowFiltersModal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'filters';
  });

  // Search form fields
  const [origin, setOrigin] = useState<RoutePlace>({
    ...(initialSearchRoute?.origin ?? { label: initialOrigin }),
  });
  const [destination, setDestination] = useState<RoutePlace>({
    ...(initialSearchRoute?.destination ?? { label: initialDestination }),
  });

  const [dateStr, setDateStr] = useState(() => {
    if (initialSearchRoute) return initialSearchRoute.date;
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  });
  const [timeStr, setTimeStr] = useState(() => initialSearchRoute?.departure.match(/T(\d{2}:\d{2})/)?.[1] ?? '18:30');
  const [timeMode, setTimeMode] = useState<'now' | 'depart_at' | 'arrive_by'>('depart_at');
  const [passengers, setPassengers] = useState(initialSearchRoute?.passengers ?? 1);
  const restoreRouteRef = useRef<SearchRouteState | null>(initialSearchRoute);

  // Filters State
  const [filters, setFilters] = useState<SearchFiltersState>({
    modes: new Set<SearchTransportMode>(['all']),
    maxPrice: 2000,
    maxDurationHours: 12,
    maxTransfers: 'any',
    minRating: 0,
    onlyVerified: false,
    airConditioning: false,
    wifi: false,
  });

  // Filter mode tab inside results view (Screen 2: All 32, Carpool 8, Bus 6, etc.)
  const [resultsFilterMode, setResultsFilterMode] = useState<SearchTransportMode>('all');

  // Search results & loading state
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<RouteSearchResultItem[]>(() =>
    []
  );
  const [selectedItem, setSelectedItem] = useState<RouteSearchResultItem | null>(() =>
    null
  );
  const filteredResults = results.filter((item) =>
    (filters.modes.has('all') || filters.modes.has(item.type)) &&
    item.priceMinor <= filters.maxPrice * 100 &&
    (item.durationSeconds === 0 || item.durationSeconds <= filters.maxDurationHours * 3600) &&
    (item.driver?.rating ?? 0) >= filters.minRating
  );

  // Sync initial props
  useEffect(() => {
    if (initialOrigin) {
      setOrigin((current) => current.label === initialOrigin ? current : { label: initialOrigin });
    }
    if (initialDestination) {
      setDestination((current) => current.label === initialDestination ? current : { label: initialDestination });
    }
  }, [initialOrigin, initialDestination]);

  // Execute unified search
  const handleExecuteSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setSubView('results');

    try {
      if (!origin.label.trim() || !destination.label.trim()) throw new Error('Вкажіть початковий пункт і пункт призначення.');
      if (origin.label.trim().toLocaleLowerCase('uk-UA') === destination.label.trim().toLocaleLowerCase('uk-UA')) {
        throw new Error('Початковий пункт і пункт призначення мають відрізнятися.');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('Оберіть коректну дату поїздки.');
      if (timeMode !== 'now' && !/^\d{2}:\d{2}$/.test(timeStr)) throw new Error('Оберіть коректний час відправлення.');
      if (!origin.providerId || !destination.providerId || origin.latitude == null || origin.longitude == null
        || destination.latitude == null || destination.longitude == null) {
        throw new Error('Оберіть початковий пункт і призначення з результатів геокодера.');
      }
      const offersRes = await productionApi.offers({
          origin: origin.label.split(',')[0].trim(),
          destination: destination.label.split(',')[0].trim(),
          date: dateStr,
          seats: passengers,
          ...(origin.longitude != null && origin.latitude != null
            ? { originCoordinates: [origin.longitude, origin.latitude] as [number, number] }
            : {}),
          ...(destination.longitude != null && destination.latitude != null
            ? { destinationCoordinates: [destination.longitude, destination.latitude] as [number, number] }
            : {}),
        });

      const items = offersToSearchItems(offersRes, dateStr, timeStr, timeMode);
      setResults(items);
      setSelectedItem(items[0] ?? null);
      const route = buildSearchRoute({
        origin: { label: origin.label, latitude: origin.latitude!, longitude: origin.longitude!, providerId: origin.providerId! },
        destination: { label: destination.label, latitude: destination.latitude!, longitude: destination.longitude!, providerId: destination.providerId! },
        date: dateStr,
        passengers,
        departure: `${dateStr}T${timeStr}:00`,
        strategy: 'BALANCED',
        mode: 'offers',
      });
      window.history.pushState({ marshgoRoute: true }, '', route);
    } catch (error) {
      setResults([]);
      setSelectedItem(null);
      setSearchError(error instanceof Error ? error.message : 'Не вдалося виконати пошук. Перевірте з’єднання та спробуйте ще раз.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const route = restoreRouteRef.current;
    if (!route) return;
    restoreRouteRef.current = null;
    let active = true;
    setIsSearching(true);
    void productionApi.offers({
      origin: route.origin.label,
      destination: route.destination.label,
      date: route.date,
      seats: route.passengers,
      originCoordinates: [route.origin.longitude, route.origin.latitude],
      destinationCoordinates: [route.destination.longitude, route.destination.latitude],
    }).then((offers) => {
      if (!active) return;
      const restoredTime = route.departure.match(/T(\d{2}:\d{2})/)?.[1] ?? '18:30';
      const items = offersToSearchItems(offers, route.date, restoredTime, 'depart_at');
      setResults(items);
      setSelectedItem(items[0] ?? null);
      setSubView('results');
    }).catch((error: unknown) => {
      if (active) setSearchError(error instanceof Error ? error.message : 'Не вдалося відновити результати пошуку.');
    }).finally(() => { if (active) setIsSearching(false); });
    return () => { active = false; };
  }, []);

  // Card clicked -> open Screen 3 (Map details)
  const handleSelectResultItem = (item: RouteSearchResultItem) => {
    setSelectedItem(item);
    setSubView('map_details');
    if (item.offerId && !item.routeGeometry) {
      void productionApi.offer(item.offerId).then((offer) => {
        if (offer.route_geometry?.length) {
          setSelectedItem((current) => current?.offerId === offer.id
            ? { ...current, routeGeometry: offer.route_geometry ?? undefined }
            : current);
        }
      }).catch(() => undefined);
    }
  };

  // Booking from the preview opens the real offer flow in the parent app.
  // Never mark a trip confirmed in the UI before the API confirms a booking.
  const handleBookItem = (item: RouteSearchResultItem) => {
    if (!item.offerId || !onBookOfferId) return;
    onBookOfferId(item.offerId, passengers);
  };

  // Switch popular route
  const handleSelectQuickRoute = (fromCity: string, toCity: string) => {
    setOrigin({
      label: `${fromCity}, Центр`,
    });
    setDestination({
      label: `${toCity}, Центр`,
    });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white transition-colors duration-200">
      {/* SCREEN 1: SEARCH FORM */}
      {subView === 'form' && (
        <div className="mx-auto flex flex-col min-h-screen max-w-md pb-24">
          {/* Header Block A: Logo, City, Notifications, Profile, Theme Toggle */}
          <SearchHeader
            currentCity={origin.label.split(',')[0] || 'Україна'}
            onSelectCity={(city) => setOrigin({ label: `${city}, Центр` })}
            onOpenNotifications={() => onOpenNotifications?.()}
            unreadCount={unreadNotificationCount}
          />

          {/* Header Block B: Title & Subtitle */}
          <div className="px-5 pt-3 pb-4">
            <h1 className="text-[28px] font-black tracking-tight text-[#081B35] dark:text-white leading-[1.15]">
              Знайди маршрут
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#63738C] dark:text-slate-400">
              Реальні пропозиції водіїв MARSHGO
            </p>
          </div>

          {/* Form Container */}
          <div className="px-5 space-y-3.5">
            {/* Block C: Origin / Destination Inputs */}
            <RouteInputs
              origin={origin}
              destination={destination}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
            />

            {/* Block D: Date, Time, Passengers Row */}
            <DateTimePassengers
              dateStr={dateStr}
              timeStr={timeStr}
              timeMode={timeMode}
              passengers={passengers}
              onDateChange={setDateStr}
              onTimeChange={setTimeStr}
              onTimeModeChange={setTimeMode}
              onPassengersChange={setPassengers}
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
              Тут показані оголошення спільних поїздок. Розклади автобусів і поїздів поки не входять до цієї видачі.
            </div>

            {/* Block F: Primary CTA Button (Placed immediately after modes & strategy as required) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecuteSearch}
                disabled={isSearching}
                className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0866F5] py-4 text-base font-black text-white shadow-xl shadow-[#0866F5]/25 hover:bg-[#0755CA] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Search size={19} strokeWidth={2.5} />
                <span>{isSearching ? 'Шукаємо маршрути…' : 'Знайти маршрут'}</span>
                <ArrowRight
                  size={19}
                  strokeWidth={2.5}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>

            {onOpenJourneyPlanner && (
              <button
                type="button"
                onClick={() => onOpenJourneyPlanner({ origin, destination, date: dateStr, time: timeStr, passengers })}
                className="w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 dark:border-blue-900 dark:bg-[#0B1730] dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                Планувати маршрут
              </button>
            )}

            {/* City Skyline Illustration Banner (matching Screen 1 bottom) */}
            <div className="relative mt-4 w-full overflow-hidden rounded-2xl border border-blue-100/80 dark:border-slate-800/80 bg-linear-to-b from-sky-50/50 to-white dark:from-slate-900/40 dark:to-slate-900">
              <img
                src="/search_city_banner.png"
                alt="Поїздки Україною"
                className="w-full h-24 object-cover object-bottom"
              />
            </div>

            {/* 3 Trust Badges (Screen 1 bottom) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-[#0B1730] p-2 text-center border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-[#0866F5] dark:bg-blue-950/60 text-xs font-black">
                  %
                </div>
                <span className="mt-1 text-[10px] font-bold text-[#081B35] dark:text-slate-200 leading-tight">
                  0% комісії
                </span>
                <span className="text-[9px] text-[#63738C] dark:text-slate-400">
                  для попуток
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-[#0B1730] p-2 text-center border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 text-xs">
                  <ShieldCheck size={14} />
                </div>
                <span className="mt-1 text-[10px] font-bold text-[#081B35] dark:text-slate-200 leading-tight">Оголошення водіїв</span>
                <span className="text-[9px] text-[#63738C] dark:text-slate-400">із даними профілю</span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-white dark:bg-[#0B1730] p-2 text-center border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-950/60 text-xs">
                  <Send size={13} />
                </div>
                <span className="mt-1 text-[10px] font-bold text-[#081B35] dark:text-slate-200 leading-tight">
                  Пошук
                </span>
                <span className="text-[9px] text-[#63738C] dark:text-slate-400">
                  по маршруту
                </span>
              </div>
            </div>

            {/* Block H: Quick Popular Routes */}
            <div className="pt-3">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-xs font-black text-[#63738C] dark:text-slate-400 uppercase tracking-wider">
                  Популярні маршрути
                </h3>
                <span className="text-[11px] font-bold text-[#0866F5]">
                  Усі
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  { from: 'Львів', to: 'Київ' },
                  { from: 'Львів', to: 'Івано-Франківськ' },
                  { from: 'Київ', to: 'Одеса' },
                ].map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectQuickRoute(r.from, r.to)}
                    className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-[#0B1730] px-3.5 py-2.5 border border-slate-100 dark:border-slate-800 text-left transition hover:border-blue-200 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#0866F5]" />
                      <span className="text-xs font-extrabold text-[#081B35] dark:text-white">
                        {r.from} → {r.to}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">Заповнити маршрут</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: SEARCH RESULTS LIST */}
      {subView === 'results' && (
        <SearchResultsList
          originTitle={origin.label}
          destTitle={destination.label}
          dateStr={dateStr}
          timeStr={timeStr}
          passengers={passengers}
          isLoading={isSearching}
          error={searchError}
          onRetry={() => void handleExecuteSearch()}
          items={filteredResults}
          selectedFilterMode={resultsFilterMode}
          onSelectFilterMode={setResultsFilterMode}
          onOpenFiltersModal={() => setShowFiltersModal(true)}
          onSelectResultItem={handleSelectResultItem}
          onBackToSearchForm={() => setSubView('form')}
          onOpenReverseMarketplace={() => {
            if (onOpenReverseMarketplace) {
              onOpenReverseMarketplace(origin.label, destination.label);
            }
          }}
        />
      )}

      {/* SCREEN 3: MAP DETAILS VIEW */}
      {subView === 'map_details' && selectedItem && (
        <SearchMapDetails
          item={selectedItem}
          originTitle={origin.label}
          destTitle={destination.label}
          dateStr={dateStr}
          timeStr={timeStr}
          passengers={passengers}
          onBackToResults={() => setSubView('results')}
          onBook={handleBookItem}
        />
      )}

      {/* SCREEN 4: SEARCH FILTERS MODAL */}
      <SearchFiltersModal
        isOpen={showFiltersModal}
        filters={filters}
        totalResultsCount={filteredResults.length}
        onClose={() => setShowFiltersModal(false)}
        onChangeFilters={(updated) => {
          setFilters(updated);
          setShowFiltersModal(false);
        }}
      />

    </div>
  );
};
