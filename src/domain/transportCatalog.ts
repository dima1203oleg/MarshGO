/**
 * MARSHGO 12 Canonical Transport Modes for Ukraine
 * Ordered by popularity and product canon, with zero extra subcategories.
 * Walking is included automatically as an internal leg; 'all' is a filter selection state.
 */

export const canonicalTransportTypes = [
  'bus',
  'marshrutka',
  'trolleybus',
  'tram',
  'metro',
  'carpool',
  'taxi',
  'train',
  'bike',
  'scooter',
  'carsharing',
  'transfer',
] as const;

export type CanonicalTransportTypeId = (typeof canonicalTransportTypes)[number];

export type TransportGroup =
  | 'Громадський транспорт'
  | 'Спільні поїздки'
  | 'Залізничний транспорт'
  | 'Мікромобільність'
  | 'Оренда авто';

export interface TransportMode {
  id: CanonicalTransportTypeId;
  label: string;
  group: TransportGroup;
  order: number;
  rental?: 'bike' | 'scooter' | 'carsharing';
  native?: boolean;
  enabled?: boolean;
  supportedCities?: string[];
}

export const CANONICAL_TRANSPORT_MODES: TransportMode[] = [
  { id: 'bus', label: 'Автобуси', group: 'Громадський транспорт', order: 1 },
  { id: 'marshrutka', label: 'Маршрутки', group: 'Громадський транспорт', order: 2 },
  { id: 'trolleybus', label: 'Тролейбуси', group: 'Громадський транспорт', order: 3 },
  { id: 'tram', label: 'Трамваї', group: 'Громадський транспорт', order: 4 },
  { id: 'metro', label: 'Метро', group: 'Громадський транспорт', order: 5, supportedCities: ['Київ', 'Харків', 'Дніпро', 'Кривий Ріг'] },
  { id: 'carpool', label: 'Попутки', group: 'Спільні поїздки', order: 6, native: true },
  { id: 'taxi', label: 'Таксі', group: 'Спільні поїздки', order: 7 },
  { id: 'train', label: 'Поїзди (включно з електричками)', group: 'Залізничний транспорт', order: 8 },
  { id: 'bike', label: 'Велосипеди', group: 'Мікромобільність', order: 9, rental: 'bike' },
  { id: 'scooter', label: 'Самокати', group: 'Мікромобільність', order: 10, rental: 'scooter' },
  { id: 'carsharing', label: 'Каршеринг', group: 'Оренда авто', order: 11, rental: 'carsharing' },
  { id: 'transfer', label: 'Трансфери', group: 'Спільні поїздки', order: 12 },
];

export const transportModes: TransportMode[] = CANONICAL_TRANSPORT_MODES;

export const transportGroups: TransportGroup[] = [
  'Громадський транспорт',
  'Спільні поїздки',
  'Залізничний транспорт',
  'Мікромобільність',
  'Оренда авто',
];

export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters / 10) * 10} м`
    : `${(meters / 1000).toFixed(1).replace('.', ',')} км`;
}