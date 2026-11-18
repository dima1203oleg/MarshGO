import type { SearchTransportMode } from './types';

export interface JourneyLegPresentation {
  type: SearchTransportMode;
  label: string;
}

const transportTypePresentation: Record<string, JourneyLegPresentation> = {
  carpool: { type: 'carpool', label: 'Попутка' },
  taxi: { type: 'taxi', label: 'Таксі' },
  carsharing: { type: 'carsharing', label: 'Каршеринг' },
  transfer: { type: 'transfer', label: 'Трансфер' },
  bus: { type: 'bus', label: 'Автобус' },
  intercity_bus: { type: 'bus', label: 'Міжміський автобус' },
  marshrutka: { type: 'minibus', label: 'Маршрутка' },
  trolleybus: { type: 'trolleybus', label: 'Тролейбус' },
  tram: { type: 'tram', label: 'Трамвай' },
  metro: { type: 'metro', label: 'Метро' },
  city_train: { type: 'suburban_train', label: 'Міська електричка' },
  suburban_train: { type: 'suburban_train', label: 'Електричка' },
  train: { type: 'train', label: 'Поїзд' },
  funicular: { type: 'other', label: 'Фунікулер' },
  bike: { type: 'bike', label: 'Велосипед' },
  scooter: { type: 'scooter', label: 'Самокат' },
  ferry: { type: 'water', label: 'Пором' },
  walk: { type: 'walk', label: 'Пішки' },
};

const modePresentation: Record<string, JourneyLegPresentation> = {
  WALK: { type: 'walk', label: 'Пішки' },
  COMMUNITY: { type: 'carpool', label: 'Попутка' },
  COMMUNITY_DEMAND: { type: 'carpool', label: 'Запит на попутку' },
  TAXI: { type: 'taxi', label: 'Таксі' },
  TRANSFER: { type: 'transfer', label: 'Трансфер' },
  BUS: { type: 'bus', label: 'Автобус' },
  URBAN_BUS: { type: 'bus', label: 'Міський автобус' },
  MINIBUS: { type: 'minibus', label: 'Маршрутка' },
  RAIL: { type: 'train', label: 'Поїзд' },
  TRAM: { type: 'tram', label: 'Трамвай' },
  TROLLEYBUS: { type: 'trolleybus', label: 'Тролейбус' },
  METRO: { type: 'metro', label: 'Метро' },
  CARSHARING: { type: 'carsharing', label: 'Каршеринг' },
  FERRY: { type: 'water', label: 'Пором' },
  FUNICULAR: { type: 'other', label: 'Фунікулер' },
  BIKE: { type: 'bike', label: 'Велосипед' },
  SCOOTER: { type: 'scooter', label: 'Самокат' },
};

/** Prefer the provider's concrete transport type over the broader journey leg mode. */
export function presentJourneyLeg(mode: string, transportType?: string | null): JourneyLegPresentation {
  if (transportType) {
    const specific = transportTypePresentation[transportType.toLocaleLowerCase('en-US')];
    if (specific) return specific;
  }
  return modePresentation[mode] ?? { type: 'other', label: mode || 'Транспорт' };
}
