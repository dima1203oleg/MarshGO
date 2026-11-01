import assert from 'node:assert/strict';
import test from 'node:test';

const apiUrl = process.env.API_TEST_URL;
const secondaryApiUrl = process.env.API_TEST_SECONDARY_URL;

test('API instances share the Redis rate-limit window', { skip: !apiUrl || !secondaryApiUrl }, async () => {
  const urls = [apiUrl!, secondaryApiUrl!];
  const statuses: number[] = [];
  for (let index = 0; index < 5; index += 1) {
    const response = await fetch(`${urls[index % urls.length]}/api/v1/offers`);
    statuses.push(response.status);
    if (index < 3) assert.equal(response.status, 400, `request ${index + 1} should reach offer validation under the shared limit`);
    else {
      assert.equal(response.status, 429, `request ${index + 1} should be blocked across API instances`);
      assert.equal((await response.json() as { error?: { code?: string } }).error?.code, 'rate_limit_exceeded');
    }
  }
  assert.deepEqual(statuses, [400, 400, 400, 429, 429]);
});
