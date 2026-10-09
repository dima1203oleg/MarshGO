import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { passengersLabel, seatsLabel, seatsWord } from '../src/domain/plural';
import { mapModes, styleUrlForMode } from '../src/map/mapMode';

describe('passenger plural forms', () => {
  it('uses the correct Ukrainian form', () => {
    const cases: Array<[number, string]> = [[1, '1 пасажир'], [2, '2 пасажири'], [4, '4 пасажири'], [5, '5 пасажирів'], [11, '11 пасажирів'], [12, '12 пасажирів'], [21, '21 пасажир'], [22, '22 пасажири'], [111, '111 пасажирів']];
    for (const [count, expected] of cases) assert.equal(passengersLabel(count), expected);
  });
  it('uses the correct Ukrainian form for seats', () => {
    const cases: Array<[number, string]> = [[1, '1 місце'], [2, '2 місця'], [4, '4 місця'], [5, '5 місць'], [11, '11 місць'], [12, '12 місць'], [21, '21 місце'], [22, '22 місця'], [114, '114 місць']];
    for (const [count, expected] of cases) assert.equal(seatsLabel(count), expected);
    assert.equal(seatsWord(1), 'місце');
    assert.equal(seatsWord(3), 'місця');
    assert.equal(seatsWord(8), 'місць');
  });
});

describe('map modes', () => {
  it('swaps only OpenFreeMap vector styles', () => {
    assert.equal(styleUrlForMode('apple', 'https://tiles.openfreemap.org/styles/bright'), 'https://tiles.openfreemap.org/styles/liberty');
    assert.equal(styleUrlForMode('waze', 'https://tiles.openfreemap.org/styles/liberty'), 'https://tiles.openfreemap.org/styles/positron');
    assert.equal(styleUrlForMode('google', 'https://maps.example/style.json'), null);
    assert.equal(styleUrlForMode('google', undefined), null);
  });
  it('defines three distinct route colours', () => {
    assert.equal(new Set(Object.values(mapModes).map((mode) => mode.route)).size, 3);
  });
});
