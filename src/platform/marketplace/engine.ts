import { GeoLocation, RouteOption, globalProviderRegistry } from '../mobility-core/registry';

export interface TripRequest {
    id: string;
    origin: GeoLocation;
    destination: GeoLocation;
    userId: string;
    requestedAt: Date;
}

export interface MatchResult {
    tripRequest: TripRequest;
    options: RouteOption[];
}

export class MatchingEngine {
    
    async matchOptions(request: TripRequest): Promise<MatchResult> {
        // 1. Get available providers for the origin location
        const availableProviders = await globalProviderRegistry.getAvailableProvidersFor(request.origin);
        
        if (availableProviders.length === 0) {
            return {
                tripRequest: request,
                options: [],
            };
        }

        // 2. Fetch routing options from all available providers concurrently
        const routePromises = availableProviders.map(provider => 
            provider.calculateRoutes(request.origin, request.destination)
        );

        const routesArrays = await Promise.all(routePromises);
        
        // 3. Flatten and sort results (e.g., by estimated duration as a basic default)
        const allOptions = routesArrays.flat();
        
        allOptions.sort((a, b) => a.estimatedDurationMinutes - b.estimatedDurationMinutes);

        return {
            tripRequest: request,
            options: allOptions,
        };
    }
}

export const globalMatchingEngine = new MatchingEngine();
