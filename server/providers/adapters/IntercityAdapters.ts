import type { IntercityProvider, IntercityTripOption } from '../../../shared/mobility/interfaces';

export interface RailProvider {
  searchTrains(originStation: string, destinationStation: string, date: string): Promise<IntercityTripOption[]>;
}

export interface IntercityBusProvider {
  searchBuses(originCity: string, destinationCity: string, date: string): Promise<IntercityTripOption[]>;
}

export class UkrzaliznytsiaAdapter implements IntercityProvider, RailProvider {
  readonly id = 'ukrzaliznytsia';

  async searchTrips(_originCity: string, _destinationCity: string, _date: string): Promise<IntercityTripOption[]> {
    // No schedule or inventory API is configured. Returning a synthetic train
    // time here would make an unverified itinerary look bookable.
    return [];
  }

  async searchTrains(_originStation: string, _destinationStation: string, _date: string): Promise<IntercityTripOption[]> {
    // Ticket sales are available on the official site, but there is no verified
    // schedule feed connected to this adapter yet.
    return [];
  }
}

export class InfobusPartnerAdapter implements IntercityProvider, IntercityBusProvider {
  readonly id = 'infobus';
  private hasContract: boolean = false;

  constructor(hasContract: boolean = false) {
    this.hasContract = hasContract;
  }

  async searchTrips(originCity: string, destinationCity: string, date: string): Promise<IntercityTripOption[]> {
    return this.searchBuses(originCity, destinationCity, date);
  }

  async searchBuses(_originCity: string, _destinationCity: string, _date: string): Promise<IntercityTripOption[]> {
    if (!this.hasContract) {
      return [];
    }
    // With official INFOBUS partner API key, inventory query is performed here
    return [];
  }
}
