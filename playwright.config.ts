import { defineConfig, devices } from '@playwright/test';

const databaseUrl = process.env.E2E_DATABASE_URL ?? 'postgres://marshgo:local_only_change_me@127.0.0.1:5434/marshgo_e2e';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [['list']],
  use: {
    ...devices['iPhone 16'],
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:3300',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node tests/fixtures/geocoder-stub.mjs',
      url: 'http://127.0.0.1:3304/health',
      reuseExistingServer: false,
      timeout: 10_000,
      env: { GEOCODER_STUB_PORT: '3304' },
    },
    {
      command: 'npm run api',
      url: 'http://127.0.0.1:3302/healthz',
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        NODE_ENV: 'development',
        DATABASE_URL: databaseUrl,
        API_HOST: '127.0.0.1',
        API_PORT: '3302',
        AUTH_DEV_OTP: 'true',
        GEOCODING_ENGINE_URL: 'http://127.0.0.1:3304/search',
        CORS_ORIGINS: 'http://127.0.0.1:3300',
      },
    },
    {
      command: 'node tests/fixtures/e2e-web-server.mjs',
      url: 'http://127.0.0.1:3300',
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
