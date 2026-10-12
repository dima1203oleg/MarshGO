import { expect, test } from '@playwright/test';

test('canonical route map synchronizes the sheet, stop details, map focus, and light/dark palettes', async ({ page, browserName }) => {
  const origin = { label: 'Львів, площа Ринок', latitude: 49.8419, longitude: 24.0315, providerId: 'e2e-lviv-origin' };
  const destination = { label: 'Львів, Сихів', latitude: 49.7915, longitude: 24.0628, providerId: 'e2e-lviv-destination' };
  const departure = new Date(Date.now() + 24 * 60 * 60_000);
  const busDeparture = new Date(departure.getTime() + 10 * 60_000);
  const busArrival = new Date(busDeparture.getTime() + 18 * 60_000);
  const tramDeparture = new Date(busArrival.getTime() + 8 * 60_000);
  const tramArrival = new Date(tramDeparture.getTime() + 22 * 60_000);
  const makeAlternativeJourney = (
    id: string,
    departureOffsetMinutes: number,
    legs: Array<{ mode: string; transportType: string; routeName?: string; minutes: number; fareMinor: number }>,
    balancedRank: number,
    cheapestRank: number,
  ) => {
    const requestedAt = new Date(departure.getTime() + departureOffsetMinutes * 60_000);
    let cursor = requestedAt.getTime() + 2 * 60_000;
    const mappedLegs = legs.map((leg, index) => {
      const departureAt = new Date(cursor);
      const arrivalAt = new Date(cursor + leg.minutes * 60_000);
      const origin = index === 0
        ? { name: 'Площа Ринок', coordinates: [24.0315, 49.8419] }
        : { name: 'Університет', coordinates: [24.036, 49.837] };
      const destinationPoint = index === legs.length - 1
        ? { name: 'Сихів', coordinates: [24.0628, 49.7915] }
        : { name: 'Університет', coordinates: [24.036, 49.837] };
      cursor = arrivalAt.getTime() + (index < legs.length - 1 ? 3 * 60_000 : 0);
      return {
        id: `${id}-leg-${index + 1}`, mode: leg.mode, transportType: leg.transportType, routeName: leg.routeName,
        source: leg.mode === 'COMMUNITY' ? 'marshgo-community' : 'gtfs-static',
        origin, destination: destinationPoint, departureAt: departureAt.toISOString(), arrivalAt: arrivalAt.toISOString(),
        durationSeconds: leg.minutes * 60, distanceMeters: 9200, priceMinor: leg.fareMinor, currency: 'UAH',
        priceStatus: 'LOCKED', availabilityStatus: leg.mode === 'COMMUNITY' ? 'AVAILABLE' : 'SCHEDULED',
        lastUpdatedAt: departure.toISOString(), routeGeometry: [origin.coordinates, destinationPoint.coordinates],
        stops: [], driver: null, vehicle: null,
      };
    });
    const durationSeconds = Math.round((cursor - requestedAt.getTime()) / 1000);
    return {
      id, offerId: null, source: 'gtfs-static', strategy: 'BALANCED',
      recommendedStrategies: ['BALANCED', 'FASTEST', 'CHEAPEST'],
      strategyRanks: { BALANCED: balancedRank, FASTEST: balancedRank, CHEAPEST: cheapestRank },
      state: 'PLANNED', requestedDepartureAt: requestedAt.toISOString(), totalDurationSeconds: durationSeconds,
      waitingSeconds: 2 * 60 + Math.max(0, legs.length - 1) * 3 * 60,
      totalPriceMinor: legs.reduce((sum, leg) => sum + leg.fareMinor, 0), confirmedPriceMinor: null,
      estimatedPriceMinMinor: null, estimatedPriceMaxMinor: null, currency: 'UAH', priceStatus: 'LOCKED',
      walkingMeters: 0, transfers: Math.max(0, legs.length - 1), reliabilityScore: null, legs: mappedLegs,
    };
  };
  const alternativeJourneys = [
    makeAlternativeJourney('e2e-alt-tram', 5, [{ mode: 'TRAM', transportType: 'tram', routeName: '8', minutes: 68, fareMinor: 1500 }], 2, 2),
    makeAlternativeJourney('e2e-alt-community', 8, [{ mode: 'COMMUNITY', transportType: 'carpool', minutes: 64, fareMinor: 3500 }], 3, 4),
    makeAlternativeJourney('e2e-alt-bus', 11, [{ mode: 'BUS', transportType: 'bus', routeName: '21', minutes: 62, fareMinor: 2200 }], 4, 3),
    makeAlternativeJourney('e2e-alt-bus-transfer', 14, [
      { mode: 'BUS', transportType: 'bus', routeName: '7', minutes: 36, fareMinor: 800 },
      { mode: 'TRAM', transportType: 'tram', routeName: '8', minutes: 35, fareMinor: 400 },
    ], 5, 1),
  ];

  await page.route('**/api/v1/places/suggest?*', route => {
    const query = new URL(route.request().url()).searchParams.get('q')?.toLocaleLowerCase('uk-UA') ?? '';
    return route.fulfill({ json: { data: query.includes('сих') ? [destination] : [origin] } });
  });
  await page.route('**/api/v1/journeys/search', async route => route.fulfill({ json: { data: {
    journeys: [{
      id: 'e2e-multimodal-journey', offerId: null, source: 'gtfs-static', providerName: 'Львівський GTFS',
      strategy: 'BALANCED', recommendedStrategies: ['BALANCED', 'FASTEST'], strategyRanks: { BALANCED: 1, FASTEST: 1 },
      state: 'PLANNED', requestedDepartureAt: departure.toISOString(), totalDurationSeconds: 58 * 60,
      waitingSeconds: 10 * 60, totalPriceMinor: null, confirmedPriceMinor: null,
      estimatedPriceMinMinor: null, estimatedPriceMaxMinor: null, walkingMeters: 310, transfers: 1, reliabilityScore: null,
      legs: [
        { id: 'e2e-bus-leg', mode: 'BUS', transportType: 'bus', routeName: '21', source: 'gtfs-static',
          origin: { name: 'Площа Ринок', coordinates: [24.0315, 49.8419] }, destination: { name: 'Вул. Князя Романа', coordinates: [24.034, 49.838] },
          departureAt: busDeparture.toISOString(), arrivalAt: busArrival.toISOString(), durationSeconds: 18 * 60,
          priceMinor: null, priceStatus: 'UNKNOWN', availabilityStatus: 'UNKNOWN', lastUpdatedAt: departure.toISOString(),
          stops: [
            { id: 'market', name: 'Площа Ринок', coordinates: [24.0315, 49.8419], arrivalAt: busDeparture.toISOString(), departureAt: busDeparture.toISOString() },
            { id: 'roman', name: 'Вул. Князя Романа', coordinates: [24.034, 49.838], arrivalAt: busArrival.toISOString(), departureAt: busArrival.toISOString() },
          ],
          routeGeometry: [[24.0315, 49.8419], [24.033, 49.84], [24.034, 49.838]], driver: null, vehicle: null },
        { id: 'e2e-walk-transfer', mode: 'WALK', transportType: 'walk', source: 'walking-estimate',
          origin: { name: 'Вул. Князя Романа', coordinates: [24.034, 49.838] }, destination: { name: 'Університет', coordinates: [24.036, 49.837] },
          departureAt: busArrival.toISOString(), arrivalAt: tramDeparture.toISOString(), durationSeconds: 8 * 60,
          priceMinor: null, priceStatus: 'UNKNOWN', availabilityStatus: 'AVAILABLE', lastUpdatedAt: departure.toISOString(), driver: null, vehicle: null },
        { id: 'e2e-tram-leg', mode: 'TRAM', transportType: 'tram', routeName: '8', source: 'gtfs-static',
          origin: { name: 'Університет', coordinates: [24.036, 49.837] }, destination: { name: 'Сихів', coordinates: [24.0628, 49.7915] },
          departureAt: tramDeparture.toISOString(), arrivalAt: tramArrival.toISOString(), durationSeconds: 22 * 60,
          priceMinor: null, priceStatus: 'UNKNOWN', availabilityStatus: 'UNKNOWN', lastUpdatedAt: departure.toISOString(),
          stops: [
            { id: 'university', name: 'Університет', coordinates: [24.036, 49.837], arrivalAt: tramDeparture.toISOString(), departureAt: tramDeparture.toISOString() },
            { id: 'sykhiv', name: 'Сихів', coordinates: [24.0628, 49.7915], arrivalAt: tramArrival.toISOString(), departureAt: tramArrival.toISOString() },
          ],
          routeGeometry: [[24.036, 49.837], [24.05, 49.82]], driver: null, vehicle: null },
      ],
    }, ...alternativeJourneys],
    requestedStrategy: 'BALANCED', availableStrategies: ['BALANCED', 'FASTEST', 'CHEAPEST'], partial: false,
    candidateCount: 5, paretoCount: 5, returnedCount: 5, blockedProviders: [], unsupportedPreferences: [], providerErrors: [],
  } } }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
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
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/v1/auth/otp/verify') && response.status() === 200),
    page.getByRole('button', { name: 'Підтвердити номер' }).click(),
  ]);

  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  const from = page.getByPlaceholder('Місто відправлення');
  await from.fill('Львів');
  await from.press('Enter');
  await page.getByRole('button', { name: origin.label, exact: true }).click();
  const to = page.getByPlaceholder('Місто призначення');
  await to.fill('Сихів');
  await to.press('Enter');
  await page.getByRole('button', { name: destination.label, exact: true }).click();
  await page.getByRole('button', { name: 'Знайти маршрут', exact: true }).click();
  await expect(page.locator('.journey-results').getByText('Маршрут: Львів, площа Ринок → Львів, Сихів')).toBeVisible();
  await expect(page.locator('.app-header')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('details.coverage-details')).toHaveCount(0);
  const resultCard = page.getByTestId('journey-result-card').first();
  const transportChain = resultCard.getByRole('list', { name: /Послідовність етапів маршруту/ });
  await expect(transportChain.getByRole('listitem')).toHaveCount(4);
  await expect(transportChain.getByRole('listitem').nth(0)).toContainText('Очікування');
  await expect(transportChain.getByRole('listitem').nth(1)).toContainText('Автобус 21');
  await expect(transportChain.getByRole('listitem').nth(2)).toContainText('Пішки');
  await expect(transportChain.getByRole('listitem').nth(3)).toContainText('Трамвай 8');
  const strategySwitch = page.getByRole('group', { name: 'Режим пошуку маршрутів' });
  await expect(strategySwitch.getByRole('button')).toHaveCount(3);
  expect(await strategySwitch.locator('button span').allTextContents()).toEqual(['Оптимальний', 'Найшвидший', 'Найдешевший']);
  expect(await strategySwitch.locator('button span').evaluateAll(spans => spans.map(span => span.scrollWidth > span.clientWidth))).toEqual([false, false, false]);
  const cheapestMode = strategySwitch.getByRole('button', { name: /Найдешевший, 4 маршрути/ });
  await expect(cheapestMode).toBeEnabled();
  await cheapestMode.click();
  await expect(page.getByTestId('journey-result-card')).toHaveCount(4);
  await expect(page.getByTestId('journey-result-card').first()).toHaveAttribute('data-journey-id', 'e2e-alt-bus-transfer');
  await strategySwitch.getByRole('button', { name: /Оптимальний, 5 маршрутів/ }).click();
  await expect(page.getByTestId('journey-result-card')).toHaveCount(5);
  const saveRoute = resultCard.getByRole('button', { name: 'Зберегти маршрут' });
  await expect(saveRoute).toHaveAttribute('aria-pressed', 'false');
  await saveRoute.click();
  await expect(resultCard.getByRole('button', { name: 'Видалити маршрут зі збережених' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').getByText('Маршрут збережено на цьому пристрої')).toBeVisible();
  await resultCard.getByRole('button', { name: 'Видалити маршрут зі збережених' }).click();
  await expect(resultCard.getByRole('button', { name: 'Зберегти маршрут' })).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-journey-results.png` });
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect.poll(() => resultCard.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(17, 24, 32)');
  await expect(resultCard.locator('p').first()).toHaveCSS('color', 'rgb(245, 249, 255)');
  await expect.poll(() => cheapestMode.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(17, 24, 32)');
  await expect(resultCard.locator('[data-segment-mode="BUS"]')).toHaveCSS('background-color', 'rgb(22, 135, 255)');
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-journey-results-dark.png` });
  await resultCard.getByRole('button', { name: /Відкрити маршрут:/ }).click();

  const routeMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await expect(routeMap).toBeVisible();
  await expect(routeMap).toHaveAttribute('data-theme', 'light');
  await expect(routeMap.getByText('Автобус 21')).toBeVisible();
  await expect(routeMap.getByText('Трамвай 8')).toBeVisible();
  await expect(routeMap.getByText('Відстань не вказана')).toBeVisible();
  await expect(routeMap.getByText(/NaN/)).toHaveCount(0);
  const sheet = routeMap.getByTestId('route-bottom-sheet');
  await expect(sheet).toHaveAttribute('data-sheet-state', 'half');
  await sheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(sheet).toHaveAttribute('data-sheet-state', 'expanded');
  await sheet.getByRole('button', { name: 'Згорнути деталі маршруту' }).click();
  await expect(sheet).toHaveAttribute('data-sheet-state', 'collapsed');
  await sheet.getByRole('button', { name: 'Розгорнути деталі маршруту' }).click();
  await expect(sheet).toHaveAttribute('data-sheet-state', 'half');
  await expect(routeMap.getByRole('button', { name: /На карті/ })).toHaveCount(0);
  await expect(routeMap.locator('img')).toHaveCount(0);
  const map = routeMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(map).toHaveAttribute('data-marshgo-route-segment-count', '2');
  await expect(map).toHaveAttribute('data-marshgo-route-point-count', '5');
  const busTimeline = routeMap.getByRole('button', { name: 'Автобус 21, 18 хв' });
  await busTimeline.click();
  const busCard = routeMap.locator('[data-segment-id="e2e-bus-leg"]');
  await expect(busCard).toHaveAttribute('data-active', 'true');
  await expect(busCard.getByRole('button', { name: 'Згорнути зупинки: Автобус' })).toHaveAttribute('aria-expanded', 'true');
  await expect(busCard.getByText('Площа Ринок').last()).toBeVisible();
  await expect(busCard.getByText('Вул. Князя Романа').last()).toBeVisible();
  await expect(map).toHaveAttribute('data-marshgo-active-route-segment-id', 'e2e-bus-leg');
  await expect(map).toHaveAttribute('data-marshgo-focused-route-segment-id', 'e2e-bus-leg');
  await busCard.getByRole('button', { name: 'Згорнути зупинки: Автобус' }).click();
  await expect(busCard.getByRole('button', { name: 'Розгорнути зупинки: Автобус' })).toHaveAttribute('aria-expanded', 'false');
  const tramCard = routeMap.locator('[data-segment-id="e2e-tram-leg"]');
  await tramCard.getByRole('button', { name: /Вибрати сегмент: Трамвай 8/ }).click();
  await expect(tramCard).toHaveAttribute('data-active', 'true');
  await expect(tramCard.getByText('Університет').last()).toBeVisible();
  await expect(tramCard.getByText('Сихів').last()).toBeVisible();
  await expect(map).toHaveAttribute('data-marshgo-active-route-segment-id', 'e2e-tram-leg');
  await expect(map).toHaveAttribute('data-marshgo-focused-route-segment-id', 'e2e-tram-leg');
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-multimodal-route-map.png`, fullPage: true });
  await routeMap.getByRole('button', { name: 'Назад до результатів' }).click();
  await expect(page.locator('.journey-results').getByText('Маршрут: Львів, площа Ринок → Львів, Сихів')).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Основна навігація' });
  await navigation.getByRole('button', { name: 'Профіль', exact: true }).click();
  await page.getByRole('button', { name: /Налаштування/ }).click();
  await page.getByRole('button', { name: 'Темна (Ніч)' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');
  await navigation.getByRole('button', { name: 'Пошук', exact: true }).click();
  await page.getByTestId('journey-result-card').first().getByRole('button', { name: /Відкрити маршрут:/ }).click();
  const darkRouteMap = page.getByRole('main', { name: 'Побудований маршрут' });
  await expect(darkRouteMap).toHaveAttribute('data-theme', 'dark');
  await expect(darkRouteMap.getByTestId('route-bottom-sheet')).toHaveAttribute('data-sheet-state', 'half');
  await expect(darkRouteMap.locator('[data-segment-id="e2e-bus-leg"]')).toHaveCSS('background-color', 'rgb(16, 32, 46)');
  await expect.poll(() => darkRouteMap.locator('[data-marshgo-map-renderer="maplibre"]').evaluate(element =>
    getComputedStyle(element).backgroundImage.includes('rgb(19, 45, 71)'))).toBe(true);
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-multimodal-route-map-dark.png`, fullPage: true });
});
