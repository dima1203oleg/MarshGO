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

  await page.waitForSelector('.app-tabbar');
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
