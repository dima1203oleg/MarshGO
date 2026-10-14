import { expect, test, type Locator, type Page } from '@playwright/test';
import { encodePolyline6 } from '../shared/navigation/geometry';

async function expectCanonicalScreenshot(
  page: Page,
  name: string,
  options: { animations: 'disabled'; maxDiffPixels?: number } = { animations: 'disabled' },
) {
  // Pixel baselines are recorded on macOS; Linux CI still runs the behavioral
  // and geometry assertions below without comparing platform-specific fonts.
  if (process.platform !== 'darwin' || test.info().project.name) return;
  await expect(page).toHaveScreenshot(name, options);
}

async function expectMapWebGlContextHealthy(map: Locator) {
  await expect.poll(async () => map.locator('canvas.maplibregl-canvas').first().evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement;
    const context = element.getContext('webgl2') ?? element.getContext('webgl');
    return context !== null && !context.isContextLost();
  }), {
    message: 'MapLibre should retain or restore a usable WebGL context',
    timeout: 5_000,
    intervals: [100, 200, 400],
  }).toBe(true);
}

async function routeSheetGeometry(routeMap: Locator) {
  return routeMap.getByTestId('route-bottom-sheet').evaluate((sheet) => {
    const bounds = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height].map(value => Math.round(value * 10) / 10);
    };
    return {
      sheet: bounds(sheet),
      summary: bounds(sheet.querySelector('.route-sheet-summary')),
      list: bounds(sheet.querySelector('[data-testid="route-segment-list"]')),
      firstSegment: bounds(sheet.querySelector('[data-testid="journey-route-segment"]')),
    };
  });
}

async function waitForSheetSnap(sheet: Locator) {
  await expect.poll(() => sheet.evaluate(element => {
    const targetHeight = Number.parseFloat((element as HTMLElement).style.height);
    return Math.abs(element.getBoundingClientRect().height - targetHeight);
  }), {
    message: 'route sheet should finish moving to its requested snap point',
    timeout: 5_000,
    intervals: [50, 100, 200],
  }).toBeLessThan(1.5);
}

async function waitForCameraSettled(map: Locator, previousRequestId?: string | null) {
  let lastRequestId = '';
  let stableReads = 0;
  await expect.poll(async () => {
    const [requested, settled, moving] = await Promise.all([
      map.getAttribute('data-marshgo-camera-request-id'),
      map.getAttribute('data-marshgo-camera-settled-id'),
      map.getAttribute('data-marshgo-camera-moving'),
    ]);
    if (!requested || Number(requested) < 1 || requested !== settled || moving !== 'false'
      || (previousRequestId !== undefined && requested === previousRequestId)) {
      lastRequestId = requested ?? '';
      stableReads = 0;
      return false;
    }
    stableReads = requested === lastRequestId ? stableReads + 1 : 1;
    lastRequestId = requested;
    return stableReads >= 2;
  }, {
    message: 'map camera should finish the latest route-fit animation',
    timeout: 5_000,
    intervals: [100, 150, 200],
  }).toBe(true);
}

async function journeyResultsGeometry(results: Locator) {
  return results.evaluate((root) => {
    const bounds = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height].map(value => Math.round(value * 10) / 10);
    };
    return {
      header: bounds(root.querySelector('.journey-results-header')),
      strategies: bounds(root.querySelector('[aria-label="Режим пошуку маршрутів"]')),
      firstCard: bounds(root.querySelector('[data-testid="journey-result-card"]')),
      firstCardRibbon: bounds(root.querySelector('[data-testid="journey-result-card"] .journey-segment-ribbon')),
      firstCardTiles: Array.from(root.querySelectorAll('[data-testid="journey-result-card"] .journey-segment-tile')).map(bounds),
    };
  });
}

