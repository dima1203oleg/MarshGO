// CP11: does the canonical PWA actually paint the routed walking geometry?
// Real user flow against the live CP10 API (:3310, bbox walking config) through the Site dev server proxy.
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3000';
const password = process.env.MARSHGO_CP11_TEST_PASSWORD;
if (!password) throw new Error('Missing required environment variable: MARSHGO_CP11_TEST_PASSWORD');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'marshgo-cp11-'));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const rand = (n) => Array.from({ length: n }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[(Math.random() * 31) | 0]).join('');
const email = `cp11.ui.${rand(6)}@marshgo.ua`;

const browser = await chromium.launch();
const page = await browser.newPage({ ...devices['iPhone 16'], locale: 'uk-UA', timezoneId: 'Europe/Kyiv' });
page.setDefaultTimeout(45_000);

const pickSuggestion = async (labelPart) => {
  const option = page.getByRole('option').filter({ hasText: labelPart }).first();
  await option.waitFor({ timeout: 25_000 });
  const text = (await option.textContent()) ?? '';
  await option.click();
  return text.trim().slice(0, 90);
};

try {
  const visibleButtons = async () => (await page.locator('button:visible').allTextContents()).map((t) => t.trim()).filter(Boolean);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.locator('button:visible').first().waitFor();
  log(`splash buttons: ${JSON.stringify(await visibleButtons())}`);
  const welcome = page.locator('button:has-text("У мене вже є акаунт")');
  if (await welcome.count()) await welcome.first().click();
  else await page.locator('button:has-text("Почати")').first().click();
  await page.waitForTimeout(700);
  log(`auth-screen buttons: ${JSON.stringify(await visibleButtons())}`);
  const registerEntry = page.locator('button:has-text("Реєстрація"), button:has-text("Створити акаунт"), button:has-text("Зареєструватися")').first();
  await registerEntry.waitFor({ timeout: 20_000 });
  await registerEntry.click();
  await page.locator('input[autocomplete="name"], input[placeholder*="ім’я"], input[placeholder*="імя"]').first().fill('CP11 UI Proof');
  await page.locator('input[autocomplete="email"], input[type="email"]').first().fill(email);
  await page.locator('input[autocomplete="new-password"], input[placeholder*="Пароль"]').first().fill(password);
  const regResponse = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/v1/auth/register');
  await Promise.all([regResponse, page.locator('button:has-text("Зареєструватися")').click()]);
  const reg = await regResponse;
  log(`register status=${reg.status()}`);
  await page.locator('.production-app').waitFor();
  log('signed in through the UI');

  // Real origin/destination: typed, geocoded by the live geocoder, picked from suggestions.
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  log('opened the Пошук tab from the bottom navigation');
  const originInput = page.getByPlaceholder(/Місто відправлення|Моє місцеперебування/);
  await originInput.click();
  await originInput.fill('Львівська політехніка');
  await originInput.press('Enter');
  const pickedOrigin = await pickSuggestion('Львів');
  const destInput = page.getByPlaceholder(/Місто призначення|Введіть адресу, місто або зупинку/);
  await destInput.click();
  await destInput.fill('Залізничний вокзал Львів');
  await destInput.press('Enter');
  const pickedDest = await pickSuggestion('Львів');
  log(`geocoder picked origin="${pickedOrigin}"`);
  log(`geocoder picked destination="${pickedDest}"`);

  const searchResponse = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/v1/journeys/search', { timeout: 90_000 });
  await page.getByRole('button', { name: 'Знайти маршрут', exact: true }).click();
  const search = await searchResponse;
  const payload = (await search.json())?.data ?? {};
  const journeys = payload.journeys ?? [];
  const walkLegs = journeys.flatMap((j) => (j.legs ?? []).filter((l) => l.mode === 'WALK')
    .map((l) => ({ journey: journeys.indexOf(j), source: l.source, meters: l.distanceMeters,
      seconds: l.durationSeconds, liveStatus: l.liveStatus, priceStatus: l.priceStatus, priceMinor: l.priceMinor,
      geometryPoints: Array.isArray(l.routeGeometry) ? l.routeGeometry.length : 0 })));
  fs.writeFileSync(`${OUT}/search.json`, JSON.stringify(payload, null, 1));
  log(`search http=${search.status()} journeys=${journeys.length} partialReasons=${JSON.stringify(payload.partialReasons ?? [])}`);
  log(`candidateCount=${payload.candidateCount} walkingMeters(top)=${journeys[0]?.walkingMeters}`);
  walkLegs.forEach((w) => log(`  WALK j${w.journey} src=${w.source} ${w.meters}m/${w.seconds}s live=${w.liveStatus} price=${w.priceStatus}/${w.priceMinor} geometryPts=${w.geometryPoints}`));

  await page.getByTestId('journey-result-card').first().waitFor();
  await page.locator('[aria-label^="Відкрити маршрут:"]').first().click();
  const routeMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await routeMap.waitFor();
  const map = page.locator('[data-marshgo-map-renderer="maplibre"]');
  await map.waitFor();
  const readMap = async () => map.evaluate((el) => ({
    pointCount: el.dataset.marshgoRoutePointCount ?? null,
    segmentCount: el.dataset.marshgoRouteSegmentCount ?? null,
    mapIdle: el.dataset.marshgoMapIdle ?? null,
    mapReady: el.dataset.marshgoMapReady ?? null,
    camera: el.dataset.marshgoCameraCenter ?? null,
    zoom: el.dataset.marshgoCameraZoom ?? null,
  }));
  await page.waitForFunction(() => document.querySelector('[data-marshgo-map-renderer="maplibre"]')?.dataset.marshgoMapIdle === 'true', null, { timeout: 45_000 }).catch(() => log('map never reported idle'));
  const lightState = await readMap();
  const statusTexts = await routeMap.getByRole('status').allTextContents();
  fs.writeFileSync(`${OUT}/ui-light.json`, JSON.stringify({ lightState, statusTexts }, null, 1));
  await page.screenshot({ path: `${OUT}/route-light.png` });
  log(`UI light: routePointCount=${lightState.pointCount} routeSegmentCount=${lightState.segmentCount} idle=${lightState.mapIdle} camera=${lightState.camera}@${lightState.zoom}`);
  log(`UI light status texts: ${JSON.stringify(statusTexts)}`);

  await page.evaluate(() => localStorage.setItem('mg_theme', 'dark'));
  // The route screen is not URL-addressable after a reload, so re-drive the search through the
  // planner deep link with the same real endpoints and read the map again in dark.
  const endpoint = (which) => {
    const leg = journeys[0].legs[which === 'origin' ? 0 : journeys[0].legs.length - 1];
    const point = which === 'origin' ? leg.origin : leg.destination;
    return { label: encodeURIComponent(point.name), lat: point.coordinates[1], lon: point.coordinates[0] };
  };
  const from = endpoint('origin'); const to = endpoint('destination');
  await page.goto(`${BASE}/journeys/search?mode=planner&origin=${from.label}&originLat=${from.lat}&originLon=${from.lon}`
    + `&originProvider=cp11&destination=${to.label}&destinationLat=${to.lat}&destinationLon=${to.lon}&destinationProvider=cp11`
    + '&date=2026-11-04&passengers=1&departure=2026-11-04T08:00&strategy=BALANCED', { waitUntil: 'domcontentloaded' });
  log(`dark pass: html.dark=${await page.evaluate(() => document.documentElement.classList.contains('dark'))} after deep-link navigation`);
  const findAgain = page.getByRole('button', { name: 'Знайти маршрут', exact: true }).first();
  await findAgain.waitFor({ timeout: 30_000 });
  const darkSearch = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/v1/journeys/search', { timeout: 90_000 });
  await Promise.all([darkSearch, findAgain.click()]);
  const darkSearchResponse = await darkSearch;
  const darkPayload = (await darkSearchResponse.json())?.data ?? {};
  const darkWalks = (darkPayload.journeys ?? []).flatMap((j) => (j.legs ?? []).filter((l) => l.mode === 'WALK')
    .map((l) => `${l.source}:${Array.isArray(l.routeGeometry) ? l.routeGeometry.length : 0}pts`));
  log(`dark pass: journeys=${(darkPayload.journeys ?? []).length} walkLegs=[${darkWalks.join(', ')}]`);
  await page.locator('[aria-label^="Відкрити маршрут:"]').first().waitFor();
  await page.locator('[aria-label^="Відкрити маршрут:"]').first().click();
  const darkRouteMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await darkRouteMap.waitFor();
  await map.waitFor();
  await page.waitForFunction(() => document.querySelector('[data-marshgo-map-renderer="maplibre"]')?.dataset.marshgoMapIdle === 'true', null, { timeout: 45_000 }).catch(() => log('map never reported idle in dark'));
  const darkState = await readMap();
  const darkStatusTexts = await darkRouteMap.getByRole('status').allTextContents();
  await page.screenshot({ path: `${OUT}/route-dark.png` });
  fs.writeFileSync(`${OUT}/ui-dark.json`, JSON.stringify({ darkState, darkStatusTexts, darkWalks }, null, 1));
  log(`UI dark: routePointCount=${darkState.pointCount} routeSegmentCount=${darkState.segmentCount} camera=${darkState.camera}@${darkState.zoom}`);
  log(`UI dark status texts: ${JSON.stringify(darkStatusTexts)}`);
  log('EVIDENCE_DIR ' + OUT);
  await browser.close();
} catch (error) {
  await page.screenshot({ path: `${OUT}/failure.png` }).catch(() => {});
  log('FAILED ' + (error?.stack ?? error));
  await browser.close();
  process.exit(1);
}
