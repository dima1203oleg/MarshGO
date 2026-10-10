export type SearchTransportMode =
  | 'all'
  | 'bus'
  | 'minibus'
  | 'marshrutka'
  | 'tram'
  | 'trolleybus'
  | 'metro'
  | 'carpool'
  | 'taxi'
  | 'train'
  | 'suburban_train'
  | 'bike'
  | 'scooter'
  | 'carsharing'
  | 'transfer'
  | 'water'
  | 'air'
  | 'walk'
  | 'other';

export type SearchStrategyMode = 'BALANCED' | 'FASTEST' | 'CHEAPEST' | 'RELIABLE' | 'PREMIUM';

export interface RoutePlace {
  label: string;
  latitude?: number;
  longitude?: number;
  providerId?: string;
}

export interface SearchFiltersState {
  modes: Set<SearchTransportMode>;
  maxPrice: number;
  maxDurationHours: number;
  maxTransfers: 'any' | 'direct' | 'one' | 'two_plus';
  minRating: number;
  onlyVerified: boolean;
  airConditioning: boolean;
  wifi: boolean;
}

export interface RouteLegItem {
  id: string;
  mode: SearchTransportMode;
  modeLabel: string;
  carrierName: string;
  originName: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  durationLabel: string;
  durationSeconds: number;
  priceLabel?: string;
  priceMinor?: number;
  vehicleModel?: string;
  vehiclePhoto?: string;
  driver?: {
    name: string;
    avatar?: string;
    rating: number | null;
    reviewCount: number;
    verified?: boolean;
  };
  features?: string[];
  transferWaitMinutes?: number;
  transferHubName?: string;
  routeName?: string;
  source?: string;
  priceStatus?: 'ESTIMATED' | 'LOCKED' | 'DYNAMIC' | 'UNKNOWN';
  availabilityStatus?: string;
  distanceMeters?: number | null;
}

export interface RouteSearchResultItem {
  id: string;
  type: SearchTransportMode;
  modeLabel: string;
  badge?: string;
  badgeType?: 'best' | 'fastest' | 'cheapest' | 'direct';
  source: 'community' | 'gtfs' | 'carrier' | 'taxi_partner';
  carrierName: string;
  carrierLogo?: string;
  vehicleModel?: string;
  vehiclePhoto?: string;
  driver?: {
    name: string;
    avatar?: string;
    rating: number | null;
    reviewCount: number;
    verified: boolean;
  };
  departureTime: string;
  arrivalTime: string;
  departureCity: string;
  arrivalCity: string;
  departureAddress: string;
  arrivalAddress: string;
  durationLabel: string;
  distanceLabel: string;
  distanceMeters: number | null;
  durationSeconds: number;
  priceMinor: number | null;
  priceLabel: string;
  priceStatus?: 'ESTIMATED' | 'LOCKED' | 'DYNAMIC' | 'UNKNOWN';
  availabilityStatus?: string;
  priceUnit: 'за місце' | 'за квиток' | 'за авто' | 'за всю поїздку';
  isPriceFixed: boolean;
  availableSeats?: number;
  features: string[];
  stopsCount: number;
  stops?: Array<{
    name: string;
    time: string;
    type: 'pickup' | 'dropoff' | 'transfer' | 'stop';
  }>;
  offerId?: string;
  journeyId?: string;
  journeyLegId?: string;
  routeGeometry?: [number, number][];
  isMultimodal?: boolean;
  transfers?: number;
  strategyWinner?: SearchStrategyMode;
  legs?: RouteLegItem[];
  reliabilityScore?: number;
  comfortScore?: number;
}
