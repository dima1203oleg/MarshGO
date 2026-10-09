import type { RideProvider, Coordinate, RideEstimate } from '../../../shared/mobility/interfaces';

export interface UberConfig {
  clientId?: string;
  clientSecret?: string;
  serverToken?: string;
  isSandbox?: boolean;
}

export class UberAdapter implements RideProvider {
  readonly id = 'uber';
  private readonly config: UberConfig;
  private readonly baseUrl: string;

  constructor(config: UberConfig = {}) {
    this.config = config;
    this.baseUrl = config.isSandbox ? 'https://sandbox-api.uber.com/v1.2' : 'https://api.uber.com/v1.2';
  }

  async getEstimates(origin: Coordinate, destination: Coordinate): Promise<RideEstimate[]> {
    if (!this.config.serverToken) {
      // In development or when unconfigured, return no estimates rather than simulated falsities
      return [];
    }

    try {
      const url = new URL(`${this.baseUrl}/estimates/price`);
      url.searchParams.set('start_longitude', origin[0].toString());
      url.searchParams.set('start_latitude', origin[1].toString());
      url.searchParams.set('end_longitude', destination[0].toString());
      url.searchParams.set('end_latitude', destination[1].toString());

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Token ${this.config.serverToken}`,
          'Accept-Language': 'uk_UA',
        },
      });

      if (!res.ok) {
        console.warn(`[UberAdapter] HTTP ${res.status} from price estimates API`);
        return [];
      }

      const body = (await res.json()) as {
        prices?: Array<{
          localized_display_name: string;
          low_estimate: number;
          high_estimate: number;
          currency_code: string;
          duration: number;
        }>;
      };

      const prices = body.prices ?? [];
      return prices.map((item) => ({
        providerId: this.id,
        productName: `Uber ${item.localized_display_name}`,
        priceMinor: Math.round(((item.low_estimate + item.high_estimate) / 2) * 100),
        currency: item.currency_code || 'UAH',
        estimatedPickupMinutes: 5,
        estimatedDurationMinutes: Math.round(item.duration / 60),
        bookingSupported: false, // Requires OAuth rider delegation
      }));
    } catch (err) {
      console.warn('[UberAdapter] Failed to fetch Uber estimates:', err);
      return [];
    }
  }

  async requestRide(
    _origin: Coordinate,
    _destination: Coordinate,
    _productId: string
  ): Promise<{ bookingId: string; status: string }> {
    throw new Error('Uber direct ride request requires user OAuth approval and certified commercial contract.');
  }
}
