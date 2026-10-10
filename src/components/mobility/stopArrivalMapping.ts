import type { TransitArrival } from '../../services/productionApi';
import type { StopArrivalItem } from './StopArrivalsSheet';

const MODE_PRESENTATION: Record<string, { type: StopArrivalItem['type']; letter: string; color: string }> = {
  bus: { type: 'bus', letter: 'А', color: '#0284C7' },
  trolleybus: { type: 'trolleybus', letter: 'Тр', color: '#0284C7' },
  tram: { type: 'tram', letter: 'Т', color: '#DC2626' },
  marshrutka: { type: 'marshrutka', letter: 'Мт', color: '#CA8A04' },
  metro: { type: 'metro', letter: 'М', color: '#7C3AED' },
};

/** Map only source-provided facts; unavailable ETA, destination and vehicle attributes stay absent. */
export function mapTransitArrivalToStopArrival(arrival: TransitArrival, index: number): StopArrivalItem {
  const mode = arrival.mode?.trim().toLowerCase() ?? '';
  const presentation = MODE_PRESENTATION[mode] ?? { type: 'unknown' as const, letter: '—', color: '#64748B' };
  const etaSeconds = arrival.etaSeconds;
  const etaMinutes = etaSeconds == null || !Number.isFinite(etaSeconds) || etaSeconds < 0
    ? null
    : Math.ceil(etaSeconds / 60);
  const isRealtime = arrival.isRealtime
    && (arrival.arrivalSource === 'TRIP_UPDATE' || arrival.arrivalSource === 'VEHICLE_PROJECTION');
  const destination = arrival.displayLabel.match(/(?:→|\bдо\s+)([^·—]+?)(?:\s+·|$)/i)?.[1]?.trim();

  return {
    id: `${arrival.routeId}-${index}`,
    routeId: arrival.routeId,
    type: presentation.type,
    typeLetter: presentation.letter,
    badgeBgColor: presentation.color,
    ...(destination ? { destination } : {}),
    statusLabel: arrival.displayLabel,
    arrivalSource: arrival.arrivalSource,
    ...(arrival.observedAt ? { observedAt: arrival.observedAt } : {}),
    isRealtime,
    etaMinutes,
  };
}
