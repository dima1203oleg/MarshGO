import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Compass,
  Plus,
  Minus,
  LocateFixed,
  Clock,
  ArrowRight,
  Footprints,
  BusFront,
  TramFront,
  TrainFront,
  CarFront,
  CarTaxiFront,
  Bike,
  Zap,
} from 'lucide-react';
import type { RouteSearchResultItem } from '../model/types';
import type { Coordinate } from '../../../../shared/navigation/contracts';
import { MarshGoMap } from '../../../map/MarshGoMap';
import type { MapAdapter, MapStatus } from '../../../map/MapAdapter';
import { RouteDetailsView } from './RouteDetailsView';
import { themeService } from '../../../services/theme';
import { transportColor } from '../../../domain/transportVisuals';
import { MapLayerSwitch } from '../../../components/MapLayerSwitch';
import { MapLayersControl } from '../../../components/MapLayersControl';

function resultMapPadding() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  const toolbarBottom = document.querySelector<HTMLElement>('[data-testid="map-top-toolbar"]')?.getBoundingClientRect().bottom;
  const resultSheetTop = document.querySelector<HTMLElement>('[data-testid="map-result-sheet"]')?.getBoundingClientRect().top;
  const topInset = toolbarBottom == null
    ? Math.min(160, height * 0.25)
    : Math.min(height * 0.38, Math.max(24, toolbarBottom + 20));
  const bottomInset = resultSheetTop == null
    ? Math.min(360, height * 0.52)
    : Math.min(height * 0.62, Math.max(24, height - resultSheetTop + 20));
  return {
    top: topInset,
    right: 64,
    bottom: bottomInset,
    left: 24,
  };
}

function formatVariantCount(count: number): string {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const word = remainder100 >= 11 && remainder100 <= 14
    ? 'варіантів'
    : remainder10 === 1 ? 'варіант'
      : remainder10 >= 2 && remainder10 <= 4 ? 'варіанти' : 'варіантів';
  return `${count} ${word}`;
}

function RouteLegIcon({ mode }: { mode: string }) {
  const Icon = mode === 'walk' ? Footprints
    : mode === 'tram' || mode === 'trolleybus' ? TramFront
      : mode === 'metro' || mode === 'train' || mode === 'suburban_train' ? TrainFront
        : mode === 'carpool' || mode === 'carsharing' ? CarFront
          : mode === 'taxi' ? CarTaxiFront
            : mode === 'bike' ? Bike
              : mode === 'scooter' ? Zap : BusFront;
  return <Icon size={13} aria-hidden="true"/>;
}

interface SearchMapDetailsProps {
  item: RouteSearchResultItem;
  originTitle: string;
  destTitle: string;
  notice?: string | null;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  dateStr?: string;
  timeStr?: string;
  passengers?: number;
  resultCount?: number;
  onBackToResults: () => void;
  onBook?: (item: RouteSearchResultItem) => void;
  initialMode?: 'details' | 'map';
}

