/**
 * RealtimePoller — background worker that periodically fetches all enabled
 * GTFS-RT and JSON vehicle-position providers from the database and pushes
 * results into VehiclePositionCache.
 *
 * Design rules:
 * - Runs server-side only; clients never fetch provider feeds directly.
 * - One fetch per provider per poll interval; concurrent providers fetch in parallel.
 * - Respects provider health: degraded providers continue polling with backoff;
 *   offline providers are skipped until re-enabled by an admin.
 * - Emits SSE events for subscribed clients after each successful refresh.
 * - Does not block server startup; call `start()` after DB is ready.
 */

import { Pool } from 'pg';
import { vehiclePositionCache } from './vehiclePositionCache';

export type SseEmitter = (event: string, data: unknown) => void;

interface PollerState {
  running: boolean;
  intervalMs: number;
  consecutiveErrors: Map<string, number>;
  lastSuccess: Map<string, Date>;
}

const MAX_BACKOFF_ERRORS = 5; // after 5 errors, skip provider until next admin test
const DEFAULT_INTERVAL_MS = 20_000; // 20 seconds
const EVICTION_INTERVAL_MS = 10 * 60_000; // 10 minutes

let globalSseEmitter: SseEmitter | null = null;

/** Register an SSE emitter so the poller can push vehicle updates to clients. */
export function setRealtimeSseEmitter(emitter: SseEmitter): void {
  globalSseEmitter = emitter;
}

export function createRealtimePoller(pool: Pool, intervalMs = DEFAULT_INTERVAL_MS) {
  const state: PollerState = {
    running: false,
    intervalMs,
    consecutiveErrors: new Map(),
    lastSuccess: new Map(),
  };

  let timer: NodeJS.Timeout | null = null;
  let evictionTimer: NodeJS.Timeout | null = null;

  async function pollOnce(): Promise<void> {
    let providers: Array<{
      id: string;
      name: string;
      city: string;
      source_type: 'gtfs_rt' | 'json';
      feed_url: string;
      health: string;
    }>;

    try {
      const result = await pool.query<{
        id: string; name: string; city: string;
        source_type: 'gtfs_rt' | 'json'; feed_url: string; health: string;
      }>(
        `SELECT id, name, city, source_type, feed_url, health
           FROM mobility_providers
          WHERE provider_type = 'public_transit'
            AND source_type IN ('gtfs_rt', 'json')
            AND status = 'enabled'
          ORDER BY priority, name`,
      );
      providers = result.rows;
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error', event: 'realtime_poller.db_error',
        message: err instanceof Error ? err.message : 'unknown',
      }));
      return;
    }

    const refreshed: string[] = [];
    const failed: string[] = [];

    await Promise.allSettled(providers.map(async (provider) => {
      const errors = state.consecutiveErrors.get(provider.id) ?? 0;
      if (errors >= MAX_BACKOFF_ERRORS) return; // skip until admin re-tests

      try {
        let result: { loaded: number; errors: string[] };
        if (provider.source_type === 'gtfs_rt') {
          result = await vehiclePositionCache.refreshGtfsRt({
            providerId: provider.id,
            sourceType: 'gtfs_rt',
            feedUrl: provider.feed_url,
            stalenessThresholdMs: 5 * 60_000,
          });
        } else {
          result = await vehiclePositionCache.refreshJsonFeed({
            providerId: provider.id,
            sourceType: 'json',
            feedUrl: provider.feed_url,
            stalenessThresholdMs: 10 * 60_000,
          });
        }

        if (result.errors.length > 0 && result.loaded === 0) {
          throw new Error(result.errors.join('; '));
        }

        state.consecutiveErrors.set(provider.id, 0);
        state.lastSuccess.set(provider.id, new Date());
        refreshed.push(provider.id);

        // Emit SSE event to subscribed clients
        if (globalSseEmitter && result.loaded > 0) {
          const positions = vehiclePositionCache.getByProvider(provider.id);
          globalSseEmitter('vehicles.updated', {
            providerId: provider.id,
            city: provider.city,
            count: result.loaded,
            positions: positions.slice(0, 200).map((p) => ({
              vehicleId: p.vehicleId,
              routeId: p.routeId,
              tripId: p.tripId,
              directionId: p.directionId,
              lat: p.lat,
              lon: p.lon,
              bearing: p.bearing,
              speedMs: p.speedMs,
              mode: p.mode,
              observedAt: p.observedAt.toISOString(),
              isStale: p.isStale,
            })),
          });
        }
      } catch (err) {
        const count = (state.consecutiveErrors.get(provider.id) ?? 0) + 1;
        state.consecutiveErrors.set(provider.id, count);
        failed.push(`${provider.name}[${count}]: ${err instanceof Error ? err.message : 'unknown'}`);
        if (count >= MAX_BACKOFF_ERRORS) {
          console.warn(JSON.stringify({
            level: 'warn', event: 'realtime_poller.provider_backoff',
            providerId: provider.id, name: provider.name, consecutiveErrors: count,
          }));
        }
      }
    }));

    // Recompute stale flags across all cached positions
    vehiclePositionCache.recomputeStale();

    if (refreshed.length > 0 || failed.length > 0) {
      console.info(JSON.stringify({
        level: 'info', event: 'realtime_poller.cycle',
        refreshed: refreshed.length, failed: failed.length,
        totalCached: vehiclePositionCache.size(),
        ...(failed.length > 0 ? { failedDetails: failed } : {}),
      }));
    }
  }

  return {
    start(): void {
      if (state.running) return;
      state.running = true;

      // First poll immediately, then on interval
      void pollOnce();
      timer = setInterval(() => { void pollOnce(); }, state.intervalMs);

      // Evict positions from disabled providers periodically
      evictionTimer = setInterval(() => {
        const evicted = vehiclePositionCache.evictStale(EVICTION_INTERVAL_MS);
        if (evicted > 0) {
          console.info(JSON.stringify({
            level: 'info', event: 'realtime_poller.eviction', evicted,
          }));
        }
      }, EVICTION_INTERVAL_MS);

      console.info(JSON.stringify({
        level: 'info', event: 'realtime_poller.started', intervalMs: state.intervalMs,
      }));
    },

    stop(): void {
      state.running = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (evictionTimer) { clearInterval(evictionTimer); evictionTimer = null; }
      console.info(JSON.stringify({ level: 'info', event: 'realtime_poller.stopped' }));
    },

    isRunning(): boolean { return state.running; },

    /** Force an immediate poll (used by admin "Перевірити / Sync" button). */
    async pollNow(): Promise<void> { return pollOnce(); },

    stats(): {
      totalCached: number;
      providersWithErrors: number;
      lastSuccessByProvider: Record<string, string>;
    } {
      return {
        totalCached: vehiclePositionCache.size(),
        providersWithErrors: [...state.consecutiveErrors.values()].filter((n) => n > 0).length,
        lastSuccessByProvider: Object.fromEntries(
          [...state.lastSuccess.entries()].map(([id, d]) => [id, d.toISOString()]),
        ),
      };
    },
  };
}

export type RealtimePoller = ReturnType<typeof createRealtimePoller>;
