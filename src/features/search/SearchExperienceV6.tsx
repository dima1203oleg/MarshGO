import React, { useState, useEffect, useRef } from 'react';
import { productionApi } from '../../services/productionApi';
import type { ApiJourney, ApiTransportProviders } from '../../services/productionApi';
import { toJourneyPreferences, type TransportSelection } from '../../domain/transportPreferences';
import type { RoutePlace, RouteSearchResultItem, SearchFiltersState, SearchStrategyMode, SearchTransportMode } from './model/types';
import { SearchResultsList } from './components/SearchResultsList';
import { SearchMapForm } from './components/SearchMapForm';
import { SearchMapDetails } from './components/SearchMapDetails';
import { SearchFiltersModal } from './components/SearchFiltersModal';
import { rankSearchResults } from './model/multimodalEngine';
import { buildSearchRoute, parseSearchRoute, type SearchRouteState } from '../../routing/searchRouteState';
import { formatKyivDateTimeInput, kyivDateTimeInputToDate, kyivDateTimeInputToIso, todayKyivDate } from '../../domain/kyivTime';


interface SearchExperienceV6Props {
  onBookOfferId?: (offerId: string, passengerCount: number, journey?: { journeyId: string; journeyLegId: string }) => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onOpenReverseMarketplace?: (origin: string, destination: string) => void;
  onOpenPointPicker?: (field: 'origin' | 'destination') => void;
  onSubViewChange?: (view: 'form' | 'results' | 'map_details') => void;
  transportSelection: TransportSelection;
  onTransportSelectionChange: (selection: TransportSelection) => void;
  initialStrategy?: SearchStrategyMode;
  initialOrigin?: string;
  initialDestination?: string;
}

