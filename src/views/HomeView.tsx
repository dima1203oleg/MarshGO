import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRightLeft,
  Calendar,
  Users,
  Car,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  Compass,
  Zap,
  ArrowRight,
  Shield,
  Crosshair,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
  RotateCcw,
  Trash2,
  Map,
  Calculator,
  ShieldAlert
} from 'lucide-react';
import { TransportCategory } from '../types';
import { detectCurrentLocation } from '../services/geolocation';
import { InteractiveMapPicker } from '../components/InteractiveMapPicker';
import { FuelCostCalculatorModal } from '../components/FuelCostCalculatorModal';
import { SafetyTripModal } from '../components/SafetyTripModal';

export interface RecentRouteItem {
  id: string;
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  searchedAt: string;
}

const DEFAULT_RECENT_ROUTES: RecentRouteItem[] = [
  {
    id: 'rr_1',
    origin: 'Одеса',
    destination: 'Київ',
    date: '2026-09-30',
    passengers: 2,
    searchedAt: 'Сьогодні'
  },
  {
    id: 'rr_2',
    origin: 'Львів',
    destination: 'Стрий',
    date: '2026-09-30',
    passengers: 1,
    searchedAt: 'Вчора'
  },
  {
    id: 'rr_3',
    origin: 'Київ',
    destination: 'Вінниця',
    date: '2026-10-01',
    passengers: 1,
    searchedAt: '3 дні тому'
  },
  {
    id: 'rr_4',
    origin: 'Дніпро',
    destination: 'Запоріжжя',
    date: '2026-09-30',
    passengers: 1,
    searchedAt: 'На цьому тижні'
  }
];

