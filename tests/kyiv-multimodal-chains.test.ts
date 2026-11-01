import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { composeKyivMultimodalChains } from '../server/journey/multimodalChainEngine';
import { planKyivRapidTransitJourneys } from '../server/mobility/kyivTransitGraph';

describe('Kyiv Multimodal Chaining Engine', () => {
  it('plans rapid transit routes across Kyiv Metro lines with transfers', () => {
    // Obolon (Heroiv Dnipra area: [30.498, 50.522]) to Kyiv-Pasazhyrskyi ([30.488, 50.441])
    const itineraries = planKyivRapidTransitJourneys([30.498, 50.522], [30.488, 50.441], 2500);
    assert.ok(itineraries.length > 0, 'Should find rapid transit itineraries');
    const best = itineraries[0];
    assert.equal(best.totalFareMinor, 800, 'Metro tariff in Kyiv is exactly 8 UAH (800 minor)');
    assert.ok(best.segments.length >= 1, 'Should contain at least 1 transit segment');
    assert.ok(best.segments.some((s) => s.transportType === 'metro'), 'Should include Kyiv Metro');
  });

  it('composes multimodal combinations with real tariffs and legs', async () => {
    const chains = await composeKyivMultimodalChains({
      origin: { name: 'ст. м. Оболонь', coordinates: [30.498, 50.501] },
      destination: { name: 'ст. м. Вокзальна', coordinates: [30.488, 50.441] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: {
        allowPublicTransport: true,
        allowTaxi: true,
        allowedTransportTypes: ['metro', 'taxi', 'scooter', 'bike'],
      },
    });

    assert.ok(chains.length > 0, 'Should return multimodal chains');
    const metroChain = chains.find((c) => c.legs.some((l) => l.mode === 'METRO'));
    assert.ok(metroChain, 'Should produce a chain containing Kyiv Metro');
    assert.equal(metroChain.totalPriceMinor, 800, 'Metro price should be 800 minor (8 ₴)');

    const taxiChain = chains.find((c) => c.legs.some((l) => l.mode === 'TAXI'));
    assert.ok(taxiChain, 'Should produce a taxi option with real OSRM tariff');
    assert.ok((taxiChain.totalPriceMinor ?? 0) >= 8500, 'Taxi in Kyiv has a minimum fare of 85 UAH');
  });
});
