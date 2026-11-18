import type { ApiBooking, ApiOffer, ApiRendezvous } from '../../../services/productionApi';

export type TripStatus =
  | 'confirmed'     // Підтверджено
  | 'approaching'   // Водій наближається
  | 'arrived'       // Водій прибув / на місці
  | 'in_progress'   // У дорозі
  | 'completed'     // Завершено
  | 'cancelled';    // Скасовано

export interface DriverContact {
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  reviewCount: number;
  vehicleModel: string;
  vehiclePlate: string;
  verified: boolean;
}

export interface ActiveTripData {
  id: string;
  routeTitle: string; // Львів → Київ
  originCity: string;
  destCity: string;
  pickupAddress: string;
  dropoffAddress: string;
  departureTime: string;
  arrivalTime: string;
  durationLabel: string;
  distanceLabel: string;
  priceLabel: string;
  seats: number;
  status: TripStatus;
  statusLabel: string;
  driver: DriverContact;
  driverEtaMinutes: number;
  driverDistanceMeters: number;
  isLocationSharing: boolean;
  passengerCoordinates: [number, number]; // [lng, lat]
  driverCoordinates: [number, number];    // [lng, lat]
  pickupCoordinates: [number, number];
  bookingId?: string;
  rawBooking?: ApiBooking;
  rawOffer?: ApiOffer;
  rawRendezvous?: ApiRendezvous;
}

export interface ChatMessageItem {
  id: string;
  sender: 'me' | 'driver' | 'system';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export type NotificationCategory = 'all' | 'trips' | 'messages' | 'offers' | 'system';

export interface V7Notification {
  id: string;
  category: 'trips' | 'messages' | 'offers' | 'system';
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  actionLabel: string;
  actionScreen: 'active_trip' | 'chat' | 'rendezvous' | 'phone' | 'safety' | 'rescue' | 'review';
}
