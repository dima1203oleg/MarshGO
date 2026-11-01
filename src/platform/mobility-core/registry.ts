/**
 * Mobility Core Abstractions
 * Defines the core models and interfaces for the MARSHGO Platform.
 */

// 1. Core Value Objects
export interface GeoLocation {
    lat: number;
    lng: number;
}

export interface Money {
    amount: number;
    currency: string;
}

// 2. Transport Provider Interface
export enum TransportMode {
    TAXI = 'taxi',
    TRANSIT = 'transit',
    MICROMOBILITY = 'micromobility',
    WALKING = 'walking'
}

export interface RouteOption {
    id: string;
    providerId: string;
    mode: TransportMode;
    estimatedDurationMinutes: number;
    estimatedPrice?: Money;
    polyline?: string; // Encoded polyline for map rendering
}

export interface TransportProvider {
    readonly id: string;
    readonly name: string;
    readonly supportedModes: TransportMode[];
    
    // Core capabilities
    isAvailableIn(location: GeoLocation): Promise<boolean>;
    calculateRoutes(origin: GeoLocation, destination: GeoLocation): Promise<RouteOption[]>;
}

// 3. Provider Registry
export class ProviderRegistry {
    private providers: Map<string, TransportProvider> = new Map();

    register(provider: TransportProvider): void {
        if (this.providers.has(provider.id)) {
            console.warn(`Provider ${provider.id} is already registered. Overwriting.`);
        }
        this.providers.set(provider.id, provider);
    }

    getProvider(id: string): TransportProvider | undefined {
        return this.providers.get(id);
    }

    getAllProviders(): TransportProvider[] {
        return Array.from(this.providers.values());
    }

    async getAvailableProvidersFor(location: GeoLocation): Promise<TransportProvider[]> {
        const availabilityChecks = Array.from(this.providers.values()).map(async (provider) => {
            const isAvailable = await provider.isAvailableIn(location);
            return isAvailable ? provider : null;
        });

        const results = await Promise.all(availabilityChecks);
        return results.filter((p): p is TransportProvider => p !== null);
    }
}

export const globalProviderRegistry = new ProviderRegistry();
