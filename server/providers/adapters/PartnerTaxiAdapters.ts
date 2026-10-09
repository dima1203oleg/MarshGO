import type { RideProvider, Coordinate, RideEstimate } from '../../../shared/mobility/interfaces';

export class UklonPartnerAdapter implements RideProvider {
  readonly id = 'uklon';
  private hasActiveContract: boolean = false;

  constructor(hasActiveContract: boolean = false) {
    this.hasActiveContract = hasActiveContract;
  }

  async getEstimates(_origin: Coordinate, _destination: Coordinate): Promise<RideEstimate[]> {
    if (!this.hasActiveContract) {
      // Per Specification: Do not simulate prices or fake cars without confirmed API access
      return [];
    }
    // In production with credentials, the official B2B endpoint would be invoked here
    return [];
  }

  async requestRide(
    _origin: Coordinate,
    _destination: Coordinate,
    _productId: string
  ): Promise<{ bookingId: string; status: string }> {
    throw new Error('Uklon ride dispatch is unavailable pending partner contract execution.');
  }
}

export class BoltPartnerAdapter implements RideProvider {
  readonly id = 'bolt';
  private hasActiveContract: boolean = false;

  constructor(hasActiveContract: boolean = false) {
    this.hasActiveContract = hasActiveContract;
  }

  async getEstimates(_origin: Coordinate, _destination: Coordinate): Promise<RideEstimate[]> {
    if (!this.hasActiveContract) {
      return [];
    }
    return [];
  }

  async requestRide(
    _origin: Coordinate,
    _destination: Coordinate,
    _productId: string
  ): Promise<{ bookingId: string; status: string }> {
    throw new Error('Bolt ride dispatch is unavailable pending partner contract execution.');
  }
}
