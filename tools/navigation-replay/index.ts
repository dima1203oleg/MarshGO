import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseReplayJsonl, runReplay } from './replay';

const file = process.argv[2];
if (file) {
  const summary = await runReplay(parseReplayJsonl(await readFile(resolve(file), 'utf8')));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  const root = resolve('tools/navigation-replay');
  const fixtures = (await readdir(resolve(root, 'fixtures'))).filter((name) => name.endsWith('.jsonl')).sort();
  for (const fixture of fixtures) {
    const name = basename(fixture, '.jsonl');
    const [input, expected] = await Promise.all([
      readFile(resolve(root, 'fixtures', fixture), 'utf8'),
      readFile(resolve(root, 'golden', `${name}.json`), 'utf8'),
    ]);
    const summary = await runReplay(parseReplayJsonl(input));
    assert.deepEqual(summary, JSON.parse(expected), `GPS replay golden mismatch: ${name}`);
    process.stdout.write(`PASS ${name}: ${summary.acceptedFixes}/${summary.totalFixes} fixes accepted\n`);
  }
  process.stdout.write(`Passed ${fixtures.length} navigation replay goldens.\n`);
}
