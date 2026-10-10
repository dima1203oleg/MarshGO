import React from 'react';
import {
  Bus,
  TramFront,
  TrainFront,
  CarFront,
  CarTaxiFront,
  Footprints,
  Zap,
  Bike,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface TransitCardSegment {
  mode: 'bus' | 'marshrutka' | 'trolleybus' | 'tram' | 'metro' | 'train' | 'carpool' | 'taxi' | 'walk' | 'bike' | 'scooter';
  typePrefix?: string;
  routeBadge: string;
  badgeBgColor?: string;
  priceUah?: number;
  distanceKm?: number;
  durationMinutes?: number;
}

export interface TransitCardData {
  id: string;
  totalDurationMinutes: number;
  totalDurationLabel: string; // e.g. "35 хв"
  totalPriceUah?: number;
  totalDistanceKm?: number;
  segments: TransitCardSegment[];
  transfersCount: number;
  isRealtime?: boolean;
  tag?: 'fastest' | 'cheapest' | 'optimal' | 'eco';
  carrierName?: string;
}

interface TransitResultCardProps {
  data: TransitCardData;
  onClick: () => void;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

function getSegmentIcon(mode: TransitCardSegment['mode']) {
  switch (mode) {
    case 'tram':
      return <TramFront size={18} className="text-slate-600 dark:text-slate-300 stroke-[2.2]" />;
    case 'metro':
    case 'train':
      return <TrainFront size={18} className="text-slate-600 dark:text-slate-300 stroke-[2.2]" />;
    case 'carpool':
      return <CarFront size={18} className="text-slate-600 dark:text-slate-300 stroke-[2.2]" />;
    case 'taxi':
      return <CarTaxiFront size={18} className="text-slate-600 dark:text-slate-300 stroke-[2.2]" />;
    case 'walk':
      return <Footprints size={16} className="text-slate-400 stroke-[2]" />;
    case 'scooter':
      return <Zap size={17} className="text-amber-500 stroke-[2.2]" />;
    case 'bike':
      return <Bike size={17} className="text-emerald-500 stroke-[2.2]" />;
    case 'bus':
    case 'marshrutka':
    case 'trolleybus':
    default:
      return <Bus size={18} className="text-slate-600 dark:text-slate-300 stroke-[2.2]" />;
  }
}

function getBadgeColor(mode: TransitCardSegment['mode'], index: number, badge: string): string {
  // Canonical palette matching European and Ukrainian live transit conventions
  if (mode === 'tram' || badge === '1' || badge === '2') return '#E11D48'; // Vivid Crimson
  if (mode === 'trolleybus' || badge === '24' || badge === '46') return '#0284C7'; // Cyan Sky
  if (mode === 'marshrutka' || badge === '21') return '#F59E0B'; // Warm Amber
  if (mode === 'metro') return '#7C3AED'; // Violet
  if (mode === 'train') return '#1D4ED8'; // Royal Blue
  // Alternating olive and vibrant green like reference Screenshot 1
  return index % 2 === 0 ? '#65A30D' : '#16A34A';
}

export const TransitResultCard: React.FC<TransitResultCardProps> = ({
  data,
  onClick,
  onFavorite: _onFavorite,
  isFavorite: _isFavorite = false,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex w-full items-center justify-between rounded-[26px] bg-[#EEF2F7]/90 hover:bg-white dark:bg-[#101E38]/90 dark:hover:bg-[#142646] p-4 text-left border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(8,102,245,0.08)] hover:border-[#0866F5]/40 dark:hover:border-blue-500/40 active:scale-[0.985] transition-all duration-200 cursor-pointer"
    >
      {/* Optional Top Mini Tag */}
      {data.tag && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-[#0866F5] px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-white shadow-xs">
          <Sparkles size={10} />
          {data.tag === 'fastest' ? 'Найшвидший' : data.tag === 'cheapest' ? 'Найдешевший' : 'Оптимальний'}
        </span>
      )}

      {/* Left to Center: Horizontal Segments Ribbon matching Reference Screenshot 1 */}
      <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar py-0.5 min-w-0 pr-3">
        {data.segments.map((segment, sIdx) => {
          const badgeBg = segment.badgeBgColor || getBadgeColor(segment.mode, sIdx, segment.routeBadge);
          const isLastSegment = sIdx === data.segments.length - 1;

          return (
            <React.Fragment key={sIdx}>
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Transport Mode Icon */}
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-2xs">
                  {getSegmentIcon(segment.mode)}
                </div>

                {/* Route Number Rounded Badge */}
                <span
                  style={{ backgroundColor: badgeBg }}
                  className="grid min-w-[36px] h-7 place-items-center rounded-xl px-2.5 text-xs font-black text-white shadow-xs tracking-tight"
                >
                  {segment.routeBadge}
                </span>

                {/* Subtext: Price and Distance */}
                {(segment.priceUah != null || segment.distanceKm != null) && (
                  <div className="flex flex-col text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                    {segment.priceUah != null && (
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {segment.priceUah.toFixed(1)} UAH
                      </span>
                    )}
                    {segment.distanceKm != null && (
                      <span className="text-[10px] text-slate-400">
                        {segment.distanceKm.toFixed(1)} км
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Connecting arrow with track to next segment */}
              {!isLastSegment && (
                <div className="flex items-center text-slate-300 dark:text-slate-600 shrink-0 px-1">
                  <ArrowRight size={16} className="stroke-[2.5]" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right Column: Total Duration in Bold Typography matching Screenshot 1 (e.g. "35 хв") */}
      <div className="flex flex-col items-end shrink-0 pl-3 border-l border-slate-200/70 dark:border-slate-800 min-w-[68px]">
        <div className="text-right">
          <span className="text-2xl sm:text-[26px] font-black tracking-tight text-[#0B1730] dark:text-white leading-none">
            {data.totalDurationMinutes}
          </span>
          <span className="ml-1 text-xs font-black text-slate-500 dark:text-slate-400">
            хв
          </span>
        </div>

        {/* Live GPS badge or total fare */}
        {data.isRealtime ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Live
          </span>
        ) : data.totalPriceUah != null ? (
          <span className="mt-0.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
            {Math.round(data.totalPriceUah)} ₴
          </span>
        ) : null}
      </div>
    </div>
  );
};
