import { spawnSync } from 'node:child_process';

// E2E serves the web bundle from dist. Never reuse the simulator build, which embeds
// an HTTP localhost API origin that is cross-origin and unavailable to browser runs.
const env = { ...process.env };
delete env.CAPACITOR_BUILD;
delete env.VITE_API_BASE_URL;
// The tile provider used by Playwright is an isolated local fixture. Keep it in
// the test build only; production/site/native release builds use provider config.
env.VITE_MAP_TILE_URL = 'http://127.0.0.1:3306/tiles/{z}/{x}/{y}.png';
env.VITE_MAP_TILE_ATTRIBUTION = 'MARSHGO isolated E2E map fixture';

const result = spawnSync('npm', ['run', 'build'], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
