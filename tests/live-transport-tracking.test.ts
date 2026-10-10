import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStopArrival, sortArrivals, type TransitArrival } from '../server/journey/arrivalEngine';
import type { LiveVehiclePosition } from '../server/mobility/vehiclePositionCache';
import { mapTransitArrivalToStopArrival } from '../src/components/mobility/stopArrivalMapping';
import {
  getFollowedVehicleId,
  getHighlightedRoute,
  getSelectedStop,
  getSelectedVehicle,
  setFollowedVehicleId,
  setHighlightedRoute,
  setSelectedStop,
  setSelectedVehicle,
} from '../src/map/transportLayers';

describe('Live Transport Tracking — Vehicle GPS & Arrival Engine', () => {
  it('calculates vehicle projection ETA with honest REALTIME flag when vehicle is near', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    const vehicle: LiveVehiclePosition = {
      key: 'lviv:bus-3a-101',
      vehicleId: 'bus-3a-101',
      providerId: 'lviv',
      routeId: '3A',
      tripId: 'trip-1',
      directionId: 0,
      lat: 49.835,
      lon: 24.025,
      bearing: 135,
      speedMs: 8.5, // ~30 km/h
      mode: 'bus',
      observedAt: new Date('2026-10-10T11:59:45Z'),
      fetchedAt: now,
      isStale: false,
    };

    const arrival = calculateStopArrival({
      stopId: 'stop-stryiska-naukova',
      stopLat: 49.830,
      stopLon: 24.030,
      routeIds: ['3A'],
      vehiclePosition: vehicle,
      now,
    });

    assert.equal(arrival.isRealtime, true);
    assert.equal(arrival.arrivalSource, 'VEHICLE_PROJECTION');
    assert.equal(arrival.routeId, '3A');
    assert.equal(arrival.mode, vehicle.mode);
    assert.ok(arrival.etaSeconds !== undefined && arrival.etaSeconds > 0);
    assert.ok(arrival.predictedArrival !== undefined);
  });

  it('labels schedule-only arrival honestly as SCHEDULE without fake realtime GPS', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    const scheduledTime = new Date('2026-10-10T12:15:00Z');

    const arrival = calculateStopArrival({
      stopId: 'stop-stryiska-naukova',
      stopLat: 49.830,
      stopLon: 24.030,
      routeIds: ['10'],
      scheduledArrival: scheduledTime,
      now,
    });

    assert.equal(arrival.isRealtime, false);
    assert.equal(arrival.arrivalSource, 'SCHEDULE');
    assert.equal(arrival.routeId, '10');
    assert.ok(arrival.displayLabel.includes('розклад'));
  });

  it('does not invent ETA, destination, vehicle, accessibility or schedule details when provider data is missing', () => {
    const arrival: TransitArrival = {
      stopId: 'stop-1',
      routeId: '24',
      arrivalSource: 'UNKNOWN',
      confidence: 'UNKNOWN',
      isRealtime: false,
      displayLabel: 'Маршрут 24 — поточне положення транспорту недоступне',
    };

    const mapped = mapTransitArrivalToStopArrival(arrival, 0);

    assert.equal(mapped.etaMinutes, null);
    assert.equal(mapped.isRealtime, false);
    assert.equal(mapped.type, 'unknown');
    assert.equal(mapped.destination, undefined);
    assert.equal(mapped.vehiclePlate, undefined);
    assert.equal(mapped.isAccessible, undefined);
    assert.equal(mapped.intervalLabel, undefined);
    assert.equal(mapped.nextEtaMinutes, undefined);
    assert.equal(mapped.alertNote, undefined);
  });

  it('uses the feed mode instead of guessing a category from a route number', () => {
    const mapped = mapTransitArrivalToStopArrival({
      stopId: 'stop-1', routeId: '1', mode: 'trolleybus', arrivalSource: 'VEHICLE_PROJECTION',
      confidence: 'MEDIUM', observedAt: '2026-10-10T12:00:00.000Z', isRealtime: true,
      etaSeconds: 75, displayLabel: 'Маршрут 1 — орієнтовно 2 хв · GPS',
    }, 0);

    assert.equal(mapped.type, 'trolleybus');
    assert.equal(mapped.typeLetter, 'Тр');
    assert.equal(mapped.etaMinutes, 2);
    assert.equal(mapped.isRealtime, true);
    assert.equal(mapped.observedAt, '2026-10-10T12:00:00.000Z');
  });

  it('does not project stale positions as a live ETA', () => {
    const now = new Date('2026-10-10T12:10:00Z');
    const staleVehicle: LiveVehiclePosition = {
      key: 'lviv:bus-3a-999',
      vehicleId: 'bus-3a-999',
      providerId: 'lviv',
      routeId: '3A',
      tripId: 'trip-2',
      directionId: 0,
      lat: 49.835,
      lon: 24.025,
      bearing: 135,
      speedMs: 0,
      mode: 'bus',
      observedAt: new Date('2026-10-10T12:00:00Z'), // 10 minutes ago
      fetchedAt: now,
      isStale: true,
    };

    const arrival = calculateStopArrival({
      stopId: 'stop-stryiska',
      stopLat: 49.830,
      stopLon: 24.030,
      routeIds: ['3A'],
      vehiclePosition: staleVehicle,
      now,
    });

    assert.equal(arrival.confidence, 'UNKNOWN');
    assert.equal(arrival.isRealtime, false);
    assert.equal(arrival.arrivalSource, 'UNKNOWN');
    assert.equal(arrival.etaSeconds, undefined);
    assert.ok(arrival.displayLabel.includes('GPS застарів'));
  });

  it('sorts stop arrival board with nearest arrival first', () => {
    const arrivals: TransitArrival[] = [
      {
        stopId: 'A',
        routeId: '10',
        arrivalSource: 'SCHEDULE',
        confidence: 'HIGH',
        isRealtime: false,
        etaSeconds: 720,
        displayLabel: '12 хв',
      },
      {
        stopId: 'A',
        routeId: '3A',
        arrivalSource: 'VEHICLE_PROJECTION',
        confidence: 'HIGH',
        isRealtime: true,
        etaSeconds: 240,
        displayLabel: '4 хв',
      },
      {
        stopId: 'A',
        routeId: '25',
        arrivalSource: 'VEHICLE_PROJECTION',
        confidence: 'HIGH',
        isRealtime: true,
        etaSeconds: 420,
        displayLabel: '7 хв',
      },
    ];

    const sorted = sortArrivals(arrivals);
    assert.equal(sorted[0].routeId, '3A'); // 4 min
    assert.equal(sorted[1].routeId, '25'); // 7 min
    assert.equal(sorted[2].routeId, '10'); // 12 min
  });

  it('manages vehicle follow mode and route highlight state reactively', () => {
    setFollowedVehicleId('veh-123');
    assert.equal(getFollowedVehicleId(), 'veh-123');

    setHighlightedRoute('3A');
    assert.equal(getHighlightedRoute(), '3A');

    setSelectedVehicle({
      id: 'veh-123',
      route: '3A',
      transport: 'bus',
      bearing: 90,
      speed: 35,
      observedAt: new Date().toISOString(),
      stopId: 'stop-1',
      coordinates: [24.03, 49.84],
    });
    assert.equal(getSelectedVehicle()?.route, '3A');
    assert.equal(getSelectedVehicle()?.speed, 35);

    setSelectedStop({
      id: 'stop-1',
      name: 'Стрийська — Наукова',
      transports: ['bus', 'trolleybus'],
      coordinates: [24.03, 49.84],
    });
    assert.equal(getSelectedStop()?.name, 'Стрийська — Наукова');

    // Clean up
    setFollowedVehicleId(null);
    setHighlightedRoute(null);
    setSelectedVehicle(null);
    setSelectedStop(null);
    assert.equal(getFollowedVehicleId(), null);
    assert.equal(getHighlightedRoute(), null);
    assert.equal(getSelectedVehicle(), null);
    assert.equal(getSelectedStop(), null);
  });
});
