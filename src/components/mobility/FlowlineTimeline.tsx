import React, { useState } from 'react';
import {
  Clock,
  Flag,
  Wallet,
  X,
  Navigation,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Footprints,
  Bus,
  TramFront,
  TrainFront,
  CarFront,
  CarTaxiFront,
  Zap,
  Bike,
  AlertTriangle,
  Bell,
  Heart,
} from 'lucide-react';

export interface FlowlineLeg {
  id: string;
  mode: 'walk' | 'bus' | 'marshrutka' | 'trolleybus' | 'tram' | 'metro' | 'train' | 'carpool' | 'taxi' | 'scooter' | 'bike';
  modeLabel?: string;
  typePrefix?: string; // 'А', 'Т', 'Тр', 'Мт', 'М'
  routeBadge?: string; // '21', '24', '112', '46'
  badgeColor?: string;
  originName: string;
  destinationName: string;
  departureTime?: string;
  arrivalTime?: string;
  durationLabel: string;
  distanceLabel: string;
  priceLabel?: string;
  stopsCount?: number;
  intermediateStops?: Array<{ name: string; time?: string; isPassed?: boolean }>;
  vehiclePlate?: string;
  isRealtime?: boolean;
  nextArrivalMinutes?: number;
  alertNote?: string;
}

export interface FlowlineData {
  totalDurationLabel: string; // e.g. '53 хв'
  totalDistanceLabel: string; // e.g. '11.0 км'
  totalPriceLabel: string;    // e.g. '60.0 UAH'
  originAddress: string;
  destinationAddress: string;
  legs: FlowlineLeg[];
  transfersCount?: number;
  departureTime?: string;
  arrivalTime?: string;
  co2SavingsKg?: number;
}

