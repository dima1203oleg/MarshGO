import { expect, test } from '@playwright/test';
import type { ApiBooking } from '../src/services/productionApi';

test('production sign-in, home and search stay usable across screen sizes', async ({ page, browserName }) => {
  const activeBooking: ApiBooking = {
    id: 'layout-check-booking', offer_id: 'layout-check-offer', seat_count: 1,
    total_price_minor: 0, currency: 'UAH', fee_class: 'community',
    platform_fee_minor: 0, fee_rule_version: 'test', status: 'confirmed',
    origin_name: 'Львів', destination_name: 'Стрий',
    departure_at: new Date(Date.now() + 86_400_000).toISOString(),
    driver_name: 'Test Driver', passenger_name: 'Test Passenger',
    current_user_is_driver: false, completion_confirmation_count: 0,
    current_user_confirmed_completion: false, current_user_has_review: false,
  };
  // Keep the API sign-in real while rendering the home state that exposes the
  // extra active-trip card. No booking is written to the isolated test database.
  await page.route('**/api/v1/bookings', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { data: [activeBooking] } })
    : route.continue());
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' && !/401 \(Unauthorized\)|404 \(Not Found\)/.test(message.text())) errors.push(`console: ${message.text()}`);
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (response.status() >= 500 || (response.status() === 404 && !url.pathname.startsWith('/api/v1/mobility/'))) {
      errors.push(`http ${response.status()}: ${response.url()}`);
    }
  });

  await page.goto('/');
  const loginHeading = page.getByRole('heading', { name: 'Вхід за номером телефону' });
  const welcome = page.getByRole('button', { name: /У мене вже є акаунт/i });
  await expect(loginHeading.or(welcome).first()).toBeVisible();
  if (await welcome.isVisible()) await welcome.click();
  await expect(loginHeading).toBeVisible();
  await page.getByPlaceholder('Ваше ім’я').fill(`Compat ${browserName}`);
  await page.getByPlaceholder('+380 номер телефону').fill(`+38091${String(Date.now()).slice(-7)}`);
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const otpNotice = page.getByText(/Тестовий OTP локального середовища:/);
  await expect(otpNotice).toBeVisible();
  const otp = (await otpNotice.innerText()).match(/\b\d{6}\b/)?.[0];
  expect(otp, 'only the isolated local E2E API may expose the test OTP').toMatch(/^\d{6}$/);
  await page.locator('input[autocomplete="one-time-code"]').fill(otp!);
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/v1/auth/otp/verify') && response.status() === 200),
    page.getByRole('button', { name: 'Підтвердити номер' }).click(),
  ]);
  await expect(page.locator('.production-app')).toBeVisible();
  await expect(page.locator('.production-app')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Відкрити MarshPass: Львів — Стрий' })).toBeVisible();

  for (const viewport of [
    { name: 'small-phone', width: 320, height: 568 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'large-phone', width: 440, height: 956 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'wide-desktop', width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => {
      const cta = document.querySelector<HTMLElement>('.home-action-card--navigation')?.getBoundingClientRect();
      const bounds = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      };
      const homeCards = [...document.querySelectorAll<HTMLElement>('.home-action-card')].map(element => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        body: { width: document.body.scrollWidth, bounds: document.body.getBoundingClientRect().toJSON() },
        root: { width: document.documentElement.scrollWidth, bounds: document.documentElement.getBoundingClientRect().toJSON() },
        header: bounds('.production-app > .app-header'),
        home: bounds('.home-hero--canonical'),
        hero: bounds('.home-canonical-banner, .home-marshpass-slot'),
        actions: bounds('.home-action-grid'),
        homeCards,
        tabbar: bounds('.production-app > .app-tabbar'),
        tabbarPosition: getComputedStyle(document.querySelector<HTMLElement>('.production-app > .app-tabbar')!).position,
        tabbarBottom: document.querySelector<HTMLElement>('.production-app > .app-tabbar')?.getBoundingClientRect().bottom ?? null,
        scrollY: window.scrollY,
        overflowers: [...document.querySelectorAll<HTMLElement>('html, body, body *')].map(element => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: typeof element.className === 'string' ? element.className.slice(0, 100) : '', text: element.textContent?.trim().slice(0, 50), left: rect.left, right: rect.right, width: rect.width };
        }).filter(element => element.right > window.innerWidth + 1 || element.left < -1).slice(0, 8),
        cta: cta ? { left: cta.left, right: cta.right, top: cta.top, bottom: cta.bottom } : null,
      };
    });
    expect(layout.documentWidth, `${viewport.name} has horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(viewport.width);
    expect(layout.cta, `${viewport.name} is missing the primary action`).not.toBeNull();
    expect(layout.cta!.left, `${viewport.name} primary action begins outside the viewport`).toBeGreaterThanOrEqual(0);
    expect(layout.cta!.right, `${viewport.name} primary action ends outside the viewport`).toBeLessThanOrEqual(viewport.width);
    if (viewport.height >= 667) expect(layout.cta!.bottom, `${viewport.name} primary action is clipped below the viewport`).toBeLessThanOrEqual(viewport.height);
    if (viewport.width < 640) {
      expect(layout.documentHeight, `${viewport.name} page should not scroll vertically`).toBeLessThanOrEqual(viewport.height + 1);
      expect(layout.home, `${viewport.name} must show the home screen`).not.toBeNull();
      expect(layout.hero!.top, `${viewport.name} hero starts below the app header`).toBeGreaterThanOrEqual(layout.header!.bottom - 1);
      expect(layout.homeCards, `${viewport.name} should render all four home actions`).toHaveLength(4);
      if (viewport.width === 390 && viewport.height === 844) {
        expect(layout.homeCards.every(card => Math.abs(card.width - card.height) <= 2), 'canonical phone Home actions must remain square').toBe(true);
      }
      if (viewport.height <= 730) {
        const home = page.locator('.home-hero--canonical');
        await home.evaluate(element => { element.scrollTop = element.scrollHeight; });
        const publishCard = page.locator('.home-action-card--publish');
        await expect(publishCard).toBeInViewport();
        const compactLayout = await page.evaluate(() => ({
          publishBottom: document.querySelector<HTMLElement>('.home-action-card--publish')?.getBoundingClientRect().bottom ?? Infinity,
          tabbarTop: document.querySelector<HTMLElement>('.app-tabbar')?.getBoundingClientRect().top ?? 0,
        }));
        expect(compactLayout.publishBottom, `${viewport.name} publish action must be reachable above the fixed tab bar`).toBeLessThanOrEqual(compactLayout.tabbarTop + 1);
        await home.evaluate(element => { element.scrollTop = 0; });
      } else {
        expect(Math.max(...layout.homeCards.map(card => card.bottom)), `${viewport.name} home cards must fit above the fixed tab bar`).toBeLessThanOrEqual(layout.tabbar!.top + 1);
      }
      const minActionHeight = viewport.height <= 620 ? 65 : 95;
      expect(layout.homeCards.every(card => card.bottom > card.top + minActionHeight), `${viewport.name} action cards must retain readable height`).toBe(true);
      // WebKit's emulated small-phone viewport excludes its bottom safe-area inset.
      expect(layout.tabbarBottom, `${viewport.name} tab bar must stay pinned to the viewport bottom`).toBeGreaterThanOrEqual(viewport.height - 8);
      expect(layout.tabbarPosition, `${viewport.name} must use the same fixed tab bar as Trips and Profile`).toBe('fixed');
      expect(layout.scrollY, `${viewport.name} home must not be vertically scrolled`).toBe(0);
    }
    if (viewport.name === 'phone') {
      const screenshot = await page.screenshot({ path: `/tmp/marshgo-${browserName}-${viewport.name}.png` });
      await test.info().attach(`${browserName}-${viewport.name}`, { body: screenshot, contentType: 'image/png' });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const homeTabbarHeight = await page.locator('.app-tabbar').evaluate(element => element.getBoundingClientRect().height);
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Куди їдемо?' })).toBeVisible();
  await expect(page.getByPlaceholder('Місто відправлення')).toBeVisible();
  await expect(page.getByPlaceholder('Місто призначення')).toBeVisible();
  const transportPanel = page.getByRole('region', { name: 'Види транспорту' });
  await expect(transportPanel).toBeVisible();
  const expectedModes = [
    'Попутки', 'Маршрутки', 'Автобуси', 'Таксі', 'Тролейбуси', 'Метро',
    'Трамваї', 'Поїзди', 'Велосипеди', 'Самокати', 'Каршеринг', 'Трансфери',
  ];
  const modeTiles = transportPanel.locator('.transport-mode-grid > button');
  await expect(modeTiles).toHaveCount(12);
  expect(await modeTiles.evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')?.split('. ')[0] ?? ''))).toEqual(expectedModes);
  await expect(transportPanel.getByRole('button', { name: /^Таксі\./ })).toBeDisabled();
  const carpoolTile = transportPanel.getByRole('button', { name: /^Попутки/ });
  await expect(carpoolTile).toHaveAttribute('aria-pressed', 'true');
  await carpoolTile.click();
  await expect(carpoolTile).toHaveAttribute('aria-pressed', 'false');
  await carpoolTile.click();
  await expect(carpoolTile).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Знайти маршрут', exact: true })).toBeVisible();
  await transportPanel.getByRole('button', { name: 'Фільтри провайдерів' }).click();
  await expect(page.getByRole('dialog', { name: 'Фільтри маршруту' })).toBeVisible();
  await page.getByRole('button', { name: 'Закрити вибір транспорту' }).click();
  await expect(transportPanel).toBeVisible();
  for (const width of [320, 390, 440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `search screen must not overflow at ${width}px`).toBeLessThanOrEqual(width);
    const tileHeights = await modeTiles.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    expect(tileHeights.every(height => height >= 44), `transport controls must remain touchable at ${width}px`).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/marshgo-site-search-canonical-light.png', fullPage: true });
  await page.evaluate(() => localStorage.setItem('mg_theme', 'dark'));
  await page.reload();
  await expect(page.locator('.production-app')).toBeVisible();
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Куди їдемо?' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Види транспорту' }).locator('.transport-mode-grid > button')).toHaveCount(12);
  const darkSurface = await page.locator('.search-screen .journey-search-card').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(darkSurface, 'search form must use the canonical graphite surface in dark mode').toBe('rgb(17, 24, 32)');
  const darkIntroBorder = await page.locator('.search-screen .home-intro').evaluate(element => getComputedStyle(element).borderColor);
  expect(darkIntroBorder, 'search header must use a quiet graphite border in dark mode').toBe('rgb(38, 54, 72)');
  const selectedModeBorder = await page.getByRole('region', { name: 'Види транспорту' }).getByRole('button', { name: /^Попутки/ }).evaluate(element => getComputedStyle(element).borderColor);
  expect(selectedModeBorder, 'selected transport mode must keep the electric-blue state in dark mode').toBe('rgb(22, 135, 255)');
  await page.screenshot({ path: '/tmp/marshgo-site-search-canonical-dark.png', fullPage: true });
  const searchTabbar = await page.locator('.app-tabbar').evaluate(element => ({
    position: getComputedStyle(element).position,
    bottom: element.getBoundingClientRect().bottom,
    height: element.getBoundingClientRect().height,
  }));
  expect(searchTabbar.position, 'search must use the same fixed tab bar as Trips and Profile').toBe('fixed');
  // WebKit's emulated phone viewport excludes the bottom safe-area inset.
  expect(searchTabbar.bottom, 'search tab bar must remain above only the WebKit safe-area inset').toBeGreaterThanOrEqual(836);
  expect(searchTabbar.height, 'bottom navigation must keep the same height across tabs').toBeCloseTo(homeTabbarHeight, 0);
  for (const destination of ['Мої поїздки', 'Профіль', 'Пошук']) {
    await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: destination, exact: true }).click();
    await expect(page.locator('.app-tabbar')).toBeVisible();
    const nav = await page.locator('.app-tabbar').evaluate(element => ({
      position: getComputedStyle(element).position,
      bottom: element.getBoundingClientRect().bottom,
      height: element.getBoundingClientRect().height,
    }));
    expect(nav.position, `${destination} should keep the shared tab bar fixed`).toBe('fixed');
    expect(nav.bottom, `${destination} should pin the tab bar above only the WebKit safe-area inset`).toBeGreaterThanOrEqual(836);
    expect(nav.height, `${destination} should keep the tab bar height stable`).toBeCloseTo(homeTabbarHeight, 0);
  }
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Головна', exact: true }).click();
  await expect(page.locator('.production-app')).toBeVisible();

  await page.goto('/unknown-route');
  await expect(page.getByRole('heading', { name: 'Сторінку не знайдено' })).toBeVisible();
  expect(errors, `${browserName} emitted browser or server errors`).toEqual([]);
});
