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
import { presentJourneyLeg } from './model/transportPresentation';
import { buildSearchRoute, parseSearchRoute, type SearchRouteState } from '../../routing/searchRouteState';
import { formatKyivDateTimeInput, kyivDateTimeInputToDate, kyivDateTimeInputToIso, todayKyivDate } from '../../domain/kyivTime';


interface SearchExperienceV6Props {
  onBookOfferId?: (offerId: string, passengerCount: number, journey?: { journeyId: string; journeyLegId: string }) => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onOpenReverseMarketplace?: (origin: string, destination: string) => void;
  onOpenPointPicker?: (field: 'origin' | 'destination') => void;
  onBackToHome?: () => void;
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
    const primaryMode = visibleLegs[0]
      ? presentJourneyLeg(visibleLegs[0].mode, visibleLegs[0].transportType)
      : { type: 'other' as const, label: 'Маршрут' };
    const price = journey.confirmedPriceMinor ?? journey.totalPriceMinor;
    const distanceKnown = journey.legs.every((leg) => leg.mode === 'WALK' || leg.distanceMeters !== null);
    const distanceMeters = distanceKnown
      ? journey.legs.reduce((sum, leg) => sum + (leg.distanceMeters ?? 0), 0)
      : null;
    const legs: NonNullable<RouteSearchResultItem['legs']> = journey.legs.map((leg) => {
      const meta = presentJourneyLeg(leg.mode, leg.transportType);
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
        coordinates: leg.coordinates,
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

function journeySearchNotice(result: Awaited<ReturnType<typeof productionApi.searchJourneys>>): string | null {
  const unsupportedTypes = result.unsupportedPreferences
    .filter((value) => value.startsWith('transportType:'))
    .map((value) => value.split(':')[1]);
  const transportLabels: Record<string, string> = {
    bus: 'автобуси', marshrutka: 'маршрутки', trolleybus: 'тролейбуси', tram: 'трамваї',
    metro: 'метро', train: 'поїзди', carpool: 'попутки', taxi: 'таксі', bike: 'велосипеди', scooter: 'самокати',
  };
  const notices = [
    ...(result.partial ? ['Результат частковий: враховано лише доступні джерела в цьому коридорі.'] : []),
    ...(result.unsupportedPreferences.includes('CHEAPEST:public-transit-fares-unavailable')
      ? ['Найдешевший маршрут не визначено: у розкладах немає підтверджених тарифів.'] : []),
    ...(unsupportedTypes.includes('marshrutka')
      ? ['Пошуковий розклад не відокремлює маршрутки від автобусів; live-позиції можуть надходити окремо. Для побудови маршруту за розкладом оберіть «Автобуси».']
      : unsupportedTypes.length
        ? [`У цьому коридорі немає підключеного джерела для: ${unsupportedTypes.map((type) => transportLabels[type] ?? type).join(', ')}.`]
        : []),
    ...(result.providerErrors.length ? [`Джерела тимчасово недоступні: ${result.providerErrors.join('; ')}.`] : []),
  ];
  return notices.length ? notices.join(' ') : null;
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
  onOpenNotifications,
  unreadNotificationCount = 0,
  onOpenReverseMarketplace,
  onOpenPointPicker,
  onBackToHome,
  onSubViewChange,
  transportSelection,
  onTransportSelectionChange,
  initialStrategy = 'BALANCED',
  initialOrigin = '',
  initialDestination = '',
}) => {
  const initialSearchRoute = parseSearchRoute(window.location.search);
  const hasInitialSearchRoute = initialSearchRoute !== null;
  // Booking and trip lifecycle are owned by ProductionMarketplace/API.
  const [subView, setSubViewState] = useState<'form' | 'results' | 'map_details'>(() => {
    if (initialSearchRoute) return 'results';
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'results') return 'results';
    if (v === 'form') return 'form';
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

  // Default to Lviv reference points when none provided
  const [origin, setOrigin] = useState<RoutePlace>(() => ({
    label: initialSearchRoute?.origin?.label || initialOrigin || 'Малого Голоска',
    latitude: initialSearchRoute?.origin?.latitude ?? 49.8642,
    longitude: initialSearchRoute?.origin?.longitude ?? 24.0152,
    providerId: initialSearchRoute?.origin?.providerId,
  }));
  const [destination, setDestination] = useState<RoutePlace>(() => ({
    label: initialSearchRoute?.destination?.label || initialDestination || 'вул. Сихівська',
    latitude: initialSearchRoute?.destination?.latitude ?? 49.7915,
    longitude: initialSearchRoute?.destination?.longitude ?? 24.0628,
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
    maxPrice: 5000,
    maxDurationHours: 24,
    maxTransfers: 'any',
    minRating: 0,
    onlyVerified: false,
    airConditioning: false,
    wifi: false,
  });

  // Search results & loading state
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [results, setResults] = useState<RouteSearchResultItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RouteSearchResultItem | null>(null);
  const [selectedItemInitialMode, setSelectedItemInitialMode] = useState<'details' | 'map'>('map');
  const selectedModeAliases: Partial<Record<SearchTransportMode, string[]>> = {
    bus: ['bus', 'intercity_bus'],
    marshrutka: ['marshrutka', 'minibus'],
    train: ['train', 'suburban_train', 'city_train'],
  };
  const resultHasSelectedMode = (item: RouteSearchResultItem) => {
    if (filters.modes.has('all')) return true;
    const itemModes = [item.type, ...(item.legs ?? []).map((leg) => leg.mode)];
    return [...filters.modes].some((mode) => mode !== 'all'
      && (selectedModeAliases[mode] ?? [mode]).some((alias) => itemModes.includes(alias as SearchTransportMode)));
  };
  const filteredResults = results.filter((item) =>
    resultHasSelectedMode(item) &&
    (filters.maxPrice >= 5000 || item.priceMinor === null || item.priceMinor <= filters.maxPrice * 100) &&
    (filters.maxDurationHours >= 24 || item.durationSeconds === 0 || item.durationSeconds <= filters.maxDurationHours * 3600) &&
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
    // A shared planner URL carries geocoded endpoint data. Do not replace it
    // with the shell's display-only labels (for example, “Моє місцеперебування”)
    // or the restored search loses the coordinates required by the planner.
    if (hasInitialSearchRoute) return;
    if (initialOrigin) {
      setOrigin((current) => current.label === initialOrigin ? current : { label: initialOrigin });
    }
    if (initialDestination) {
      setDestination((current) => current.label === initialDestination ? current : { label: initialDestination });
    }
  }, [hasInitialSearchRoute, initialOrigin, initialDestination]);

  useEffect(() => {
    let current = true;
    setSearchProviderGroups(null);
    // Keep providers from both ends and the corridor available to the planner.
    // Restricting this list to the origin point hides destination-city feeds
    // (for example Lviv when travelling from Stryi) before the API can route.
    productionApi.providersByTransport().then((groups) => {
      if (current) {
        setSearchProviderGroups(groups);
      }
    }).catch(() => {
      if (current) {
        setSearchProviderGroups([]);
      }
    });
    return () => { current = false; };
  }, []);

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
      // The canonical post-search screen is the complete route list. Opening
      // the first result here hides every other option behind the map preview.
      setSelectedItem(null);
      setSubView('results');
      setSearchNotice(journeySearchNotice(result));
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
    const strategy = route.strategy === 'CUSTOM' ? 'BALANCED' : route.strategy;
    const restore = (async () => {
      if (route.mode === 'planner') {
        if (new Date(route.departure).getTime() <= Date.now()) {
          const suggestedDeparture = formatKyivDateTimeInput(new Date(Date.now() + 15 * 60_000));
          setDateStr(suggestedDeparture.slice(0, 10));
          setTimeStr(suggestedDeparture.slice(11, 16));
          setSearchError('Час у збереженому пошуку вже минув. Перевірте запропонований час і натисніть «Знайти маршрут».');
          setSubView('form');
          return;
        }
        const [restoredOrigin, restoredDestination] = await Promise.all([
          route.origin.latitude == null || route.origin.longitude == null
            ? resolveCityPlace(route.origin.label, route.destination.label)
            : Promise.resolve(route.origin),
          route.destination.latitude == null || route.destination.longitude == null
            ? resolveCityPlace(route.destination.label, route.origin.label)
            : Promise.resolve(route.destination),
        ]);
        if (!active) return;
        setOrigin(restoredOrigin);
        setDestination(restoredDestination);
        setIsSearching(true);
        const result = await productionApi.searchJourneys({
          origin: { name: restoredOrigin.label, coordinates: [restoredOrigin.longitude!, restoredOrigin.latitude!] },
          destination: { name: restoredDestination.label, coordinates: [restoredDestination.longitude!, restoredDestination.latitude!] },
          departureAt: route.departure,
          passengers: route.passengers,
          strategy,
          preferences: toJourneyPreferences(transportSelection, searchProviderGroups),
        });
        if (!active) return;
        const items = journeyResultsToSearchItems(result.journeys);
        setResults(items);
        setSelectedItem(null);
        setSubView('results');
        setSearchNotice(journeySearchNotice(result));
        return;
      }
      setIsSearching(true);
      const offers = await productionApi.offers({
        origin: route.origin.label,
        destination: route.destination.label,
        date: route.date,
        seats: route.passengers,
        ...(route.origin.latitude != null && route.origin.longitude != null
          ? { originCoordinates: [route.origin.longitude, route.origin.latitude] as [number, number] } : {}),
        ...(route.destination.latitude != null && route.destination.longitude != null
          ? { destinationCoordinates: [route.destination.longitude, route.destination.latitude] as [number, number] } : {}),
      });
      if (!active) return;
      const restoredTime = route.departure.match(/T(\d{2}:\d{2})/)?.[1] ?? '18:30';
      const offerItems = offersToSearchItems(offers, route.date, restoredTime, 'depart_at');
      rawOfferItemsRef.current = offerItems;
      const items = rankSearchResults(offerItems, strategy);
      setResults(items);
      setSelectedItem(items[0] ?? null);
      setSubView('results');
    })();
    void restore.catch((error: unknown) => {
      if (active) {
        setSearchError(error instanceof Error ? error.message : 'Не вдалося відновити результати пошуку.');
        setSubView('form');
      }
    }).finally(() => { if (active) setIsSearching(false); });
    return () => { active = false; };
  }, []);

  // The canonical sequence is results -> selected route map -> route details.
  const handleSelectResultItem = (item: RouteSearchResultItem) => {
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
    <div className="search-experience h-full min-h-0 w-full max-w-full overflow-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white transition-colors duration-200">
      {/* Canonical route form: route, date/time, all mode choices, then search. */}
      {subView === 'form' && (
        <SearchMapForm
          origin={origin}
          destination={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onOpenMapPicker={onOpenPointPicker}
          onBackToHome={onBackToHome}
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
          onSearch={() => void handleSearchJourneys()}
          isSearching={isSearching}
          isResolvingPlaces={isResolvingPlaces}
          error={searchError}
        />
      )}

      {subView === 'map_details' && selectedItem && (
        <SearchMapDetails
          item={selectedItem}
          originTitle={origin.label}
          destTitle={destination.label}
          notice={searchNotice}
          dateStr={dateStr}
          timeStr={timeStr}
          passengers={passengers}
          resultCount={filteredResults.length}
          onOpenNotifications={onOpenNotifications}
          unreadNotificationCount={unreadNotificationCount}
          initialMode={selectedItemInitialMode}
          onBackToResults={() => setSubView('results')}
          onBook={handleBookItem}
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
          selectedStrategy={searchStrategy}
          onSelectStrategy={handleSelectStrategy}
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
