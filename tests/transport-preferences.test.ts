import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  transportTypes,
  activeTypesForSearch,
  choiceFor,
  defaultSelection,
  effectiveProviders,
  hasJourneySearchProvider,
  isAllActive,
  providersForJourneySearch,
  selectAll,
  toggleProvider,
  toggleType,
  toJourneyPreferences,
} from '../src/domain/transportPreferences';

const groups = [
  { transportType: 'carpool', providers: [{ id: 'carpool:MARSHGO', name: 'MARSHGO Community', available: true, cities: [], sources: ['marshgo'], services: ['carpool'] }] },
  { transportType: 'taxi', providers: [{ id: 'taxi:Uklon', name: 'Uklon', available: true, cities: [], sources: ['taxi'], services: ['taxi'] }, { id: 'taxi:Bolt', name: 'Bolt', available: true, cities: [], sources: ['taxi'], services: ['taxi'] }] },
  { transportType: 'scooter', providers: [{ id: 'scooter:Bolt', name: 'Bolt', available: true, cities: [], sources: ['gbfs'], services: ['scooter'] }] },
  { transportType: 'bike', providers: [{ id: 'bike:3electra', name: '3electra', available: true, cities: ['Львів'], sources: ['gbfs'], services: ['bike'] }] },
  { transportType: 'bus', providers: [{ id: 'bus:Львівавтодор', name: 'Львівавтодор', available: true, cities: ['Львів'], sources: ['gtfs'], services: ['bus', 'tram'] }] },
  { transportType: 'tram', providers: [{ id: 'tram:Львівавтодор', name: 'Львівавтодор', available: true, cities: ['Львів'], sources: ['gtfs'], services: ['tram'] }] },
  { transportType: 'train', providers: [{ id: 'train:Укрзалізниця', name: 'Укрзалізниця', available: true, cities: ['Україна'], sources: ['gtfs'], services: ['train'] }] },
  { transportType: 'city_train', providers: [{ id: 'city_train:Львівавтодор', name: 'Львівавтодор', available: true, cities: ['Львів'], sources: ['gtfs'], services: ['city_train'] }] },
  { transportType: 'funicular', providers: [{ id: 'funicular:Фунікулер', name: 'Фунікулер', available: true, cities: ['Київ'], sources: ['gtfs'], services: ['funicular'] }] },
  { transportType: 'ferry', providers: [{ id: 'ferry:Пором', name: 'Пором', available: true, cities: ['Україна'], sources: ['gtfs'], services: ['ferry'] }] },
];

describe('transport types and providers', () => {
  it('exposes exactly 12 canonical transport tiles in the approved order', () => {
    assert.deepEqual(transportTypes.map((type) => type.id), [
      'bus', 'marshrutka', 'trolleybus', 'tram', 'metro', 'carpool',
      'taxi', 'train', 'bike', 'scooter', 'carsharing', 'transfer',
    ]);
  });

  it('selects every currently routeable category through “Усі”', () => {
    assert.deepEqual(activeTypesForSearch(defaultSelection), [
      'bus', 'marshrutka', 'trolleybus', 'tram', 'metro', 'carpool', 'train',
    ]);
    assert.equal(isAllActive(defaultSelection), true);
    assert.equal(isAllActive(selectAll({ ...defaultSelection, active: ['bus'] })), true);
    assert.equal(isAllActive(toggleType(defaultSelection, 'bus')), false);
  });

  it('keeps unsupported canonical categories visible but prevents selecting or routing them', () => {
    const unsupported = ['taxi', 'bike', 'scooter', 'carsharing', 'transfer'] as const;
    for (const type of unsupported) {
      assert.deepEqual(toggleType(defaultSelection, type), defaultSelection);
      assert.equal(hasJourneySearchProvider(type, groups), false);
      assert.deepEqual(providersForJourneySearch(type, groups), []);
    }
    assert.deepEqual(effectiveProviders(defaultSelection, 'taxi', groups), []);
    const taxiPreferences = toJourneyPreferences({ ...defaultSelection, active: ['taxi'] }, groups);
    assert.equal(taxiPreferences.allowTaxi, false);
    assert.deepEqual(taxiPreferences.allowedTransportTypes, []);
  });

  it('keeps an empty selection empty instead of silently searching all categories', () => {
    let selection = defaultSelection;
    for (const type of defaultSelection.active) selection = toggleType(selection, type);
    assert.deepEqual(selection.active, []);
    assert.deepEqual(activeTypesForSearch(selection), []);
    assert.deepEqual(toJourneyPreferences(selection, groups).allowedTransportTypes, []);
  });

  it('filters providers by real route adapter and remembers provider choices by category', () => {
    assert.equal(hasJourneySearchProvider('carpool', groups), true);
    assert.equal(hasJourneySearchProvider('bus', groups), true);
    assert.equal(hasJourneySearchProvider('tram', groups), true);
    assert.equal(hasJourneySearchProvider('train', groups), true);
    assert.equal(hasJourneySearchProvider('bike', groups), false); // GBFS vehicles do not build itineraries.
    assert.deepEqual(providersForJourneySearch('bus', groups).map((provider) => provider.id), ['bus:Львівавтодор']);
    assert.deepEqual(providersForJourneySearch('train', groups).map((provider) => provider.id), ['train:Укрзалізниця', 'city_train:Львівавтодор']);

    let selection = toggleProvider(defaultSelection, 'bus', 'bus:Львівавтодор');
    assert.deepEqual(effectiveProviders(selection, 'bus', groups), ['bus:Львівавтодор']);
    selection = toggleType(selection, 'bus');
    selection = toggleType(selection, 'bus');
    assert.deepEqual(choiceFor(selection, 'bus'), { all: false, ids: ['bus:Львівавтодор'] });
  });

  it('maps multi-select categories while keeping walking an automatic planner leg', () => {
    const preferences = toJourneyPreferences({ ...defaultSelection, active: ['bus', 'tram', 'train', 'carpool'] }, groups);
    assert.equal(preferences.allowCommunity, true);
    assert.equal(preferences.allowPublicTransport, true);
    assert.equal(preferences.allowBus, true);
    assert.equal(preferences.allowRail, true);
    assert.equal('allowWalk' in preferences, false);
    assert.deepEqual(preferences.allowedTransportTypes, [
      'bus', 'intercity_bus', 'tram', 'carpool', 'train', 'suburban_train', 'city_train',
    ]);
    assert.deepEqual(preferences.allowedTransitProvidersByType, {
      bus: ['Львівавтодор'], tram: ['Львівавтодор'], train: ['Укрзалізниця'], city_train: ['Львівавтодор'],
    });
  });

  it('does not relabel a funicular provider as a train provider', () => {
    assert.deepEqual(providersForJourneySearch('train', groups).map((provider) => provider.id), ['train:Укрзалізниця', 'city_train:Львівавтодор']);
    const modes = toJourneyPreferences({ ...defaultSelection, active: ['train'] }, groups).allowedTransportTypes;
    assert.ok(Array.isArray(modes));
    assert.equal(modes.includes('funicular'), false);
  });
});
