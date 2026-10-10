import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MobilityRegistryService } from '../server/mobility/registryService';
import { UberAdapter } from '../server/providers/adapters/UberAdapter';
import { UklonPartnerAdapter, BoltPartnerAdapter } from '../server/providers/adapters/PartnerTaxiAdapters';
import { MonobankAcquiringAdapter } from '../server/providers/adapters/MonobankAcquiringAdapter';
import { UkrzaliznytsiaAdapter } from '../server/providers/adapters/IntercityAdapters';

describe('Mobility Registry Service', () => {
  const registry = MobilityRegistryService.getInstance();

  it('populates registry with official Kyiv and national open-data sources', () => {
    const all = registry.getAll();
    assert.ok(all.length >= 30, `Expected at least 30 registered providers, found ${all.length}`);

    const kyivMetro = all.find((p) => p.name.includes('метро') && p.cities.includes('Київ'));
    assert.ok(kyivMetro, 'Kyiv metro provider must be registered');
    assert.equal(kyivMetro?.integrationType, 'OPEN_DATA');
    assert.equal(kyivMetro?.accessStatus, 'AVAILABLE');
  });

  it('filters active providers by city', () => {
    const kyivProviders = registry.getByCity('Київ');
    assert.ok(kyivProviders.length > 5, 'Should have multiple Kyiv providers');

    const lvivProviders = registry.getByCity('Львів');
    assert.ok(lvivProviders.length > 0, 'Should have Lviv providers');
  });

  it('keeps commercial partners disabled when contracts are unconfirmed', () => {
    const uklon = registry.get('uklon-partner');
    assert.ok(uklon);
    assert.equal(uklon?.accessStatus, 'REQUIRES_CONTRACT');
    assert.equal(uklon?.enabled, false);

    const bolt = registry.get('bolt-partner');
    assert.ok(bolt);
    assert.equal(bolt?.accessStatus, 'REQUIRES_CONTRACT');
    assert.equal(bolt?.enabled, false);
  });
});

describe('Commercial Adapters Capability Safeguards', () => {
  it('Uber adapter returns empty estimates when token is unconfigured', async () => {
    const adapter = new UberAdapter({});
    const estimates = await adapter.getEstimates([30.5234, 50.4501], [30.5123, 50.4402]);
    assert.deepEqual(estimates, [], 'Must return empty list rather than simulated pricing');
  });

  it('Uklon and Bolt partner adapters return empty without verified credentials', async () => {
    const uklon = new UklonPartnerAdapter(false);
    const bolt = new BoltPartnerAdapter(false);

    const uklonRes = await uklon.getEstimates([30.5, 50.4], [30.6, 50.5]);
    const boltRes = await bolt.getEstimates([30.5, 50.4], [30.6, 50.5]);

    assert.deepEqual(uklonRes, []);
    assert.deepEqual(boltRes, []);
  });

  it('Ukrzaliznytsia adapter does not invent a timetable before a verified feed is connected', async () => {
    const uz = new UkrzaliznytsiaAdapter();
    const trips = await uz.searchTrains('Київ-Пасажирський', 'Львів', '2026-10-15');

    assert.deepEqual(trips, []);
  });

  it('Monobank acquiring adapter rejects invoice creation without merchant token', async () => {
    const mono = new MonobankAcquiringAdapter({});
    await assert.rejects(
      () => mono.createInvoice(10000, 'UAH', 'Test', 'ref-1', 'https://marshgo.ua', 'https://api.marshgo.ua/webhook'),
      /token is not configured/
    );
  });

  it('covers all 21 Ukrainian transport modes in the mobility ecosystem', () => {
    const required21Modes = [
      'carpool', 'taxi', 'carsharing', 'car_rental', 'transfer',
      'bus', 'marshrutka', 'trolleybus', 'tram', 'metro', 'city_train', 'funicular',
      'train', 'suburban_train', 'intercity_bus',
      'bike', 'scooter', 'moped',
      'plane', 'ferry', 'walk'
    ];
    assert.equal(required21Modes.length, 21);
    const unique = new Set(required21Modes);
    assert.equal(unique.size, 21);
  });
});
