import type { ApiTransportProviders } from '../services/productionApi';
import {
  CANONICAL_TRANSPORT_MODES,
  canonicalTransportTypes,
  type CanonicalTransportTypeId,
  type TransportGroup,
} from './transportCatalog';

export { canonicalTransportTypes, type CanonicalTransportTypeId };

/** Backward-compatible type allowing legacy aliases while standardizing on the 12 canonical modes */
export type TransportTypeId =
  | CanonicalTransportTypeId
  | 'city_train'
  | 'suburban_train'
  | 'intercity_bus'
  | 'funicular'
  | 'car_rental'
  | 'moped'
  | 'plane'
  | 'ferry'
  | 'walk';

export interface TransportTypeInfo {
  id: TransportTypeId;
  label: string;
  group: TransportGroup;
  order: number;
}

/** 12 Canonical Transport Types */
export const transportTypes: TransportTypeInfo[] = CANONICAL_TRANSPORT_MODES.map((mode) => ({
  id: mode.id as TransportTypeId,
  label: mode.label,
  group: mode.group,
  order: mode.order,
}));

const canonicalTypeIds: TransportTypeId[] = transportTypes.map((type) => type.id);

/** Modes backed by the current route engine. The other six canonical tiles stay visible but disabled. */
export const journeySearchSupportedTypes: readonly TransportTypeId[] = [
  'bus',
  'marshrutka',
  'trolleybus',
  'tram',
  'metro',
  'carpool',
  'train',
];

export function isJourneySearchSupported(type: TransportTypeId): boolean {
  return journeySearchSupportedTypes.includes(type);
}

/** Per-type provider choice */
export interface ProviderChoice {
  all: boolean;
  ids: string[]
}

export interface TransportSelection {
  active: TransportTypeId[];
  providers: Partial<Record<TransportTypeId, ProviderChoice>>;
}

export const defaultSelection: TransportSelection = {
  active: [...journeySearchSupportedTypes],
  providers: {},
};

const KEY = 'marshgo_transport_selection_v2';

export function loadSelection(): TransportSelection {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<TransportSelection> | null;
    if (parsed && Array.isArray(parsed.active) && typeof parsed.providers === 'object' && parsed.providers !== null) {
      // Normalize any legacy types into canonical 12
      const normalizedActive: TransportTypeId[] = parsed.active.map((id) => {
        if (id === 'suburban_train' || id === 'city_train') return 'train';
        if (id === 'intercity_bus') return 'bus';
        if (id === 'car_rental') return 'carsharing';
        return id as TransportTypeId;
      }).filter((id): id is TransportTypeId => canonicalTypeIds.includes(id) && isJourneySearchSupported(id));

      return {
        active: Array.from(new Set(normalizedActive)),
        providers: parsed.providers,
      };
    }
  } catch {
    // fallback
  }
  return defaultSelection;
}

export function saveSelection(selection: TransportSelection) {
  try {
    localStorage.setItem(KEY, JSON.stringify(selection));
  } catch {
    // fallback
  }
}

export const isAllActive = (selection: TransportSelection) =>
  journeySearchSupportedTypes.every((id) => selection.active.includes(id))
  && selection.active.every(isJourneySearchSupported);

/** "Усі": switches every routeable canonical type on. Unsupported tiles remain visible and disabled. */
export function selectAll(selection: TransportSelection): TransportSelection {
  return { ...selection, active: [...journeySearchSupportedTypes] };
}

/** Plain toggle: user can select any combination */
export function toggleType(selection: TransportSelection, type: TransportTypeId): TransportSelection {
  if (!isJourneySearchSupported(type)) return selection;
  // Normalize alias
  const normalizedType = (type === 'suburban_train' || type === 'city_train')
    ? 'train'
    : (type === 'intercity_bus')
    ? 'bus'
    : type;

  const active = selection.active.includes(normalizedType)
    ? selection.active.filter((id) => id !== normalizedType)
    : [...selection.active, normalizedType];

  return { ...selection, active };
}

export function choiceFor(selection: TransportSelection, type: TransportTypeId): ProviderChoice {
  return selection.providers[type] ?? { all: true, ids: [] };
}

/** Toggle provider for a transport type */
export function toggleProvider(selection: TransportSelection, type: TransportTypeId, providerId: string | 'all'): TransportSelection {
  const current = choiceFor(selection, type);
  let next: ProviderChoice;
  if (providerId === 'all') {
    next = { all: true, ids: [] };
  } else {
    const ids = current.ids.includes(providerId)
      ? current.ids.filter((id) => id !== providerId)
      : [...current.ids, providerId];
    next = ids.length === 0 ? { all: true, ids: [] } : { all: false, ids };
  }
  return { ...selection, providers: { ...selection.providers, [type]: next } };
}

