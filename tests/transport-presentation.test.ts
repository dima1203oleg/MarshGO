import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { presentJourneyLeg } from '../src/features/search/model/transportPresentation';

describe('journey leg transport presentation', () => {
  it('uses concrete provider types to distinguish bus, minibus, and rail subtypes', () => {
    assert.deepEqual(presentJourneyLeg('BUS', 'marshrutka'), { type: 'minibus', label: 'Маршрутка' });
    assert.deepEqual(presentJourneyLeg('RAIL', 'suburban_train'), { type: 'suburban_train', label: 'Електричка' });
    assert.deepEqual(presentJourneyLeg('BUS', 'intercity_bus'), { type: 'bus', label: 'Міжміський автобус' });
  });

  it('maps every journey leg mode returned by the server without collapsing supported categories', () => {
    const serverModes = [
      'WALK', 'COMMUNITY', 'COMMUNITY_DEMAND', 'TAXI', 'TRANSFER', 'BUS', 'MINIBUS',
      'RAIL', 'TRAM', 'TROLLEYBUS', 'METRO', 'URBAN_BUS', 'CARSHARING', 'FERRY',
      'FUNICULAR', 'BIKE', 'SCOOTER',
    ];
    for (const mode of serverModes) {
      assert.notEqual(presentJourneyLeg(mode).label, 'Транспорт', `${mode} should have a useful label`);
      assert.notEqual(presentJourneyLeg(mode).type, undefined, `${mode} should map to a filter category`);
    }
  });

  it('falls back to the broad mode for missing or future provider types', () => {
    assert.deepEqual(presentJourneyLeg('TRAM'), { type: 'tram', label: 'Трамвай' });
    assert.deepEqual(presentJourneyLeg('HYPERLOOP', 'future_mode'), { type: 'other', label: 'HYPERLOOP' });
  });
});
