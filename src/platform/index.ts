import { globalProviderRegistry } from './mobility-core/registry';
import { UklonAdapter } from './mobility-core/adapters/uklon';

/**
 * Platform Bootstrapper
 * Initializes the Mobility Integration Platform by registering known providers
 * and setting up necessary adapters.
 */
export function initializePlatform() {
    console.log('[MARSHGO Platform] Initializing Mobility Core...');
    
    // Phase 1: Register Core Adapters
    const uklonAdapter = new UklonAdapter();
    globalProviderRegistry.register(uklonAdapter);
    
    console.log('[MARSHGO Platform] Initialization complete. Registered providers:', globalProviderRegistry.getAllProviders().map(p => p.id));
}
