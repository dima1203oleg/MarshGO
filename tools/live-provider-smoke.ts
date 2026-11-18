import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { suggestPlaces } from '../server/geocoding';
import { reverseGeocode } from '../server/geocoding';
import { fetchOsrmRoute } from '../server/routing/providers/osrmTransport';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const maplibreDirectory = path.join(root, 'node_modules/maplibre-gl/dist');
const libFiles = new Set(['maplibre-gl.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl.css']);
const server = createServer(async (request, response) => {
  const file = new URL(request.url ?? '/', 'http://127.0.0.1').pathname.slice(1);
  if (!libFiles.has(file)) { response.writeHead(404).end('not found'); return; }
  try {
    const bytes = await readFile(path.join(maplibreDirectory, file));
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.writeHead(200).end(bytes);
  } catch { response.writeHead(500).end('asset unavailable'); }
});

async function main() {
  // A deliberately small manual acceptance sample. Nominatim requests are
  // explicit, spaced apart, country-filtered and are not autocomplete traffic.
  process.env.GEOCODING_ENGINE_URL = 'https://nominatim.openstreetmap.org/search';
  const lviv = await suggestPlaces('Львів, Україна');
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const stryi = await suggestPlaces('Стрий, Львівська область, Україна');
  await new Promise((resolve) => setTimeout(resolve, 1200));
  process.env.GEOCODING_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
  const reversed = await reverseGeocode(Number(lviv[0]?.latitude), Number(lviv[0]?.longitude));
  assert.ok(lviv.some((place) => /Львів/.test(place.label)), 'live Ukrainian geocoder should resolve Lviv');
  assert.ok(stryi.some((place) => /Стрий/.test(place.label)), 'live Ukrainian geocoder should resolve Stryi');
  assert.match(reversed.label, /Львів/, 'live reverse geocoder should resolve the selected Lviv coordinates');
  const origin = lviv[0]; const destination = stryi[0];
  const route = await fetchOsrmRoute([[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]], 'https://router.project-osrm.org/route/v1/driving/');
  assert.ok(route.distanceMeters > 10_000 && route.geometry.length > 20 && (route.maneuvers?.length ?? 0) > 5, 'live road route should have substantial road geometry and maneuvers');

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const tileRequests: string[] = [];
    const failures: string[] = [];
    page.on('request', (request) => {
      try {
        if (new URL(request.url()).hostname === 'tiles.openfreemap.org') tileRequests.push(request.url());
      } catch { /* Ignore non-URL browser requests in the provider counter. */ }
    });
    page.on('requestfailed', (request) => failures.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));
    page.on('pageerror', (error) => failures.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await page.addStyleTag({ url: `http://127.0.0.1:${address.port}/maplibre-gl.css` });
    await page.evaluate(async ({ serverOrigin, origin, destination, route }) => {
      const lib = await import(`${serverOrigin}/maplibre-gl.mjs`);
      lib.setWorkerUrl(`${serverOrigin}/maplibre-gl-worker.mjs`);
      const container = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'map' }));
      Object.assign(container.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh' });
      const map = new lib.Map({
        container,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [origin.longitude, origin.latitude], zoom: 10,
      });
      map.on('load', () => {
        map.addSource('marshgo-smoke-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.geometry } } });
        map.addLayer({ id: 'marshgo-smoke-route', type: 'line', source: 'marshgo-smoke-route', paint: { 'line-color': '#0969da', 'line-width': 6 } });
        map.addSource('marshgo-smoke-stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [origin, destination].map((place) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] } })) } });
        map.addLayer({ id: 'marshgo-smoke-stops', type: 'circle', source: 'marshgo-smoke-stops', paint: { 'circle-color': '#e11d48', 'circle-radius': 7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
        const longitudes = route.geometry.map(([longitude]) => longitude);
        const latitudes = route.geometry.map(([, latitude]) => latitude);
        map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 70, duration: 0 });
        document.body.dataset.mapReady = 'true';
        document.body.dataset.routePoints = String(route.geometry.length);
      });
      map.on('error', (event: { error?: { message?: string } }) => { document.body.dataset.mapError = event.error?.message ?? 'map error'; });
    }, { serverOrigin: `http://127.0.0.1:${address.port}`, origin: { longitude: origin.longitude, latitude: origin.latitude }, destination: { longitude: destination.longitude, latitude: destination.latitude }, route });
    await page.waitForFunction(() => document.body.dataset.mapReady === 'true', undefined, { timeout: 30_000 });
    await page.waitForFunction(() => document.querySelectorAll('.maplibregl-canvas').length === 1, undefined, { timeout: 10_000 });
    await page.waitForTimeout(8_000);
    const mapState = await page.evaluate(() => ({ canvas: document.querySelectorAll('.maplibregl-canvas').length, mapError: document.body.dataset.mapError ?? null, routePoints: Number(document.body.dataset.routePoints), routeLayer: document.querySelector('.maplibregl-canvas') !== null }));
    assert.equal(mapState.canvas, 1, 'MapLibre canvas should render');
    assert.equal(mapState.mapError, null, 'MapLibre should not report a style/worker/render error');
    assert.ok(tileRequests.length > 0, 'live style should request actual provider assets');
    assert.ok(route.geometry.length > 20);
    await page.screenshot({ path: '/tmp/marshgo-live-map-route.png', fullPage: true });
    assert.equal(failures.length, 0, `browser should have no network/JS failures: ${failures.join('; ')}`);
    console.log(JSON.stringify({
      geocoding: { lviv: lviv.length, stryi: stryi.length, reverseLabel: reversed.label, selected: [origin.label, destination.label] },
      routing: { provider: 'OSRM public demo (one-time low-volume acceptance)', distanceMeters: Math.round(route.distanceMeters), durationSeconds: Math.round(route.durationSeconds), geometryPoints: route.geometry.length, maneuvers: route.maneuvers?.length ?? 0 },
      map: { provider: 'OpenFreeMap public liberty vector style (one-time acceptance)', ...mapState, providerAssetRequests: tileRequests.length, screenshot: '/tmp/marshgo-live-map-route.png' },
      limitations: 'External public services have no production SLA and do not constitute a hosted MARSHGO asset manifest or production deployment.',
    }, null, 2));
  } finally { await browser.close(); }
}

try { await main(); }
finally { server.close(); }
