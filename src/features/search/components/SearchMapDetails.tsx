import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowUpDown,
  SlidersHorizontal,
  Compass,
  Plus,
  Minus,
  LocateFixed,
  Clock,
  Route,
  Coins,
  ChevronRight,
  ArrowRight,
  List,
} from 'lucide-react';
import type { RouteSearchResultItem } from '../model/types';
import type { Coordinate } from '../../../../shared/navigation/contracts';
import { MarshGoMap } from '../../../map/MarshGoMap';
import type { MapAdapter, MapStatus } from '../../../map/MapAdapter';
import { RouteDetailsView } from './RouteDetailsView';
import { themeService } from '../../../services/theme';

function resultMapPadding() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  return {
    top: Math.min(200, height * 0.30),
    right: 64,
    bottom: Math.min(300, height * 0.455),
    left: 24,
  };
}

interface SearchMapDetailsProps {
  item: RouteSearchResultItem;
  originTitle: string;
  destTitle: string;
  notice?: string | null;
  dateStr?: string;
  timeStr?: string;
  passengers?: number;
  onBackToResults: () => void;
  onSwapRoute?: () => void;
  onBook?: (item: RouteSearchResultItem) => void;
  initialMode?: 'details' | 'map';
}

export const SearchMapDetails: React.FC<SearchMapDetailsProps> = ({
  item,
  originTitle,
  destTitle,
  notice,
  onBackToResults,
  onSwapRoute,
  onBook,
  initialMode = 'details',
}) => {
  // Screen mode: 'details' (Screen 3: Stepper Timeline) or 'map' (Screen 1: Map View with floating cards)
  const [currentMode, setCurrentMode] = useState<'details' | 'map'>(initialMode);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');
  const [mapAdapter, setMapAdapter] = useState<MapAdapter | null>(null);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isDark, setIsDark] = useState(() => themeService.isDark());

  useEffect(() => themeService.subscribe((_theme, dark) => setIsDark(dark)), []);

  const cleanOrigin = originTitle.split(',')[0].trim() || 'Початок маршруту';
  const cleanDest = destTitle.split(',')[0].trim() || 'Пункт призначення';

  const durationText = item.durationLabel || 'Час не вказано';
  const distanceText = item.distanceLabel || 'Відстань не надана';
  const priceText = item.priceLabel ? item.priceLabel.replace(' UAH', ' грн').replace(' ₴', ' грн') : 'Ціну не надано';

  const routeCoordinates: Coordinate[] = useMemo(() => {
    return item.routeGeometry && item.routeGeometry.length >= 2 ? item.routeGeometry : [];
  }, [item.routeGeometry]);

  // Offer geometry can arrive after this view mounts. Refit when that real
  // provider geometry becomes available so the route does not stay off-screen
  // at the map's default camera position.
  useEffect(() => {
    if (!mapAdapter || routeCoordinates.length < 2) return;
    mapAdapter.setRoute(routeCoordinates);
    mapAdapter.fitRoute(resultMapPadding());
  }, [mapAdapter, routeCoordinates]);

  const customMarkers = useMemo<import('../../../map/MapAdapter').CustomMapMarker[]>(() => {
    if (routeCoordinates.length < 2) return [];
    const marker = (coordinate: Coordinate, label: string, color: string) => ({
      coordinate,
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:${color};color:#ffffff;border-radius:9999px;font-weight:900;font-size:12px;border:3px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.2);">${label}</div>`,
      anchor: 'center' as const,
    });
    return [marker(routeCoordinates[0], 'A', '#0066FF'), marker(routeCoordinates.at(-1)!, 'B', '#EF4444')];
  }, [routeCoordinates]);
  const routeFocus = routeCoordinates[Math.floor(routeCoordinates.length / 2)];

  const handleZoomIn = () => {
    if (mapAdapter && routeFocus) {
      const nextZoom = zoomLevel + 1;
      setZoomLevel(nextZoom);
      mapAdapter.focus(routeFocus, nextZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapAdapter && routeFocus) {
      const nextZoom = Math.max(8, zoomLevel - 1);
      setZoomLevel(nextZoom);
      mapAdapter.focus(routeFocus, nextZoom);
    }
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator && mapAdapter) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapAdapter.focus([pos.coords.longitude, pos.coords.latitude], 14.5);
        },
        () => {
          if (routeCoordinates.length >= 2) mapAdapter.fitRoute(resultMapPadding());
        }
      );
    } else if (mapAdapter && routeCoordinates.length >= 2) {
      mapAdapter.fitRoute(resultMapPadding());
    }
  };

  // If in Details Stepper Timeline mode, render Screen 3
  if (currentMode === 'details') {
    return (
      <RouteDetailsView
        item={item}
        originTitle={cleanOrigin}
        destTitle={cleanDest}
        onBackToResults={onBackToResults}
        onOpenMap={() => setCurrentMode('map')}
        onBook={() => onBook?.(item)}
      />
    );
  }

  // SCREEN 1: MAP VIEW WITH FLOATING CARDS
  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-[#eaf3fc] dark:bg-[#070E1B] text-[#081B35] dark:text-white select-none">
      {/* Map Canvas */}
      <div className="absolute inset-0 z-0">
        <MarshGoMap
          route={routeCoordinates}
          routeSegments={[]}
          customMarkers={customMarkers}
          overlays={false}
          theme={isDark ? 'MARSHGO_DARK' : 'MARSHGO_LIGHT'}
          onStatus={setMapStatus}
          onAdapter={(adapter: MapAdapter | null) => {
            setMapAdapter(adapter);
            if (adapter && routeCoordinates.length >= 2) {
              adapter.setRoute(routeCoordinates);
              if (adapter.setRouteSegments) adapter.setRouteSegments([]);
              if (adapter.setCustomMarkers) adapter.setCustomMarkers(customMarkers);
              if (routeCoordinates.length >= 2) adapter.fitRoute(resultMapPadding());
            }
          }}
        />
      </div>

      {routeCoordinates.length < 2 && (
        <div role="status" className="pointer-events-none absolute left-3 right-16 top-44 z-10 mx-auto max-w-md rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 text-xs font-semibold text-slate-700 shadow-lg dark:border-amber-900 dark:bg-[#0B1730]/95 dark:text-slate-200">
          Провайдер не надав геометрію цього маршруту. На карті показано лише підкладку без вигаданої лінії чи руху транспорту.
        </div>
      )}
      {(mapStatus === 'failed' || mapStatus === 'degraded') && <div role="status" className="pointer-events-none absolute left-3 right-16 top-44 z-10 mx-auto max-w-md rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-[10px] font-semibold text-amber-900 shadow-lg dark:border-amber-900 dark:bg-[#0B1730]/95 dark:text-amber-100">Підкладка карти завантажилася частково. Дані маршруту збережені.</div>}

      {/* Floating Top Route Input Card matching Reference Screen 1 */}
      <div className="pointer-events-none absolute inset-x-3 sm:inset-x-5 top-[max(0.8rem,env(safe-area-inset-top))] z-30">
        <div className="pointer-events-auto mx-auto max-w-md rounded-[24px] bg-white/95 dark:bg-[#0B1730]/95 p-2 shadow-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
          {/* Row A: Origin */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0066FF] text-white text-[11px] font-black shadow-xs">
                A
              </span>
              <div className="min-w-0">
                <span className="text-[10px] block font-semibold text-slate-400 leading-none mb-0.5">
                  Звідки
                </span>
                <span className="truncate block text-xs font-black text-[#0B1730] dark:text-white leading-tight">
                  {cleanOrigin}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToResults}
              aria-label="Налаштування"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          <div className="h-1.5" />

          {/* Row B: Destination */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EF4444] text-white text-[11px] font-black shadow-xs">
                B
              </span>
              <div className="min-w-0">
                <span className="text-[10px] block font-semibold text-slate-400 leading-none mb-0.5">
                  Куди
                </span>
                <span className="truncate block text-xs font-black text-[#0B1730] dark:text-white leading-tight">
                  {cleanDest}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onSwapRoute}
              disabled={!onSwapRoute}
              aria-label="Поміняти місцями"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#0066FF] shadow-sm transition hover:bg-blue-50 disabled:opacity-50 dark:bg-slate-800"
            >
              <ArrowUpDown size={15} />
            </button>
          </div>
        </div>
      </div>

      {notice && <div role="status" title={notice} className="pointer-events-none absolute left-3 right-16 top-32 z-20 mx-auto line-clamp-2 max-w-md rounded-xl border border-amber-200 bg-white/95 px-2.5 py-1.5 text-[9px] font-semibold leading-3 text-amber-900 shadow-lg dark:border-amber-900/70 dark:bg-[#0B1730]/95 dark:text-amber-100">{notice}</div>}

      {/* Floating Map Controls on Right (Compass, +, -, GPS) matching Reference Screen 1 */}
      <div className="pointer-events-none absolute right-3 sm:right-5 top-36 z-20 flex flex-col gap-2.5 items-end">
        {/* Compass */}
        <button
          type="button"
          onClick={() => {
            if (mapAdapter) mapAdapter.fitRoute(resultMapPadding());
          }}
          aria-label="Компас"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200/80 dark:border-slate-800 transition active:scale-95"
        >
          <Compass size={18} />
        </button>

        {/* Zoom Controls (+ / -) */}
        <div className="pointer-events-auto flex flex-col rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Збільшити"
            className="grid h-9 w-10 place-items-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition border-b border-slate-100 dark:border-slate-800"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Зменшити"
            className="grid h-9 w-10 place-items-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* GPS Locate Me Target */}
        <button
          type="button"
          onClick={handleLocateMe}
          aria-label="Моє місцезнаходження"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl bg-white/95 dark:bg-[#0B1730]/95 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200/80 dark:border-slate-800 transition active:scale-95 hover:bg-slate-50"
        >
          <LocateFixed size={18} />
        </button>
      </div>

      {/* Floating Bottom Route Result Card matching Reference Screen 1 */}
      <div className="pointer-events-none absolute inset-x-3 sm:inset-x-5 bottom-[calc(5.6rem+env(safe-area-inset-bottom))] z-30 flex justify-center">
        <div className="pointer-events-auto w-full max-w-md rounded-[24px] bg-white/95 p-3 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-md border border-slate-200/80 dark:border-slate-800 dark:bg-[#0B1730]/95">
          {/* Card Header: map/list views stay one tap apart */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-extrabold text-[#0B1730] dark:text-white">
              Результати пошуку
            </h3>
            <button
              type="button"
              onClick={onBackToResults}
              aria-label="Список маршрутів"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[10px] font-bold text-slate-600 transition hover:text-slate-900 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              <List size={14} />Список
            </button>
          </div>

          {/* 3 Metric Stats Row: 🕒 53 хв   🛣️ 11.0 км   🪙 60 грн */}
          <div className="flex items-center gap-3 pt-2 pb-1">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-[#0066FF]" />
              <span className="text-xs font-black text-[#0B1730] dark:text-white">
                {durationText}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Route size={16} className="text-[#0066FF]" />
              <span className="text-xs font-black text-[#0B1730] dark:text-white">
                {distanceText}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins size={16} className="text-amber-500" />
              <span className="text-xs font-black text-[#0B1730] dark:text-white">
                {priceText}
              </span>
            </div>
          </div>

          {/* Summary from the selected provider result */}
          <button
            type="button"
            onClick={() => setCurrentMode('details')}
            className="mt-1 w-full flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800 text-left transition hover:border-[#0066FF] active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {(item.legs?.length ? item.legs.map((leg) => leg.modeLabel || leg.carrierName || leg.mode) : [item.modeLabel]).map((label, index) => (
                  <React.Fragment key={`${label}-${index}`}>
                    {index > 0 && <ArrowRight size={13} className="text-slate-400 font-bold" />}
                    <span className="rounded-xl bg-[#0066FF] px-2.5 py-1 text-xs font-black text-white">{label}</span>
                  </React.Fragment>
                ))}
              </div>

              <p className="mt-1 text-[11px] font-bold text-[#0B1730] dark:text-white">
                {durationText} • {item.transfers ?? 0} пересадок • {distanceText} • {priceText}
              </p>
              <p className="text-[9px] leading-3 text-slate-400 dark:text-slate-500">
                {routeCoordinates.length >= 2 ? 'Геометрія надана провайдером' : 'Геометрія маршруту недоступна'}
              </p>
            </div>

            <ChevronRight size={18} className="text-slate-400 shrink-0 ml-2" />
          </button>
        </div>
      </div>

    </div>
  );
};