interface FlowlineTimelineProps {
  data: FlowlineData;
  onClose?: () => void;
  onStartNavigation?: () => void;
  onShare?: () => void;
  onSelectStop?: (stopName: string) => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

function getModeIcon(mode: FlowlineLeg['mode']) {
  switch (mode) {
    case 'walk':
      return <Footprints size={19} className="text-slate-500 stroke-[2.2]" />;
    case 'tram':
      return <TramFront size={19} className="text-rose-500 dark:text-rose-400 stroke-[2.2]" />;
    case 'trolleybus':
      return <Bus size={19} className="text-sky-500 dark:text-sky-400 stroke-[2.2]" />;
    case 'metro':
      return <TrainFront size={19} className="text-purple-500 dark:text-purple-400 stroke-[2.2]" />;
    case 'train':
      return <TrainFront size={19} className="text-indigo-500 dark:text-indigo-400 stroke-[2.2]" />;
    case 'carpool':
      return <CarFront size={19} className="text-emerald-500 dark:text-emerald-400 stroke-[2.2]" />;
    case 'taxi':
      return <CarTaxiFront size={19} className="text-amber-500 dark:text-amber-400 stroke-[2.2]" />;
    case 'scooter':
      return <Zap size={19} className="text-emerald-500 dark:text-emerald-400 stroke-[2.2]" />;
    case 'bike':
      return <Bike size={19} className="text-teal-500 dark:text-teal-400 stroke-[2.2]" />;
    case 'bus':
    case 'marshrutka':
    default:
      return <Bus size={19} className="text-amber-500 dark:text-amber-400 stroke-[2.2]" />;
  }
}

function getBadgeStyle(mode: FlowlineLeg['mode'], badge?: string): { bg: string; text: string; railColor: string } {
  if (mode === 'tram' || badge === '1' || badge === '2') {
    return { bg: 'bg-[#DC2626]', text: 'text-white', railColor: 'bg-[#DC2626]' };
  }
  if (mode === 'trolleybus' || badge === '24') {
    return { bg: 'bg-[#0284C7]', text: 'text-white', railColor: 'bg-[#0284C7]' };
  }
  if (mode === 'marshrutka' || badge === '21') {
    return { bg: 'bg-[#F59E0B]', text: 'text-white', railColor: 'bg-[#F59E0B]' };
  }
  if (mode === 'metro') {
    return { bg: 'bg-[#7C3AED]', text: 'text-white', railColor: 'bg-[#7C3AED]' };
  }
  if (mode === 'train') {
    return { bg: 'bg-[#1D4ED8]', text: 'text-white', railColor: 'bg-[#1D4ED8]' };
  }
  return { bg: 'bg-[#16A34A]', text: 'text-white', railColor: 'bg-[#16A34A]' };
}

export const FlowlineTimeline: React.FC<FlowlineTimelineProps> = ({
  data,
  onClose,
  onStartNavigation,
  onShare,
  onSelectStop,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const [expandedLegs, setExpandedLegs] = useState<Record<string, boolean>>({});
  const [alarmActive, setAlarmActive] = useState(false);

  const toggleExpand = (legId: string) => {
    setExpandedLegs((prev) => ({ ...prev, [legId]: !prev[legId] }));
  };

  return (
    <div className="flowline-container flex flex-col w-full bg-white dark:bg-[#0B1730] text-[#0B1730] dark:text-white rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden transition-all duration-300 border-t border-slate-200/80 dark:border-slate-800">
      {/* Top Grab Handle for mobile swipe gestures */}
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

      {/* Header Bar matching Reference Photo 4:
          [Clock icon] 53 хв  [Flag icon] 11.0 км  [Wallet icon] 60.0 UAH  [Close X] */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Time Stat */}
          <div className="flex items-center gap-2.5">
            <Clock size={24} className="text-[#0B1730] dark:text-white stroke-[2.4]" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1730] dark:text-white">
              {data.totalDurationLabel}
            </span>
          </div>

          {/* Distance Stat */}
          <div className="flex items-center gap-2.5">
            <Flag size={24} className="text-[#0B1730] dark:text-white stroke-[2.4]" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1730] dark:text-white">
              {data.totalDistanceLabel}
            </span>
          </div>

          {/* Price Stat */}
          <div className="flex items-center gap-2.5">
            <Wallet size={24} className="text-[#0B1730] dark:text-white stroke-[2.4]" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1730] dark:text-white">
              {data.totalPriceLabel}
            </span>
          </div>
        </div>