async function expectRouteCenteredInVisibleMap(map: Locator, sheet: Locator, route: Array<[number, number]>) {
  const [mapBounds, sheetBounds, camera] = await Promise.all([
    map.boundingBox(),
    sheet.boundingBox(),
    map.evaluate(element => ({
      center: element.getAttribute('data-marshgo-camera-center')?.split(',').map(Number),
      zoom: Number(element.getAttribute('data-marshgo-camera-zoom')),
      bearing: Number(element.getAttribute('data-marshgo-camera-bearing') ?? 0),
    })),
  ]);
  expect(mapBounds, 'map bounds should be available after route focus').not.toBeNull();
  expect(sheetBounds, 'route sheet bounds should be available after route focus').not.toBeNull();
  expect(camera.center, 'map camera center should be available after route focus').toHaveLength(2);
  expect(camera.center!.every(Number.isFinite), 'map camera center should be numeric').toBe(true);
  expect(Number.isFinite(camera.zoom), 'map camera zoom should be numeric').toBe(true);
  const mercator = ([longitude, latitude]: [number, number]): [number, number] => {
    const clampedLatitude = Math.max(-85.051129, Math.min(85.051129, latitude));
    const radians = clampedLatitude * Math.PI / 180;
    return [(longitude + 180) / 360, (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2];
  };
  const [centerX, centerY] = mercator(camera.center as [number, number]);
  const worldSize = 512 * 2 ** camera.zoom;
  const rotation = camera.bearing * Math.PI / 180;
  const points = route.map((coordinate) => {
    const [worldX, worldY] = mercator(coordinate);
    let deltaX = worldX - centerX;
    if (deltaX > 0.5) deltaX -= 1;
    if (deltaX < -0.5) deltaX += 1;
    const dx = deltaX * worldSize;
    const dy = (worldY - centerY) * worldSize;
    return [
      mapBounds!.x + mapBounds!.width / 2 + dx * Math.cos(rotation) + dy * Math.sin(rotation),
      mapBounds!.y + mapBounds!.height / 2 - dx * Math.sin(rotation) + dy * Math.cos(rotation),
    ] as const;
  });
  const visible = {
    left: mapBounds!.x + 12,
    right: mapBounds!.x + mapBounds!.width - 12,
    top: mapBounds!.y + 64,
    bottom: Math.min(mapBounds!.y + mapBounds!.height - 12, sheetBounds!.y - 12),
  };
  const routeBounds = {
    left: Math.min(...points.map(([x]) => x)),
    right: Math.max(...points.map(([x]) => x)),
    top: Math.min(...points.map(([, y]) => y)),
    bottom: Math.max(...points.map(([, y]) => y)),
  };
  for (const [x, y] of points) {
    expect(x, 'selected route point should remain visible horizontally').toBeGreaterThanOrEqual(visible.left - 20);
    expect(x, 'selected route point should remain visible horizontally').toBeLessThanOrEqual(visible.right + 20);
    expect(y, 'selected route point should remain above the route sheet').toBeGreaterThanOrEqual(visible.top - 20);
    expect(y, 'selected route point should remain above the route sheet').toBeLessThanOrEqual(visible.bottom + 20);
  }
  const routeCenterX = (routeBounds.left + routeBounds.right) / 2;
  const routeCenterY = (routeBounds.top + routeBounds.bottom) / 2;
  const visibleCenterX = (visible.left + visible.right) / 2;
  const visibleCenterY = (visible.top + visible.bottom) / 2;
  expect(Math.hypot(routeCenterX - visibleCenterX, routeCenterY - visibleCenterY), 'selected route should be centered in the unobstructed map viewport')
    .toBeLessThan(Math.min(visible.right - visible.left, visible.bottom - visible.top) * 0.24);
}

async function expectRouteHorizontal(map: Locator, route: Array<[number, number]>) {
  const bearing = Number(await map.getAttribute('data-marshgo-camera-bearing')) * Math.PI / 180;
  const mercator = ([longitude, latitude]: [number, number]): [number, number] => {
    const clampedLatitude = Math.max(-85.051129, Math.min(85.051129, latitude));
    const radians = clampedLatitude * Math.PI / 180;
    return [(longitude + 180) / 360, (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2];
  };
  const [startX, startY] = mercator(route[0]);
  const [endX, endY] = mercator(route.at(-1)!);
  const dx = endX - startX;
  const dy = endY - startY;
  const screenDx = dx * Math.cos(bearing) + dy * Math.sin(bearing);
  const screenDy = -dx * Math.sin(bearing) + dy * Math.cos(bearing);
  expect(Math.abs(screenDy), 'expanded route should run horizontally through the visible map band')
    .toBeLessThan(Math.abs(screenDx) * 0.18);
}

test('canonical route map synchronizes the sheet, stop details, map focus, and light/dark palettes', async ({ page, browserName }) => {
  const browserErrors: string[] = [];
  let allowInitialAnonymousSessionProbe = true;
  page.on('pageerror', (error) => browserErrors.push(`${error.name}: ${error.message}`));
  page.on('response', (response) => {
    if (response.status() !== 401) return;
    const url = new URL(response.url());
    // A fresh browser context probes its HttpOnly refresh cookie before OTP login.
    // That one expected anonymous response is not an app error; any later 401 is.
    if (allowInitialAnonymousSessionProbe && url.pathname === '/api/v1/auth/refresh') {
      allowInitialAnonymousSessionProbe = false;
      return;
    }
    browserErrors.push(`HTTP ${response.status()} ${url.pathname}`);
  });
  page.on('console', (message) => {
    const text = message.text();
    // The response listener above classifies 401s by endpoint so the browser's
    // generic resource-failure message does not lose that request context.
    if (/^Failed to load resource: the server responded with a status of 401 \(Unauthorized\)$/.test(text)) return;
    // GitHub's Xvfb + software Mesa matrix emits these renderer diagnostics
    // during repeated MapLibre mounts. Keep checking the actual canvas below;
    // a context that was lost and not restored still fails the browser test.
    const softwareWebGlDiagnostic = process.env.MARSHGO_FIREFOX_XVFB === '1'
      && (/GL Driver Message .*GPU stall due to ReadPixels/i.test(text) || /WebGL context was lost\./i.test(text));
    if (softwareWebGlDiagnostic) return;
    if (message.type() === 'error' || /webgl|maplibre.*(?:failed|error)/i.test(text)) browserErrors.push(text);
  });
  const origin = { label: 'вул. Мало-Голосківська, 24', latitude: 49.8682, longitude: 24.0030, providerId: 'e2e-lviv-origin' };
  const destination = { label: 'вул. Стрийська, 32', latitude: 49.7941, longitude: 24.0576, providerId: 'e2e-lviv-destination' };
  const departure = new Date('2026-10-14T08:00:00+03:00');
  const tramDeparture = new Date(departure.getTime() + 5 * 60_000);
  const tramArrival = new Date(tramDeparture.getTime() + 12 * 60_000);
  const scooterDeparture = tramArrival;
  const scooterArrival = new Date(scooterDeparture.getTime() + 8 * 60_000);
  const busDeparture = scooterArrival;
  const busArrival = new Date(busDeparture.getTime() + 13 * 60_000);
  let includeExtendedScheduledModes = false;
  const makeAlternativeJourney = (
    id: string,
    departureOffsetMinutes: number,
    legs: Array<{ mode: string; transportType: string; routeName?: string; minutes: number; fareMinor: number }>,
    balancedRank: number,
    fastestRank: number,
    cheapestRank: number,
  ) => {
    const requestedAt = new Date(departure.getTime() + departureOffsetMinutes * 60_000);
    let cursor = requestedAt.getTime();
    const routeCoordinateAt = (progress: number): [number, number] => [
      origin.longitude + (destination.longitude - origin.longitude) * progress,
      origin.latitude + (destination.latitude - origin.latitude) * progress,
    ];
    const mappedLegs = legs.map((leg, index) => {
      const departureAt = new Date(cursor);
      const arrivalAt = new Date(cursor + leg.minutes * 60_000);
      const segmentOrigin = index === 0
        ? { name: 'Площа Ринок', coordinates: routeCoordinateAt(0) }
        : { name: `Проміжна точка ${index}`, coordinates: routeCoordinateAt(index / legs.length) };
      const destinationPoint = index === legs.length - 1
        ? { name: 'Сихів', coordinates: routeCoordinateAt(1) }
        : { name: `Проміжна точка ${index + 1}`, coordinates: routeCoordinateAt((index + 1) / legs.length) };
      cursor = arrivalAt.getTime();
      const scheduled = ['BUS', 'MINIBUS', 'TROLLEYBUS', 'TRAM', 'METRO', 'RAIL', 'FERRY', 'FUNICULAR'].includes(leg.mode);
      const midpointAt = new Date((departureAt.getTime() + arrivalAt.getTime()) / 2).toISOString();
      const midpointCoordinates = [
        (segmentOrigin.coordinates[0] + destinationPoint.coordinates[0]) / 2,
        (segmentOrigin.coordinates[1] + destinationPoint.coordinates[1]) / 2,
      ];
      return {
        id: `${id}-leg-${index + 1}`, mode: leg.mode, transportType: leg.transportType, routeName: leg.routeName,
        source: leg.mode === 'COMMUNITY' ? 'marshgo-community' : leg.mode === 'WALK' ? 'walking-routing' : 'gtfs-static',
        origin: segmentOrigin, destination: destinationPoint, departureAt: departureAt.toISOString(), arrivalAt: arrivalAt.toISOString(),
        durationSeconds: leg.minutes * 60, distanceMeters: leg.mode === 'WALK' ? Math.round(leg.minutes * 60 * 1.1) : leg.minutes * 250, priceMinor: leg.fareMinor, currency: 'UAH',
        priceStatus: 'LOCKED', availabilityStatus: leg.mode === 'COMMUNITY' ? 'AVAILABLE' : 'SCHEDULED',
        lastUpdatedAt: departure.toISOString(), routeGeometry: [segmentOrigin.coordinates, destinationPoint.coordinates],
        stops: scheduled ? [
          { id: `${id}-leg-${index + 1}-boarding`, name: segmentOrigin.name, coordinates: segmentOrigin.coordinates, arrivalAt: departureAt.toISOString(), departureAt: departureAt.toISOString() },
          { id: `${id}-leg-${index + 1}-middle`, name: `Проміжна зупинка · ${leg.routeName ?? leg.transportType}`, coordinates: midpointCoordinates, arrivalAt: midpointAt, departureAt: midpointAt },
          { id: `${id}-leg-${index + 1}-alighting`, name: destinationPoint.name, coordinates: destinationPoint.coordinates, arrivalAt: arrivalAt.toISOString(), departureAt: arrivalAt.toISOString() },
        ] : [], driver: null, vehicle: null,
      };
    });
    const durationSeconds = Math.round((cursor - requestedAt.getTime()) / 1000);
    return {
      id, offerId: null, source: 'gtfs-static', strategy: 'BALANCED',
      recommendedStrategies: ['BALANCED', 'FASTEST', 'CHEAPEST'],
      strategyRanks: { BALANCED: balancedRank, FASTEST: fastestRank, CHEAPEST: cheapestRank },
      state: 'PLANNED', requestedDepartureAt: requestedAt.toISOString(), totalDurationSeconds: durationSeconds,
      waitingSeconds: 0,
      totalPriceMinor: legs.reduce((sum, leg) => sum + leg.fareMinor, 0), confirmedPriceMinor: null,
      estimatedPriceMinMinor: null, estimatedPriceMaxMinor: null, currency: 'UAH', priceStatus: 'LOCKED',
      walkingMeters: legs.filter(leg => leg.mode === 'WALK').reduce((sum, leg) => sum + leg.minutes * 60 * 1.1, 0),
      transfers: Math.max(0, legs.filter(leg => leg.mode !== 'WALK').length - 1), reliabilityScore: null, legs: mappedLegs,
    };
  };
  const alternativeJourneys = [
    makeAlternativeJourney('e2e-alt-metro', 5, [
      { mode: 'WALK', transportType: 'walk', minutes: 8, fareMinor: 0 },
      { mode: 'METRO', transportType: 'metro', routeName: 'M', minutes: 14, fareMinor: 1500 },
      { mode: 'BUS', transportType: 'bus', routeName: 'A20', minutes: 12, fareMinor: 1800 },
      { mode: 'WALK', transportType: 'walk', minutes: 8, fareMinor: 0 },
    ], 2, 3, 2),
    makeAlternativeJourney('e2e-alt-train', 7, [
      { mode: 'WALK', transportType: 'walk', minutes: 6, fareMinor: 0 },
      { mode: 'RAIL', transportType: 'train', routeName: 'Електричка', minutes: 11, fareMinor: 4500 },
      { mode: 'BUS', transportType: 'bus', routeName: '21', minutes: 17, fareMinor: 0 },
    ], 3, 1, 4),
    makeAlternativeJourney('e2e-alt-bus', 9, [
      { mode: 'WALK', transportType: 'walk', minutes: 7, fareMinor: 0 },
      { mode: 'BUS', transportType: 'bus', routeName: 'A20', minutes: 20, fareMinor: 0 },
      { mode: 'TROLLEYBUS', transportType: 'trolleybus', routeName: '3', minutes: 22, fareMinor: 1800 },
      { mode: 'WALK', transportType: 'walk', minutes: 7, fareMinor: 0 },
    ], 4, 5, 1),
    makeAlternativeJourney('e2e-alt-community', 11, [
      { mode: 'WALK', transportType: 'walk', minutes: 10, fareMinor: 0 },
      { mode: 'COMMUNITY', transportType: 'carpool', minutes: 20, fareMinor: 1500 },
      { mode: 'BUS', transportType: 'bus', routeName: '21', minutes: 17, fareMinor: 1200 },
    ], 5, 4, 2),
    makeAlternativeJourney('e2e-alt-trolley-tram', 13, [
      { mode: 'WALK', transportType: 'walk', minutes: 12, fareMinor: 0 },
      { mode: 'TROLLEYBUS', transportType: 'trolleybus', routeName: '7', minutes: 24, fareMinor: 1200 },
      { mode: 'TRAM', transportType: 'tram', routeName: 'T09', minutes: 26, fareMinor: 4000 },
      { mode: 'WALK', transportType: 'walk', minutes: 10, fareMinor: 0 },
    ], 6, 6, 4),
    makeAlternativeJourney('e2e-alt-minibus-taxi', 15, [
      { mode: 'WALK', transportType: 'walk', minutes: 6, fareMinor: 0 },
      { mode: 'MINIBUS', transportType: 'marshrutka', routeName: '12', minutes: 16, fareMinor: 1500 },
      { mode: 'WALK', transportType: 'walk', minutes: 5, fareMinor: 0 },
      { mode: 'TAXI', transportType: 'taxi', minutes: 17, fareMinor: 5500 },
      { mode: 'WALK', transportType: 'walk', minutes: 8, fareMinor: 0 },
    ], 7, 7, 5),
  ];
  const extendedScheduledModeJourneys = [
    makeAlternativeJourney('e2e-alt-ferry', 17, [
      { mode: 'WALK', transportType: 'walk', minutes: 5, fareMinor: 0 },
      { mode: 'FERRY', transportType: 'ferry', routeName: 'F1', minutes: 18, fareMinor: 2500 },
    ], 8, 8, 8),
    makeAlternativeJourney('e2e-alt-funicular', 19, [
      { mode: 'WALK', transportType: 'walk', minutes: 5, fareMinor: 0 },
      { mode: 'FUNICULAR', transportType: 'funicular', routeName: 'Київський', minutes: 7, fareMinor: 1000 },
      { mode: 'WALK', transportType: 'walk', minutes: 4, fareMinor: 0 },
    ], 9, 9, 9),
  ];

  await page.route('**/api/v1/places/suggest?*', route => {
    const query = new URL(route.request().url()).searchParams.get('q')?.toLocaleLowerCase('uk-UA') ?? '';
    return route.fulfill({ json: { data: query.includes('стр') ? [destination] : [origin] } });
  });
  await page.route('**/api/v1/journeys/search', async route => route.fulfill({ json: { data: {
    journeys: [{
      id: 'e2e-multimodal-journey', offerId: null, source: 'gtfs-static', providerName: 'Львівський GTFS',
      strategy: 'BALANCED', recommendedStrategies: ['BALANCED', 'FASTEST'], strategyRanks: { BALANCED: 1, FASTEST: 2, CHEAPEST: 3 },
      state: 'PLANNED', requestedDepartureAt: departure.toISOString(), totalDurationSeconds: 38 * 60,
      waitingSeconds: 0, totalPriceMinor: 3600, confirmedPriceMinor: null,
      estimatedPriceMinMinor: null, estimatedPriceMaxMinor: null, currency: 'UAH', priceStatus: 'LOCKED', walkingMeters: 550, transfers: 2, reliabilityScore: null,
      legs: [
        { id: 'e2e-walk-access', mode: 'WALK', transportType: 'walk', source: 'walking-routing',
          origin: { name: 'вул. Мало-Голосківська, 24', coordinates: [24.003, 49.8682] }, destination: { name: 'Малий Голоско', coordinates: [24.005, 49.867] },
          departureAt: departure.toISOString(), arrivalAt: tramDeparture.toISOString(), durationSeconds: 5 * 60,
          distanceMeters: 550, priceMinor: 0, currency: 'UAH', priceStatus: 'LOCKED', availabilityStatus: 'AVAILABLE', lastUpdatedAt: departure.toISOString(),
          routeGeometry: [[24.003, 49.8682], [24.004, 49.868], [24.005, 49.867]], driver: null, vehicle: null },
        { id: 'e2e-tram-leg', mode: 'TRAM', transportType: 'tram', routeName: 'T09', source: 'gtfs-static',
          origin: { name: 'Малий Голоско', coordinates: [24.005, 49.867] }, destination: { name: 'Університет', coordinates: [24.018, 49.846] },
          departureAt: tramDeparture.toISOString(), arrivalAt: tramArrival.toISOString(), durationSeconds: 12 * 60,
          priceMinor: 1500, currency: 'UAH', priceStatus: 'LOCKED', availabilityStatus: 'SCHEDULED', lastUpdatedAt: departure.toISOString(),
          stops: [
            { id: 'golosko', name: 'Малий Голоско', coordinates: [24.005, 49.867], arrivalAt: tramDeparture.toISOString(), departureAt: tramDeparture.toISOString() },
            { id: 'university', name: 'Університет', coordinates: [24.018, 49.846], arrivalAt: tramArrival.toISOString(), departureAt: tramArrival.toISOString() },
          ],
          routeGeometry: [[24.005, 49.867], [24.012, 49.855], [24.018, 49.846]], driver: null, vehicle: null },
        { id: 'e2e-scooter-leg', mode: 'SCOOTER', transportType: 'scooter', source: 'gbfs',
          origin: { name: 'Університет', coordinates: [24.018, 49.846] }, destination: { name: 'вул. Городоцька, 55', coordinates: [24.03, 49.825] },
          departureAt: scooterDeparture.toISOString(), arrivalAt: scooterArrival.toISOString(), durationSeconds: 8 * 60,
          distanceMeters: 1500, priceMinor: 2100, currency: 'UAH', priceStatus: 'LOCKED', availabilityStatus: 'AVAILABLE', lastUpdatedAt: departure.toISOString(),
          routeGeometry: [[24.018, 49.846], [24.03, 49.825]], driver: null, vehicle: null },
        { id: 'e2e-bus-leg', mode: 'BUS', transportType: 'bus', routeName: 'A20', source: 'gtfs-static',
          origin: { name: 'вул. Городоцька, 55', coordinates: [24.03, 49.825] }, destination: { name: 'вул. Стрийська, 32', coordinates: [24.0576, 49.7941] },
          departureAt: busDeparture.toISOString(), arrivalAt: busArrival.toISOString(), durationSeconds: 13 * 60,
          distanceMeters: 7100, priceMinor: 0, currency: 'UAH', priceStatus: 'LOCKED', availabilityStatus: 'SCHEDULED', lastUpdatedAt: departure.toISOString(),
          stops: [
            { id: 'horodotska', name: 'вул. Городоцька, 55', coordinates: [24.03, 49.825], arrivalAt: busDeparture.toISOString(), departureAt: busDeparture.toISOString() },
            { id: 'naukova', name: 'Наукова', coordinates: [24.044, 49.81], arrivalAt: new Date(busDeparture.getTime() + 6 * 60_000).toISOString(), departureAt: new Date(busDeparture.getTime() + 6 * 60_000).toISOString() },
            { id: 'stryiska', name: 'вул. Стрийська, 32', coordinates: [24.0576, 49.7941], arrivalAt: busArrival.toISOString(), departureAt: busArrival.toISOString() },
          ],
          routeGeometry: [[24.03, 49.825], [24.044, 49.81], [24.0576, 49.7941]], driver: null, vehicle: null },
      ],
    }, ...alternativeJourneys, ...(includeExtendedScheduledModes ? extendedScheduledModeJourneys : [])],
    requestedStrategy: 'BALANCED', availableStrategies: ['BALANCED', 'FASTEST', 'CHEAPEST'], partial: false,
    candidateCount: includeExtendedScheduledModes ? 9 : 7,
    paretoCount: includeExtendedScheduledModes ? 9 : 7,
    returnedCount: includeExtendedScheduledModes ? 9 : 7,
    blockedProviders: [], unsupportedPreferences: [], providerErrors: [],
  } } }));

  if (browserName === 'firefox') {
    // Playwright's Firefox geolocation fixture reports its timestamp one day
    // ahead of Date.now(). Keep the simulated coordinates, but normalize that
    // fixture-only clock skew so freshness and server checks stay realistic.
    await page.addInitScript(() => {
      const geolocation = navigator.geolocation;
      const skewMs = 24 * 60 * 60 * 1000;
      const normalize = (position: GeolocationPosition) => new Proxy(position, {
        get(target, property) {
          if (property === 'timestamp') return target.timestamp - skewMs;
          return Reflect.get(target, property, target);
        },
      });
      const current = geolocation.getCurrentPosition.bind(geolocation);
      const watch = geolocation.watchPosition.bind(geolocation);
      Object.defineProperty(geolocation, 'getCurrentPosition', { configurable: true, value: (success: PositionCallback, error?: PositionErrorCallback | null, options?: PositionOptions) => current(position => success(normalize(position)), error, options) });
      Object.defineProperty(geolocation, 'watchPosition', { configurable: true, value: (success: PositionCallback, error?: PositionErrorCallback | null, options?: PositionOptions) => watch(position => success(normalize(position)), error, options) });
    });
  }

  await page.goto('/');
  // Resize only after navigation: Firefox can hang when resizing its blank
  // mobile-emulation page, while the same phone viewport works after first paint.
  await page.setViewportSize({ width: 402, height: 852 });
  const loginHeading = page.getByRole('heading', { name: 'Вхід за номером телефону' });
  const welcome = page.getByRole('button', { name: /У мене вже є акаунт/i });
  await expect(loginHeading.or(welcome).first()).toBeVisible();
  if (await welcome.isVisible()) await welcome.click();
  await page.getByPlaceholder('Ваше ім’я').fill(`Map ${browserName}`);
  await page.getByPlaceholder('+380 номер телефону').fill(`+38092${String(Date.now()).slice(-7)}`);
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const otpNotice = page.getByText(/Тестовий OTP локального середовища:/);
  await expect(otpNotice).toBeVisible();
  const otp = (await otpNotice.innerText()).match(/\b\d{6}\b/)?.[0];
  expect(otp).toMatch(/^\d{6}$/);
  await page.locator('input[autocomplete="one-time-code"]').fill(otp!);
  const [verifyResponse] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/v1/auth/otp/verify') && response.status() === 200),
    page.getByRole('button', { name: 'Підтвердити номер' }).click(),
  ]);
  const accessToken = (await verifyResponse.json()).data.accessToken as string;
  const driverRoleStatus = await page.evaluate(async (token) => fetch('/api/v1/users/me/roles', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role: 'driver' }),
  }).then((response) => response.status), accessToken);
  expect(driverRoleStatus).toBe(200);
  await page.reload();

  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  const from = page.getByPlaceholder('Місто відправлення');
  await from.fill('Мало-Голосківська');
  await from.press('Enter');
  await page.getByRole('button', { name: origin.label, exact: true }).click();
  const to = page.getByPlaceholder('Місто призначення');
  await to.fill('Стрийська');
  await to.press('Enter');
  await page.getByRole('button', { name: destination.label, exact: true }).click();
  await page.getByRole('button', { name: 'Знайти маршрут', exact: true }).click();
  await expect(page.locator('.journey-results').getByText('Маршрут: вул. Мало-Голосківська, 24 → вул. Стрийська, 32')).toBeVisible();
  await expect(page.locator('.app-header')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Основна навігація' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Змінити маршрут пошуку' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('details.coverage-details')).toHaveCount(0);
  const resultCard = page.getByTestId('journey-result-card').first();
  const canonicalJourneyId = await resultCard.getAttribute('data-journey-id');
  expect(canonicalJourneyId).toBeTruthy();
  if (!canonicalJourneyId) throw new Error('The first route result must have a stable Journey ID.');
  await expect(resultCard.locator('[data-canonical-route-lip]')).toHaveAttribute('data-canonical-route-lip', canonicalJourneyId);
  const metricGap = await resultCard.locator('.journey-result-key-metrics').evaluate((group) => {
    const duration = group.querySelector('.journey-result-duration');
    const price = group.querySelector('.journey-result-total-price');
    if (!duration || !price) return Number.POSITIVE_INFINITY;
    const durationBounds = duration.getBoundingClientRect();
    const priceBounds = price.getBoundingClientRect();
    return Math.round((priceBounds.left - durationBounds.right) * 10) / 10;
  });
  expect(metricGap, 'duration and price should read as one compact metric group').toBeGreaterThanOrEqual(0);
  expect(metricGap, 'price should stay visually close to duration').toBeLessThanOrEqual(24);
  await expect(resultCard.locator('.journey-result-total-price')).toHaveCSS('font-weight', '900');
  await expect(resultCard.locator('.journey-segment-ribbon')).toHaveCSS('height', '11px');
  await expect(resultCard.locator('.journey-segment-strip')).toHaveAttribute('data-layout', 'horizontal');
  const firstSegmentLayout = await resultCard.locator('.journey-segment-tile-horizontal').first().evaluate((tile) => {
    const icon = tile.querySelector('.journey-segment-tile-icon');
    const label = tile.querySelector('.journey-segment-tile-label');
    if (!icon || !label) return false;
    return icon.getBoundingClientRect().left < label.getBoundingClientRect().left;
  });
  expect(firstSegmentLayout, 'transport icon should sit to the left of its segment details').toBe(true);
  await expect(resultCard.locator('.journey-segment-tile-meta-value').first()).toHaveCSS('font-weight', '700');
  await expect(resultCard.getByLabel('Оптимальний')).toBeVisible();
  await expect(page.locator('[data-testid="journey-result-card"][data-journey-id="e2e-alt-train"]').getByLabel('Найшвидший')).toBeVisible();
  await expect(page.locator('[data-testid="journey-result-card"][data-journey-id="e2e-alt-bus"]').getByLabel('Найдешевший')).toBeVisible();
  const transportChain = resultCard.getByRole('list', { name: /Послідовність етапів маршруту/ });
  await expect(transportChain.getByRole('listitem')).toHaveCount(4);
  await expect(resultCard.locator('.journey-segment-ribbon > [data-segment-mode]')).toHaveCount(4);
  await expect(resultCard.locator('[data-segment-tile-id]')).toHaveCount(4);
  await expect(transportChain.getByRole('listitem').nth(0)).toContainText('Пішки');
  await expect(transportChain.getByRole('listitem').nth(1)).toContainText('Трамвай');
  await expect(transportChain.getByRole('listitem').nth(1)).toHaveAttribute('aria-label', /маршрут T09/);
  await expect(transportChain.getByRole('listitem').nth(2)).toContainText('Самокат');
  await expect(transportChain.getByRole('listitem').nth(3)).toContainText('Автобус');
  await expect(transportChain.getByRole('listitem').nth(3)).toHaveAttribute('aria-label', /маршрут A20/);
  const segmentLabelsAreReadable = (items: Element[]) => items.every((item) => {
    const label = item as HTMLElement;
    const fullLabel = label.textContent?.trim() ?? '';
    const style = getComputedStyle(label);
    const fits = label.scrollWidth <= label.clientWidth;
    return label.clientWidth > 0
      && fullLabel.length > 0
      && label.title === fullLabel
      && (fits || style.textOverflow === 'ellipsis');
  });
  await expect.poll(() => transportChain.locator('.journey-segment-tile-label').evaluateAll(segmentLabelsAreReadable)).toBe(true);
  const allResultTileLabels = page.locator('.journey-result-card .journey-segment-tile-label');
  const allResultTileMeta = page.locator('.journey-result-card .journey-segment-tile-meta');
  await expect.poll(() => allResultTileLabels.evaluateAll(segmentLabelsAreReadable)).toBe(true);
  await expect.poll(() => allResultTileMeta.evaluateAll(items => items.every(item => item.scrollWidth <= item.clientWidth))).toBe(true);
  const strategySwitch = page.getByRole('group', { name: 'Режим пошуку маршрутів' });
  await expect(strategySwitch.getByRole('button')).toHaveCount(3);
  expect(await strategySwitch.locator('button span').allTextContents()).toEqual(['Оптимальний', 'Найшвидший', 'Найдешевший']);
  expect(await strategySwitch.locator('button span').evaluateAll(spans => spans.map(span => span.scrollWidth > span.clientWidth))).toEqual([false, false, false]);
  const cheapestMode = strategySwitch.getByRole('button', { name: /Найдешевший, 7 маршрутів/ });
  await expect(cheapestMode).toBeEnabled();
  await cheapestMode.click();
  await expect(page.getByTestId('journey-result-card')).toHaveCount(7);
  await expect(page.getByTestId('journey-result-card').first()).toHaveAttribute('data-journey-id', 'e2e-alt-bus');
  await strategySwitch.getByRole('button', { name: /Оптимальний, 7 маршрутів/ }).click();
  await expect(page.getByTestId('journey-result-card')).toHaveCount(7);
  const saveRoute = resultCard.getByRole('button', { name: 'Зберегти маршрут' });
  await expect(saveRoute).toHaveAttribute('aria-pressed', 'false');
  await saveRoute.click();
  await expect(resultCard.getByRole('button', { name: 'Видалити маршрут зі збережених' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').getByText('Маршрут збережено на цьому пристрої')).toBeVisible();
  await resultCard.getByRole('button', { name: 'Видалити маршрут зі збережених' }).click();
  await expect(resultCard.getByRole('button', { name: 'Зберегти маршрут' })).toHaveAttribute('aria-pressed', 'false');
  const resultsScreen = page.locator('.journey-results');
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-journey-results.png` });
  await expectCanonicalScreenshot(page, 'journey-results-light.png');
  const lightResultsGeometry = await journeyResultsGeometry(resultsScreen);
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect.poll(() => resultCard.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(9, 27, 42)');
  await expect(resultCard.locator('[data-testid="canonical-route-duration"]')).toHaveCSS('color', 'rgb(245, 249, 255)');
  await expect.poll(() => cheapestMode.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(10, 29, 45)');
  await expect(resultCard.locator('[data-segment-mode="BUS"]')).toHaveCSS('background-color', 'rgb(22, 135, 255)');
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-journey-results-dark.png` });
  await expectCanonicalScreenshot(page, 'journey-results-dark.png');
  expect(await journeyResultsGeometry(resultsScreen)).toEqual(lightResultsGeometry);
  await page.setViewportSize({ width: 360, height: 844 });
  await expect.poll(() => allResultTileLabels.evaluateAll(segmentLabelsAreReadable)).toBe(true);
  await expect.poll(() => allResultTileMeta.evaluateAll(items => items.every(item => item.scrollWidth <= item.clientWidth))).toBe(true);
  const multiLegCard = page.getByTestId('journey-result-card').nth(6);
  await multiLegCard.scrollIntoViewIfNeeded();
  await expect(multiLegCard.getByRole('listitem')).toHaveCount(5);
  const segmentScrollCue = multiLegCard.getByRole('button', { name: 'Прокрутити до наступних етапів маршруту' });
  const segmentScroller = multiLegCard.locator('.journey-result-segments');
  await expect(segmentScrollCue).toBeVisible();
  await expect(segmentScrollCue.getByTestId('segment-scroll-cue-surface')).toHaveCSS('background-color', 'rgb(17, 24, 32)');
  await segmentScrollCue.click();
  await expect.poll(() => segmentScroller.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const returnToSegmentStart = multiLegCard.getByRole('button', { name: 'Повернутися до початку етапів маршруту' });
  await expect(returnToSegmentStart).toBeVisible();
  await returnToSegmentStart.click();
  await expect.poll(() => segmentScroller.evaluate(element => element.scrollLeft)).toBe(0);
  await expect(page.getByTestId('journey-result-card').nth(5).getByRole('button', { name: 'Прокрутити до наступних етапів маршруту' })).toBeVisible();
  await page.setViewportSize({ width: 402, height: 852 });
  await resultCard.getByRole('button', { name: /Відкрити маршрут:/ }).click();

  const routeMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await expect(routeMap).toBeVisible();
  await expect(routeMap.locator('[data-canonical-route-lip]')).toHaveCount(1);
  await expect(routeMap).toHaveAttribute('data-theme', 'light');
  const routeSummaryTitle = routeMap.locator('.route-summary-title');
  await expect(routeSummaryTitle).toContainText('Мало-Голосківська, 24');
  await expect(routeSummaryTitle).toContainText('Стрийська, 32');
  await expect.poll(() => routeSummaryTitle.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(routeMap.getByText('Автобус A20')).toBeVisible();
  await expect(routeMap.getByText('Трамвай T09')).toBeVisible();
  await expect(routeMap.getByText('Відстань не вказана', { exact: true })).toHaveCount(0);
  await expect(routeMap.getByText(/NaN/)).toHaveCount(0);
  const sheet = routeMap.getByTestId('route-bottom-sheet');
  const summaryStrip = sheet.locator('.journey-segment-strip');
  await expect(summaryStrip).toBeVisible();
  await expect(summaryStrip.getByRole('listitem')).toHaveCount(await summaryStrip.locator('.journey-segment-ribbon > [data-segment-mode]').count());
  await expect.poll(() => summaryStrip.locator('.journey-segment-tile-meta').evaluateAll(items => items.every(item => item.scrollWidth <= item.clientWidth)))
    .toBe(true);
  const map = routeMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(sheet).toHaveAttribute('data-sheet-state', 'half');
  try {
    await expect(map).toHaveAttribute('data-marshgo-map-ready', 'true');
  } catch (error) {
    const diagnostics = await map.evaluate((element) => ({
      attributes: Array.from(element.attributes).reduce<Record<string, string>>((result, attribute) => {
        result[attribute.name] = attribute.value;
        return result;
      }, {}),
      canvasCount: element.querySelectorAll('canvas').length,
      canvasSize: Array.from(element.querySelectorAll('canvas')).map((canvas) => ({ width: canvas.width, height: canvas.height })),
      webgl: (() => {
        const canvas = element.querySelector('canvas');
        if (!canvas) return 'no-canvas';
        try { return canvas.getContext('webgl2') ? 'webgl2' : canvas.getContext('webgl') ? 'webgl' : 'unavailable'; }
        catch { return 'context-query-failed'; }
      })(),
    }));
    throw new Error(`Map initialization diagnostics: ${JSON.stringify({ diagnostics, browserErrors })}`, { cause: error });
  }
  await waitForCameraSettled(map);
  await expect(map).toHaveAttribute('data-marshgo-camera-zoom', /\d/);
  const routeOverviewZoom = Number(await map.getAttribute('data-marshgo-camera-zoom'));
  const dragSheet = async (deltaY: number, steps = 8) => {
    const previousCameraRequestId = await map.getAttribute('data-marshgo-camera-request-id');
    const handle = sheet.locator('.route-sheet-grabber');
    const bounds = await handle.boundingBox();
    expect(bounds, 'bottom sheet drag handle should be visible').not.toBeNull();
    const initialHeight = (await sheet.boundingBox())!.height;
    const x = bounds!.x + bounds!.width / 2;
    const y = bounds!.y + bounds!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + deltaY, { steps });
    await expect.poll(() => sheet.evaluate((element, startingHeight) => Math.abs(element.getBoundingClientRect().height - startingHeight), initialHeight), {
      message: 'bottom sheet should track the finger before release',
      timeout: 500,
      intervals: [16, 40, 80],
    }).toBeGreaterThan(Math.min(16, Math.abs(deltaY) / 4));
    await page.mouse.up();
    // Wait for the rendered height to reach the inline snap target. Checking
    // animation counts is flaky on slow CI runners, which may keep transitions
    // alive longer than their nominal CSS duration.
    await waitForSheetSnap(sheet);
    await waitForCameraSettled(map, previousCameraRequestId);
  };
  await expectCanonicalScreenshot(page, 'journey-route-map-light-half.png');
  const lightHalfGeometry = await routeSheetGeometry(routeMap);
  await dragSheet(-260);
  await expect(sheet).toHaveAttribute('data-sheet-state', 'expanded');
  await waitForSheetSnap(sheet);
  await waitForCameraSettled(map);
  const expandedGeometry = await routeSheetGeometry(routeMap);
  expect(expandedGeometry.sheet?.[1], 'expanded sheet must leave a visible map band').toBeGreaterThanOrEqual(96);
  const requestedBearing = Number(await routeMap.getAttribute('data-route-camera-bearing'));
  expect(Math.abs(requestedBearing), 'expanded route should request a horizontal map bearing').toBeGreaterThan(1);
  await expect.poll(async () => Math.abs(Number(await map.getAttribute('data-marshgo-camera-bearing'))), {
    message: 'map camera should finish rotating to the expanded route bearing',
    timeout: 3_000,
  }).toBeGreaterThan(1);
  const expandedBearing = Number(await map.getAttribute('data-marshgo-camera-bearing'));
  expect(Number.isFinite(expandedBearing), 'expanded map camera bearing should be reported').toBe(true);
  expect(Math.abs(expandedBearing), 'route direction should be rotated to a horizontal map pass').toBeGreaterThan(1);
  await expectRouteHorizontal(map, [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]]);
  await expectRouteCenteredInVisibleMap(map, sheet, [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]]);
  await dragSheet(120);
  await expect(sheet).toHaveAttribute('data-sheet-state', 'half');
  await dragSheet(300);
  await expect(sheet).toHaveAttribute('data-sheet-state', 'collapsed');
  await expect(sheet.locator('.journey-segment-strip')).toBeVisible();
  await expect(sheet.getByTestId('route-segment-list')).toBeHidden();
  await dragSheet(-180);
  await expect(sheet).toHaveAttribute('data-sheet-state', 'half');
  const cameraBeforeExpandDetails = await map.getAttribute('data-marshgo-camera-request-id');
  await sheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(sheet).toHaveAttribute('data-sheet-state', 'expanded');
  await waitForSheetSnap(sheet);
  await waitForCameraSettled(map, cameraBeforeExpandDetails);
  const scooterCard = routeMap.locator('[data-segment-id="e2e-scooter-leg"]');
  await expect(scooterCard).toBeVisible();
  await expect(scooterCard.getByRole('button', { name: /зупинки:/i })).toHaveCount(0);
  await expect(scooterCard).toContainText('Університет');
  await expect(scooterCard).toContainText('вул. Городоцька, 55');
  await expectCanonicalScreenshot(page, 'journey-route-details-light-expanded.png');
  const lightExpandedGeometry = await routeSheetGeometry(routeMap);
  const cameraBeforeCollapseDetails = await map.getAttribute('data-marshgo-camera-request-id');
  await sheet.getByRole('button', { name: 'Згорнути деталі маршруту' }).click();
  await expect(sheet).toHaveAttribute('data-sheet-state', 'collapsed');
  await waitForSheetSnap(sheet);
  await waitForCameraSettled(map, cameraBeforeCollapseDetails);
  await expectCanonicalScreenshot(page, 'journey-route-map-light-collapsed.png');
  const lightCollapsedGeometry = await routeSheetGeometry(routeMap);
  const cameraBeforeReturnToHalf = await map.getAttribute('data-marshgo-camera-request-id');
  await sheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(sheet).toHaveAttribute('data-sheet-state', 'half');
  await waitForSheetSnap(sheet);
  await waitForCameraSettled(map, cameraBeforeReturnToHalf);
  await expect(routeMap.getByRole('button', { name: /На карті/ })).toHaveCount(0);
  await expect(routeMap.locator('img')).toHaveCount(0);
  await expect(map).toHaveAttribute('data-marshgo-route-segment-count', '4');
  await expect(map).toHaveAttribute('data-marshgo-route-point-count', '11');
  const busSummaryTile = summaryStrip.getByRole('button', { name: 'Вибрати сегмент: Автобус A20' });
  const cameraBeforeBusFocus = await map.getAttribute('data-marshgo-camera-request-id');
  await busSummaryTile.click();
  const busCard = routeMap.locator('[data-segment-id="e2e-bus-leg"]');
  await expect(busCard).toHaveAttribute('data-active', 'true');
  await expect(busCard.getByRole('button', { name: 'Згорнути зупинки: Автобус' })).toHaveAttribute('aria-expanded', 'true');
  await expect(busCard.getByText('вул. Городоцька, 55').last()).toBeVisible();
  await expect(busCard.getByText('Наукова', { exact: true })).toBeVisible();
  await expect(busCard.getByText('вул. Стрийська, 32').last()).toBeVisible();
  await expect(map).toHaveAttribute('data-marshgo-active-route-segment-id', 'e2e-bus-leg');
  await expect(map).toHaveAttribute('data-marshgo-focused-route-segment-id', 'e2e-bus-leg');
  await expect(map).toHaveAttribute('data-marshgo-active-route-segment-color', '#1687FF');
  await waitForCameraSettled(map, cameraBeforeBusFocus);
  const focusedBusZoom = Number(await map.getAttribute('data-marshgo-camera-zoom'));
  expect(focusedBusZoom).toBeGreaterThan(routeOverviewZoom + 0.05);
  await expectRouteCenteredInVisibleMap(map, sheet, [[24.03, 49.825], [24.044, 49.81], [24.0576, 49.7941]]);
  await busCard.getByRole('button', { name: 'Згорнути зупинки: Автобус' }).click();
  await expect(busCard.getByRole('button', { name: 'Розгорнути зупинки: Автобус' })).toHaveAttribute('aria-expanded', 'false');
  const tramCard = routeMap.locator('[data-segment-id="e2e-tram-leg"]');
  const cameraBeforeTramFocus = await map.getAttribute('data-marshgo-camera-request-id');
  await tramCard.getByRole('button', { name: /Вибрати сегмент: Трамвай T09/ }).click();
  await expect(tramCard).toHaveAttribute('data-active', 'true');
  await expect(tramCard.getByText('Університет').last()).toBeVisible();
  await expect(tramCard.getByText('Малий Голоско').last()).toBeVisible();
  await expect(map).toHaveAttribute('data-marshgo-active-route-segment-id', 'e2e-tram-leg');
  await expect(map).toHaveAttribute('data-marshgo-focused-route-segment-id', 'e2e-tram-leg');
  await expect(map).toHaveAttribute('data-marshgo-active-route-segment-color', '#F43F7B');
  await waitForCameraSettled(map, cameraBeforeTramFocus);
  await expectRouteCenteredInVisibleMap(map, sheet, [[24.005, 49.867], [24.012, 49.855], [24.018, 49.846]]);
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-multimodal-route-map.png`, fullPage: true });
  await routeMap.getByRole('button', { name: 'Назад до результатів' }).click();
  await expect(page.locator('.journey-results').getByText('Маршрут: вул. Мало-Голосківська, 24 → вул. Стрийська, 32')).toBeVisible();
  const metroResult = page.locator('[data-testid="journey-result-card"][data-journey-id="e2e-alt-metro"]');
  await expect(metroResult).toBeVisible();
  const verifyIntermediateStop = async (journeyId: string, segmentId: string, routeName: string, expectedStop: string, expectedColor: string) => {
    const resultCard = page.locator(`[data-testid="journey-result-card"][data-journey-id="${journeyId}"]`);
    await resultCard.getByRole('button', { name: /Відкрити маршрут:/ }).click();
    const route = page.getByRole('main', { name: 'Побудований маршрут' });
    const map = route.locator('[data-marshgo-map-renderer="maplibre"]');
    const segment = route.locator(`[data-segment-id="${segmentId}"]`);
    await expect(segment).toBeVisible();
    await segment.getByRole('button', { name: new RegExp(`Вибрати сегмент: .*${routeName}`) }).click();
    await expect(segment.getByRole('button', { name: /Згорнути зупинки:/ })).toHaveAttribute('aria-expanded', 'true');
    await expect(segment.getByText(expectedStop, { exact: true })).toBeVisible();
    await expect(map).toHaveAttribute('data-marshgo-active-route-segment-id', segmentId);
    await expect(map).toHaveAttribute('data-marshgo-focused-route-segment-id', segmentId);
    await expect(map).toHaveAttribute('data-marshgo-active-route-segment-color', expectedColor);
    await route.getByRole('button', { name: 'Назад до результатів' }).click();
    await expect(page.locator('.journey-results')).toBeVisible();
  };
  await verifyIntermediateStop('e2e-alt-metro', 'e2e-alt-metro-leg-2', 'M', 'Проміжна зупинка · M', '#E43F86');
  await verifyIntermediateStop('e2e-alt-train', 'e2e-alt-train-leg-2', 'Електричка', 'Проміжна зупинка · Електричка', '#914BF4');
  await verifyIntermediateStop('e2e-alt-bus', 'e2e-alt-bus-leg-3', '3', 'Проміжна зупинка · 3', '#00C2A0');
  await verifyIntermediateStop('e2e-alt-trolley-tram', 'e2e-alt-trolley-tram-leg-3', 'T09', 'Проміжна зупинка · T09', '#F43F7B');
  await verifyIntermediateStop('e2e-alt-minibus-taxi', 'e2e-alt-minibus-taxi-leg-2', '12', 'Проміжна зупинка · 12', '#F02F79');
  await metroResult.getByRole('button', { name: /Відкрити маршрут:/ }).click();
  const metroRouteMap = page.getByRole('main', { name: 'Побудований маршрут' });
  const metroMap = metroRouteMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(metroMap).toHaveAttribute('data-marshgo-map-ready', 'true');
  await waitForCameraSettled(metroMap);
  const metroOverviewZoom = Number(await metroMap.getAttribute('data-marshgo-camera-zoom'));
  const metroCard = metroRouteMap.locator('[data-segment-id="e2e-alt-metro-leg-2"]');
  await expect(metroCard).toBeVisible();
  const metroStrip = metroRouteMap.locator('.journey-segment-strip');
  const metroTile = metroStrip.getByRole('button', { name: 'Вибрати сегмент: Метро M' });
  await expect(metroStrip.locator('[data-segment-mode="METRO"]')).toHaveCSS('background-color', 'rgb(228, 63, 134)');
  const metroSegmentCount = Number(await metroMap.getAttribute('data-marshgo-route-segment-count'));
  expect(metroSegmentCount).toBeGreaterThan(1);
  const cameraBeforeMetroFocus = await metroMap.getAttribute('data-marshgo-camera-request-id');
  await metroTile.click();
  await expect(metroTile).toHaveAttribute('aria-pressed', 'true');
  await expect(metroStrip.locator('.journey-segment-tile.is-active')).toHaveCount(1);
  await expect(metroStrip.locator('.journey-segment-tile.is-active')).toHaveCSS('opacity', '1');
  await expect(metroStrip.locator('.journey-segment-tile:not(.is-active)').first()).toHaveCSS('opacity', '0.5');
  await expect(metroStrip.locator('.journey-segment-ribbon > [data-journey-strip-segment-id="e2e-alt-metro-leg-2"]'))
    .toHaveAttribute('style', /brightness\(1\.16\)/);
  await expect(metroStrip.locator('.journey-segment-ribbon > [data-journey-strip-segment-id]:not([data-journey-strip-segment-id="e2e-alt-metro-leg-2"])').first())
    .toHaveAttribute('style', /brightness\(0\.55\)/);
  await expect(metroCard).toHaveAttribute('data-active', 'true');
  await expect(metroMap).toHaveAttribute('data-marshgo-active-route-segment-id', 'e2e-alt-metro-leg-2');
  await expect(metroMap).toHaveAttribute('data-marshgo-focused-route-segment-id', 'e2e-alt-metro-leg-2');
  await expect(metroMap).toHaveAttribute('data-marshgo-active-route-segment-color', '#E43F86');
  await expect(metroMap).toHaveAttribute('data-marshgo-selected-route-segment-count', '1');
  await expect(metroMap).toHaveAttribute('data-marshgo-dimmed-route-segment-count', String(metroSegmentCount - 1));
  await waitForCameraSettled(metroMap, cameraBeforeMetroFocus);
  await expect.poll(async () => Number(await metroMap.getAttribute('data-marshgo-camera-zoom'))).toBeGreaterThan(metroOverviewZoom + 0.5);
  await expectRouteCenteredInVisibleMap(
    metroMap,
    metroRouteMap.getByTestId('route-bottom-sheet'),
    [[24.01665, 49.849675], [24.0303, 49.83115]],
  );
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-metro-segment-focus.png`, fullPage: true });
  await metroRouteMap.getByRole('button', { name: 'Назад до результатів' }).click();
  await expect(page.locator('.journey-results')).toBeVisible();
  await page.getByRole('button', { name: 'Назад до пошуку' }).click();
  const navigation = page.getByRole('navigation', { name: 'Основна навігація' });
  await navigation.getByRole('button', { name: 'Профіль', exact: true }).click();
  await page.getByRole('button', { name: /Налаштування/ }).click();
  await page.getByRole('button', { name: 'Темна (Ніч)' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
  await navigation.getByRole('button', { name: 'Пошук', exact: true }).click();
  await page.getByRole('button', { name: 'Знайти маршрут', exact: true }).click();
  await expect(page.locator('.journey-results')).toBeVisible();
  await page.getByTestId('journey-result-card').first().getByRole('button', { name: /Відкрити маршрут:/ }).click();
  const darkRouteMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await expect(darkRouteMap).toHaveAttribute('data-theme', 'dark');
  await expect(darkRouteMap.getByTestId('route-bottom-sheet')).toHaveAttribute('data-sheet-state', 'half');
  await expect(darkRouteMap.locator('[data-segment-id="e2e-bus-leg"]')).toHaveCSS('background-color', 'rgb(11, 28, 43)');
  await expect.poll(() => darkRouteMap.locator('[data-marshgo-map-renderer="maplibre"]').evaluate(element =>
    getComputedStyle(element).backgroundImage.includes('rgb(19, 45, 71)'))).toBe(true);
  const darkMap = darkRouteMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(darkMap).toHaveAttribute('data-marshgo-map-ready', 'true');
  await waitForCameraSettled(darkMap);
  expect(await routeSheetGeometry(darkRouteMap)).toEqual(lightHalfGeometry);
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-multimodal-route-map-dark.png`, fullPage: true });
  await expectCanonicalScreenshot(page, 'journey-route-map-dark-half.png');
  const darkSheet = darkRouteMap.getByTestId('route-bottom-sheet');
  const cameraBeforeDarkExpand = await darkMap.getAttribute('data-marshgo-camera-request-id');
  await darkSheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(darkSheet).toHaveAttribute('data-sheet-state', 'expanded');
  await waitForSheetSnap(darkSheet);
  await waitForCameraSettled(darkMap, cameraBeforeDarkExpand);
  const cameraBeforeDarkCollapse = await darkMap.getAttribute('data-marshgo-camera-request-id');
  await darkSheet.getByRole('button', { name: 'Згорнути деталі маршруту' }).click();
  await expect(darkSheet).toHaveAttribute('data-sheet-state', 'collapsed');
  await waitForSheetSnap(darkSheet);
  await waitForCameraSettled(darkMap, cameraBeforeDarkCollapse);
  await expect.poll(async () => routeSheetGeometry(darkRouteMap)).toEqual(lightCollapsedGeometry);
  await expectCanonicalScreenshot(page, 'journey-route-map-dark-collapsed.png');
  const cameraBeforeDarkHalf = await darkMap.getAttribute('data-marshgo-camera-request-id');
  await darkSheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(darkSheet).toHaveAttribute('data-sheet-state', 'half');
  await waitForSheetSnap(darkSheet);
  await waitForCameraSettled(darkMap, cameraBeforeDarkHalf);
  const cameraBeforeDarkExpanded = await darkMap.getAttribute('data-marshgo-camera-request-id');
  await darkSheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(darkSheet).toHaveAttribute('data-sheet-state', 'expanded');
  await waitForSheetSnap(darkSheet);
  await waitForCameraSettled(darkMap, cameraBeforeDarkExpanded);
  await expect.poll(async () => routeSheetGeometry(darkRouteMap)).toEqual(lightExpandedGeometry);
  await expectCanonicalScreenshot(page, 'journey-route-details-dark-expanded.png');

  await page.evaluate(() => localStorage.setItem('mg_theme', 'light'));
  await page.route('**/api/v1/transport/cities', route => route.fulfill({ json: { data: [{
    id: 'kyiv', name: 'Київ', timezone: 'Europe/Kyiv', bbox: [30.239, 50.213, 30.825, 50.59],
    modes: ['bus', 'tram', 'trolleybus', 'metro', 'city_train'], routeCount: 306, stopCount: 1492,
    realtimeAvailable: false, sourceUrl: 'https://data.kyivcity.gov.ua', licenses: ['Kyiv open data'],
    providers: [{ name: 'E2E schedule fixture', sourceType: 'gtfs', license: 'Kyiv open data', sourceRef: 'e2e:kyiv' }],
  }] } }));
  await page.route('**/api/v1/transport/layers', route => route.fulfill({ json: { data: [
    'BUS', 'TRAM', 'TROLLEYBUS', 'METRO', 'CITY_TRAIN', 'STOPS', 'BICYCLE', 'SCOOTER', 'CARSHARING', 'RENTAL_POINTS',
  ].map(id => ({ id, available: true })) } }));
  await page.goto('/map');
  await expect(page.getByRole('heading', { name: 'Карта транспорту' })).toBeVisible();
  await page.getByRole('button', { name: 'Шари карти' }).click();
  await expect(page.getByRole('dialog', { name: 'Шари карти' })).toBeVisible();
  await expectCanonicalScreenshot(page, 'transport-map-layers-light.png');

  // Keep the GPS age label deterministic without freezing map animations or timers.
  await page.clock.setFixedTime(new Date());
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: origin.latitude, longitude: origin.longitude, accuracy: 5 });
  await page.goto('/');
  const createNavigation = page.waitForResponse(response => response.url().endsWith('/api/v1/navigation/sessions') && response.request().method() === 'POST');
  await page.getByRole('button', { name: /^Навігація Побудувати маршрут/ }).click();
  expect((await createNavigation).status()).toBe(201);
  await page.getByPlaceholder('Куди їдемо?').fill(destination.label);
  await page.getByRole('button', { name: 'Знайти місце' }).click();
  const destinationRoute = page.waitForResponse(response => response.url().endsWith('/destination') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: destination.label, exact: true }).click();
  const destinationResponse = await destinationRoute;
  expect(destinationResponse.status()).toBe(200);
  expect((await destinationResponse.json()).data.route.length).toBeGreaterThan(1);
  const navigationMap = page.getByRole('main');
  const navigationCanvas = navigationMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(navigationCanvas).toHaveAttribute('data-marshgo-map-ready', 'true');
  const navigationMapData = await navigationCanvas.evaluate((element) => ({ ...element.dataset }));
  expect(navigationMapData).toHaveProperty('marshgoRoutePointCount');
  expect(Number(navigationMapData.marshgoRoutePointCount)).toBeGreaterThan(1);
  await expect(page.getByTestId('navigation-live-progress')).toContainText(/^\d+ хв/);
  await expect(page.getByRole('button', { name: 'Розгорнути панель навігації' })).toBeVisible();
  // Freeze the pulsing location halo only for the screenshot; keep production motion unchanged.
  const staticLocationHalo = await page.addStyleTag({ content: '.marshgo-puck__halo { animation: none !important; }' });
  // MapLibre rasterizes the location puck edge with a stable, localized 20px variance on this host.
  await expectCanonicalScreenshot(page, 'navigation-light-route.png', { animations: 'disabled', maxDiffPixels: 24 });
  await staticLocationHalo.evaluate(style => style.parentNode?.removeChild(style));
  await page.getByRole('button', { name: 'Шари карти' }).click();
  await expect(page.getByRole('dialog', { name: 'Шари карти' })).toBeVisible();
  await expectCanonicalScreenshot(page, 'navigation-light-layers.png');

  // Keep these extra schedules out of screenshot goldens: this block verifies
  // that detail rendering handles the two additional GTFS route modes too.
  includeExtendedScheduledModes = true;
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  await page.getByPlaceholder('Місто відправлення').fill('Мало-Голосківська');
  await page.getByPlaceholder('Місто відправлення').press('Enter');
  await page.getByRole('button', { name: origin.label, exact: true }).click();
  await page.getByPlaceholder('Місто призначення').fill('Стрийська');
  await page.getByPlaceholder('Місто призначення').press('Enter');
  await page.getByRole('button', { name: destination.label, exact: true }).click();
  await page.getByRole('button', { name: 'Знайти маршрут', exact: true }).click();
  await expect(page.locator('[data-testid="journey-result-card"][data-journey-id="e2e-alt-ferry"]')).toBeVisible();
  await expect(page.locator('[data-testid="journey-result-card"][data-journey-id="e2e-alt-funicular"]')).toBeVisible();
  await verifyIntermediateStop('e2e-alt-ferry', 'e2e-alt-ferry-leg-2', 'F1', 'Проміжна зупинка · F1', '#0891B2');
  await verifyIntermediateStop('e2e-alt-funicular', 'e2e-alt-funicular-leg-2', 'Київський', 'Проміжна зупинка · Київський', '#64748B');

  // A saved confirmed Community leg must bind only its participant-scoped
  // rendezvous location, and must keep an old GPS fix visibly stale.
  const savedJourneyId = 'e2e-saved-rendezvous-journey';
  const savedBookingId = 'e2e-confirmed-booking';
  const savedLegId = 'e2e-saved-community-leg';
  let rendezvousCapturedAt = new Date(Date.now() - 120_000).toISOString();
  let rendezvousFreshness: 'LIVE' | 'STALE' = 'STALE';
  const savedDepartureAt = new Date().toISOString();
  const savedArrivalAt = new Date(Date.now() + 20 * 60_000).toISOString();
  await page.route(url => url.pathname === `/api/v1/journeys/${savedJourneyId}`, route => route.fulfill({ json: { data: {
    id: savedJourneyId,
    origin_name: 'вул. Мало-Голосківська, 12',
    destination_name: 'вул. Сихівська, 30',
    origin_coordinates: [24.003, 49.8682],
    destination_coordinates: [24.0576, 49.7941],
    requested_departure_at: savedDepartureAt,
    requested_arrival_at: savedArrivalAt,
    strategy: 'BALANCED',
    state: 'PARTIALLY_RESERVED',
    passenger_count: 1,
    total_price_minor: 5500,
    confirmed_price_minor: 5500,
    total_duration_s: 1200,
    walking_distance_m: 0,
    transfer_count: 0,
    reliability_score: null,
    waitingSeconds: 0,
    legs: [{
      id: savedLegId,
      ordinal: 0,
      mode: 'COMMUNITY',
      originName: 'вул. Мало-Голосківська, 12',
      originCoordinates: [24.003, 49.8682],
      destinationName: 'вул. Сихівська, 30',
      destinationCoordinates: [24.0576, 49.7941],
      departureAt: savedDepartureAt,
      arrivalAt: savedArrivalAt,
      durationSeconds: 1200,
      distanceMeters: 7800,
      priceMinor: 5500,
      currency: 'UAH',
      priceStatus: 'LOCKED',
      availabilityStatus: 'CONFIRMED',
      providerType: 'COMMUNITY',
      offerId: 'e2e-confirmed-offer',
      bookingId: savedBookingId,
      state: 'CONFIRMED',
      dataSource: 'e2e-confirmed-booking',
      source: 'marshgo-community',
      lastUpdatedAt: savedDepartureAt,
      metadata: {},
      routeGeometry: [[24.003, 49.8682], [24.019, 49.846], [24.038, 49.82], [24.0576, 49.7941]],
      stops: [],
    }],
  } } }));
  await page.route(url => url.pathname === `/api/v1/bookings/${savedBookingId}/rendezvous`, route => route.fulfill({ json: { data: {
    id: 'e2e-rendezvous-session',
    bookingId: savedBookingId,
    journeyLegId: savedLegId,
    state: 'ACTIVE',
    pickup: { label: 'вул. Мало-Голосківська, 12', coordinates: [24.003, 49.8682] },
    plannedPickupAt: savedDepartureAt,
    predictedPickupAt: null,
    activationAt: savedDepartureAt,
    locationSharingEnabled: true,
    driverArrivedAt: null,
    passengerArrivedAt: null,
    boardingStartedAt: null,
    completedAt: null,
    cancelledAt: null,
    currentParticipant: 'passenger',
    locations: {
      driver: { coordinates: [24.010, 49.861], accuracyMeters: 11, capturedAt: rendezvousCapturedAt, freshness: rendezvousFreshness },
      passenger: null,
    },
  } } }));
  let approachRequests = 0;
  await page.route(url => url.pathname === '/api/v1/routing/calculate', async route => {
    approachRequests += 1;
    const request = route.request().postDataJSON();
    expect(request.origin).toEqual([24.010, 49.861]);
    expect(request.destination).toEqual([24.003, 49.8682]);
    expect(request.profile.mode).toBe('CAR');
    const geometry: Array<[number, number]> = [[24.010, 49.861], [24.007, 49.864], [24.003, 49.8682]];
    await route.fulfill({ json: { data: {
      id: request.requestId,
      provider: 'osrm',
      geometry: { encoding: 'polyline6', value: encodePolyline6(geometry) },
      bounds: [[24.003, 49.861], [24.010, 49.8682]],
      distanceMeters: 1400,
      durationSeconds: 240,
      durationWithoutTrafficSeconds: 240,
      trafficAware: false,
      legs: [{ distanceMeters: 1400, durationSeconds: 240 }],
      maneuvers: [],
      confidence: 'BASELINE',
      calculatedAt: new Date().toISOString(),
      routeVersion: 1,
    } } });
  });
  await page.goto(`/journeys/${savedJourneyId}`);
  await expect(page.getByText('Збережений Journey · PARTIALLY_RESERVED')).toBeVisible();
  await page.getByTestId('saved-journey-map-button').click();
  const savedJourneyMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await expect(savedJourneyMap.locator('[data-testid="journey-rendezvous-status"]')).toContainText('Остання відома позиція водія застаріла.');
  await expect(savedJourneyMap.locator('[data-testid="journey-rendezvous-status"]')).toContainText('ETA за дорожнім маршрутом недоступний.');
  const savedMapCanvas = savedJourneyMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(savedMapCanvas).toHaveAttribute('data-marshgo-map-ready', 'true');
  await expect(savedMapCanvas).toHaveAttribute('data-marshgo-rideshare-count', '0');
  await expect(savedJourneyMap.locator(`[data-segment-id="${savedLegId}"]`).getByRole('button', { name: 'Забронювати' })).toHaveCount(0);
  await savedJourneyMap.locator(`[data-segment-id="${savedLegId}"] button[aria-label^="Вибрати сегмент:"]`).click();
  await expect(savedMapCanvas).toHaveAttribute('data-marshgo-rideshare-count', '1');
  await expect(savedMapCanvas.locator('.marshgo-rideshare-marker')).toHaveAttribute('data-freshness', 'stale');
  await expect(savedMapCanvas.locator('.marshgo-rideshare-marker')).toHaveAttribute('aria-label', 'Попутка: остання відома позиція, GPS застаріло');
  await expect(savedJourneyMap).not.toContainText(/\d+\s*хв до вас/);
  await expectMapWebGlContextHealthy(savedMapCanvas);

  // The same authorized booking may show a baseline road estimate only after
  // a fresh GPS fix and an authenticated OSRM response are both available.
  rendezvousCapturedAt = new Date().toISOString();
  rendezvousFreshness = 'LIVE';
  await page.reload();
  await expect(page.getByText('Збережений Journey · PARTIALLY_RESERVED')).toBeVisible();
  await page.getByTestId('saved-journey-map-button').click();
  const liveJourneyMap = page.getByRole('main', { name: 'Побудований маршрут' });
  const liveMapCanvas = liveJourneyMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(liveMapCanvas).toHaveAttribute('data-marshgo-map-ready', 'true');
  await liveJourneyMap.locator(`[data-segment-id="${savedLegId}"] button[aria-label^="Вибрати сегмент:"]`).click();
  await expect(liveJourneyMap.locator('[data-testid="journey-rendezvous-status"]')).toContainText('OSRM, без live-трафіку');
  await expect(liveMapCanvas).toHaveAttribute('data-marshgo-rideshare-approach-route-count', '1');
  await expect(liveMapCanvas).toHaveAttribute('data-marshgo-rideshare-approach-provider', 'osrm');
  await expect(liveMapCanvas).toHaveAttribute('data-marshgo-rideshare-approach-distance-meters', '1400');
  await expect(liveMapCanvas).toHaveAttribute('data-marshgo-rideshare-approach-duration-seconds', '240');
  expect(approachRequests).toBe(1);
  await expectMapWebGlContextHealthy(liveMapCanvas);
  expect(browserErrors).toEqual([]);
});
