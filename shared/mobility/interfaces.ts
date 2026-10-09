/**
 * MARSHGO Universal Mobility Integration Platform Contracts
 * Defines normalized provider interfaces, capabilities, health models, and DTOs.
 */

export type Coordinate = [number, number]; // [longitude, latitude]

export type ProviderCategory =
  | 'PUBLIC_TRANSIT'
  | 'ROUTING'
  | 'GEOCODING'
  | 'RIDE_HAILING'
  | 'CARPOOL'
  | 'CARSHARING'
  | 'MICROMOBILITY'
  | 'RAIL'
  | 'INTERCITY_BUS'
  | 'TRAFFIC'
  | 'PARKING'
  | 'PAYMENT'
  | 'FLEET_TELEMATICS';

export type IntegrationType =
  | 'OPEN_DATA'
  | 'PUBLIC_API'
  | 'PARTNER_API'
  | 'INTERNAL';

export type AccessStatus =
  | 'AVAILABLE'
  | 'REQUIRES_KEY'
  | 'REQUIRES_CONTRACT'
  | 'UNVERIFIED'
  | 'BLOCKED';

export type RuntimeStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'STALE'
  | 'OFFLINE'
  | 'NOT_CONFIGURED';

export interface ProviderCapability {
  code: string;
  name: string;
  description: string;
  supported: boolean;
}

export interface ProviderHealth {
  status: RuntimeStatus;
  latencyMs?: number;
  lastCheckedAt: string;
  lastSuccessfulSyncAt?: string;
  errorMessage?: string;
  entityCount?: number;
}

export interface ProviderRegistryEntry {
  id: string;
  name: string;
  category: ProviderCategory;
  cities: string[];
  integrationType: IntegrationType;
  accessStatus: AccessStatus;
  runtimeStatus: RuntimeStatus;
  capabilities: string[];
  documentationUrl?: string;
  requiresAuth: boolean;
  enabled: boolean;
  license?: string;
  updateFrequency?: string;
  coverage?: string;
  sourceAttribution?: string;
  lastVerifiedAt?: string;
}

// -------------------------------------------------------------
// Specialized Provider Interfaces
// -------------------------------------------------------------

export interface TransitRouteInfo {
  id: string;
  shortName: string;
  longName: string;
  type: string;
  color?: string;
  agencyName?: string;
}

export interface TransitStopInfo {
  id: string;
  name: string;
  coordinate: Coordinate;
  code?: string;
  wheelchairAccessible?: boolean;
}

export interface TransitVehiclePosition {
  id: string;
  routeId?: string;
  tripId?: string;
  coordinate: Coordinate;
  bearing?: number;
  speedMps?: number;
  timestamp: string;
  congestionLevel?: string;
  occupancyStatus?: string;
}

export interface TransitProvider {
  readonly id: string;
  readonly name: string;
  getRoutes(city: string): Promise<TransitRouteInfo[]>;
  getStops(city: string, bbox?: [number, number, number, number]): Promise<TransitStopInfo[]>;
  getLiveVehicles?(city: string, bbox?: [number, number, number, number]): Promise<TransitVehiclePosition[]>;
  getArrivalPredictions?(stopId: string): Promise<Array<{ routeId: string; expectedArrivalAt: string; delaySeconds?: number }>>;
}

export interface RoutingLeg {
  distanceMeters: number;
  durationSeconds: number;
  geometry: Coordinate[];
}

export interface RoutingResult {
  providerId: string;
  distanceMeters: number;
  durationSeconds: number;
  durationWithoutTrafficSeconds?: number;
  geometryPolyline6: string;
  legs: RoutingLeg[];
  trafficAware: boolean;
}

export interface RoutingProvider {
  readonly id: string;
  calculateRoute(origin: Coordinate, destination: Coordinate, waypoints?: Coordinate[], mode?: 'CAR' | 'WALK' | 'BICYCLE'): Promise<RoutingResult>;
  calculateMatrix?(origins: Coordinate[], destinations: Coordinate[]): Promise<number[][]>; // durations in seconds
}

