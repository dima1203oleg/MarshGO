import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { composeUkraineMultimodalChains } from '../server/journey/multimodalChainEngine';
import { planCityTransitJourneys } from '../server/mobility/ukraineTransitGraph';

describe('Ukraine Multi-City Multimodal Chaining Engine', () => {
  it('composes multimodal transit in Lviv (Сихів → Залізничний вокзал via Трамвай)', async () => {
    // Sykhiv ([24.0560, 49.7942]) to Lviv Central Station ([23.9950, 49.8358])
    const lvivItineraries = planCityTransitJourneys('Львів', [24.0560, 49.7942], [23.9950, 49.8358], 2500);
    assert.ok(lvivItineraries.length > 0, 'Should find Lviv transit itineraries');
    const best = lvivItineraries[0];
    assert.equal(best.totalFareMinor, 1500, 'Lviv tram fare is 15.00 UAH (1500 minor)');
    assert.equal(best.segments[0].transportType, 'tram');
    assert.ok(best.segments[0].providerName.includes('Львівелектротранс'));

    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'вул. Вернадського (Сихів)', coordinates: [24.0560, 49.7942] },
      destination: { name: 'Львів-Головний', coordinates: [23.9950, 49.8358] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: { allowPublicTransport: true, allowedTransportTypes: ['tram', 'taxi'] },
    });
    assert.ok(chains.length > 0, 'Should produce multimodal chains in Lviv');
    const tramChain = chains.find((c) => c.legs.some((l) => l.mode === 'TRAM'));
    assert.ok(tramChain, 'Should contain Lviv Tram chain');
    assert.equal(tramChain.totalPriceMinor, 1500, 'Lviv tram fare should be 15 ₴');
  });

  it('composes multimodal transit in Odesa (Аркадія → Одеса-Головна via Трамвай №5)', async () => {
    // Arcadia ([30.7675, 46.4298]) to Odesa-Holovna ([30.7412, 46.4674])
    const odesaItineraries = planCityTransitJourneys('Одеса', [30.7675, 46.4298], [30.7412, 46.4674], 2500);
    assert.ok(odesaItineraries.length > 0, 'Should find Odesa transit itineraries');
    assert.equal(odesaItineraries[0].totalFareMinor, 800, 'Odesa tram fare is 8.00 UAH (800 minor)');

    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'Аркадія', coordinates: [30.7675, 46.4298] },
      destination: { name: 'Одеса-Головна', coordinates: [30.7412, 46.4674] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: { allowPublicTransport: true, allowedTransportTypes: ['tram', 'taxi'] },
    });
    assert.ok(chains.length > 0, 'Should return Odesa multimodal chains');
    const tramChain = chains.find((c) => c.legs.some((l) => l.mode === 'TRAM'));
    assert.ok(tramChain, 'Should contain Odesa Tram chain');
  });

  it('composes multimodal transit in Kharkiv (Салтівка → Південний вокзал via Метро)', async () => {
    // Saltivka ([36.3245, 50.0245]) to Kharkiv-Pas ([36.2050, 49.9880])
    const kharkivItineraries = planCityTransitJourneys('Харків', [36.3245, 50.0245], [36.2050, 49.9880], 2500);
    assert.ok(kharkivItineraries.length > 0, 'Should find Kharkiv transit itineraries');
    assert.equal(kharkivItineraries[0].totalFareMinor, 800, 'Kharkiv metro fare is 8.00 UAH');

    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'ст. м. Героїв Праці', coordinates: [36.3245, 50.0245] },
      destination: { name: 'Південний вокзал', coordinates: [36.2050, 49.9880] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: { allowPublicTransport: true, allowedTransportTypes: ['metro'] },
    });
    assert.ok(chains.length > 0, 'Should return Kharkiv multimodal chains');
    const metroChain = chains.find((c) => c.legs.some((l) => l.mode === 'METRO'));
    assert.ok(metroChain, 'Should contain Kharkiv Metro chain');
  });

  it('composes multimodal transit in Dnipro (Покровська → Вокзальна via Дніпровське метро)', async () => {
    // Pokrovska ([34.9255, 48.4835]) to Dnipro-Holovnyi ([35.0165, 48.4760])
    const dniproItineraries = planCityTransitJourneys('Дніпро', [34.9255, 48.4835], [35.0165, 48.4760], 2500);
    assert.ok(dniproItineraries.length > 0, 'Should find Dnipro transit itineraries');
    assert.equal(dniproItineraries[0].totalFareMinor, 800, 'Dnipro metro fare is 8.00 UAH');
  });

  it('composes multi-line transfer in Kharkiv Metro (Салтівська → Холодногірсько-Заводська лінія із безкоштовною пересадкою)', async () => {
    // Heroiv Pratsi ([36.3245, 50.0245]) to Kholodna Hora ([36.1802, 49.9825])
    const kharkivTransfers = planCityTransitJourneys('Харків', [36.3245, 50.0245], [36.1802, 49.9825], 2500);
    assert.ok(kharkivTransfers.length > 0, 'Should plan transit with transfer in Kharkiv');
    const transferItinerary = kharkivTransfers.find((it) => it.transfers === 1);
    assert.ok(transferItinerary, 'Should contain a 1-transfer journey between Line 2 and Line 1');
    assert.equal(transferItinerary.totalFareMinor, 800, 'Underground transfer in Kharkiv Metro is free (8.00 UAH total)');
    assert.equal(transferItinerary.segments.length, 2, 'Must have exactly 2 metro segments');
    assert.equal(transferItinerary.segments[0].lineName, 'Салтівська лінія');
    assert.equal(transferItinerary.segments[1].lineName, 'Холодногірсько-Заводська лінія');
  });

  it('composes Dnipro Metro to Tram 1 transfer at Railway Hub (Покровська → пл. Соборна / ЦУМ)', async () => {
    // Pokrovska ([34.9255, 48.4835]) to Soborna Square ([35.0655, 48.4575])
    const dniproTransfers = planCityTransitJourneys('Дніпро', [34.9255, 48.4835], [35.0655, 48.4575], 2500);
    assert.ok(dniproTransfers.length > 0, 'Should find Dnipro Metro + Tram itineraries');
    const transferItinerary = dniproTransfers.find((it) => it.transfers === 1);
    assert.ok(transferItinerary, 'Should find 1-transfer itinerary connecting Metro and Tram 1');
    assert.equal(transferItinerary.segments[0].mode, 'METRO');
    assert.equal(transferItinerary.segments[1].mode, 'TRAM');
    assert.equal(transferItinerary.totalFareMinor, 1600, 'Metro 8 ₴ + Tram 8 ₴ = 16 ₴ (1600 minor)');
  });

  it('composes complete Intercity Multimodal Corridor: Київ → Львів (First Mile + Intercity+ + Last Mile)', async () => {
    // Obolon (Kyiv) [30.498, 50.501] to Sykhiv (Lviv) [24.0560, 49.7942]
    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'вул. Маршала Тимошенка (Київ)', coordinates: [30.498, 50.501] },
      destination: { name: 'просп. Червоної Калини (Львів)', coordinates: [24.0560, 49.7942] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: {
        allowPublicTransport: true,
        allowTaxi: true,
        allowedTransportTypes: ['train', 'taxi', 'tram'],
      },
    });

    assert.ok(chains.length > 0, 'Should produce Intercity multimodal chains');
    const intercityChain = chains.find((c) => c.legs.some((l) => l.mode === 'RAIL'));
    assert.ok(intercityChain, 'Should produce a chain containing Intercity rail leg');
    assert.ok(intercityChain.legs.length >= 3, 'Must have at least 3 legs: First Mile, Rail, and Last Mile');
    assert.equal(intercityChain.transfers, 2, 'Should specify exactly 2 connection points');
    assert.ok(intercityChain.totalPriceMinor && intercityChain.totalPriceMinor > 48000, 'Total price includes rail (480 UAH) plus city transfers');
    assert.ok(intercityChain.legs.some((l) => l.providerName?.includes('Укрзалізниця')), 'Rail leg must be attributed to Укрзалізниця');

    // Verify transfer buffer between first mile arrival and rail departure is at least 15 minutes
    const railIndex = intercityChain.legs.findIndex((l) => l.mode === 'RAIL');
    const firstMileLeg = intercityChain.legs[railIndex - 1];
    const railLeg = intercityChain.legs[railIndex];
    const bufferMinutes = (railLeg.departureAt.getTime() - firstMileLeg.arrivalAt.getTime()) / 60_000;
    assert.ok(bufferMinutes >= 15, `Rail departure buffer must be >= 15 min, got ${bufferMinutes} min`);
  });

  it('composes Intercity Multimodal Corridor: Київ → Одеса (Intercity+ №763/764)', async () => {
    // Pechersk (Kyiv) [30.540, 50.428] to Arcadia (Odesa) [30.7675, 46.4298]
    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'Печерська площа (Київ)', coordinates: [30.540, 50.428] },
      destination: { name: 'Аркадія (Одеса)', coordinates: [30.7675, 46.4298] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: { allowPublicTransport: true, allowTaxi: true, allowedTransportTypes: ['train', 'taxi', 'tram'] },
    });

    assert.ok(chains.length > 0, 'Should return Kyiv-Odesa corridors');
    const railChain = chains.find((c) => c.legs.some((l) => l.mode === 'RAIL'));
    assert.ok(railChain, 'Should contain rail leg');
    assert.ok(railChain.totalPriceMinor && railChain.totalPriceMinor >= 45000, 'Should include 450 ₴ UZ ticket');
  });

  it('composes Intercity Multimodal Corridor: Київ → Харків (Intercity+ №722/724)', async () => {
    // Pozniaky (Kyiv) [30.634, 50.398] to Saltivka (Kharkiv) [36.3245, 50.0245]
    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'ст. м. Позняки (Київ)', coordinates: [30.634, 50.398] },
      destination: { name: 'Героїв Праці (Харків)', coordinates: [36.3245, 50.0245] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: { allowPublicTransport: true, allowTaxi: true, allowedTransportTypes: ['train', 'taxi', 'metro'] },
    });

    assert.ok(chains.length > 0, 'Should return Kyiv-Kharkiv corridors');
    const railChain = chains.find((c) => c.legs.some((l) => l.mode === 'RAIL'));
    assert.ok(railChain, 'Should contain rail leg');
    assert.ok(railChain.totalPriceMinor && railChain.totalPriceMinor >= 42000, 'Should include 420 ₴ UZ ticket');
  });

  it('composes Regional Multimodal Corridor: Львів → Івано-Франківськ (Прикарпатський експрес)', async () => {
    // Lviv Centre [24.0315, 49.8418] to Ivano-Frankivsk [24.7215, 48.9230]
    const chains = await composeUkraineMultimodalChains({
      origin: { name: 'пл. Ринок (Львів)', coordinates: [24.0315, 49.8418] },
      destination: { name: 'Івано-Франківськ (Центр)', coordinates: [24.7215, 48.9230] },
      departureAt: new Date(Date.now() + 3600_000),
      passengers: 1,
      strategy: 'BALANCED',
      preferences: { allowPublicTransport: true, allowTaxi: true, allowedTransportTypes: ['train', 'tram', 'taxi'] },
    });

    assert.ok(chains.length > 0, 'Should return Lviv - Ivano-Frankivsk chains');
    const railChain = chains.find((c) => c.legs.some((l) => l.mode === 'RAIL'));
    assert.ok(railChain, 'Should contain rail leg');
    assert.ok(railChain.totalPriceMinor && railChain.totalPriceMinor >= 15000, 'Should include 150 ₴ regional express ticket');
  });
});
