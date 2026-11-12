/** Shared colors for transport badges, route segments and transit map layers. */
export const transportColors = {
  bus: '#0284C7',
  marshrutka: '#F59E0B',
  trolleybus: '#10B981',
  tram: '#EF4444',
  metro: '#8B5CF6',
  train: '#8B5CF6',
  suburban_train: '#8B5CF6',
  city_train: '#0D9488',
  funicular: '#B45309',
  walk: '#64748B',
  carpool: '#10B981',
  taxi: '#F59E0B',
  bike: '#16A34A',
  scooter: '#F59E0B',
  carsharing: '#10B981',
  transfer: '#0284C7',
  ferry: '#0284C7',
  water: '#0284C7',
  air: '#7C3AED',
  community: '#10B981',
  community_demand: '#10B981',
  other: '#64748B',
} as const;

export type TransportVisualMode = keyof typeof transportColors;

export function normalizeTransportVisualMode(mode: string): TransportVisualMode {
  const normalized = mode.trim().toLocaleLowerCase('uk-UA');
  if (normalized === 'minibus') return 'marshrutka';
  if (normalized === 'rail') return 'train';
  if (normalized === 'walking' || normalized === 'foot') return 'walk';
  if (Object.hasOwn(transportColors, normalized)) return normalized as TransportVisualMode;
  return 'other';
}

export function transportColor(mode: string): string {
  return transportColors[normalizeTransportVisualMode(mode)];
}
