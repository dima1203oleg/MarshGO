import { useState, useEffect, lazy, Suspense } from 'react';
import {
  ArrowDownUp,
  Bell,
  Bike,
  Bus,
  Calendar,
  CarFront,
  CarTaxiFront,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Footprints,
  Grid,
  Heart,
  Layers,
  MapPin,
  Maximize2,
  Mic,
  Moon,
  Navigation,
  Plane,
  Plus,
  Radio,
  Repeat,
  Search,
  Ship,
  SlidersHorizontal,
  Star,
  Sun,
  Ticket,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { themeService } from '../services/theme';
import { productionApi, type ApiPlace } from '../services/productionApi';

const MapPointPicker = lazy(() => import('../components/MapPointPicker').then((module) => ({ default: module.MapPointPicker })));

export interface HomeHeroProps {
  onStartNavigation: () => void;
  onSearchTrip: () => void;
  onPlanTrip: (mode?: 'driver' | 'passenger') => void;
  onSearchRoute?: (originText: string, destinationText: string, dateStr?: string, timeStr?: string, seatsCount?: number) => void;
  onSelectCategory?: (category: string) => void;
  onViewAllTrips?: () => void;
  onOpenMap?: () => void;
  onOpenNotifications?: () => void;
}

interface TransportCategory {
  id: string;
  name: string;
  icon: typeof CarFront;
  bgClass: string;
  iconClass: string;
  badge?: string;
}

/**
 * 20 Transport Modes matching the exact specification and modal
 */
const ALL_TRANSPORT_CATEGORIES: TransportCategory[] = [
  { id: 'all', name: 'Усі', icon: Grid, bgClass: 'bg-[#1769ED] text-white', iconClass: 'text-white' },
  { id: 'carpool', name: 'Попутки', icon: CarFront, bgClass: 'bg-slate-900 text-white dark:bg-slate-700', iconClass: 'text-white' },
  { id: 'taxi', name: 'Таксі', icon: CarTaxiFront, bgClass: 'bg-amber-400 text-slate-950', iconClass: 'text-slate-950' },
  { id: 'carsharing', name: 'Каршеринг', icon: Users, bgClass: 'bg-emerald-500 text-white', iconClass: 'text-white' },
  { id: 'transfer', name: 'Трансфер', icon: Repeat, bgClass: 'bg-indigo-500 text-white', iconClass: 'text-white' },
  { id: 'bus', name: 'Автобуси', icon: Bus, bgClass: 'bg-blue-600 text-white', iconClass: 'text-white' },
  { id: 'marshrutka', name: 'Маршрутки', icon: Users, bgClass: 'bg-amber-500 text-white', iconClass: 'text-white' },
  { id: 'train', name: 'Поїзди', icon: TrainFront, bgClass: 'bg-purple-600 text-white', iconClass: 'text-white' },
  { id: 'suburban_train', name: 'Електрички', icon: TrainFrontTunnel, bgClass: 'bg-teal-500 text-white', iconClass: 'text-white' },
  { id: 'metro', name: 'Метро', icon: TrainFront, bgClass: 'bg-sky-600 text-white', iconClass: 'text-white' },
  { id: 'tram', name: 'Трамваї', icon: TramFront, bgClass: 'bg-rose-500 text-white', iconClass: 'text-white' },
  { id: 'trolleybus', name: 'Тролейбуси', icon: Bus, bgClass: 'bg-cyan-600 text-white', iconClass: 'text-white' },
  { id: 'city_transit', name: 'Міський', icon: Bus, bgClass: 'bg-emerald-600 text-white', iconClass: 'text-white' },
  { id: 'scooter', name: 'Самокати', icon: Zap, bgClass: 'bg-lime-500 text-slate-950', iconClass: 'text-slate-950' },
  { id: 'bike', name: 'Велосипеди', icon: Bike, bgClass: 'bg-red-500 text-white', iconClass: 'text-white' },
  { id: 'air', name: 'Літак', icon: Plane, bgClass: 'bg-blue-500 text-white', iconClass: 'text-white' },
  { id: 'water_taxi', name: 'Таксі-водний', icon: Ship, bgClass: 'bg-cyan-500 text-white', iconClass: 'text-white' },
  { id: 'ferry', name: 'Пороми', icon: Ship, bgClass: 'bg-sky-700 text-white', iconClass: 'text-white' },
  { id: 'walk', name: 'Пішохідний', icon: Footprints, bgClass: 'bg-slate-600 text-white', iconClass: 'text-white' },
  { id: 'other', name: 'Інші', icon: Plus, bgClass: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', iconClass: 'text-slate-700 dark:text-slate-300' },
];

/**
 * MARSHGO V5 Premium Screen — 1:1 match with visual design specification
 */
export function HomeHero({
  onStartNavigation,
  onSearchTrip,
  onPlanTrip,
  onSearchRoute,
  onSelectCategory,
  onViewAllTrips,
  onOpenMap,
  onOpenNotifications,
}: HomeHeroProps) {
  // Search Inputs State
  const [originInput, setOriginInput] = useState('Львів, Мій поточний місцеперебува...');
  const [destInput, setDestInput] = useState('Київ, Центральний вокзал');
  const [departureDate, setDepartureDate] = useState('Сьогодні, 14 травня');
  const [departureTime, setDepartureTime] = useState('18:30');
  const [passengerCount, setPassengerCount] = useState(1);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isDark, setIsDark] = useState(() => themeService.isDark());

  useEffect(() => {
    return themeService.subscribe((_theme, dark) => setIsDark(dark));
  }, []);

  // GPS & Map Picker State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [activePickerField, setActivePickerField] = useState<'origin' | 'destination' | null>(null);

  // Transport Filters State
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set(['all']));
  const [showAllModesModal, setShowAllModesModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Extra Search Filters
  const [filters, setFilters] = useState({
    directOnly: false,
    luggage: true,
    childSeat: false,
    pets: false,
    comfort: false,
    maxPrice: 600,
  });

  // Saved / Bookmarked Routes
  const [bookmarkedRoutes, setBookmarkedRoutes] = useState<Set<string>>(new Set(['lviv-kyiv']));

  // Handle Swap with smooth animation
  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      const prevOrigin = originInput;
      setOriginInput(destInput);
      setDestInput(prevOrigin);
      setIsSwapping(false);
    }, 150);
  };

  // Handle GPS Current Location
  const handleGpsCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS недоступний');
      setTimeout(() => setGpsStatus(null), 3000);
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Визначаємо геопозицію…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const reverse = await productionApi.reverseGeocode(lat, lon).catch(() => null);
          const address = reverse?.label || `Моє місцезнаходження (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          setOriginInput(address);
          setGpsStatus('Локацію оновлено ✓');
        } catch {
          setOriginInput('Львів, поточна геопозиція');
          setGpsStatus('Локацію оновлено');
        } finally {
          setGpsLoading(false);
          setTimeout(() => setGpsStatus(null), 2500);
        }
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('Доступ до GPS відхилено');
        setTimeout(() => setGpsStatus(null), 3000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Map Point Selection Confirm
  const handleMapPointConfirm = (place: ApiPlace) => {
    const formatted = place.label || `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`;
    if (activePickerField === 'origin') {
      setOriginInput(formatted);
    } else if (activePickerField === 'destination') {
      setDestInput(formatted);
    }
    setActivePickerField(null);
  };

  // Toggle Mode Selection
  const handleToggleMode = (modeId: string) => {
    if (modeId === 'other') {
      setShowAllModesModal(true);
      return;
    }

    if (modeId === 'all') {
      setSelectedModes(new Set(['all']));
      if (onSelectCategory) onSelectCategory('all');
      return;
    }

    const next = new Set(selectedModes);
    next.delete('all');
    if (next.has(modeId)) {
      next.delete(modeId);
      if (next.size === 0) next.add('all');
    } else {
      next.add(modeId);
    }
    setSelectedModes(next);
    if (onSelectCategory) onSelectCategory(modeId);
  };

  // Submit Search
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchRoute) {
      onSearchRoute(originInput || 'Львів', destInput || 'Київ', departureDate, departureTime, passengerCount);
    } else {
      onSearchTrip();
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(bookmarkedRoutes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBookmarkedRoutes(next);
  };

  return (
    <div className="home-screen-v5 mx-auto flex w-full max-w-md flex-col px-3.5 pb-16 pt-1 sm:px-4">
      {/* 1. UPPER HEADER / STATUS BAR (01_Верхня панель) */}
      <header className="mb-3.5 flex items-center justify-between pt-1">
        {/* Brand & City Location Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {/* Custom stylized M logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1453CA] to-[#257BF4] text-white shadow-md shadow-blue-500/25">
              <span className="text-lg font-black tracking-tighter">M</span>
            </div>
            <span className="text-[19px] font-black tracking-tight text-[#142642] dark:text-white">
              MARSH<span className="text-[#1769ED]">GO</span>
            </span>
          </div>

          {/* Location Dropdown Pill */}
          <button
            type="button"
            onClick={handleGpsCurrentLocation}
            className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-bold text-[#142642] shadow-xs hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white"
          >
            <span className="text-xs">📍</span>
            <span>Львів</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
        </div>

        {/* Theme Toggle & Notifications & Profile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => themeService.toggle()}
            title={isDark ? "Світла тема" : "Темна тема"}
            aria-label="Перемкнути тему"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-200"
          >
            {isDark ? <Sun size={17} className="text-amber-400 fill-amber-400" /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Сповіщення"
            className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-200"
          >
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
              3
            </span>
          </button>

          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200/90 shadow-xs dark:border-slate-700">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces&auto=format&q=80"
              alt="Профіль"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* 2. INTERACTIVE LIVE MAP HERO WIDGET (02_Інтерактивна карта) */}
      <section aria-label="Карта транспорту" className="relative mb-3.5 overflow-hidden rounded-[2rem] border border-[#E3EBF4] bg-[#E8F0F8] shadow-sm dark:border-slate-800 dark:bg-[#0B172E]">
        <div className="relative h-48 w-full overflow-hidden">
          {/* Stylized vector map underlay */}
          <svg className="absolute inset-0 h-full w-full opacity-60 dark:opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lviv-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lviv-grid)" />
            {/* Major Arterial Roads */}
            <path d="M -20 120 Q 140 60 300 110 T 600 70" fill="none" stroke="#94A3B8" strokeWidth="4" />
            <path d="M -20 120 Q 140 60 300 110 T 600 70" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            <path d="M 160 -10 Q 190 110 250 240" fill="none" stroke="#94A3B8" strokeWidth="3" />
            <path d="M 160 -10 Q 190 110 250 240" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
            <path d="M 270 100 L 460 20" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>

          {/* Central Pulsing City Hub (Львів) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border border-blue-500/25 bg-blue-500/5 animate-ping" />
            <div className="absolute h-18 w-18 rounded-full border border-blue-400/40 bg-blue-500/10" />
            <div className="absolute h-8 w-8 rounded-full bg-blue-600/30 p-1 flex items-center justify-center shadow-lg backdrop-blur-md">
              <span className="h-3 w-3 rounded-full bg-[#1769ED] ring-2 ring-white" />
            </div>
            <span className="absolute -bottom-5 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-black tracking-wide text-[#142642] shadow-sm backdrop-blur-md dark:bg-slate-900/90 dark:text-white">
              Львів
            </span>
          </div>

          {/* Landmark Placeholders */}
          <span className="absolute left-[38%] top-[18%] text-[9px] font-bold text-slate-500 dark:text-slate-400">
            Високий Замок
          </span>
          <span className="absolute right-[22%] top-[48%] text-[9px] font-bold text-slate-500 dark:text-slate-400">
            Головний вокзал
          </span>
          <span className="absolute left-[14%] bottom-[16%] text-[9px] font-bold text-slate-500 dark:text-slate-400">
            Франківський
          </span>
          <span className="absolute right-[16%] bottom-[18%] text-[9px] font-bold text-slate-500 dark:text-slate-400">
            Сихів
          </span>

          {/* Live Vehicle Pins moving on map */}
          {/* Blue Bus */}
          <div className="absolute left-[24%] top-[22%] grid h-6 w-6 place-items-center rounded-full bg-[#1769ED] text-white shadow-md">
            <Bus size={12} strokeWidth={2.5} />
          </div>
          {/* Green Tram */}
          <div className="absolute right-[32%] top-[20%] grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-md">
            <TramFront size={12} strokeWidth={2.5} />
          </div>
          {/* Orange Taxi/Car */}
          <div className="absolute left-[28%] bottom-[22%] grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white shadow-md">
            <CarFront size={12} strokeWidth={2.5} />
          </div>
          {/* Purple Bike/Scooter */}
          <div className="absolute right-[24%] bottom-[28%] grid h-6 w-6 place-items-center rounded-full bg-purple-600 text-white shadow-md">
            <Bike size={12} strokeWidth={2.5} />
          </div>

          {/* Floating Weather & Safety Info Box (Top-Right) */}
          <div className="absolute right-3 top-3 rounded-2xl border border-white/60 bg-white/85 p-2 text-left shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/85">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#142642] dark:text-white">
              <Sun size={13} className="text-amber-500 fill-amber-500" />
              <span>+14° Сонячно</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Дороги вільні</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Якість повітря: добра</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Тривог немає</span>
            </div>
          </div>

          {/* Map Scale (Bottom-Left) */}
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>|</span>
            <span className="border-b border-slate-400 px-1">1 km</span>
            <span>|</span>
          </div>

          {/* Right Floating Map Controls (Stacked Vertically) */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onOpenMap ?? onSearchTrip}
              title="Шари карти"
              className="grid h-8 w-8 place-items-center rounded-xl border border-white/60 bg-white/90 text-slate-700 shadow-md backdrop-blur-md hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
            >
              <Layers size={14} />
            </button>
            <button
              type="button"
              onClick={handleGpsCurrentLocation}
              title="Моє місцезнаходження"
              className="grid h-8 w-8 place-items-center rounded-xl border border-white/60 bg-white/90 text-blue-600 shadow-md backdrop-blur-md hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-900/90 dark:text-blue-400"
            >
              <Navigation size={14} className={gpsLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onOpenMap ?? onSearchTrip}
              title="Повноекранний режим"
              className="grid h-8 w-8 place-items-center rounded-xl border border-white/60 bg-white/90 text-slate-700 shadow-md backdrop-blur-md hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. ROUTE SEARCH CARD (03_Пошук маршруту) */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-3xl border border-[#E3EBF4] bg-white p-3.5 shadow-[0_6px_24px_rgba(20,58,112,0.05)] dark:border-slate-800 dark:bg-[#101E38]"
      >
        <div className="relative space-y-2">
          {/* Origin Row */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#F5F8FC] px-3 py-2 dark:bg-[#0B1730]">
            <span className="grid h-5 w-5 shrink-0 place-items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1769ED]" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] font-bold text-[#6A7F98] dark:text-slate-400">
                Звідки
              </span>
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="Звідки вирушаємо?"
                className="w-full bg-transparent text-sm font-bold text-[#142642] outline-none placeholder:text-[#6A7F98] dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setActivePickerField('origin')}
              className="flex items-center gap-1 rounded-xl border border-[#E3EBF4] bg-white px-2.5 py-1 text-xs font-bold text-[#1769ED] shadow-2xs hover:border-blue-400 active:scale-95 dark:border-slate-700 dark:bg-[#101E38] dark:text-blue-400"
            >
              <MapPin size={12} />
              <span>На карті</span>
            </button>
          </div>

          {/* Swap Button (Floating vertically on right) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Поміняти місцями"
              className={`grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-[#1769ED] shadow-sm transition hover:bg-blue-50 active:scale-90 dark:border-slate-700 dark:bg-[#101E38] dark:text-blue-400 ${
                isSwapping ? 'rotate-180' : ''
              }`}
            >
              <ArrowDownUp size={14} />
            </button>
          </div>

          {/* Destination Row */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#F5F8FC] px-3 py-2 dark:bg-[#0B1730]">
            <span className="grid h-5 w-5 shrink-0 place-items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] font-bold text-[#6A7F98] dark:text-slate-400">
                Куди
              </span>
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="Куди прямуємо?"
                className="w-full bg-transparent text-sm font-bold text-[#142642] outline-none placeholder:text-[#6A7F98] dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setActivePickerField('destination')}
              className="flex items-center gap-1 rounded-xl border border-[#E3EBF4] bg-white px-2.5 py-1 text-xs font-bold text-[#1769ED] shadow-2xs hover:border-blue-400 active:scale-95 dark:border-slate-700 dark:bg-[#101E38] dark:text-blue-400"
            >
              <MapPin size={12} />
              <span>На карті</span>
            </button>
          </div>
        </div>

        {/* GPS status feedback */}
        {gpsStatus && (
          <div className="mt-1.5 text-center text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {gpsStatus}
          </div>
        )}

        {/* Date, Time, Passengers Row (3 pills) */}
        <div className="mt-2.5 grid grid-cols-12 gap-2 text-xs">
          {/* Date */}
          <button
            type="button"
            onClick={() => {
              const dates = ['Сьогодні, 14 травня', 'Завтра, 15 травня', 'Пт, 16 травня'];
              const idx = dates.indexOf(departureDate);
              setDepartureDate(dates[(idx + 1) % dates.length]);
            }}
            className="col-span-5 flex items-center justify-between rounded-xl border border-[#E3EBF4] bg-[#F8FAFD] px-2.5 py-2 font-bold text-[#142642] dark:border-slate-800 dark:bg-[#0B1730] dark:text-slate-200"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Calendar size={13} className="text-[#1769ED]" />
              <span className="truncate">{departureDate}</span>
            </div>
          </button>

          {/* Time */}
          <button
            type="button"
            onClick={() => {
              const times = ['18:30', '19:00', '20:15', '09:00', '12:00'];
              const idx = times.indexOf(departureTime);
              setDepartureTime(times[(idx + 1) % times.length]);
            }}
            className="col-span-3 flex items-center justify-between rounded-xl border border-[#E3EBF4] bg-[#F8FAFD] px-2.5 py-2 font-bold text-[#142642] dark:border-slate-800 dark:bg-[#0B1730] dark:text-slate-200"
          >
            <div className="flex items-center gap-1">
              <Clock size={13} className="text-[#1769ED]" />
              <span>{departureTime}</span>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </button>

          {/* Passengers */}
          <button
            type="button"
            onClick={() => setPassengerCount((c) => (c % 4) + 1)}
            className="col-span-4 flex items-center justify-between rounded-xl border border-[#E3EBF4] bg-[#F8FAFD] px-2.5 py-2 font-bold text-[#142642] dark:border-slate-800 dark:bg-[#0B1730] dark:text-slate-200"
          >
            <div className="flex items-center gap-1 truncate">
              <User size={13} className="text-[#1769ED]" />
              <span>{passengerCount} пасажир</span>
            </div>
            <ChevronDown size={11} className="text-slate-400" />
          </button>
        </div>

        {/* CTA Row: Search button + Mic + Filters */}
        <div className="mt-3 flex items-center gap-2">
          {/* Main CTA */}
          <button
            type="submit"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1769ED] px-4 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(23,105,237,0.35)] transition hover:bg-[#1358CA] active:scale-[0.99]"
          >
            <Search size={18} className="stroke-[2.5]" />
            <span>Знайти маршрут</span>
          </button>

          {/* Voice Search Button */}
          <button
            type="button"
            title="Голосовий пошук"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#E3EBF4] bg-[#F8FAFD] text-[#1769ED] shadow-2xs transition hover:border-blue-400 dark:border-slate-800 dark:bg-[#0B1730] dark:text-blue-400"
          >
            <Mic size={20} className="stroke-[2.2]" />
          </button>

          {/* Filters Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            title="Фільтри маршруту"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#E3EBF4] bg-[#F8FAFD] text-[#142642] shadow-2xs transition hover:border-slate-400 dark:border-slate-800 dark:bg-[#0B1730] dark:text-slate-200"
          >
            <SlidersHorizontal size={20} className="stroke-[2.2]" />
          </button>
        </div>
      </form>

      {/* 4. TRANSPORT CATEGORIES BAR (04_Категорії транспорту - 2-row scroll) */}
      <section aria-label="Категорії транспорту" className="mt-4">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 pt-0.5">
          {/* Row 1 and Row 2 in a 2-row column layout for compact horizontal swiping */}
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-3">
              {ALL_TRANSPORT_CATEGORIES.slice(0, 7).map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedModes.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleMode(cat.id)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl transition shadow-xs active:scale-95 ${
                        cat.id === 'all'
                          ? isSelected
                            ? 'bg-[#1769ED] text-white shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          : `${cat.bgClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                    </div>
                    <span className="text-[10px] font-bold text-[#142642] dark:text-slate-300">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              {ALL_TRANSPORT_CATEGORIES.slice(7, 16).map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedModes.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleMode(cat.id)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl transition shadow-xs active:scale-95 ${
                        cat.bgClass
                      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    >
                      <Icon size={20} strokeWidth={2.2} />
                    </div>
                    <span className="text-[10px] font-bold text-[#142642] dark:text-slate-300">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
              {/* "Other" button */}
              <button
                type="button"
                onClick={() => setShowAllModesModal(true)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-slate-600 transition shadow-xs active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Plus size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-bold text-[#142642] dark:text-slate-300">
                  Інші
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SYSTEM QUICK ACTIONS 2x2 GRID (05_Швидкі дії) */}
      <section aria-label="Швидкі дії" className="mt-4">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Почати навігацію (водій) */}
          <button
            type="button"
            onClick={onStartNavigation}
            className="flex items-center justify-between rounded-2xl border border-[#E3EBF4] bg-white p-3 text-left shadow-2xs transition hover:border-[#1769ED] active:scale-[0.99] dark:border-slate-800 dark:bg-[#101E38]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1769ED] text-white shadow-sm">
                <Compass size={20} strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#142642] dark:text-white leading-tight">
                  Почати навігацію
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[#6A7F98] dark:text-slate-400">
                  Маршрут і підбір попутників
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Card 2: Створити поїздку */}
          <button
            type="button"
            onClick={() => onPlanTrip('driver')}
            className="flex items-center justify-between rounded-2xl border border-[#E3EBF4] bg-white p-3 text-left shadow-2xs transition hover:border-rose-400 active:scale-[0.99] dark:border-slate-800 dark:bg-[#101E38]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FF3366] text-white shadow-sm">
                <CarFront size={20} strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#142642] dark:text-white leading-tight">
                  Створити поїздку
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[#6A7F98] dark:text-slate-400">
                  Опублікувати маршрут і вільні місця
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Card 3: Шукаю поїздку */}
          <button
            type="button"
            onClick={() => onPlanTrip('passenger')}
            className="flex items-center justify-between rounded-2xl border border-[#E3EBF4] bg-white p-3 text-left shadow-2xs transition hover:border-cyan-400 active:scale-[0.99] dark:border-slate-800 dark:bg-[#101E38]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#00B4D8] text-white shadow-sm">
                <Radio size={20} strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#142642] dark:text-white leading-tight">
                  Шукаю поїздку
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[#6A7F98] dark:text-slate-400">
                  Знайти водія на мій маршрут
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Card 4: Мої маршрути */}
          <button
            type="button"
            onClick={onViewAllTrips ?? onSearchTrip}
            className="flex items-center justify-between rounded-2xl border border-[#E3EBF4] bg-white p-3 text-left shadow-2xs transition hover:border-emerald-400 active:scale-[0.99] dark:border-slate-800 dark:bg-[#101E38]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#10B981] text-white shadow-sm">
                <Ticket size={20} strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold text-[#142642] dark:text-white leading-tight">
                  Мої маршрути
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[#6A7F98] dark:text-slate-400">
                  Збережені та нещодавні
                </span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400 shrink-0 ml-1" />
          </button>
        </div>
      </section>

      {/* 6. POPULAR ROUTES (06_Популярні маршрути) */}
      <section aria-label="Популярні маршрути" className="mt-4">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-extrabold text-[#142642] dark:text-white">
            Популярні маршрути
          </h2>
          <button
            type="button"
            onClick={onViewAllTrips ?? onSearchTrip}
            className="text-[11px] font-bold text-[#1769ED] hover:underline dark:text-blue-400"
          >
            Усі →
          </button>
        </div>

        {/* Horizontal Scroll of Popular Route Cards */}
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {[
            { id: 'lviv-kyiv', icon: CarFront, from: 'Львів', to: 'Київ', time: 'Сьогодні, 18:30', price: 'від 420 ₴' },
            { id: 'lviv-stryi', icon: Bus, from: 'Львів', to: 'Стрий', time: 'Сьогодні, 09:15', price: 'від 150 ₴' },
            { id: 'lviv-odesa', icon: TrainFront, from: 'Львів', to: 'Одеса', time: '14 травня', price: 'від 490 ₴' },
          ].map((item) => {
            const Icon = item.icon;
            const isBookmarked = bookmarkedRoutes.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setOriginInput(item.from);
                  setDestInput(item.to);
                  if (onSearchRoute) onSearchRoute(item.from, item.to);
                }}
                className="min-w-[175px] shrink-0 cursor-pointer rounded-2xl border border-[#E3EBF4] bg-white p-3 shadow-2xs transition hover:border-blue-400 dark:border-slate-800 dark:bg-[#101E38]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#142642] dark:text-white">
                    <Icon size={14} className="text-[#1769ED]" />
                    <span>{item.from} ➔ {item.to}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleBookmark(item.id, e)}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Heart size={14} className={isBookmarked ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6A7F98] dark:text-slate-400">
                  <Clock size={11} />
                  <span>{item.time}</span>
                </div>
                <div className="mt-2 text-xs font-black text-[#142642] dark:text-white">
                  {item.price}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. RECOMMENDED OPTIONS (07_Рекомендовані варіанти) */}
      <section aria-label="Рекомендовані варіанти" className="mt-4">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-extrabold text-[#142642] dark:text-white">
            Рекомендовані варіанти
          </h2>
          <button
            type="button"
            onClick={onSearchTrip}
            className="text-[11px] font-bold text-[#1769ED] hover:underline dark:text-blue-400"
          >
            Дивитися всі →
          </button>
        </div>

        {/* Horizontal Carousel of Recommended Cards */}
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {/* Card 1: Carpool Offer */}
          <div className="min-w-[270px] shrink-0 rounded-2xl border border-[#E3EBF4] bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-[#101E38]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ★ Найкраща ціна
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  🚗 Попутка
                </span>
              </div>
              <span className="text-sm font-black text-[#142642] dark:text-white">
                420 ₴
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&auto=format&q=80"
                  alt="Водій"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                  ✓
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#142642] dark:text-white">
                    Олександр Б.
                  </span>
                  <span className="flex items-center text-[11px] font-bold text-amber-500">
                    <Star size={10} className="fill-amber-400" />
                    <span className="ml-0.5">4.9</span>
                    <span className="ml-0.5 text-[10px] text-slate-400 font-normal">(120)</span>
                  </span>
                </div>
                <p className="text-[10px] text-[#6A7F98] dark:text-slate-400">
                  VW Passat · Чорний
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800">
              <div className="text-[10px] text-slate-500">
                19:00 → 01:15 · 2 вільні місця
              </div>
              <button
                type="button"
                onClick={onSearchTrip}
                className="rounded-lg bg-[#1769ED] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
              >
                Бронювати
              </button>
            </div>
          </div>

          {/* Card 2: Train Offer */}
          <div className="min-w-[250px] shrink-0 rounded-2xl border border-[#E3EBF4] bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-[#101E38]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-extrabold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                🚆 Поїзд
              </span>
              <span className="text-sm font-black text-[#142642] dark:text-white">
                380 ₴
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <TrainFront size={20} />
              </div>
              <div>
                <b className="block text-xs font-extrabold text-[#142642] dark:text-white">
                  Інтерсіті+ 743
                </b>
                <span className="block text-[10px] text-slate-500">
                  06:05 → 11:58 · 5г 53хв
                </span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800">
              <span className="text-[10px] text-slate-500">Сидячий 2-й клас</span>
              <button
                type="button"
                onClick={onSearchTrip}
                className="rounded-lg bg-[#1769ED] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
              >
                Квитки
              </button>
            </div>
          </div>

          {/* Card 3: Bus Offer */}
          <div className="min-w-[250px] shrink-0 rounded-2xl border border-[#E3EBF4] bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-[#101E38]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-extrabold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                🚌 Автобус
              </span>
              <span className="text-sm font-black text-[#142642] dark:text-white">
                350 ₴
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Bus size={20} />
              </div>
              <div>
                <b className="block text-xs font-extrabold text-[#142642] dark:text-white">
                  Autolux Express
                </b>
                <span className="block text-[10px] text-slate-500">
                  21:30 → 06:00 · 8г 30хв
                </span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800">
              <span className="text-[10px] text-slate-500">Wi-Fi · Багаж</span>
              <button
                type="button"
                onClick={onSearchTrip}
                className="rounded-lg bg-[#1769ED] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
              >
                Квитки
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL 1: FULL 20 TRANSPORT MODES ("Розширений вибір транспорту") */}
      {showAllModesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#101E38]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#142642] dark:text-white">
                  Розширений вибір транспорту
                </h3>
                <p className="text-xs text-[#6A7F98] dark:text-slate-400">
                  Оберіть один або декілька режимів для пошуку
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModesModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* 5x4 Grid matching the design image */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {ALL_TRANSPORT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedModes.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleMode(cat.id)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-2.5 text-center transition ${
                      isSelected
                        ? 'border-2 border-[#1769ED] bg-blue-50/80 shadow-xs dark:bg-blue-950/40'
                        : 'border border-[#E3EBF4] bg-[#F8FAFD] hover:border-slate-300 dark:border-slate-800 dark:bg-[#0B1730]'
                    }`}
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${cat.bgClass} shadow-xs`}>
                      <Icon size={18} />
                    </div>
                    <span className="mt-1.5 block text-[10px] font-bold text-[#142642] dark:text-slate-200 truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowAllModesModal(false)}
              className="mt-5 w-full rounded-2xl bg-[#1769ED] py-3 text-sm font-extrabold text-white shadow-md hover:bg-blue-700"
            >
              Застосувати вибір
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ROUTE SEARCH FILTERS ("Фільтри маршруту (приклад)") */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#101E38]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#142642] dark:text-white">
                Фільтри маршруту (приклад)
              </h3>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex gap-2">
              {['Ціна', 'Пересадки', 'Час у дорозі'].map((tab, idx) => (
                <button
                  key={tab}
                  type="button"
                  className={`flex-1 rounded-xl py-2 text-xs font-bold ${
                    idx === 0
                      ? 'bg-blue-50 text-[#1769ED] dark:bg-blue-950 dark:text-blue-300'
                      : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-[#0B1730] dark:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filter Pills Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAllModesModal(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-700 dark:border-slate-800 dark:bg-[#0B1730] dark:text-slate-200"
              >
                <span>👁️</span>
                <span>Види транспорту</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, luggage: !filters.luggage })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 font-bold ${
                  filters.luggage
                    ? 'border-blue-400 bg-blue-50 text-[#1769ED] dark:bg-blue-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-[#0B1730]'
                }`}
              >
                <span>🧳</span>
                <span>Багаж</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, pets: !filters.pets })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 font-bold ${
                  filters.pets
                    ? 'border-blue-400 bg-blue-50 text-[#1769ED] dark:bg-blue-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-[#0B1730]'
                }`}
              >
                <span>🐾</span>
                <span>Тварини</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, childSeat: !filters.childSeat })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 font-bold ${
                  filters.childSeat
                    ? 'border-blue-400 bg-blue-50 text-[#1769ED] dark:bg-blue-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-[#0B1730]'
                }`}
              >
                <span>👶</span>
                <span>Дитяче крісло</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, comfort: !filters.comfort })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 font-bold ${
                  filters.comfort
                    ? 'border-blue-400 bg-blue-50 text-[#1769ED] dark:bg-blue-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-[#0B1730]'
                }`}
              >
                <span>🛋️</span>
                <span>Комфорт</span>
              </button>
              <button
                type="button"
                onClick={() => setFilters({ ...filters, directOnly: !filters.directOnly })}
                className={`flex items-center gap-2 rounded-xl border p-2.5 font-bold ${
                  filters.directOnly
                    ? 'border-blue-400 bg-blue-50 text-[#1769ED] dark:bg-blue-950'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-[#0B1730]'
                }`}
              >
                <span>↗️</span>
                <span>Лише прямі</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersModal(false)}
              className="mt-5 w-full rounded-2xl bg-[#1769ED] py-3 text-sm font-extrabold text-white shadow-md hover:bg-blue-700"
            >
              Застосувати фільтри
            </button>
          </div>
        </div>
      )}

      {/* Map Point Picker Integration */}
      {activePickerField && (
        <Suspense fallback={null}>
          <MapPointPicker
            title={activePickerField === 'origin' ? 'Точка відправлення' : 'Точка прибуття'}
            initial={null}
            onConfirm={handleMapPointConfirm}
            onClose={() => setActivePickerField(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
