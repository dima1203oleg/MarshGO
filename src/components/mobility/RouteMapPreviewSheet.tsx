import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Menu,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  Plus,
  Minus,
  LocateFixed,
  Clock,
  Flag,
  Wallet,
  X,
  Navigation,
} from 'lucide-react';
import type { Coordinate } from '../../../shared/navigation/contracts';
import { MarshGoMap } from '../../map/MarshGoMap';
import { FlowlineTimeline, type FlowlineData } from './FlowlineTimeline';
import type { MapAdapter, MapStatus } from '../../map/MapAdapter';

interface RouteMapPreviewSheetProps {
  originTitle: string;
  destinationTitle: string;
  routeCoordinates?: Coordinate[];
  flowlineData: FlowlineData;
  onBack: () => void;
  onMenuClick?: () => void;
  onOpenFilters?: () => void;
  onSwapPoints?: () => void;
  onStartNavigation: () => void;
  onClose?: () => void;
}

export const RouteMapPreviewSheet: React.FC<RouteMapPreviewSheetProps> = ({
  originTitle,
  destinationTitle,
  routeCoordinates = [],
  flowlineData,
  onBack,
  onMenuClick,
  onOpenFilters,
  onSwapPoints,
  onStartNavigation,
  onClose,
}) => {
  // Bottom sheet states: 'collapsed' (Photo 3), 'expanded' (Photo 4/5), 'full'
  const [sheetState, setSheetState] = useState<'collapsed' | 'expanded'>('collapsed');
  const [, setMapStatus] = useState<MapStatus>('loading');
  const [mapAdapter, setMapAdapter] = useState<MapAdapter | null>(null);
  const [zoomLevel, setZoomLevel] = useState(13);

  // Extract midpoint or vehicle position for live marker animation
  const vehiclePosition = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      const midIdx = Math.floor(routeCoordinates.length * 0.45);
      return routeCoordinates[midIdx] ?? null;
    }
    return null;
  }, [routeCoordinates]);

  const handleZoomIn = () => {
    if (mapAdapter && vehiclePosition) {
      const nextZoom = zoomLevel + 1;
      setZoomLevel(nextZoom);
      mapAdapter.focus(vehiclePosition, nextZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapAdapter && vehiclePosition) {
      const nextZoom = Math.max(8, zoomLevel - 1);
      setZoomLevel(nextZoom);
      mapAdapter.focus(vehiclePosition, nextZoom);
    }
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator && mapAdapter) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapAdapter.focus([pos.coords.longitude, pos.coords.latitude], 14.5);
        },
        () => {
          if (routeCoordinates.length >= 2) mapAdapter.fitRoute();
        }
      );
    } else if (mapAdapter && routeCoordinates.length >= 2) {
      mapAdapter.fitRoute();
    }
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-[#eaf3fc] dark:bg-[#070E1B] text-[#081B35] dark:text-white select-none">
      {/* MAP CANVAS */}
      <div className="absolute inset-0 z-0">
        <MarshGoMap
          route={routeCoordinates}
          vehicle={vehiclePosition}
          heading={45}
          speedMps={8.3}
          vehicleLabel={flowlineData.legs.find((l) => l.routeBadge)?.routeBadge ? `№${flowlineData.legs.find((l) => l.routeBadge)?.routeBadge}` : undefined}
          overlays={true}
          theme="MARSHGO_LIGHT"
          onStatus={setMapStatus}
          onAdapter={(adapter) => {
            setMapAdapter(adapter);
            if (adapter && routeCoordinates.length >= 2) {
              adapter.setRoute(routeCoordinates);
              adapter.fitRoute();
            }
          }}
        />
      </div>

      {/* TOP FLOATING SEARCH & ROUTE BAR (Matching Reference Screenshot 3) */}
      <div className="pointer-events-none absolute inset-x-3 sm:inset-x-5 top-[max(0.8rem,env(safe-area-inset-top))] z-30 flex items-start gap-2.5">
        {/* Floating Left Circular Buttons: Back [<] & Menu [≡] */}
        <div className="pointer-events-auto flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Назад"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/95 dark:bg-[#0B1730]/95 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200/80 dark:border-slate-800 transition active:scale-95 hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </button>

          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Меню"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/95 dark:bg-[#0B1730]/95 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200/80 dark:border-slate-800 transition active:scale-95 hover:bg-slate-50"
            >
              <Menu size={19} />
            </button>
          )}
        </div>

        {/* Floating Search Points Card (A and B inputs with settings and swap) */}
        <div className="pointer-events-auto flex-1 rounded-[22px] bg-white/95 dark:bg-[#0B1730]/95 p-2 shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
          {/* Row A: Origin */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-500 text-white text-[11px] font-black shadow-xs">
                A
              </span>
              <span className="truncate text-xs font-black text-[#0B1730] dark:text-white">
                {originTitle}
              </span>
            </div>

            {onOpenFilters && (
              <button
                type="button"
                onClick={onOpenFilters}
                aria-label="Налаштування фільтрів"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <SlidersHorizontal size={15} />
              </button>
            )}
          </div>

          <div className="h-1.5" />

          {/* Row B: Destination */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0866F5] text-white text-[11px] font-black shadow-xs">
                B
              </span>
              <span className="truncate text-xs font-black text-[#0B1730] dark:text-white">
                {destinationTitle}
              </span>
            </div>

            {onSwapPoints && (
              <button
                type="button"
                onClick={onSwapPoints}
                aria-label="Поміняти місцями"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <ArrowUpDown size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING MAP CONTROLS ON RIGHT (Matching Reference Screenshot 3) */}
      <div className="pointer-events-none absolute right-3 sm:right-5 top-40 z-20 flex flex-col gap-2.5 items-end">
        {/* Layer Switcher */}
        <button
          type="button"
          onClick={() => {
            // cycle layers
          }}
          aria-label="Шари карти"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200/80 dark:border-slate-800 transition active:scale-95"
        >
          <Layers size={19} />
        </button>

        {/* Zoom Controls Pill (+ / -) */}
        <div className="pointer-events-auto flex flex-col rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Збільшити"
            className="grid h-10 w-11 place-items-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-b border-slate-100 dark:border-slate-800"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Зменшити"
            className="grid h-10 w-11 place-items-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Minus size={18} />
          </button>
        </div>

        {/* GPS Locate Me Target */}
        <button
          type="button"
          onClick={handleLocateMe}
          aria-label="Моє місцезнаходження"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#0866F5] text-white shadow-xl shadow-blue-500/25 transition active:scale-95"
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {/* SMART BOTTOM SHEET: COLLAPSED (Photo 3) OR EXPANDED FLOWLINE (Photo 4/5) */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end pointer-events-none">
        {sheetState === 'collapsed' ? (
          /* COLLAPSED BOTTOM BAR MATCHING SCREENSHOT 3:
             [Clock icon] 53 хв  [Flag icon] 11.0 км  [Wallet icon] 60.0 UAH  [Close X] */
          <div className="pointer-events-auto mx-auto w-full max-w-xl rounded-t-[28px] bg-white/95 dark:bg-[#0B1730]/95 backdrop-blur-md p-4 sm:p-5 shadow-[0_-10px_35px_rgba(0,0,0,0.15)] border-t border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
            {/* Grab handle */}
            <button
              type="button"
              onClick={() => setSheetState('expanded')}
              aria-label="Відкрити деталі маршруту"
              className="w-full flex justify-center pb-2 cursor-grab active:cursor-grabbing"
            >
              <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            </button>

            <div className="flex items-center justify-between pt-1">
              {/* 3 Key Stats Row */}
              <button
                type="button"
                onClick={() => setSheetState('expanded')}
                className="flex items-center gap-5 sm:gap-7 text-left group cursor-pointer"
              >
                {/* Time */}
                <div className="flex items-center gap-2">
                  <Clock size={22} className="text-[#0B1730] dark:text-white stroke-[2.2]" />
                  <span className="text-xl font-black text-[#0B1730] dark:text-white">
                    {flowlineData.totalDurationLabel}
                  </span>
                </div>

                {/* Distance */}
                <div className="flex items-center gap-2">
                  <Flag size={22} className="text-[#0B1730] dark:text-white stroke-[2.2]" />
                  <span className="text-xl font-black text-[#0B1730] dark:text-white">
                    {flowlineData.totalDistanceLabel}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <Wallet size={22} className="text-[#0B1730] dark:text-white stroke-[2.2]" />
                  <span className="text-xl font-black text-[#0B1730] dark:text-white">
                    {flowlineData.totalPriceLabel}
                  </span>
                </div>
              </button>

              {/* Close Button X */}
              <button
                type="button"
                onClick={onClose || onBack}
                aria-label="Закрити"
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
              >
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Quick action bar */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onStartNavigation}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0866F5] py-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition"
              >
                <Navigation size={15} className="fill-current" />
                <span>Почати навігацію</span>
              </button>
              <button
                type="button"
                onClick={() => setSheetState('expanded')}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-xs font-extrabold text-[#0B1730] dark:text-white hover:bg-slate-100"
              >
                Деталі покроково
              </button>
            </div>
          </div>
        ) : (
          /* EXPANDED FLOWLINE TIMELINE (Photo 4/5) */
          <div className="pointer-events-auto mx-auto w-full max-w-xl animate-in slide-in-from-bottom duration-300">
            <FlowlineTimeline
              data={flowlineData}
              onClose={() => setSheetState('collapsed')}
              onStartNavigation={onStartNavigation}
              onSelectStop={(_stopName) => {
                // can highlight stop on map
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