export interface GeocodingResult {
  id: string;
  displayName: string;
  coordinate: Coordinate;
  type: 'address' | 'poi' | 'city' | 'street';
  city?: string;
  postalCode?: string;
}

export interface GeocodingProvider {
  readonly id: string;
  search(query: string, focusPoint?: Coordinate): Promise<GeocodingResult[]>;
  reverse(coordinate: Coordinate): Promise<GeocodingResult | null>;
}

export interface RideEstimate {
  providerId: string;
  productName: string;
  priceMinor: number;
  currency: string;
  estimatedPickupMinutes: number;
  estimatedDurationMinutes: number;
  bookingSupported: boolean;
}

export interface RideProvider {
  readonly id: string;
  getEstimates(origin: Coordinate, destination: Coordinate): Promise<RideEstimate[]>;
  requestRide?(origin: Coordinate, destination: Coordinate, productId: string): Promise<{ bookingId: string; status: string }>;
}

export interface SharedVehicleItem {
  id: string;
  providerId: string;
  type: 'BIKE' | 'EBIKE' | 'SCOOTER' | 'MOPED' | 'CAR';
  coordinate: Coordinate;
  isReserved: boolean;
  batteryPercent?: number;
  rangeMeters?: number;
  deepLink?: string;
}

export interface SharedStationItem {
  id: string;
  name: string;
  coordinate: Coordinate;
  availableVehicles: number;
  availableDocks: number;
  isRenting: boolean;
  isReturning: boolean;
}

export interface SharedVehicleProvider {
  readonly id: string;
  getVehicles(bbox: [number, number, number, number]): Promise<SharedVehicleItem[]>;
  getStations?(bbox: [number, number, number, number]): Promise<SharedStationItem[]>;
}

export interface IntercityTripOption {
  id: string;
  operatorName: string;
  transportType: 'TRAIN' | 'BUS';
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  priceMinor?: number;
  currency?: string;
  availableSeats?: number;
  bookingUrl?: string;
}

export interface IntercityProvider {
  readonly id: string;
  searchTrips(originCity: string, destinationCity: string, date: string): Promise<IntercityTripOption[]>;
}

export interface TrafficIncident {
  id: string;
  type: 'ROAD_CLOSURE' | 'ACCIDENT' | 'CONSTRUCTION' | 'CONGESTION';
  description: string;
  coordinate: Coordinate;
  geometry?: Coordinate[];
  startTime: string;
  endTime?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TrafficProvider {
  readonly id: string;
  getIncidents(bbox: [number, number, number, number]): Promise<TrafficIncident[]>;
  getCongestionRatio?(coordinate: Coordinate): Promise<number>; // 1.0 = free flow, >1.0 = delay factor
}

export interface ParkingFacility {
  id: string;
  name: string;
  coordinate: Coordinate;
  address?: string;
  capacity?: number;
  freeSpots?: number;
  tariffUahPerHour?: number;
  operator?: string;
  isCovered?: boolean;
}

export interface ParkingProvider {
  readonly id: string;
  getFacilities(bbox: [number, number, number, number]): Promise<ParkingFacility[]>;
}

export interface PaymentIntent {
  invoiceId: string;
  paymentUrl: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';
  amountMinor: number;
  currency: string;
}

export interface PaymentProvider {
  readonly id: string;
  createInvoice(amountMinor: number, currency: string, description: string, orderReference: string, redirectUrl: string, webhookUrl: string): Promise<PaymentIntent>;
  verifyWebhook(payload: unknown, signature: string): boolean;
  checkStatus(invoiceId: string): Promise<'PENDING' | 'SUCCESS' | 'FAILURE'>;
  refund?(invoiceId: string, amountMinor: number): Promise<boolean>;
}

export interface FleetVehicleTelemetry {
  vehicleId: string;
  coordinate: Coordinate;
  headingDegrees: number;
  speedKmh: number;
  ignitionOn: boolean;
  recordedAt: string;
}

export interface FleetProvider {
  readonly id: string;
  getFleetLocations(fleetId: string): Promise<FleetVehicleTelemetry[]>;
}
