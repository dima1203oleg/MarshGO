import { expect, test } from '@playwright/test';

test('route results open a full-screen map with separate transport-colored shapes', async ({ page, browserName }) => {
  const origin = { label: 'Львів, площа Ринок', latitude: 49.8419, longitude: 24.0315, providerId: 'e2e-lviv-origin' };
  const destination = { label: 'Львів, Сихів', latitude: 49.7915, longitude: 24.0628, providerId: 'e2e-lviv-destination' };
  const departure = new Date(Date.now() + 24 * 60 * 60_000);
  const busDeparture = new Date(departure.getTime() + 10 * 60_000);
  const busArrival = new Date(busDeparture.getTime() + 18 * 60_000);
  const tramDeparture = new Date(busArrival.getTime() + 8 * 60_000);
  const tramArrival = new Date(tramDeparture.getTime() + 22 * 60_000);

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
          routeGeometry: [[24.0315, 49.8419], [24.033, 49.84], [24.034, 49.838]], driver: null, vehicle: null },
        { id: 'e2e-walk-transfer', mode: 'WALK', transportType: 'walk', source: 'walking-estimate',
          origin: { name: 'Вул. Князя Романа', coordinates: [24.034, 49.838] }, destination: { name: 'Університет', coordinates: [24.036, 49.837] },
          departureAt: busArrival.toISOString(), arrivalAt: tramDeparture.toISOString(), durationSeconds: 8 * 60,
          priceMinor: null, priceStatus: 'UNKNOWN', availabilityStatus: 'AVAILABLE', lastUpdatedAt: departure.toISOString(), driver: null, vehicle: null },
        { id: 'e2e-tram-leg', mode: 'TRAM', transportType: 'tram', routeName: '8', source: 'gtfs-static',
          origin: { name: 'Університет', coordinates: [24.036, 49.837] }, destination: { name: 'Сихів', coordinates: [24.0628, 49.7915] },
          departureAt: tramDeparture.toISOString(), arrivalAt: tramArrival.toISOString(), durationSeconds: 22 * 60,
          priceMinor: null, priceStatus: 'UNKNOWN', availabilityStatus: 'UNKNOWN', lastUpdatedAt: departure.toISOString(),
          routeGeometry: [[24.036, 49.837], [24.05, 49.82]], driver: null, vehicle: null },
      ],
    }],
    requestedStrategy: 'BALANCED', availableStrategies: ['BALANCED', 'FASTEST'], partial: false,
    candidateCount: 1, paretoCount: 1, returnedCount: 1, blockedProviders: [], unsupportedPreferences: [], providerErrors: [],
  } } }));

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
  await expect(page.getByRole('heading', { name: 'Найкращі доступні варіанти' })).toBeVisible();
  await expect(page.getByText('Пішохідну відстань оцінено по прямій; реальний шлях може бути довшим.')).toBeVisible();
  await page.getByRole('button', { name: 'Показати маршрут на карті' }).click();

  const routeMap = page.getByRole('main', { name: 'Карта маршруту' });
  await expect(routeMap).toBeVisible();
  await expect(routeMap.getByText('Автобус 21')).toBeVisible();
  await expect(routeMap.getByText('Трамвай 8')).toBeVisible();
  await expect(routeMap.getByText('1 пересадка')).toBeVisible();
  const map = routeMap.locator('[data-marshgo-map-renderer="maplibre"]');
  await expect(map).toHaveAttribute('data-marshgo-route-segment-count', '2');
  await expect(map).toHaveAttribute('data-marshgo-route-point-count', '5');
  await page.screenshot({ path: `/tmp/marshgo-${browserName}-multimodal-route-map.png`, fullPage: true });
  await routeMap.getByRole('button', { name: 'Назад до результатів' }).click();
  await expect(page.getByRole('heading', { name: 'Найкращі доступні варіанти' })).toBeVisible();
});