export const SearchMapDetails: React.FC<SearchMapDetailsProps> = ({
  item,
  originTitle,
  destTitle,
  dateStr,
  timeStr,
  passengers = 1,
  resultCount = 1,
  onBackToResults,
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
  const distanceText = item.distanceMeters == null || item.distanceMeters <= 0 || /не надана|невідом/i.test(item.distanceLabel)
    ? null
    : item.distanceLabel;
  const priceText = item.priceMinor == null || /не надано|невідом/i.test(item.priceLabel)
    ? null
    : item.priceLabel.replace(' UAH', ' грн').replace(' ₴', ' грн');
  const departureTime = item.departureTime.match(/\d{1,2}:\d{2}/)?.[0] ?? '—';
  const arrivalTime = item.arrivalTime.match(/\d{1,2}:\d{2}/)?.[0] ?? '—';
  const routeTitle = [...new Set((item.legs ?? [])
    .filter((leg) => leg.mode !== 'walk')
    .map((leg) => [leg.modeLabel, leg.routeName].filter(Boolean).join(' ')))].join(' + ') || item.modeLabel;

  const routeCoordinates: Coordinate[] = useMemo(() => {
    if (item.routeGeometry && item.routeGeometry.length >= 2) return item.routeGeometry;
    if (item.legs && item.legs.length > 0) {
      const flattened = item.legs.flatMap((l) => l.coordinates || []);
      if (flattened.length >= 2) return flattened;
    }
    return [];
  }, [item.routeGeometry, item.legs]);

  const routeSegments = useMemo<import('../../../map/MapAdapter').RouteSegment[]>(() => {
    if (item.legs && item.legs.length > 0) {
      // Keep each provider-supplied leg independent. Missing geometry should
      // omit that leg, never connect adjacent segments with an invented line.
      return item.legs.flatMap((leg) => leg.coordinates && leg.coordinates.length >= 2
        ? [{ coordinates: leg.coordinates, color: transportColor(leg.mode), dashed: leg.mode === 'walk' }]
        : []);
    }

    if (routeCoordinates.length >= 2) {
      return [{
        coordinates: routeCoordinates,
        color: transportColor(item.type),
        dashed: false,
      }];
    }
    return [];
  }, [item.legs, routeCoordinates]);

  const missingLegGeometry = Boolean(item.legs?.some((leg) => !leg.coordinates || leg.coordinates.length < 2));

  // Offer geometry can arrive after this view mounts. Refit when that real
  // provider geometry becomes available so the route does not stay off-screen
  // at the map's default camera position.
  useEffect(() => {
    if (!mapAdapter || routeCoordinates.length < 2) return;
    mapAdapter.setRoute(routeCoordinates);
    if (mapAdapter.setRouteSegments) {
      mapAdapter.setRouteSegments(routeSegments);
    }
    mapAdapter.fitRoute(resultMapPadding());
  }, [mapAdapter, routeCoordinates, routeSegments]);

  const customMarkers = useMemo<import('../../../map/MapAdapter').CustomMapMarker[]>(() => {
    if (routeCoordinates.length < 2) return [];

    const startCoord = routeCoordinates[0];
    const endCoord = routeCoordinates[routeCoordinates.length - 1];

    const markers: import('../../../map/MapAdapter').CustomMapMarker[] = [];

    // Origin Marker A with label bubble matching Screen 1
    markers.push({
      coordinate: startCoord,
      html: `<div style="display:flex;align-items:center;gap:6px;transform:translate(-14px,-14px);pointer-events:auto;"><div style="width:28px;height:28px;border-radius:9999px;background:#0066FF;color:#ffffff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.25);">A</div><div style="background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);padding:4px 9px;border-radius:12px;font-size:11px;font-weight:800;color:#0B1730;box-shadow:0 3px 8px rgba(0,0,0,0.18);white-space:nowrap;border:1px solid rgba(0,0,0,0.06);">${cleanOrigin}</div></div>`,
      anchor: 'center',
    });

    // Destination Marker B with label bubble matching Screen 1
    markers.push({
      coordinate: endCoord,
      html: `<div style="display:flex;align-items:center;gap:6px;transform:translate(-14px,-14px);pointer-events:auto;"><div style="width:28px;height:28px;border-radius:9999px;background:#EF4444;color:#ffffff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.25);">B</div><div style="background:rgba(255,255,255,0.96);backdrop-filter:blur(8px);padding:4px 9px;border-radius:12px;font-size:11px;font-weight:800;color:#0B1730;box-shadow:0 3px 8px rgba(0,0,0,0.18);white-space:nowrap;border:1px solid rgba(0,0,0,0.06);">${cleanDest}</div></div>`,
      anchor: 'center',
    });

    // Add segment icons at midpoints and transfer nodes
    if (routeSegments.length > 0) {
      routeSegments.forEach((seg, idx) => {
        if (seg.coordinates.length >= 2) {
          const midIdx = Math.floor(seg.coordinates.length / 2);
          const midCoord = seg.coordinates[midIdx];
          const isWalk = seg.dashed === true;
          const segmentColor = seg.color;

          let iconHtml: string;
          if (isWalk) {
            iconHtml = `<div style="width:26px;height:26px;border-radius:9999px;background:${segmentColor};color:#ffffff;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.22);transform:translate(-13px,-13px);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 17-1.5-3-3.5 1-1-4 3-2"/><circle cx="13" cy="4" r="2"/><path d="m5 17 2-4 3 1 1-4-2.5-1.5"/></svg></div>`;
          } else {
            iconHtml = `<div style="width:28px;height:28px;border-radius:9999px;background:${segmentColor};color:#ffffff;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.22);transform:translate(-14px,-14px);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.4-1-1-1H3c-.6 0-1 .4-1 1 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`;
          }

          markers.push({
            coordinate: midCoord,
            html: iconHtml,
            anchor: 'center',
          });

          // Add transfer stop nodes between segments
          if (idx > 0) {
            markers.push({
              coordinate: seg.coordinates[0],
              html: `<div style="width:12px;height:12px;border-radius:9999px;background:#ffffff;border:3px solid ${segmentColor};box-shadow:0 2px 6px rgba(0,0,0,0.25);transform:translate(-6px,-6px);"></div>`,
              anchor: 'center',
            });
          }
        }
      });
    }

    return markers;
  }, [cleanOrigin, cleanDest, routeCoordinates, routeSegments, item.legs]);

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
    <div className="route-map-screen relative h-[100svh] w-full overflow-hidden bg-[#eaf3fc] dark:bg-[#070E1B] text-[#081B35] dark:text-white select-none">
      {/* Map Canvas */}
      <div className="absolute inset-0 z-0">
        <MarshGoMap
          route={routeCoordinates}
          routeSegments={routeSegments}
          customMarkers={customMarkers}
          overlays={false}
          theme={isDark ? 'MARSHGO_DARK' : 'MARSHGO_LIGHT'}
          onStatus={setMapStatus}
          onAdapter={(adapter: MapAdapter | null) => {
            setMapAdapter(adapter);
            if (adapter && routeCoordinates.length >= 2) {
              adapter.setRoute(routeCoordinates);
              if (adapter.setRouteSegments) adapter.setRouteSegments(routeSegments);
              if (adapter.setCustomMarkers) adapter.setCustomMarkers(customMarkers);
              if (routeCoordinates.length >= 2) adapter.fitRoute(resultMapPadding());
            }
          }}
        />
      </div>

      {(routeCoordinates.length < 2 || missingLegGeometry) && (
        <div role="status" className="pointer-events-none absolute left-3 right-16 top-[calc(env(safe-area-inset-top)+4.25rem)] z-10 mx-auto max-w-md rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 text-xs font-semibold text-slate-700 shadow-lg dark:border-amber-900 dark:bg-[#0B1730]/95 dark:text-slate-200">
          {routeCoordinates.length < 2
            ? 'Провайдер не надав геометрію цього маршруту. На карті показано лише підкладку без вигаданої лінії чи руху транспорту.'
            : 'Джерело не надало геометрію для кожної ділянки. Показані лише підтверджені відрізки маршруту.'}
        </div>
      )}
      {(mapStatus === 'failed' || mapStatus === 'degraded') && <div role="status" className="pointer-events-none absolute left-3 right-16 top-[calc(env(safe-area-inset-top)+4.25rem)] z-10 mx-auto max-w-md rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-[10px] font-semibold text-amber-900 shadow-lg dark:border-amber-900 dark:bg-[#0B1730]/95 dark:text-amber-100">Підкладка карти завантажилася частково. Дані маршруту збережені.</div>}

      {/* Map modes and transport overlays stay available while the route remains visible. */}
      <div data-testid="map-top-toolbar" className="pointer-events-none absolute inset-x-3 sm:inset-x-5 top-[max(0.75rem,calc(env(safe-area-inset-top)+0.5rem))] z-30">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-1.5 rounded-[22px] border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_12px_36px_rgba(15,35,65,0.16)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1730]/95">
          <button type="button" onClick={onBackToResults} aria-label="Повернутися до всіх маршрутів" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowLeft size={19}/></button>
          <MapLayerSwitch layout="horizontal" className="min-w-0 flex-1 justify-center" />
          <MapLayersControl overlays compact showModes={false} label="Транспорт" />
        </div>
        <p className="mx-auto mt-1 w-fit max-w-full truncate rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/90 dark:text-slate-200">{cleanOrigin} → {cleanDest}</p>
      </div>

      {/* Floating Map Controls on Right (Compass, +, -, GPS) matching Screen 1 */}
      <div className="pointer-events-none absolute right-3 sm:right-5 top-[calc(max(0.75rem,calc(env(safe-area-inset-top)+0.5rem))+7rem)] z-20 flex flex-col gap-2 items-end">
        {/* Compass / Direction Arrow */}
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

      {/* Selected route summary, color-matched to its real transport legs. */}
      <div className="route-map-result-anchor pointer-events-none absolute inset-x-3 sm:inset-x-5 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 flex justify-center">
        <div data-testid="map-result-sheet" className="pointer-events-auto w-full max-w-md rounded-[26px] border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_12px_36px_rgba(15,35,65,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1730]/95">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="mb-0.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Вибраний маршрут</span>
              <h3 className="truncate text-base font-black text-[#0B1730] dark:text-white">{routeTitle}</h3>
              <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{cleanOrigin} → {cleanDest}</p>
            </div>
            <button type="button" onClick={onBackToResults} aria-label={`Показати всі ${formatVariantCount(resultCount)}`} className="shrink-0 rounded-xl bg-slate-100 px-2.5 py-2 text-[11px] font-extrabold text-slate-700 transition hover:bg-blue-50 hover:text-[#0066FF] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-950/60">
              Усі варіанти
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1"><Clock size={13} className="text-[#0066FF]"/><time>{departureTime} → {arrivalTime}</time></span>
            <span>{durationText}</span>
            <span>{item.transfers ?? 0} {item.transfers === 1 ? 'пересадка' : 'пересадки'}</span>
            {distanceText && <span>{distanceText}</span>}
            {priceText && <span className="font-extrabold text-amber-700 dark:text-amber-300">{priceText}</span>}
          </div>

          {item.legs?.length ? (
            <div aria-label="Послідовність відрізків маршруту" className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
              {item.legs.map((leg, legIdx) => {
                const isWalk = leg.mode === 'walk';
                return <React.Fragment key={leg.id || legIdx}>
                  {legIdx > 0 && <ArrowRight size={13} className="shrink-0 text-slate-400 dark:text-slate-500"/>}
                  <span className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black ${isWalk ? 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'text-white shadow-sm'}`} style={isWalk ? undefined : { backgroundColor: transportColor(leg.mode) }}>
                    <RouteLegIcon mode={leg.mode}/>{[leg.modeLabel, leg.routeName].filter(Boolean).join(' ') || (isWalk ? 'Пішки' : 'Транспорт')}
                  </span>
                </React.Fragment>;
              })}
            </div>
          ) : <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Деталі сегментів для цього варіанта не надані джерелом.</p>}

          <button type="button" onClick={() => setCurrentMode('details')} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#087CF0] px-4 py-2.5 text-sm font-black text-white shadow-md shadow-blue-500/20 transition hover:bg-[#0066D6] active:scale-[0.99]">
            Показати деталі <ArrowRight size={17}/>
          </button>
          <p className="mt-1 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">{dateStr || 'Дата не вказана'} · {timeStr || 'Час не вказано'} · {passengers} {passengers === 1 ? 'пасажир' : 'пасажири'}</p>
        </div>
      </div>

    </div>
  );
};
