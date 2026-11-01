/* global document, getComputedStyle, window */
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 size
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  console.log("Navigating to http://127.0.0.1:3000");
  await page.goto('http://127.0.0.1:3000');

  // Sign in logic copied from E2E
  const welcome = page.getByRole('button', { name: /У мене вже є акаунт/i });
  if (await welcome.isVisible()) await welcome.click();
  await page.getByPlaceholder('Ваше ім’я').fill('Test User');
  await page.getByPlaceholder('+380 номер телефону').fill('+380501234567');
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const otpNotice = page.getByText(/Тестовий OTP локального середовища:/);
  await otpNotice.waitFor();
  const code = (await otpNotice.innerText()).match(/\b\d{6}\b/)?.[0];
  await page.locator('input[autocomplete="one-time-code"]').fill(code);
  await page.getByRole('button', { name: 'Підтвердити номер' }).click();
  await page.waitForSelector('.app-tabbar');

  const getTabbarRect = async (label) => {
    return await page.evaluate((l) => {
      const tabbar = document.querySelector('.app-tabbar');
      if (!tabbar) return null;
      const rect = tabbar.getBoundingClientRect();
      const pos = getComputedStyle(tabbar).position;
      const bottom = getComputedStyle(tabbar).bottom;

      const prodApp = document.querySelector('.production-app');
      const pRect = prodApp ? prodApp.getBoundingClientRect() : null;

      return {
        step: l,
        tabbar_pos: pos,
        tabbar_bottom_css: bottom,
        tabbar_rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
        prodApp_rect: pRect ? { top: pRect.top, bottom: pRect.bottom, height: pRect.height } : null,
        body_classes: document.body.className,
        body_rect: document.body.getBoundingClientRect(),
        window_innerHeight: window.innerHeight
      };
    }, label);
  };

  console.log("INITIAL:", await getTabbarRect('initial'));

  console.log("Clicking Trips...");
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Мої поїздки' }).click();
  await page.waitForTimeout(500);
  console.log("TRIPS:", await getTabbarRect('trips'));

  console.log("Clicking Home...");
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Головна', exact: true }).click();
  await page.waitForTimeout(500);
  console.log("HOME (after back):", await getTabbarRect('home_after_back'));

  await browser.close();
})();
