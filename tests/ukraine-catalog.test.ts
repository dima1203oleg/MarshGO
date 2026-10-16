import assert from 'node:assert/strict';
import test from 'node:test';
import { ukraineCatalog } from '../server/mobility/ukraineCatalog';

test('does not register the incorrectly located 3electra GBFS feed as Kyiv supply', () => {
  assert.equal(ukraineCatalog.some((entry) => entry.name.toLocaleLowerCase('uk-UA').includes('3electra')), false);
});
