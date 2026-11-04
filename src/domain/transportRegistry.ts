import { CANONICAL_TRANSPORT_MODES, type TransportMode } from './transportCatalog';

const REGISTRY_STORAGE_KEY = 'marshgo_transport_registry_overrides_v1';

export interface TransportModeConfig {
  id: string;
  enabled: boolean;
  supportedCities?: string[];
}

class TransportRegistryService {
  private overrides: Record<string, Partial<TransportModeConfig>> = {};
  private listeners = new Set<() => void>();

  constructor() {
    this.loadOverrides();
  }

  private loadOverrides() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(REGISTRY_STORAGE_KEY);
        if (stored) {
          this.overrides = JSON.parse(stored);
        }
      }
    } catch {
      this.overrides = {};
    }
  }

  private saveOverrides() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(this.overrides));
      }
    } catch {
      // safe fallback
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in transport registry listener:', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns all 12 canonical modes, merged with admin registry overrides,
   * optionally filtered by the active city context.
   */
  getModes(city?: string): TransportMode[] {
    return CANONICAL_TRANSPORT_MODES.map((mode) => {
      const override = this.overrides[mode.id];
      const enabled = override?.enabled !== undefined ? override.enabled : (mode.enabled ?? true);
      const supportedCities = override?.supportedCities ?? mode.supportedCities;

      return {
        ...mode,
        enabled,
        supportedCities,
      };
    }).filter((mode) => {
      if (!mode.enabled) return false;
      if (city && mode.supportedCities && mode.supportedCities.length > 0) {
        return mode.supportedCities.some((c) => city.toLowerCase().includes(c.toLowerCase()));
      }
      return true;
    }).sort((a, b) => a.order - b.order);
  }

  /**
   * Admin API: Toggle whether a transport mode is enabled globally
   */
  setModeEnabled(modeId: string, enabled: boolean) {
    this.overrides[modeId] = {
      ...this.overrides[modeId],
      enabled,
    };
    this.saveOverrides();
  }

  /**
   * Admin API: Set city constraints for a transport mode
   */
  setModeCities(modeId: string, cities: string[] | undefined) {
    this.overrides[modeId] = {
      ...this.overrides[modeId],
      supportedCities: cities,
    };
    this.saveOverrides();
  }

  /**
   * Reset overrides to system canonical defaults
   */
  resetToDefaults() {
    this.overrides = {};
    this.saveOverrides();
  }
}

export const transportRegistry = new TransportRegistryService();
