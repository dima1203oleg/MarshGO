import test from 'node:test';
import assert from 'node:assert/strict';
import { pathForProductionTab, productionTabForPath } from '../src/routing/productionRoutes';

test('production tab routes are refresh-safe and normalize trailing slashes', () => {
  const tabs = ['home', 'search', 'trips', 'chat', 'profile', 'demand', 'requests', 'my-demands', 'offer-new', 'admin', 'navigation'] as const;
  for (const tab of tabs) {
    assert.equal(productionTabForPath(pathForProductionTab(tab)), tab);
    assert.equal(productionTabForPath(`${pathForProductionTab(tab)}/`), tab);
  }
  assert.equal(productionTabForPath('/unknown'), null);
});
