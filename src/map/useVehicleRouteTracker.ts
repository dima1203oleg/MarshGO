import { useState, useEffect, useMemo, useRef } from 'react';
import type { Coordinate } from '../../shared/navigation/contracts';

export interface UseVehicleRouteTrackerOptions {
  routePoints?: Coordinate[];
  routeName?: string | null;
  transportType?: 'bus' | 'marshrutka' | 'tram' | 'trolleybus' | 'metro' | 'train' | 'car' | string;
  speedKmh?: number;
  initialProgress?: number; // 0..1
  enabled?: boolean;
}

export interface TrackedVehicleState {
  vehicle: Coordinate | null;
  heading: number | null;
  speedMps: number;
  speedKmh: number;
  label: string;
  progress: number;
  distanceRemainingMeters: number;
  etaSeconds: number;
  isMoving: boolean;
}

function haversineMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function calculateBearing(a: Coordinate, b: Coordinate): number {
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function useVehicleRouteTracker({
  routePoints = [],
  routeName = null,
  transportType = 'bus',
  speedKmh = 28,
  initialProgress = 0.25,
  enabled = true,
}: UseVehicleRouteTrackerOptions): TrackedVehicleState {
  const segments = useMemo(() => {
    if (!routePoints || routePoints.length < 2) return null;
    const lens: number[] = [];
    const cum: number[] = [0];
    let total = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const d = haversineMeters(routePoints[i], routePoints[i + 1]);
      lens.push(d);
      total += d;
      cum.push(total);
    }
    if (total < 10) return null;
    return { points: routePoints, lengths: lens, cumulative: cum, totalDistance: total };
  }, [routePoints]);

  const [currentDistance, setCurrentDistance] = useState<number>(() => {
    return segments ? segments.totalDistance * Math.max(0, Math.min(0.9, initialProgress)) : 0;
  });

  const lastUpdateRef = useRef<number>(Date.now());
  const speedMps = Math.max(2, (speedKmh * 1000) / 3600);

  // Reset or adjust distance when segments change
  useEffect(() => {
    if (segments) {
      setCurrentDistance(segments.totalDistance * Math.max(0, Math.min(0.9, initialProgress)));
      lastUpdateRef.current = Date.now();
    }
  }, [segments?.totalDistance]);

  useEffect(() => {
    if (!enabled || !segments) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.min(3, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;

      setCurrentDistance((prev) => {
        const advanced = prev + speedMps * deltaSeconds;
        return advanced >= segments.totalDistance ? 0 : advanced;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [enabled, segments, speedMps]);

  const result = useMemo<TrackedVehicleState>(() => {
    const defaultLabel = (() => {
      const icon =
        transportType === 'tram' ? '🚊' :
        transportType === 'trolleybus' ? '🚎' :
        transportType === 'train' || transportType === 'rail' ? '🚆' :
        transportType === 'metro' ? '🚇' :
        transportType === 'car' ? '🚗' :
        '🚌';
      const clean = routeName ? routeName.replace(/^(Автобус|Трамвай|Тролейбус|Маршрутка)\s*№?/i, '').trim() : '';
      return clean ? `${icon} №${clean}` : `${icon} Маршрут`;
    })();

    if (!segments || !enabled) {
      return {
        vehicle: null,
        heading: null,
        speedMps: 0,
        speedKmh,
        label: defaultLabel,
        progress: 0,
        distanceRemainingMeters: 0,
        etaSeconds: 0,
        isMoving: false,
      };
    }

    const { points, lengths, cumulative, totalDistance } = segments;
    const clampedDist = Math.max(0, Math.min(totalDistance, currentDistance));

    // Find current segment index
    let segIdx = 0;
    while (segIdx < lengths.length - 1 && cumulative[segIdx + 1] <= clampedDist) {
      segIdx++;
    }

    const segStartDist = cumulative[segIdx];
    const segLen = lengths[segIdx] || 1;
    const segProgress = Math.max(0, Math.min(1, (clampedDist - segStartDist) / segLen));

    const pA = points[segIdx];
    const pB = points[segIdx + 1];

    const currentCoord: Coordinate = [
      pA[0] + (pB[0] - pA[0]) * segProgress,
      pA[1] + (pB[1] - pA[1]) * segProgress,
    ];

    const currentHeading = calculateBearing(pA, pB);
    const progress = totalDistance > 0 ? clampedDist / totalDistance : 0;
    const distanceRemainingMeters = Math.max(0, totalDistance - clampedDist);
    const etaSeconds = Math.round(distanceRemainingMeters / speedMps);

    return {
      vehicle: currentCoord,
      heading: currentHeading,
      speedMps,
      speedKmh,
      label: defaultLabel,
      progress,
      distanceRemainingMeters,
      etaSeconds,
      isMoving: true,
    };
  }, [segments, enabled, currentDistance, speedMps, speedKmh, routeName, transportType]);

  return result;
}
