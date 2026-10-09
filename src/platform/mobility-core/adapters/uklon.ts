import { TransportProvider, TransportMode, GeoLocation, RouteOption } from '../registry';

export class UklonAdapter implements TransportProvider {
    readonly id = 'uklon';
    readonly name = 'Uklon';
    readonly supportedModes = [TransportMode.TAXI];

    async isAvailableIn(_location: GeoLocation): Promise<boolean> {
        // Availability cannot be asserted without a contracted service API.
        return false;
    }

    async calculateRoutes(_origin: GeoLocation, _destination: GeoLocation): Promise<RouteOption[]> {
        // Never return estimated prices/times until they come from Uklon's API.
        return [];
    }
}
