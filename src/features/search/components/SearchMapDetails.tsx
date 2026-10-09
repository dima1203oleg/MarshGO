import React, { useState } from 'react';
import { ArrowLeft, Car, MapPin, Share2, ShieldCheck, Star } from 'lucide-react';
import type { RouteSearchResultItem } from '../model/types';
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
  onBook,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const routeCoordinates: Coordinate[] = item.routeGeometry?.length ? item.routeGeometry : [];

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

      </header>

      <div className="border-b border-slate-100 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-[#0B1730]/80 dark:text-slate-300">
        Маршрут і дані з оголошення водія
      </div>

      {/* Use only route geometry returned by the API; never imply a road was calculated when it was not. */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#E7F0FD] dark:bg-[#0A162B]">
        {routeCoordinates.length >= 2 ? (
          <MarshGoMap route={routeCoordinates} onStatus={() => {}} onAdapter={() => {}} />
        ) : (
          <div className="grid h-full min-h-56 place-items-center px-8 text-center">
            <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-[#0B1730]/90">
              <MapPin className="mx-auto mb-3 text-blue-600" size={28} />
              <p className="font-bold text-slate-800 dark:text-white">Маршрут на карті поки недоступний</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Водій ще не надав дорожню геометрію для цієї пропозиції.</p>
            </div>
          </div>
        )}
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
                  {item.driver.avatar ? (
                    <img src={item.driver.avatar} alt={item.driver.name} className="h-full w-full object-cover" />
                  ) : item.driver.name.slice(0, 1).toUpperCase()}
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
                  {item.driver.rating == null ? (
                    <span className="text-[10px] text-[#63738C] dark:text-slate-400">Ще немає відгуків</span>
                  ) : (
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-black">{item.driver.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-[#63738C] dark:text-slate-400">({item.driver.reviewCount})</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#63738C] dark:text-slate-400">
                  {item.vehicleModel || 'Автомобіль'}
                </p>
              </div>
            </div>

            {item.vehiclePhoto && <img src={item.vehiclePhoto} alt="Фото автомобіля" className="h-16 w-20 rounded-xl border border-slate-100 object-cover dark:border-slate-700" />}
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

        {/* Share and booking actions */}
        <div className="mt-4 flex items-center gap-2.5">
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
