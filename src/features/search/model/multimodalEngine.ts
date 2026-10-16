import type { RoutePlace, RouteSearchResultItem, SearchStrategyMode } from './types';

export interface ComposeMultimodalParams {
  origin: RoutePlace;
  destination: RoutePlace;
  dateStr: string;
  timeStr: string;
  passengers: number;
  strategy: SearchStrategyMode;
  /** Actual records returned by a provider. No local/demo route generation is allowed. */
  realOffers?: readonly RouteSearchResultItem[];
}

/** Rank only the journeys supplied by configured providers, using their returned facts. */
export function rankSearchResults(
  providerResults: readonly RouteSearchResultItem[],
  strategy: SearchStrategyMode,
): RouteSearchResultItem[] {
  const items = [...providerResults];
  if (items.length < 2) return items;

  const durationRange = Math.max(...items.map((item) => item.durationSeconds))
    - Math.min(...items.map((item) => item.durationSeconds));
  const pricedItems = items.filter((item) => item.priceMinor !== null);
  const priceRange = pricedItems.length > 1
    ? Math.max(...pricedItems.map((item) => item.priceMinor!)) - Math.min(...pricedItems.map((item) => item.priceMinor!))
    : 0;
  const normalized = (value: number, min: number, range: number) => range === 0 ? 0 : (value - min) / range;
  const minDuration = Math.min(...items.map((item) => item.durationSeconds));
  const minPrice = pricedItems.length ? Math.min(...pricedItems.map((item) => item.priceMinor!)) : 0;

  const score = (item: RouteSearchResultItem) => {
    if (strategy === 'FASTEST') return item.durationSeconds;
    if (strategy === 'CHEAPEST') return item.priceMinor ?? Number.MAX_SAFE_INTEGER;
    if (strategy === 'RELIABLE') return -(item.reliabilityScore ?? 80);
    if (strategy === 'PREMIUM') return -(item.comfortScore ?? 80);
    return normalized(item.durationSeconds, minDuration, durationRange) * 0.55
      + (item.priceMinor === null ? 1 : normalized(item.priceMinor, minPrice, priceRange)) * 0.45;
  };

  const sorted = items.sort((a, b) => score(a) - score(b)
    || a.departureTime.localeCompare(b.departureTime)
    || a.id.localeCompare(b.id));
  const comparablePrices = items.every((item) => item.priceMinor !== null);
  const badge = strategy === 'FASTEST' ? 'Найшвидший серед знайдених'
    : strategy === 'CHEAPEST' && comparablePrices ? 'Найдешевший серед знайдених'
      : strategy === 'RELIABLE' ? 'Найнадійніший серед знайдених'
        : strategy === 'PREMIUM' ? 'Найкомфортніший серед знайдених'
          : 'Оптимальний серед знайдених';
  const badgeType = strategy === 'FASTEST' ? 'fastest' as const
    : strategy === 'CHEAPEST' ? 'cheapest' as const : 'best' as const;

  return sorted.map((item, index) => index === 0 && (strategy !== 'CHEAPEST' || comparablePrices) ? { ...item, badge, badgeType } : item);
}

/**
 * Compatibility wrapper used by the community-offer screen. Transit, taxi,
 * bike-share and other legs must come from the journey-search API; this UI
 * helper must never fabricate availability, prices, schedules, or transfer chains.
 */
export function composeMultimodalJourneys({
  strategy,
  realOffers = [],
}: ComposeMultimodalParams): RouteSearchResultItem[] {
  return rankSearchResults(realOffers, strategy);
}