interface HomeViewProps {
  onSearch: (params: { origin: string; destination: string; date: string; passengers: number }) => void;
  onNavigate: (view: string) => void;
  onCategoryClick: (cat: TransportCategory) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearch,
  onNavigate,
  onCategoryClick
}) => {
  const [origin, setOrigin] = useState('Одеса');
  const [destination, setDestination] = useState('Київ');
  const [date, setDate] = useState('2026-09-30');
  const [passengers, setPassengers] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState<TransportCategory>('all');
  const [isFuelCalcOpen, setIsFuelCalcOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  // Recent routes history state
  const [recentRoutes, setRecentRoutes] = useState<RecentRouteItem[]>(() => {
    try {
      const saved = localStorage.getItem('mg_recent_routes');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_RECENT_ROUTES;
  });

  const saveRecentRoute = (newRoute: { origin: string; destination: string; date: string; passengers: number }) => {
    setRecentRoutes((prev) => {
      const filtered = prev.filter(
        (r) =>
          !(
            r.origin.trim().toLowerCase() === newRoute.origin.trim().toLowerCase() &&
            r.destination.trim().toLowerCase() === newRoute.destination.trim().toLowerCase()
          )
      );
      const updated: RecentRouteItem[] = [
        {
          id: `rr_${Date.now()}`,
          origin: newRoute.origin.trim(),
          destination: newRoute.destination.trim(),
          date: newRoute.date,
          passengers: newRoute.passengers,
          searchedAt: 'Щойно'
        },
        ...filtered
      ].slice(0, 6);

      try {
        localStorage.setItem('mg_recent_routes', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleQuickRepeatSearch = (route: RecentRouteItem) => {
    setOrigin(route.origin);
    setDestination(route.destination);
    setDate(route.date);
    setPassengers(route.passengers);
    saveRecentRoute(route);
    onSearch({
      origin: route.origin,
      destination: route.destination,
      date: route.date,
      passengers: route.passengers
    });
  };

  const handleClearRecent = () => {
    setRecentRoutes([]);
    try {
      localStorage.removeItem('mg_recent_routes');
    } catch {}
  };

  const handleRemoveRecentItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecentRoutes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('mg_recent_routes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Geolocation detection states
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessNotice, setLocationSuccessNotice] = useState<string | null>(null);
  const [locationErrorNotice, setLocationErrorNotice] = useState<string | null>(null);

  // Interactive Map Picker in search form
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);

  // Auto-detect location if permission was previously granted
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            handleDetectLocation(true);
          }
        })
        .catch(() => {
          // Permissions API optional fallback
        });
    }
  }, []);

  const handleDetectLocation = async (isSilent = false) => {
    setIsLocating(true);
    setLocationErrorNotice(null);
    if (!isSilent) {
      setLocationSuccessNotice(null);
    }

    const result = await detectCurrentLocation();
    setIsLocating(false);

    if (result.success && result.location) {
      setOrigin(result.location.city);
      setLocationSuccessNotice(`Визначено поточне місто: ${result.location.city} (точність ±${result.location.accuracyMeters}м)`);
      setTimeout(() => setLocationSuccessNotice(null), 4000);
    } else {
      if (!isSilent) {
        setLocationErrorNotice(result.error || 'Не вдалося визначити координати.');
        setTimeout(() => setLocationErrorNotice(null), 4000);
      }
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    saveRecentRoute({ origin, destination, date, passengers });
    onSearch({ origin, destination, date, passengers });
  };


  const categories = [
    { id: 'all', label: 'Усі', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'community', label: 'Попутка (0%)', icon: <Car className="w-4 h-4 text-emerald-600" /> },
    { id: 'taxi_pro', label: 'Таксі та PRO', icon: <Car className="w-4 h-4 text-amber-500" /> },
    { id: 'bus', label: 'Автобуси', icon: <Car className="w-4 h-4 text-blue-500" /> },
    { id: 'transfer', label: 'Трансфери', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { id: 'carsharing', label: 'Каршеринг', icon: <Car className="w-4 h-4 text-teal-600" /> }
  ];

  const popularRoutes = [
    { from: 'Одеса', to: 'Київ', price: 'від 450 грн', duration: '≈ 6 год', available: '5 рейсів' },
    { from: 'Київ', to: 'Львів', price: 'від 550 грн', duration: '≈ 6.5 год', available: '8 рейсів' },
    { from: 'Стрий', to: 'Львів', price: 'від 120 грн', duration: '≈ 50 хв', available: '14 рейсів' },
    { from: 'Дніпро', to: 'Київ', price: 'від 500 грн', duration: '≈ 6 год', available: '6 рейсів' }
  ];

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-12">
      {/* Hero Section */}
      <section className="relative bg-[#081B35] text-white pt-8 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1769F4]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#38BDF8] mb-4 backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Усі дороги України — в одному застосунку</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white text-balance leading-tight">
            Один пошук. <span className="text-[#38BDF8]">Усі способи</span> доїхати.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Попутка без комісії, перевірені PRO-водії, таксі, автобуси та трансфери.
            Або опублікуйте свій бюджет — водії відгукнуться самі.
          </p>

          {/* Unified Search Form */}
          <form
            id="tour-search-form"
            onSubmit={handleSubmit}
            className="mt-8 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-[#14243B] shadow-2xl border border-white/20 text-left transition-all duration-300"
          >
            {/* Mode Switcher Header: Text inputs vs Interactive Map */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-[#F5F8FD] rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    !showMapPicker
                      ? 'bg-white text-[#14243B] shadow-xs'
                      : 'text-[#62718A] hover:text-[#14243B]'
                  }`}
                >
                  <span>Текстовий ввід</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    showMapPicker
                      ? 'bg-[#1769F4] text-white shadow-xs'
                      : 'text-[#1769F4] hover:bg-blue-50'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Вибір на карті</span>
                  <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-black">
                    Маркери
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs font-bold text-[#1769F4] hover:text-[#1358CE] flex items-center gap-1.5 transition"
              >
                <Map className="w-3.5 h-3.5" />
                <span>{showMapPicker ? 'Згорнути карту' : 'Обрати пункти кліком на карті'}</span>
              </button>
            </div>

            {/* Interactive Map Picker Section */}
            {showMapPicker && (
              <div className="mb-4 animate-fadeIn">
                <InteractiveMapPicker
                  origin={origin}
                  destination={destination}
                  onSelectOrigin={(city) => setOrigin(city)}
                  onSelectDestination={(city) => setDestination(city)}
                  onSwap={handleSwap}
                  onConfirm={() => {
                    if (!origin.trim() || !destination.trim()) return;
                    saveRecentRoute({ origin, destination, date, passengers });
                    onSearch({ origin, destination, date, passengers });
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center">
              {/* Origin with GPS & Map Trigger */}
              <div className="md:col-span-4 relative bg-[#F5F8FD] rounded-xl p-2.5 border border-[#DFE7F1] focus-within:border-[#1769F4] focus-within:bg-white transition">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#62718A] uppercase tracking-wider">
                    Звідки
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      title="Обрати на інтерактивній карті"
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#1769F4] transition px-1.5 py-0.5 rounded hover:bg-slate-100"
                    >
                      <Map className="w-3 h-3 text-[#1769F4]" />
                      <span className="hidden sm:inline">Карта</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDetectLocation(false)}
                      disabled={isLocating}
                      title="Визначити моє поточне розташування через GPS"
                      className="flex items-center gap-1 text-[11px] font-bold text-[#1769F4] hover:text-[#1358CE] transition px-1.5 py-0.5 rounded hover:bg-blue-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#1769F4]" />
                          <span>Шукаємо GPS...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-3 h-3 text-[#1769F4]" />
                          <span>Моє місце</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#1769F4] shrink-0" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Місто або адреса"
                    className="w-full text-sm font-bold text-[#14243B] bg-transparent focus:outline-none placeholder:font-normal"
                    required
                  />
                </div>
              </div>

              {/* Swap Button (Desktop & Mobile) */}
              <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full bg-white border border-[#DFE7F1] shadow-sm flex items-center justify-center text-slate-600 hover:text-[#1769F4] hover:border-[#1769F4] active:rotate-180 transition-all z-10"
                  aria-label="Поміняти місцями"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination with Map Trigger */}
              <div className="md:col-span-4 relative bg-[#F5F8FD] rounded-xl p-2.5 border border-[#DFE7F1] focus-within:border-[#1769F4] focus-within:bg-white transition">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#62718A] uppercase tracking-wider">
                    Куди
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    title="Обрати на інтерактивній карті"
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#1769F4] transition px-1.5 py-0.5 rounded hover:bg-slate-100"
                  >
                    <Map className="w-3 h-3 text-[#16845C]" />
                    <span className="hidden sm:inline">Карта</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#16845C] shrink-0" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Місто прибуття"
                    className="w-full text-sm font-bold text-[#14243B] bg-transparent focus:outline-none placeholder:font-normal"
                    required
                  />
                </div>
              </div>

              {/* Date & Passengers */}
              <div className="md:col-span-3 grid grid-cols-2 gap-2">
                <div className="bg-[#F5F8FD] rounded-xl p-2.5 border border-[#DFE7F1] focus-within:border-[#1769F4] focus-within:bg-white transition">
                  <label className="block text-[10px] font-bold text-[#62718A] uppercase tracking-wider">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-bold text-[#14243B] bg-transparent focus:outline-none mt-1"
                  />
                </div>

                <div className="bg-[#F5F8FD] rounded-xl p-2.5 border border-[#DFE7F1] focus-within:border-[#1769F4] focus-within:bg-white transition">
                  <label className="block text-[10px] font-bold text-[#62718A] uppercase tracking-wider">
                    Пасажири
                  </label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full text-xs font-bold text-[#14243B] bg-transparent focus:outline-none mt-1"
                  >
                    <option value={1}>1 особа</option>
                    <option value={2}>2 особи</option>
                    <option value={3}>3 особи</option>
                    <option value={4}>4 особи</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Geolocation Feedback Banner */}
            {locationSuccessNotice && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{locationSuccessNotice}</span>
              </div>
            )}

            {locationErrorNotice && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{locationErrorNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationErrorNotice(null)}
                  className="text-[11px] font-bold text-amber-800 underline"
                >
                  Ок
                </button>
              </div>
            )}

            {/* Quick Cities Chips */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-[#62718A] shrink-0">Швидкий вибір:</span>
              <button
                type="button"
                onClick={() => handleDetectLocation(false)}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1769F4] font-semibold flex items-center gap-1 shrink-0 transition"
              >
                <Crosshair className="w-3 h-3" />
                <span>Моє місце (GPS)</span>
              </button>
              {['Київ', 'Одеса', 'Львів', 'Стрий', 'Дніпро', 'Вінниця'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setOrigin(city)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition ${
                    origin === city
                      ? 'bg-[#1769F4] text-white shadow-xs font-semibold'
                      : 'bg-[#F5F8FD] text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Submit CTA */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#62718A]">
                <ShieldCheck className="w-4 h-4 text-[#16845C]" />
                <span>0% комісії для Community carpool · Чесні ціни</span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1769F4] hover:bg-[#1358CE] text-white font-bold text-sm shadow-lg shadow-[#1769F4]/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Знайти маршрут</span>
              </button>
            </div>
          </form>

          {/* Transport Category Filter Buttons */}
          <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as TransportCategory);
                  onCategoryClick(cat.id as TransportCategory);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-white text-[#081B35] shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Body Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 relative z-20 space-y-6 flex-1">
        {/* Recent Routes Section (Недавні маршрути - 1 клік) */}
        {recentRoutes.length > 0 && (
          <div id="tour-recent-routes" className="bg-white rounded-2xl border border-[#DFE7F1] p-5 shadow-sm space-y-3.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-[#1769F4]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#14243B]">Недавні маршрути</h3>
                  <p className="text-[11px] text-[#62718A]">Повторіть пошук в один клік</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearRecent}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
              >
                Очистити історію
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {recentRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleQuickRepeatSearch(route)}
                  className="group relative bg-[#F5F8FD] hover:bg-blue-50/70 border border-[#DFE7F1] hover:border-[#1769F4] rounded-xl p-3 cursor-pointer transition shadow-xs flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="space-y-1 w-full">
                      <div className="font-extrabold text-xs text-[#14243B] flex items-center gap-1.5">
                        <span className="truncate max-w-[85px]">{route.origin}</span>
                        <ArrowRight className="w-3 h-3 text-[#1769F4] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        <span className="truncate max-w-[85px]">{route.destination}</span>
                      </div>
                      <div className="text-[11px] text-[#62718A] flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(route.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{route.passengers} ос.</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentItem(e, route.id)}
                      className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-200/60 transition opacity-0 group-hover:opacity-100 shrink-0"
                      title="Видалити з недавніх"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-[#1769F4]">
                    <span>Швидкий пошук</span>
                    <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reverse Marketplace Callout Banner (FLOW B) */}
        <div id="tour-reverse-marketplace" className="bg-gradient-to-r from-[#0F284E] to-[#1769F4] rounded-2xl p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 transition-all duration-300">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold text-[#38BDF8]">
              <Zap className="w-3.5 h-3.5" />
              <span>Зворотний маркетплейс попиту</span>
            </div>
            <h3 className="text-lg font-bold">Не знайшли зручний рейс?</h3>
            <p className="text-xs text-slate-200 max-w-lg">
              Опублікуйте свій маршрут та бюджет. Водії, які їдуть цим шляхом, самі запропонують взяти вас із собою.
            </p>
          </div>

          <button
            onClick={() => onNavigate('demand-new')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-[#081B35] font-extrabold text-xs hover:bg-slate-100 shadow-lg transition shrink-0 flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Шукаю поїздку (Назвати бюджет)</span>
            <ArrowRight className="w-4 h-4 text-[#1769F4]" />
          </button>
        </div>

        {/* MARSHGO Navigation Teaser (FLOW D) */}
        <div id="tour-driver-section" className="bg-white rounded-2xl border border-[#DFE7F1] p-5 shadow-sm hover:border-[#1769F4] transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#081B35] text-[#38BDF8] flex items-center justify-center shrink-0 shadow-md">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-[#14243B]">MARSHGO Navigation</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Foreground Beta</span>
                </div>
                <p className="text-xs text-[#62718A] mt-1 max-w-xl">
                  Ви водій і просто їдете у своїх справах? Увімкніть навігатор. Система автоматично запропонує попутників прямо уздовж вашої траси з розрахунком +хвилин та +км.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('navigation')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#081B35] hover:bg-[#0F284E] text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <span>Почати навігацію (Стрий → Львів)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8]" />
            </button>
          </div>
        </div>

        {/* Popular Directions Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#14243B]">Популярні напрямки по Україні</h3>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-[#1769F4] hover:underline flex items-center gap-1"
            >
              <span>Усі рейси</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {popularRoutes.map((route, i) => (
              <div
                key={i}
                onClick={() => {
                  setOrigin(route.from);
                  setDestination(route.to);
                  onSearch({ origin: route.from, destination: route.to, date, passengers: 1 });
                }}
                className="bg-white p-3.5 rounded-xl border border-[#DFE7F1] hover:border-[#1769F4] hover:shadow-sm cursor-pointer transition group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#14243B]">
                  <span>{route.from}</span>
                  <span className="text-slate-400">→</span>
                  <span>{route.to}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-[#1769F4]">{route.price}</span>
                  <span className="text-[11px] text-slate-500">{route.duration}</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium mt-1">
                  {route.available} доступно сьогодні
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel & Safety Interactive Tools Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-500/30 text-sky-300 px-2 py-0.5 rounded">
                Справедливі тарифи
              </span>
              <span className="text-xs text-slate-300">0% комісії для Community</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              Скільки насправді коштує поїздка на пальному?
            </h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Розрахуйте чесний внесок за 1 місце для авто на бензині, дизелі, газі чи електрокарі.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFuelCalcOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#081B35] hover:bg-slate-100 font-extrabold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <Calculator className="w-4 h-4 text-[#1769F4]" />
              <span>Калькулятор пального</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSafetyOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Безпека та SOS</span>
            </button>
          </div>
        </div>

        {/* Three Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16845C] flex items-center justify-center font-bold">
              0%
            </div>
            <h4 className="font-bold text-sm text-[#14243B]">Справжній Carpool</h4>
            <p className="text-xs text-[#62718A]">
              0% платформної комісії для спільних поїздок Community. Лише чесний розподіл витрат на пальне.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769F4] flex items-center justify-center font-bold">
              PRO
            </div>
            <h4 className="font-bold text-sm text-[#14243B]">Перевірені перевізники</h4>
            <p className="text-xs text-[#62718A]">
              Окремий режим для таксі, трансферів та ліцензованих автобусних рейсів із чесними статусами.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#AE6C00] flex items-center justify-center font-bold">
              GPS
            </div>
            <h4 className="font-bold text-sm text-[#14243B]">Розумна навігація</h4>
            <p className="text-xs text-[#62718A]">
              Підбір попутників прямо дорогою з розрахунком додаткового часу та відхилення від траси.
            </p>
          </div>
        </div>
      </main>

      {/* Fuel Cost Calculator Modal */}
      <FuelCostCalculatorModal
        isOpen={isFuelCalcOpen}
        onClose={() => setIsFuelCalcOpen(false)}
        defaultOrigin={origin}
        defaultDestination={destination}
        defaultDistanceKm={475}
      />

      {/* Safety Trip Modal */}
      <SafetyTripModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        tripDetails={{
          origin,
          destination
        }}
      />
    </div>
  );
};