/** Providers to use for a type in the search */
export function activeTypesForSearch(selection: TransportSelection): TransportTypeId[] {
  return selection.active.filter(isJourneySearchSupported);
}

/** Legacy schedule subtypes grouped under the approved twelve user-facing categories. */
export const journeyTypesForCategory: Readonly<Record<CanonicalTransportTypeId, readonly string[]>> = {
  bus: ['bus', 'intercity_bus'],
  marshrutka: ['marshrutka'],
  trolleybus: ['trolleybus'],
  tram: ['tram'],
  metro: ['metro'],
  carpool: ['carpool'],
  taxi: ['taxi'],
  train: ['train', 'suburban_train', 'city_train'],
  bike: ['bike'],
  scooter: ['scooter'],
  carsharing: ['carsharing'],
  transfer: ['transfer'],
};

function groupsForCategory(type: TransportTypeId, groups: ApiTransportProviders[] | null) {
  if (!groups || !canonicalTypeIds.includes(type as CanonicalTransportTypeId)) return [];
  return groups.filter((group) => journeyTypesForCategory[type as CanonicalTransportTypeId].includes(group.transportType));
}

function providerCanRoute(type: TransportTypeId, provider: ApiTransportProviders['providers'][number]): boolean {
  return type === 'carpool' ? provider.sources.includes('marshgo') : provider.sources.includes('gtfs');
}

export function hasJourneySearchProvider(type: TransportTypeId, groups: ApiTransportProviders[] | null): boolean {
  if (!isJourneySearchSupported(type)) return false;
  if (type === 'carpool') return true;
  return groupsForCategory(type, groups).some((group) => group.providers.some((provider) => provider.available && providerCanRoute(type, provider)));
}

export function providersForJourneySearch(type: TransportTypeId, groups: ApiTransportProviders[] | null): ApiTransportProviders['providers'] {
  if (!isJourneySearchSupported(type)) return [];
  return groupsForCategory(type, groups).flatMap((group) => group.providers.filter((provider) => provider.available && providerCanRoute(type, provider)));
}

export function effectiveProviders(selection: TransportSelection, type: TransportTypeId, groups: ApiTransportProviders[] | null): string[] {
  const available = providersForJourneySearch(type, groups);
  const choice = choiceFor(selection, type);
  return available.filter((provider) => choice.all || choice.ids.includes(provider.id)).map((provider) => provider.id);
}

/**
 * Maps the 12 canonical transport modes onto the Journey Engine flags.
 * "Пішки" (walking) is automatically factored into combined routes.
 */
export function toJourneyPreferences(
  selection: TransportSelection,
  groups: ApiTransportProviders[] | null
): Record<string, boolean | string[] | Record<string, string[]>> {
  const active = journeySearchSupportedTypes.filter((type) => selection.active.includes(type));
  const withProviders = active.filter((type) => type === 'carpool' || groups === null || effectiveProviders(selection, type, groups).length > 0);
  const allowedTransportTypes = withProviders.flatMap((category) => journeyTypesForCategory[category as CanonicalTransportTypeId]);
  const transit = withProviders.filter((type) => type !== 'carpool');
  const allowedTransitProvidersByType: Record<string, string[]> = {};
  const selectedTransitProviders: string[] = [];
  if (groups !== null) for (const category of transit) {
    const selectedIds = new Set(effectiveProviders(selection, category, groups));
    for (const group of groupsForCategory(category, groups)) {
      const ids = group.providers.filter((provider) => provider.available && providerCanRoute(category, provider) && selectedIds.has(provider.id))
        .map((provider) => provider.id.slice(provider.id.indexOf(':') + 1));
      if (ids.length) {
        allowedTransitProvidersByType[group.transportType] = [...new Set([...(allowedTransitProvidersByType[group.transportType] ?? []), ...ids])];
        selectedTransitProviders.push(...ids);
      }
    }
  }

  return {
    allowCommunity: withProviders.includes('carpool'),
    allowTaxi: false,
    allowCarsharing: false,
    allowTransfer: false,
    allowBus: withProviders.some((type) => type === 'bus' || type === 'trolleybus' || type === 'tram' || type === 'metro'),
    allowMinibus: withProviders.includes('marshrutka'),
    allowRail: withProviders.includes('train'),
    allowPublicTransport: transit.length > 0,
    // Walking is an automatic access/transfer leg, not a selectable provider
    // preference. The journey API rejects unknown preference keys.
    allowedTransportTypes,
    allowedTransitProviders: [...new Set(selectedTransitProviders)],
    allowedTransitProvidersByType,
  };
}