        {/* Action icons: Favorite, Share, Close */}
        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-label="В обране"
              className={`grid h-10 w-10 place-items-center rounded-full transition active:scale-95 ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              aria-label="Поділитися"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
            >
              <Share2 size={18} />
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити"
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Multimodal Eco/Smart Header Banner */}
      {data.co2SavingsKg != null && data.co2SavingsKg > 0 && (
        <div className="mx-5 mt-3 flex items-center justify-between rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 px-3.5 py-2 border border-emerald-100 dark:border-emerald-900/40 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Екологічний маршрут · заощаджено ~{data.co2SavingsKg} кг CO₂</span>
          </div>
          {data.transfersCount != null && (
            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/60 px-2 py-0.5 rounded-full shadow-2xs">
              {data.transfersCount === 0 ? 'Прямий рейс' : `${data.transfersCount} пересадка`}
            </span>
          )}
        </div>
      )}

      {/* Interactive Vertical Timeline Body (Matching Reference Photo 4 & 5) */}
      <div className="timeline-body flex-1 overflow-y-auto px-5 py-4 space-y-0 text-sm max-h-[62vh] sm:max-h-[520px]">
        {data.legs.map((leg, index) => {
          const isWalking = leg.mode === 'walk';
          const badgeStyle = getBadgeStyle(leg.mode, leg.routeBadge);
          const isExpanded = Boolean(expandedLegs[leg.id]);
          const nextLeg = data.legs[index + 1];

          if (isWalking) {
            return (
              <div key={leg.id} className="relative flex items-start gap-4 pb-4">
                {/* Dotted Vertical Timeline Column */}
                <div className="flex flex-col items-center self-stretch shrink-0 w-6">
                  {/* Top dot / node */}
                  <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600 my-1" />
                  {/* Dotted rail */}
                  <div className="w-0.5 flex-1 border-l-2 border-dotted border-slate-300 dark:border-slate-700 my-0.5" />
                </div>

                {/* Walk Content Card */}
                <div className="flex-1 rounded-2xl bg-[#F6F8FB] dark:bg-[#101E38]/80 border border-slate-200/70 dark:border-slate-800 p-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs">
                        <Footprints size={18} />
                      </div>
                      <div>
                        <b className="text-sm font-black text-[#0B1730] dark:text-white">Пішки</b>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          До {leg.destinationName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock size={13} />
                        {leg.durationLabel}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Flag size={13} />
                        {leg.distanceLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // PUBLIC TRANSIT / VEHICLE LEG
          return (
            <React.Fragment key={leg.id}>
              {/* BOARDING STOP CAPSULE NODE (Matching Reference Photo 4: "Щепова" or "вул. Петра Дорошенка") */}
              <div className="relative flex items-center gap-4 py-1.5">
                {/* Ring node on the vertical rail */}
                <div className="flex flex-col items-center shrink-0 w-6">
                  <div className="h-5 w-5 rounded-full border-[3.5px] border-slate-700 dark:border-slate-300 bg-white dark:bg-[#0B1730] shadow-xs" />
                </div>

                {/* Stop Capsule Pill (Identical to Photo 4 style) */}
                <button
                  type="button"
                  onClick={() => onSelectStop?.(leg.originName)}
                  className="group flex-1 flex items-center justify-between rounded-full bg-[#E5E9EF] dark:bg-[#1E2E4A] hover:bg-slate-300 dark:hover:bg-slate-700 px-4 py-2.5 text-left transition active:scale-[0.99] shadow-2xs"
                >
                  <span className="text-xs sm:text-sm font-black text-[#0B1730] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {leg.originName}
                  </span>
                  {leg.departureTime && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {leg.departureTime}
                    </span>
                  )}
                </button>
              </div>

              {/* TRANSIT SEGMENT ROW (Matching Photo 4: Bus icon, type prefix, colored badge, duration, distance, stops count) */}
              <div className="relative flex items-start gap-4 py-2">
                {/* Solid Vertical Transit Rail */}
                <div className="flex flex-col items-center self-stretch shrink-0 w-6">
                  <div className={`w-1.5 flex-1 rounded-full ${badgeStyle.railColor} my-0.5 opacity-90`} />
                </div>

                {/* Transit Vehicle Card */}
                <div className="flex-1 rounded-2xl bg-white dark:bg-[#101E38] border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-sm">
                  {/* Row 1: Vehicle Icon + Type Prefix + Route Badge + Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        {getModeIcon(leg.mode)}
                      </span>

                      {/* Type Prefix (e.g. "Мт", "Тр", "А", "Т") */}
                      <span className="text-sm font-black text-[#0B1730] dark:text-white">
                        {leg.typePrefix || (leg.mode === 'marshrutka' ? 'Мт' : leg.mode === 'trolleybus' ? 'Тр' : leg.mode === 'tram' ? 'Т' : 'А')}
                      </span>

                      {/* Route Number Colored Badge */}
                      {leg.routeBadge && (
                        <span
                          className={`grid min-w-[34px] h-7 place-items-center px-2 py-0.5 rounded-xl text-xs font-black shadow-xs ${badgeStyle.bg} ${badgeStyle.text}`}
                        >
                          {leg.routeBadge}
                        </span>
                      )}

                      {/* Live GPS badge */}
                      {leg.isRealtime && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live GPS
                        </span>
                      )}
                    </div>

                    {/* Stats: Duration, Distance, Stops */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>{leg.durationLabel}</span>
                      <span>•</span>
                      <span>{leg.distanceLabel}</span>
                      {leg.stopsCount != null && leg.stopsCount > 0 && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => toggleExpand(leg.id)}
                            className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-black hover:underline"
                          >
                            <span>{leg.stopsCount} зуп.</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Destination direction arrow & subtext */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400 font-bold">➔</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {leg.destinationName}
                      </span>
                    </div>

                    {leg.priceLabel && (
                      <span className="font-extrabold text-[#0B1730] dark:text-white shrink-0 ml-2">
                        {leg.priceLabel}
                      </span>
                    )}
                  </div>

                  {/* Alert or delay notice if present */}
                  {leg.alertNote && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                      <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                      <span>{leg.alertNote}</span>
                    </div>
                  )}

                  {/* Expandable intermediate stops list */}
                  {isExpanded && leg.intermediateStops && leg.intermediateStops.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 pl-2 animate-in fade-in duration-200">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Проміжні зупинки ({leg.intermediateStops.length})
                      </p>
                      {leg.intermediateStops.map((stop, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between text-xs py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                          onClick={() => onSelectStop?.(stop.name)}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="font-semibold">{stop.name}</span>
                          </div>
                          {stop.time && (
                            <span className="text-[11px] font-mono text-slate-400">{stop.time}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* If this leg is the last public transit leg, render its DESTINATION STOP CAPSULE */}
              {(!nextLeg || nextLeg.mode === 'walk') && (
                <div className="relative flex items-center gap-4 py-1.5">
                  <div className="flex flex-col items-center shrink-0 w-6">
                    <div className="h-5 w-5 rounded-full border-[3.5px] border-slate-700 dark:border-slate-300 bg-white dark:bg-[#0B1730] shadow-xs" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectStop?.(leg.destinationName)}
                    className="group flex-1 flex items-center justify-between rounded-full bg-[#E5E9EF] dark:bg-[#1E2E4A] hover:bg-slate-300 dark:hover:bg-slate-700 px-4 py-2.5 text-left transition active:scale-[0.99] shadow-2xs"
                  >
                    <span className="text-xs sm:text-sm font-black text-[#0B1730] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {leg.destinationName}
                    </span>
                    {leg.arrivalTime && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {leg.arrivalTime}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* DESTINATION PIN B (Matching Reference Screenshot 5 bottom) */}
        <div className="relative flex items-center gap-4 pt-3 pb-1">
          <div className="flex flex-col items-center shrink-0 w-6">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#0866F5] text-white text-xs font-black shadow-md">
              B
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm font-black text-[#0866F5] dark:text-blue-400">
              {data.destinationAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Turn-by-turn Navigation & Alarms from Spec) */}
      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Active Navigation Primary Button */}
          <button
            type="button"
            onClick={onStartNavigation}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0866F5] to-[#0553CA] hover:from-[#0755CA] hover:to-[#0444A5] py-4 px-5 text-sm font-black text-white shadow-xl shadow-blue-500/25 active:scale-[0.985] transition-all"
          >
            <Navigation size={18} className="fill-current" />
            <span>Почати навігацію</span>
          </button>

          {/* Alarm / Transfer reminder button */}
          <button
            type="button"
            onClick={() => setAlarmActive(!alarmActive)}
            title="Сповістити про вихід на зупинці"
            aria-label="Сповістити про вихід"
            className={`grid h-13 w-13 place-items-center rounded-2xl border transition active:scale-95 ${
              alarmActive
                ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bell size={20} />
          </button>
        </div>

        {alarmActive && (
          <p className="mt-2.5 text-center text-xs font-bold text-amber-600 dark:text-amber-400 animate-in fade-in duration-200">
            🔔 Сповіщення активовано: ви отримаєте сигнал за 1 зупинку до пересадки
          </p>
        )}
      </div>
    </div>
  );
};
