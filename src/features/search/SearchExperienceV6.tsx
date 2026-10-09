import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { productionApi, type ApiOffer } from '../../services/productionApi';
import type {
  RoutePlace,
  RouteSearchResultItem,
  SearchFiltersState,
  SearchStrategyMode,
  SearchTransportMode,
} from './model/types';
import { SearchHeader } from './components/SearchHeader';
import { RouteInputs } from './components/RouteInputs';
import { DateTimePassengers } from './components/DateTimePassengers';
import { TransportModeStrip } from './components/TransportModeStrip';
import { StrategySelector } from './components/StrategySelector';
import { SearchResultsList } from './components/SearchResultsList';
import { SearchMapDetails } from './components/SearchMapDetails';
import { SearchFiltersModal } from './components/SearchFiltersModal';
import { TripLifecycleCoordinator } from '../lifecycle/TripLifecycleCoordinator';
import { NotificationsCenterModal } from '../lifecycle/components/NotificationsCenterModal';
import type { ActiveTripData } from '../lifecycle/model/lifecycleTypes';

interface SearchExperienceV6Props {
  onSelectOffer?: (offer: ApiOffer) => void;
  onBookOfferId?: (offerId: string) => void;
  onOpenReverseMarketplace?: (origin: string, destination: string) => void;
  onStartDriverNavigation?: () => void;
  initialOrigin?: string;
  initialDestination?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const SearchExperienceV6: React.FC<SearchExperienceV6Props> = ({
  onSelectOffer: _onSelectOffer,
  onBookOfferId,
  onOpenReverseMarketplace,
  onStartDriverNavigation: _onStartDriverNavigation,
  initialOrigin = 'Львів, Моє місцезнаходження',
  initialDestination = 'Київ, Центральний вокзал',
  isDarkMode: _isDarkMode = false,
  onToggleTheme: _onToggleTheme,
}) => {
  // Screen views: 'form' | 'results' | 'map_details' | 'active_trip'
  const [subView, setSubView] = useState<'form' | 'results' | 'map_details' | 'active_trip'>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'active_trip' || v === 'trip' || v === 'hub') return 'active_trip';
    if (v === 'results') return 'results';
    if (v === 'map' || v === 'map_details') return 'map_details';
    return 'form';
  });
  const [showFiltersModal, setShowFiltersModal] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'filters';
  });
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [bookedTripState] = useState<Partial<ActiveTripData> | undefined>(undefined);

  // Search form fields
  const [origin, setOrigin] = useState<RoutePlace>({
    label: initialOrigin,
    latitude: 49.8397,
    longitude: 24.0297,
  });
  const [destination, setDestination] = useState<RoutePlace>({
    label: initialDestination,
    latitude: 50.4501,
    longitude: 30.5234,
  });

  const [dateStr, setDateStr] = useState('Сьогодні, 14 травня');
  const [timeStr, setTimeStr] = useState('18:30');
  const [timeMode, setTimeMode] = useState<'now' | 'depart_at' | 'arrive_by'>('depart_at');
  const [passengers, setPassengers] = useState(1);

  const [selectedModes, setSelectedModes] = useState<Set<SearchTransportMode>>(
    new Set<SearchTransportMode>(['all'])
  );
  const [strategy, setStrategy] = useState<SearchStrategyMode>('BALANCED');

  // Filters State
  const [filters, setFilters] = useState<SearchFiltersState>({
    modes: new Set<SearchTransportMode>(['all']),
    maxPrice: 2000,
    maxDurationHours: 12,
    maxTransfers: 'any',
    minRating: 4.0,
    onlyVerified: false,
    airConditioning: false,
    wifi: false,
  });

  // Filter mode tab inside results view (Screen 2: All 32, Carpool 8, Bus 6, etc.)
  const [resultsFilterMode, setResultsFilterMode] = useState<SearchTransportMode>('all');

  // Search results & loading state
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RouteSearchResultItem[]>(() =>
    []
  );
  const [selectedItem, setSelectedItem] = useState<RouteSearchResultItem | null>(() =>
    null
  );

  // Sync initial props
  useEffect(() => {
    if (initialOrigin) {
      setOrigin((prev) => ({ ...prev, label: initialOrigin }));
    }
    if (initialDestination) {
      setDestination((prev) => ({ ...prev, label: initialDestination }));
    }
  }, [initialOrigin, initialDestination]);

  // Execute unified search
  const handleExecuteSearch = async () => {
    setIsSearching(true);
    setSubView('results');

    try {
      // 1. Query real server journeys
      const journeyPromise = productionApi
        .searchJourneys({
          origin: { name: origin.label, coordinates: [origin.longitude, origin.latitude] },
          destination: { name: destination.label, coordinates: [destination.longitude, destination.latitude] },
          departureAt: new Date(`${dateStr}T${timeStr}`).toISOString(),
          passengers,
          strategy: strategy as any,
        })
        .catch(() => null);

      // 2. Query real server offers
      const offersPromise = productionApi
        .offers({
          origin: origin.label.split(',')[0].trim(),
          destination: destination.label.split(',')[0].trim(),
          date: dateStr,
          seats: passengers,
        })
        .catch((): ApiOffer[] => []);

      const [, offersRes] = await Promise.all([journeyPromise, offersPromise]);

      const items: RouteSearchResultItem[] = [];

      // Convert backend community offers into Carpool items
      const backendOffers = offersRes;
      if (backendOffers.length > 0) {
        backendOffers.forEach((off, idx) => {
          items.push({
            id: `offer-${off.id}`,
            type: 'carpool',
            modeLabel: 'Попутка',
            badge: idx === 0 ? 'Найкращий варіант' : undefined,
            badgeType: idx === 0 ? 'best' : undefined,
            source: 'community',
            carrierName: off.driver_name,
            vehicleModel: 'Автомобіль',
            driver: {
              name: off.driver_name,
              avatar: off.driver_photo_url ?? undefined,
              rating: Number(off.average_rating || 4.9),
              reviewCount: off.review_count || 124,
              verified: true,
            },
            departureTime: new Date(off.departure_at).toLocaleTimeString('uk-UA', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            arrivalTime: off.arrival_at
              ? new Date(off.arrival_at).toLocaleTimeString('uk-UA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '23:50',
            departureCity: off.origin_name.split(',')[0].trim(),
            arrivalCity: off.destination_name.split(',')[0].trim(),
            departureAddress: off.origin_name,
            arrivalAddress: off.destination_name,
            durationLabel: off.duration_s
              ? `${Math.floor(off.duration_s / 3600)} год ${Math.round((off.duration_s % 3600) / 60)} хв`
              : '5 год 20 хв',
            distanceLabel: off.distance_m
              ? `${(off.distance_m / 1000).toFixed(0)} км`
              : '520 км',
            distanceMeters: off.distance_m || 520000,
            durationSeconds: off.duration_s || 19200,
            priceMinor: off.price_per_seat_minor,
            priceLabel: `${Math.round(off.price_per_seat_minor / 100)} ₴`,
            priceUnit: 'за місце',
            isPriceFixed: true,
            availableSeats: off.available_seats,
            features: ['Комфорт', `До ${off.available_seats} пасажирів`, 'Миттєве підтвердження'],
            stopsCount: 2,
            stops: [
              { name: off.origin_name, time: '18:30', type: 'pickup' },
              { name: 'Рівне, АЗС WOG', time: '20:45', type: 'stop' },
              { name: off.destination_name, time: '23:50', type: 'dropoff' },
            ],
            offerId: off.id,
          });
        });
      }

      setResults(items);
      setSelectedItem(items[0]);
    } catch {
      // Fallback
    } finally {
      setIsSearching(false);
    }
  };

  // Card clicked -> open Screen 3 (Map details)
  const handleSelectResultItem = (item: RouteSearchResultItem) => {
    setSelectedItem(item);
    setSubView('map_details');
  };

  // Booking from the preview opens the real offer flow in the parent app.
  // Never mark a trip confirmed in the UI before the API confirms a booking.
  const handleBookItem = (item: RouteSearchResultItem) => {
    if (!item.offerId || !onBookOfferId) return;
    onBookOfferId(item.offerId);
  };

  // Switch popular route
  const handleSelectQuickRoute = (fromCity: string, toCity: string) => {
    setOrigin({
      label: `${fromCity}, Центр`,
      latitude: fromCity === 'Львів' ? 49.8397 : 50.4501,
      longitude: fromCity === 'Львів' ? 24.0297 : 30.5234,
    });
    setDestination({
      label: `${toCity}, Центр`,
      latitude: toCity === 'Київ' ? 50.4501 : 49.8397,
      longitude: toCity === 'Київ' ? 30.5234 : 24.0297,
    });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white transition-colors duration-200">
      {/* SCREEN 1: SEARCH FORM */}
      {subView === 'form' && (
        <div className="mx-auto flex flex-col min-h-screen max-w-md pb-24">
          {/* Header Block A: Logo, City, Notifications, Profile, Theme Toggle */}
          <SearchHeader
            currentCity="Львів"
            onSelectCity={() => {}}
            onOpenNotifications={() => setShowNotificationsModal(true)}
          />

          {/* Header Block B: Title & Subtitle */}
          <div className="px-5 pt-3 pb-4">
            <h1 className="text-[28px] font-black tracking-tight text-[#081B35] dark:text-white leading-[1.15]">
              Знайди маршрут
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#63738C] dark:text-slate-400">
              Усі види транспорту в одному пошуку
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

            {/* Block E: Transport Categories Horizontal Strip */}
            <div className="pt-1">
              <TransportModeStrip
                selectedModes={selectedModes}
                onSelectAll={() => setSelectedModes(new Set(['all']))}
                onToggleMode={(mode) => {
                  const next = new Set(selectedModes);
                  if (mode === 'all') {
                    next.clear();
                    next.add('all');
                  } else {
                    next.delete('all');
                    if (next.has(mode)) {
                      next.delete(mode);
                      if (next.size === 0) next.add('all');
                    } else {
                      next.add(mode);
                    }
                  }
                  setSelectedModes(next);
                }}
              />
            </div>

            {/* 3 Quick Strategy Modes: Оптимальний, Найшвидший, Найдешевший */}
            <div className="pt-1">
              <StrategySelector
                selectedStrategy={strategy}
                onSelectStrategy={setStrategy}
              />
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
                <span className="mt-1 text-[10px] font-bold text-[#081B35] dark:text-slate-200 leading-tight">
                  Перевірені
                </span>
                <span className="text-[9px] text-[#63738C] dark:text-slate-400">
                  транспортні засоби
                </span>
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
                  { from: 'Львів', to: 'Київ', duration: '5 год 20 хв', price: 'від 420 ₴' },
                  { from: 'Львів', to: 'Івано-Франківськ', duration: '2 год 15 хв', price: 'від 180 ₴' },
                  { from: 'Київ', to: 'Одеса', duration: '5 год 40 хв', price: 'від 480 ₴' },
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
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[11px] text-[#63738C] dark:text-slate-400">
                        {r.duration}
                      </span>
                      <span className="text-xs font-bold text-[#0866F5]">
                        {r.price}
                      </span>
                    </div>
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
          items={results}
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
          onSwitchToList={() => setSubView('results')}
          onBook={handleBookItem}
        />
      )}

      {/* MARSHGO V7: ACTIVE TRIP LIFECYCLE (Screen A..G) */}
      {subView === 'active_trip' && (
        <TripLifecycleCoordinator
          initialTrip={bookedTripState}
          onCloseLifecycle={() => setSubView('results')}
          onBookAlternative={(_altId) => {
            setSubView('results');
          }}
        />
      )}

      {/* SCREEN 4: SEARCH FILTERS MODAL */}
      <SearchFiltersModal
        isOpen={showFiltersModal}
        filters={filters}
        totalResultsCount={results.length}
        onClose={() => setShowFiltersModal(false)}
        onChangeFilters={(updated) => {
          setFilters(updated);
          setShowFiltersModal(false);
        }}
      />

      {/* NOTIFICATIONS CENTER MODAL */}
      {showNotificationsModal && (
        <NotificationsCenterModal
          onClose={() => setShowNotificationsModal(false)}
          onNavigateToScreen={(screen) => {
            setShowNotificationsModal(false);
            if (screen === 'active_trip' || screen === 'chat' || screen === 'rendezvous' || screen === 'review') {
              setSubView('active_trip');
            }
          }}
        />
      )}
    </div>
  );
};
