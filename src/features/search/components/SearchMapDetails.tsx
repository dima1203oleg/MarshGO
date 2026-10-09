import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Car,
  Heart,
  Layers,
  MoreVertical,
  Navigation,
  Share2,
  ShieldCheck,
  Star,
} from 'lucide-react';
import type { RouteSearchResultItem } from '../model/types';
import { MOCK_ASSETS } from '../assets/mockAssets';
import { MarshGoMap } from '../../../map/MarshGoMap';
import type { Coordinate } from '../../../../shared/navigation/contracts';

interface SearchMapDetailsProps {
  item: RouteSearchResultItem;
  originTitle: string;
  destTitle: string;
  dateStr: string;
  timeStr: string;
  passengers: number;
  onBackToResults: () => void;
  onSwitchToList: () => void;
  onBook: (item: RouteSearchResultItem) => void;
}

export const SearchMapDetails: React.FC<SearchMapDetailsProps> = ({
  item,
  originTitle,
  destTitle,
  dateStr: _dateStr,
  timeStr,
  passengers,
  onBackToResults,
  onSwitchToList,
  onBook,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'timeline'>('map');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Construct coordinates for the route
  // Default to Lviv (49.8397, 24.0297) -> Kyiv (50.4501, 30.5234) if not supplied
  const defaultRoute: Coordinate[] = [
    [49.8397, 24.0297], // Lviv
    [50.6199, 26.2516], // Rivne
    [50.2547, 28.6587], // Zhytomyr
    [50.4501, 30.5234], // Kyiv
  ];

  const routeCoordinates: Coordinate[] =
    item.routeGeometry && item.routeGeometry.length > 0
      ? (item.routeGeometry as Coordinate[])
      : defaultRoute;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `MARSHGO: ${originTitle} → ${destTitle}`,
          text: `Знайдено маршрут: ${item.modeLabel} за ${item.priceLabel} (${item.durationLabel})`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="relative mx-auto flex flex-col h-[100svh] w-full max-w-md overflow-hidden bg-[#F4F8FF] dark:bg-[#070E1B] text-[#081B35] dark:text-white pb-16">
      {/* Top Header */}
      <header className="relative z-30 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md px-4 py-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBackToResults}
          className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition active:scale-95"
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-black tracking-tight text-[#081B35] dark:text-white">
            {originTitle.split(',')[0]} → {destTitle.split(',')[0]}
          </h1>
          <p className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
            {timeStr} · {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`grid h-9 w-9 place-items-center rounded-full transition ${
              isBookmarked
                ? 'bg-red-50 text-red-500 dark:bg-red-950/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            aria-label="В обране"
          >
            <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Меню"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </header>

      {/* Segmented View Switcher: Карта | Список | Таймлайн */}
      <div className="relative z-30 px-4 py-2 bg-white/80 dark:bg-[#0B1730]/80 backdrop-blur-md border-b border-slate-100/60 dark:border-slate-800/60">
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#EAF3FF] dark:bg-slate-800/70 border border-[#D3E5FD] dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`py-1.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'map'
                ? 'bg-[#0866F5] text-white shadow-md shadow-[#0866F5]/25'
                : 'text-[#081B35] dark:text-slate-300 hover:text-[#0866F5]'
            }`}
          >
            Карта
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              onSwitchToList();
            }}
            className={`py-1.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'list'
                ? 'bg-[#0866F5] text-white shadow-md shadow-[#0866F5]/25'
                : 'text-[#081B35] dark:text-slate-300 hover:text-[#0866F5]'
            }`}
          >
            Список
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-1.5 text-xs font-black rounded-xl transition-all ${
              activeTab === 'timeline'
                ? 'bg-[#0866F5] text-white shadow-md shadow-[#0866F5]/25'
                : 'text-[#081B35] dark:text-slate-300 hover:text-[#0866F5]'
            }`}
          >
            Таймлайн
          </button>
        </div>
      </div>

      {/* Map Canvas with Route */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#E7F0FD] dark:bg-[#0A162B]">
        {/* MapLibre / Native Map Container */}
        <div className="absolute inset-0 z-0">
          <MarshGoMap
            route={routeCoordinates}
            onStatus={() => {}}
            onAdapter={() => {}}
          />
        </div>

        {/* Vector Route Overlay matching Screen 3 Mockup exactly */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" fill="none">
            {/* Soft map road grid / terrain lines */}
            <path d="M 0 160 Q 200 130 400 110" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 80 0 Q 150 180 200 300" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
            
            {/* Main curved route polyline from Lviv (x:55, y:190) to Kyiv (x:340, y:100) */}
            <path
              d="M 55 190 Q 120 160 170 145 T 270 140 T 340 100"
              stroke="#0866F5"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 55 190 Q 120 160 170 145 T 270 140 T 340 100"
              stroke="#60A5FA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />

            {/* Stop points along the route */}
            {/* Lviv Start Node */}
            <circle cx="55" cy="190" r="10" fill="#0866F5" />
            <circle cx="55" cy="190" r="5" fill="#FFFFFF" />

            {/* Rivne Stop Node */}
            <circle cx="170" cy="145" r="7" fill="#10B981" />
            <circle cx="170" cy="145" r="3.5" fill="#FFFFFF" />

            {/* Zhytomyr Stop Node */}
            <circle cx="270" cy="140" r="7" fill="#F59E0B" />
            <circle cx="270" cy="140" r="3.5" fill="#FFFFFF" />

            {/* Kyiv Destination Node */}
            <circle cx="340" cy="100" r="10" fill="#EF4444" />
            <circle cx="340" cy="100" r="5" fill="#FFFFFF" />
          </svg>

          {/* City & Route Labels */}
          <div className="absolute left-[35px] top-[195px] text-[13px] font-black text-[#081B35] dark:text-white drop-shadow-sm">
            Львів
          </div>
          <div className="absolute left-[155px] top-[118px] text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
            Рівне
          </div>
          <div className="absolute left-[245px] top-[148px] text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
            Житомир
          </div>
          <div className="absolute right-[25px] top-[105px] text-[13px] font-black text-[#081B35] dark:text-white drop-shadow-sm">
            Київ
          </div>
          <div className="absolute left-[255px] top-[210px] text-[10px] font-semibold text-slate-400">
            Біла Церква
          </div>
          <div className="absolute left-[270px] top-[230px] text-[13px] font-black text-slate-700/80 dark:text-slate-400/80 tracking-wide">
            Україна
          </div>

          {/* Lviv Origin Pin Chip */}
          <div className="absolute left-4 top-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#0B1730]/95 shadow-md border border-slate-200/80 dark:border-slate-700">
              <span className="text-xs font-black text-[#081B35] dark:text-white">
                {item.departureTime}
              </span>
              <span className="text-[11px] font-bold text-[#63738C] dark:text-slate-400">
                {originTitle.split(',')[0]}
              </span>
            </div>
          </div>

          {/* Floating Map Control Buttons */}
          <div className="absolute right-4 top-4 flex flex-col gap-2 pointer-events-auto">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 shadow-lg border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95"
              aria-label="Шари карти"
            >
              <Layers size={18} />
            </button>
          </div>

          <div className="absolute right-4 bottom-8 pointer-events-auto">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 shadow-lg border border-slate-200/80 dark:border-slate-700 text-[#0866F5] transition active:scale-95"
              aria-label="Моє місцезнаходження"
            >
              <Navigation size={18} />
            </button>
          </div>

          {/* Kyiv Destination Pin Chip */}
          <div className="absolute right-12 top-14">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#0B1730]/95 shadow-md border border-slate-200/80 dark:border-slate-700">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E73C59]" />
              <span className="text-xs font-black text-[#081B35] dark:text-white">
                {item.arrivalTime}
              </span>
              <span className="text-[11px] font-bold text-[#63738C] dark:text-slate-400">
                {destTitle.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Up Bottom Sheet Card (Screen 3 Bottom Panel) */}
      <div className="relative z-20 w-full max-w-md mx-auto bg-white dark:bg-[#0B1730] rounded-t-[28px] shadow-[0_-8px_30px_rgba(8,27,53,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] border-t border-slate-100 dark:border-slate-800 px-4 pt-3 pb-6 animate-in slide-in-from-bottom-6 duration-300">
        {/* Grab Handle */}
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

        {/* Duration & Price Row */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#081B35] dark:text-white">
                {item.durationLabel}
              </span>
              <span className="text-xs font-semibold text-[#63738C] dark:text-slate-400">
                {item.distanceLabel}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-black text-[#0866F5] dark:text-[#3B82F6]">
              {item.priceLabel}
            </div>
            <div className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
              {item.priceUnit}
            </div>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 mt-2.5">
          {item.badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              <Star size={11} fill="currentColor" />
              {item.badge}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3FF] dark:bg-blue-950/50 px-2.5 py-1 text-[11px] font-black text-[#0866F5] dark:text-[#60A5FA] border border-[#D3E5FD] dark:border-blue-800/40">
            <Car size={11} />
            {item.modeLabel}
          </span>
        </div>

        {/* Driver & Vehicle Box */}
        {item.driver && (
          <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-[#F4F8FF] dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#0866F5]/10 text-sm font-black text-[#0866F5]">
                  <img
                    src={item.driver.avatar || MOCK_ASSETS.avatarAndriy}
                    alt={item.driver.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {item.driver.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white dark:bg-slate-900 p-0.5 text-blue-600">
                    <ShieldCheck size={12} fill="currentColor" className="text-[#0866F5]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[#081B35] dark:text-white">
                    {item.driver.name}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-black">
                      {item.driver.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[#63738C] dark:text-slate-400">
                      ({item.driver.reviewCount})
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#63738C] dark:text-slate-400">
                  {item.vehicleModel || 'Toyota Camry · Чорний'}
                </p>
              </div>
            </div>

            {/* Car Interior Preview Photos (3 thumbnails matching Screen 3) */}
            <div className="flex items-center gap-1.5">
              <div className="h-10 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-800 shadow-xs">
                <img
                  src={MOCK_ASSETS.interiorWheel}
                  alt="Салон кермо"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="h-10 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-800 shadow-xs">
                <img
                  src={MOCK_ASSETS.interiorSeats}
                  alt="Салон сидіння"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="h-10 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-800 shadow-xs">
                <img
                  src={MOCK_ASSETS.carSedan}
                  alt="Авто зовні"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stops / Timeline Section */}
        <div className="mt-3.5 space-y-2.5">
          {/* Pickup */}
          <div className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-[#0866F5] ring-4 ring-blue-100 dark:ring-blue-950" />
              <div className="my-0.5 h-7 w-0.5 bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="-mt-1 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black text-[#081B35] dark:text-white">
                  {item.departureTime}
                </span>
                <span className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
                  Посадка
                </span>
              </div>
              <p className="text-xs text-[#63738C] dark:text-slate-300">
                {item.departureAddress || originTitle}
              </p>
            </div>
          </div>

          {/* En-route snippet */}
          <div className="flex items-center gap-3 pl-0.5">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0866F5] text-xs">
              <Car size={13} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-[#081B35] dark:text-white">
                {item.durationLabel} · {item.distanceLabel}
              </p>
              <p className="text-[11px] text-[#63738C] dark:text-slate-400">
                Комфортна поїздка, {item.stopsCount} {item.stopsCount === 1 ? 'зупинка' : 'зупинки'}
              </p>
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-[#0866F5] ring-4 ring-blue-100 dark:ring-blue-950" />
            </div>
            <div className="-mt-1 flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black text-[#081B35] dark:text-white">
                  {item.arrivalTime}
                </span>
                <span className="text-[11px] font-semibold text-[#63738C] dark:text-slate-400">
                  Висадка
                </span>
              </div>
              <p className="text-xs text-[#63738C] dark:text-slate-300">
                {item.arrivalAddress || destTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Row: Bookmark | Share | Primary CTA Button */}
        <div className="mt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`grid h-12 w-12 place-items-center rounded-2xl border transition active:scale-95 ${
              isBookmarked
                ? 'border-[#0866F5] bg-blue-50 text-[#0866F5] dark:bg-blue-950/40'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            aria-label="Зберегти"
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 text-xs font-black text-[#081B35] dark:text-white transition active:scale-95"
          >
            <Share2 size={16} />
            <span>{copiedLink ? 'Скопійовано!' : 'Поділитися'}</span>
          </button>

          <button
            type="button"
            onClick={() => onBook(item)}
            className="flex-1 h-12 rounded-2xl bg-[#0866F5] text-white text-sm font-black shadow-lg shadow-[#0866F5]/30 hover:bg-[#0755CA] transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Забронювати
          </button>
        </div>
      </div>
    </div>
  );
};