function offersToSearchItems(
  offers: Awaited<ReturnType<typeof productionApi.offers>>,
  date: string,
  time: string,
  timeMode: 'now' | 'depart_at' | 'arrive_by',
): RouteSearchResultItem[] {
  const threshold = timeMode === 'now' ? Date.now() : kyivDateTimeInputToDate(`${date}T${time}`)?.getTime() ?? Number.POSITIVE_INFINITY;
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
      departureTime: formatKyivDateTimeInput(offer.departure_at).slice(11),
      arrivalTime: offer.arrival_at
        ? formatKyivDateTimeInput(offer.arrival_at).slice(11)
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

function journeyResultsToSearchItems(journeys: ApiJourney[]): RouteSearchResultItem[] {
  const modeMeta: Record<string, { type: SearchTransportMode; label: string }> = {
    WALK: { type: 'walk', label: 'Пішки' },
    COMMUNITY: { type: 'carpool', label: 'Попутка' },
    BUS: { type: 'bus', label: 'Автобус' },
    MINIBUS: { type: 'minibus', label: 'Маршрутка' },
    TRAM: { type: 'tram', label: 'Трамвай' },
    TROLLEYBUS: { type: 'trolleybus', label: 'Тролейбус' },
    METRO: { type: 'metro', label: 'Метро' },
    RAIL: { type: 'train', label: 'Поїзд' },
    TAXI: { type: 'taxi', label: 'Таксі' },
  };
  const formatTime = (value: string) => new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv',
  }).format(new Date(value));
  const formatDuration = (seconds: number) => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours} год ${minutes % 60} хв` : `${minutes} хв`;
  };
  const formatPrice = (minor: number) => `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(minor / 100)} грн`;

  return journeys.flatMap((journey) => {
    const first = journey.legs[0];
    const last = journey.legs.at(-1);
    if (!first || !last) return [];
    const visibleLegs = journey.legs.filter((leg) => leg.mode !== 'WALK');
    const primaryMode = modeMeta[visibleLegs[0]?.mode ?? ''] ?? { type: 'other' as const, label: 'Маршрут' };
    const price = journey.confirmedPriceMinor ?? journey.totalPriceMinor;
    const distanceKnown = journey.legs.every((leg) => leg.mode === 'WALK' || leg.distanceMeters !== null);
    const distanceMeters = distanceKnown
      ? journey.legs.reduce((sum, leg) => sum + (leg.distanceMeters ?? 0), 0)
      : null;
    const legs: NonNullable<RouteSearchResultItem['legs']> = journey.legs.map((leg) => {
      const meta = modeMeta[leg.mode] ?? { type: 'other' as const, label: leg.mode };
      return {
        id: leg.id,
        mode: meta.type,
        modeLabel: meta.label,
        carrierName: leg.providerName ?? leg.driver?.name ?? '',
        originName: leg.origin.name,
        destinationName: leg.destination.name,
        departureTime: leg.departureAt,
        arrivalTime: leg.arrivalAt,
        durationLabel: formatDuration(leg.durationSeconds),
        durationSeconds: leg.durationSeconds,
        priceMinor: leg.priceMinor ?? undefined,
        routeName: leg.routeName,
        source: leg.source,
        priceStatus: leg.priceStatus,
        availabilityStatus: leg.availabilityStatus,
        distanceMeters: leg.distanceMeters,
      };
    });
    const strategy = journey.strategy === 'CUSTOM' ? 'BALANCED' : journey.strategy;
    const badge = strategy === 'FASTEST' ? 'Найшвидший серед знайдених'
      : strategy === 'CHEAPEST' ? 'Найдешевший серед маршрутів із відомою ціною'
        : strategy === 'BALANCED' ? 'Оптимальний серед знайдених' : undefined;
    return [{
      id: journey.id,
      type: primaryMode.type,
      modeLabel: journey.legs.length > 1 ? 'Комбінований маршрут' : primaryMode.label,
      badge,
      badgeType: strategy === 'FASTEST' ? 'fastest' : strategy === 'CHEAPEST' ? 'cheapest' : 'best',
      source: journey.source === 'gtfs-static' ? 'gtfs' : 'community',
      carrierName: journey.providerName ?? first.providerName ?? primaryMode.label,
      driver: first.driver ? {
        name: first.driver.name,
        rating: first.driver.averageRating,
        reviewCount: first.driver.reviewCount,
        verified: false,
      } : undefined,
      departureTime: formatTime(first.departureAt),
      arrivalTime: formatTime(last.arrivalAt),
      departureCity: first.origin.name,
      arrivalCity: last.destination.name,
      departureAddress: first.origin.name,
      arrivalAddress: last.destination.name,
      durationLabel: formatDuration(journey.totalDurationSeconds),
      distanceLabel: distanceMeters === null ? 'Відстань маршруту не надана' : `${(distanceMeters / 1000).toFixed(1)} км`,
      distanceMeters,
      durationSeconds: journey.totalDurationSeconds,
      priceMinor: price,
      priceLabel: price === null ? 'Ціну не надано' : formatPrice(price),
      priceStatus: journey.confirmedPriceMinor !== null ? 'LOCKED' : price === null ? 'UNKNOWN' : 'ESTIMATED',
      availabilityStatus: visibleLegs.every((leg) => leg.availabilityStatus === 'AVAILABLE') ? 'AVAILABLE' : 'UNKNOWN',
      priceUnit: 'за всю поїздку',
      isPriceFixed: journey.confirmedPriceMinor !== null,
      features: journey.source === 'gtfs-static' ? ['Розклад GTFS', 'Наявність не підтверджена'] : [],
      stopsCount: journey.legs.length,
      journeyId: journey.id,
      journeyLegId: journey.legs.find((leg) => leg.offerId === journey.offerId)?.id
        ?? journey.legs.find((leg) => leg.offerId)?.id,
      offerId: journey.offerId ?? undefined,
      isMultimodal: visibleLegs.length > 1 || journey.legs.some((leg) => leg.mode === 'WALK'),
      transfers: journey.transfers,
      strategyWinner: strategy,
      reliabilityScore: journey.reliabilityScore === null ? undefined : journey.reliabilityScore * 100,
      legs,
    }];
  });
}

async function resolveCityPlace(city: string, contextLabel?: string): Promise<RoutePlace> {
  const query = city.trim();
  let matches = await productionApi.suggestPlaces(query).catch(() => []);
  if (!matches.length) {
    matches = await productionApi.suggestPlaces(`${query}, центр`).catch(() => []);
  }
  let match = matches[0];
  if (contextLabel) {
    const cityMatch = matches.find((place) =>
      contextLabel.split(',').some((part) => part.trim().length > 3 && place.label.includes(part.trim()))
    );
    if (cityMatch) match = cityMatch;
  }
  if (!match || match.latitude == null || match.longitude == null) {
    throw new Error(`Не вдалося підтвердити координати точки «${city}». Оберіть адресу зі списку.`);
  }
  return { label: match.label, latitude: match.latitude, longitude: match.longitude, providerId: match.providerId };
}

export const SearchExperienceV6: React.FC<SearchExperienceV6Props> = ({
  onBookOfferId,
  onOpenNotifications: _onOpenNotifications,
  unreadNotificationCount: _unreadNotificationCount = 0,
  onOpenReverseMarketplace,
  onOpenPointPicker,
  onSubViewChange,
  transportSelection,
  onTransportSelectionChange,
  initialStrategy = 'BALANCED',
  initialOrigin = '',
  initialDestination = '',
}) => {
  const initialSearchRoute = parseSearchRoute(window.location.search);
  // Booking and trip lifecycle are owned by ProductionMarketplace/API.
  const [subView, setSubViewState] = useState<'form' | 'results' | 'map_details'>(() => {
    if (initialSearchRoute) return 'results';
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'results') return 'results';
    if (v === 'map' || v === 'map_details') return 'map_details';
    return 'form';
  });

  const setSubView = (nextView: 'form' | 'results' | 'map_details') => {
    setSubViewState(nextView);
    onSubViewChange?.(nextView);
  };

  const [showFiltersModal, setShowFiltersModal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'filters';
  });

  // Empty coordinates stay unresolved until the user selects a real place result.
  const [origin, setOrigin] = useState<RoutePlace>(() => ({
    label: initialSearchRoute?.origin?.label || initialOrigin || '',
    latitude: initialSearchRoute?.origin?.latitude,
    longitude: initialSearchRoute?.origin?.longitude,
    providerId: initialSearchRoute?.origin?.providerId,
  }));
  const [destination, setDestination] = useState<RoutePlace>(() => ({
    label: initialSearchRoute?.destination?.label || initialDestination || '',
    latitude: initialSearchRoute?.destination?.latitude,
    longitude: initialSearchRoute?.destination?.longitude,
    providerId: initialSearchRoute?.destination?.providerId,
  }));

  const [dateStr, setDateStr] = useState(() => {
    if (initialSearchRoute) return initialSearchRoute.date;
    return todayKyivDate();
  });
  const [timeStr, setTimeStr] = useState(() => initialSearchRoute?.departure.match(/T(\d{2}:\d{2})/)?.[1] ?? '18:30');
  const [timeMode, setTimeMode] = useState<'now' | 'depart_at' | 'arrive_by'>('depart_at');
  const [passengers, setPassengers] = useState(initialSearchRoute?.passengers ?? 1);
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategyMode>(() => initialSearchRoute?.strategy === 'CUSTOM' ? initialStrategy : initialSearchRoute?.strategy ?? initialStrategy);
  const restoreRouteRef = useRef<SearchRouteState | null>(initialSearchRoute);
  const rawOfferItemsRef = useRef<RouteSearchResultItem[]>([]);
  const [searchProviderGroups, setSearchProviderGroups] = useState<ApiTransportProviders[] | null>(null);

  const handleSelectStrategy = (newStrategy: SearchStrategyMode) => {
    setSearchStrategy(newStrategy);
    if (results.length > 0) {
      void handleSearchJourneys({ strategy: newStrategy });
    }
  };

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

  // Filter mode tab inside results view (Screen 2: all modes and supported categories).
  const [resultsFilterMode, setResultsFilterMode] = useState<SearchTransportMode>('all');

  // Search results & loading state
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [results, setResults] = useState<RouteSearchResultItem[]>(() =>
    []
  );
  const [selectedItem, setSelectedItem] = useState<RouteSearchResultItem | null>(() =>
    null
  );
  const [selectedItemInitialMode, setSelectedItemInitialMode] = useState<'details' | 'map'>('details');
  const filteredResults = results.filter((item) =>
    (filters.modes.has('all') || filters.modes.has(item.type)) &&
    (item.priceMinor === null || item.priceMinor <= filters.maxPrice * 100) &&
    (item.durationSeconds === 0 || item.durationSeconds <= filters.maxDurationHours * 3600) &&
    (item.driver?.rating ?? 0) >= filters.minRating &&
    (filters.maxTransfers === 'any' ||
      (filters.maxTransfers === 'direct' && (item.transfers ?? 0) === 0) ||
      (filters.maxTransfers === 'one' && (item.transfers ?? 0) <= 1) ||
      (filters.maxTransfers === 'two_plus' && (item.transfers ?? 0) >= 2)) &&
    (!filters.onlyVerified || item.driver?.verified === true) &&
    (!filters.airConditioning || item.features.some((feature) => /кондиціон|кондиц/i.test(feature))) &&
    (!filters.wifi || item.features.some((feature) => /wi-?fi/i.test(feature)))
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

  useEffect(() => {
    if (origin.latitude == null || origin.longitude == null) {
      setSearchProviderGroups(null);
      return;
    }
    let current = true;
    setSearchProviderGroups(null);
    productionApi.providersByTransport({ latitude: origin.latitude, longitude: origin.longitude }).then((groups) => {
      if (current) {
        setSearchProviderGroups(groups);
      }
    }).catch(() => {
      if (current) {
        setSearchProviderGroups([]);
      }
    });
    return () => { current = false; };
  }, [origin.latitude, origin.longitude, origin.label]);

  const handleSearchJourneys = async (request?: {
    origin?: RoutePlace;
    destination?: RoutePlace;
    date?: string;
    time?: string;
    passengers?: number;
    strategy?: SearchStrategyMode;
    timeMode?: 'now' | 'depart_at' | 'arrive_by';
    departureAt?: string;
  }) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchNotice(null);
    setSubView('results');

    try {
      let effectiveOrigin = request?.origin ?? origin;
      let effectiveDestination = request?.destination ?? destination;
      const effectiveDate = request?.date ?? dateStr;
      const effectiveTime = request?.time ?? timeStr;
      const effectivePassengers = request?.passengers ?? passengers;
      const effectiveStrategy = request?.strategy ?? searchStrategy;
      const effectiveTimeMode = request?.timeMode ?? timeMode;
      if (!effectiveOrigin.label.trim() || !effectiveDestination.label.trim()) {
        throw new Error('Вкажіть початкову точку й пункт призначення.');
      }
      if (effectiveOrigin.latitude == null || effectiveOrigin.longitude == null) {
        effectiveOrigin = await resolveCityPlace(effectiveOrigin.label, effectiveDestination.label);
        setOrigin(effectiveOrigin);
      }
      if (effectiveDestination.latitude == null || effectiveDestination.longitude == null) {
        effectiveDestination = await resolveCityPlace(effectiveDestination.label, effectiveOrigin.label);
        setDestination(effectiveDestination);
      }
      if (effectiveOrigin.label.trim().toLocaleLowerCase('uk-UA') === effectiveDestination.label.trim().toLocaleLowerCase('uk-UA')) {
        throw new Error('Початковий пункт і пункт призначення мають відрізнятися.');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) throw new Error('Оберіть коректну дату поїздки.');
      if (effectiveTimeMode === 'arrive_by') throw new Error('Пошук із часом прибуття поки не підтримує маршрутний API. Оберіть час відправлення.');
      if (effectiveTimeMode !== 'now' && !/^\d{2}:\d{2}$/.test(effectiveTime)) throw new Error('Оберіть коректний час відправлення.');
      const checkedDate = new Date(`${effectiveDate}T00:00:00.000Z`);
      if (!Number.isFinite(checkedDate.getTime()) || checkedDate.toISOString().slice(0, 10) !== effectiveDate) throw new Error('Оберіть коректну дату поїздки.');
      const departureAt = request?.departureAt ?? (effectiveTimeMode === 'now'
        ? new Date().toISOString()
        : kyivDateTimeInputToIso(`${effectiveDate}T${effectiveTime}`));
      if (!departureAt) throw new Error('Цей час не існує через перехід на літній або зимовий час. Оберіть інший час.');

      const result = await productionApi.searchJourneys({
        origin: { name: effectiveOrigin.label, coordinates: [effectiveOrigin.longitude!, effectiveOrigin.latitude!] },
        destination: { name: effectiveDestination.label, coordinates: [effectiveDestination.longitude!, effectiveDestination.latitude!] },
        departureAt,
        passengers: effectivePassengers,
        strategy: effectiveStrategy,
        preferences: toJourneyPreferences(transportSelection, searchProviderGroups),
      });
      const items = journeyResultsToSearchItems(result.journeys);
      setResults(items);
      if (items[0]) handleOpenResultOnMap(items[0]);
      else {
        setSelectedItem(null);
        setSubView('results');
      }
      const notices = [
        ...(result.partial ? ['Результат частковий: враховано лише доступні джерела в цьому коридорі.'] : []),
        ...(result.unsupportedPreferences.includes('CHEAPEST:public-transit-fares-unavailable')
          ? ['Найдешевший маршрут не визначено: у розкладах немає підтверджених тарифів.'] : []),
        ...(result.unsupportedPreferences.filter((value) => value.startsWith('transportType:')).length
          ? [`Не входять до побудови: ${result.unsupportedPreferences.filter((value) => value.startsWith('transportType:')).map((value) => value.split(':')[1]).join(', ')}.`] : []),
        ...(result.providerErrors.length ? [`Джерела тимчасово недоступні: ${result.providerErrors.join('; ')}.`] : []),
      ];
      setSearchNotice(notices.join(' '));
      const route = buildSearchRoute({
        origin: { ...effectiveOrigin, latitude: effectiveOrigin.latitude!, longitude: effectiveOrigin.longitude!, providerId: effectiveOrigin.providerId ?? 'selected-point' },
        destination: { ...effectiveDestination, latitude: effectiveDestination.latitude!, longitude: effectiveDestination.longitude!, providerId: effectiveDestination.providerId ?? 'selected-point' },
        date: effectiveDate,
        passengers: effectivePassengers,
        departure: departureAt,
        strategy: effectiveStrategy,
        mode: 'planner',
      });
      window.history.pushState({ marshgoRoute: true }, '', route);
    } catch (error) {
      setResults([]);
      setSelectedItem(null);
      setSearchNotice(null);
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
    const strategy = route.strategy === 'CUSTOM' ? 'BALANCED' : route.strategy;
    const restore = route.mode === 'planner'
      ? productionApi.searchJourneys({
        origin: { name: route.origin.label, coordinates: [route.origin.longitude, route.origin.latitude] },
        destination: { name: route.destination.label, coordinates: [route.destination.longitude, route.destination.latitude] },
        departureAt: route.departure,
        passengers: route.passengers,
        strategy,
        preferences: toJourneyPreferences(transportSelection, searchProviderGroups),
      }).then((result) => {
        if (!active) return;
        const items = journeyResultsToSearchItems(result.journeys);
        setResults(items);
        if (items[0]) handleOpenResultOnMap(items[0]);
        else {
          setSelectedItem(null);
          setSubView('results');
        }
        setSearchNotice(result.partial ? 'Результат частковий: враховано лише доступні джерела в цьому коридорі.' : null);
      })
      : productionApi.offers({
        origin: route.origin.label,
        destination: route.destination.label,
        date: route.date,
        seats: route.passengers,
        originCoordinates: [route.origin.longitude, route.origin.latitude],
        destinationCoordinates: [route.destination.longitude, route.destination.latitude],
      }).then((offers) => {
        if (!active) return;
        const restoredTime = route.departure.match(/T(\d{2}:\d{2})/)?.[1] ?? '18:30';
        const offerItems = offersToSearchItems(offers, route.date, restoredTime, 'depart_at');
        rawOfferItemsRef.current = offerItems;
        const items = rankSearchResults(offerItems, strategy);
        setResults(items);
        setSelectedItem(items[0] ?? null);
        setSubView('results');
      });
    void restore.catch((error: unknown) => {
      if (active) setSearchError(error instanceof Error ? error.message : 'Не вдалося відновити результати пошуку.');
    }).finally(() => { if (active) setIsSearching(false); });
    return () => { active = false; };
  }, []);

  // Card clicked -> open Screen 3 (Map details)
  const handleSelectResultItem = (item: RouteSearchResultItem) => {
    setSelectedItem(item);
    setSelectedItemInitialMode('details');
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

  const handleOpenResultOnMap = (item: RouteSearchResultItem) => {
    setSelectedItem(item);
    setSelectedItemInitialMode('map');
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
    onBookOfferId(item.offerId, passengers, item.journeyId && item.journeyLegId
      ? { journeyId: item.journeyId, journeyLegId: item.journeyLegId }
      : undefined);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white transition-colors duration-200">
      {/* SCREEN 1: MAP-FIRST SEARCH */}
      {subView === 'form' && (
        <SearchMapForm
          origin={origin}
          destination={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onOpenMapPicker={onOpenPointPicker}
          dateStr={dateStr}
          timeStr={timeStr}
          timeMode={timeMode}
          passengers={passengers}
          onDateChange={setDateStr}
          onTimeChange={setTimeStr}
          onTimeModeChange={setTimeMode}
          onPassengersChange={setPassengers}
          selection={transportSelection}
          groups={searchProviderGroups}
          onSelectionChange={onTransportSelectionChange}
          strategy={searchStrategy}
          onStrategyChange={handleSelectStrategy}
          onSearch={() => void handleSearchJourneys()}
          isSearching={isSearching}
          isResolvingPlaces={isResolvingPlaces}
          error={searchError}
        />
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
          onRetry={() => void handleSearchJourneys()}
          notice={searchNotice}
          items={filteredResults}
          selectedFilterMode={resultsFilterMode}
          onSelectFilterMode={setResultsFilterMode}
          selectedStrategy={searchStrategy}
          onSelectStrategy={handleSelectStrategy}
          onOpenFiltersModal={() => setShowFiltersModal(true)}
          onSelectResultItem={handleSelectResultItem}
          onOpenMapView={() => { const firstResult = filteredResults.find((item) => resultsFilterMode === 'all' || item.type === resultsFilterMode); if (firstResult) handleOpenResultOnMap(firstResult); }}
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
          notice={searchNotice}
          dateStr={dateStr}
          timeStr={timeStr}
          passengers={passengers}
          initialMode={selectedItemInitialMode}
          onBackToResults={() => setSubView('results')}
          onSwapRoute={() => {
            setOrigin(destination);
            setDestination(origin);
          }}
          onBook={handleBookItem}
        />
      )}
      {subView === 'map_details' && !selectedItem && (
        <div className="mx-auto flex min-h-[70svh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
          <p className="text-base font-bold">Маршрут не вибрано</p>
          <p className="mt-2 text-sm text-slate-500">Поверніться до результатів і відкрийте маршрут, отриманий від провайдера.</p>
          <button type="button" onClick={() => setSubView('results')} className="mt-4 rounded-xl bg-[#0066FF] px-5 py-3 text-sm font-bold text-white">До результатів</button>
        </div>
      )}

      {/* SCREEN 4: SEARCH FILTERS MODAL */}
      <SearchFiltersModal
        isOpen={showFiltersModal}
        filters={filters}
        totalResultsCount={filteredResults.length}
        onClose={() => setShowFiltersModal(false)}
        onChangeFilters={(updated) => {
          setFilters(updated);
        }}
      />

    </div>
  );
};
