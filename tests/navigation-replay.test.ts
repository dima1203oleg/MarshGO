import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseReplayJsonl, runReplay } from '../tools/navigation-replay/replay';

for (const name of ['clean-route', 'location-jump', 'offline-section', 'weak-gps']) {
  test(`navigation replay golden: ${name}`, async () => {
    const base = resolve('tools/navigation-replay');
    const [fixture, expected] = await Promise.all([
      readFile(resolve(base, `fixtures/${name}.jsonl`), 'utf8'),
      readFile(resolve(base, `golden/${name}.json`), 'utf8'),
    ]);
    assert.deepEqual(await runReplay(parseReplayJsonl(fixture)), JSON.parse(expected));
  });
}
