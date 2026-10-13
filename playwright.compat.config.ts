import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: './e2e',
  testMatch: /(?:browser-compat|journey-route-map)\.spec\.ts/,
  reporter: [['list']],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    // Playwright's Firefox build does not emulate iPhone touch input reliably;
    // keep its phone-sized viewport but exercise the standards-based mouse pointer.
    { name: 'firefox', use: { browserName: 'firefox', hasTouch: false } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
