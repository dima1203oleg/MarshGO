import { expect, test } from '@playwright/test';

test('production UI stays usable at phone, tablet and desktop sizes with current API data', async ({ page, browserName }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  // The pinned Server release predates the optional Mobility API; its 404 is tolerated, other 404s are not.
  let tolerated404s = 0;
  page.on('response', response => { if (response.status() === 404 && new URL(response.url()).pathname.startsWith('/api/v1/mobility/')) tolerated404s++; });
  page.on('console', message => {
    // A 401 while restoring an absent refresh cookie is the expected signed-out
    // startup path. Surface all other console errors as compatibility failures.
    if (message.type() !== 'error') return;
    if (/401 \(Unauthorized\)/.test(message.text())) return;
    if (/404 \(Not Found\)/.test(message.text()) && tolerated404s > 0) { tolerated404s--; return; }
    errors.push(`console: ${message.text()}`);
  });
  page.on('response', response => { if (response.status() >= 500) errors.push(`http ${response.status()}: ${response.url()}`); });

  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('.auth-intro-screen > section')).toBeVisible();
  expect(await page.locator('.auth-intro-screen > section').evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(1100);
  const welcomeScreenshot = await page.screenshot({ path: `/tmp/marshgo-${browserName}-desktop-welcome.png`, fullPage: true });
  await test.info().attach(`${browserName}-desktop-welcome`, { body: welcomeScreenshot, contentType: 'image/png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Почати', exact: true }).first().click();
  await page.getByRole('button', { name: 'Далі', exact: true }).click();
  await page.getByRole('button', { name: 'Далі', exact: true }).click();
  await page.getByRole('button', { name: 'Пропустити', exact: true }).click();
  await page.getByPlaceholder('Ваше ім’я').fill(`Compat ${browserName}`);
  const phone = `+38091${String(Date.now()).slice(-7)}`;
  await page.getByPlaceholder('+380 номер телефону').fill(phone);
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const otpNotice = page.getByText(/Тестовий OTP локального середовища:/);
  await expect(otpNotice).toBeVisible();
  const otp = (await otpNotice.innerText()).match(/\b\d{6}\b/)?.[0];
  expect(otp, 'only the isolated E2E API may expose the test OTP').toMatch(/^\d{6}$/);
  await page.locator('input[autocomplete="one-time-code"]').fill(otp!);
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/v1/auth/otp/verify') && response.status() === 200),
    page.getByRole('button', { name: 'Підтвердити номер' }).click(),
  ]);
  await expect(page.locator('.production-app')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Подорожуйте Україною простіше/ })).toBeVisible();
  await expect(page.getByText(/Ще немає завантажених пропозицій/)).toBeVisible();
  await expect(page.getByText('100+ маршрутів')).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('navigation', { name: 'Розділи MARSHGO' }).getByRole('button', { name: 'Пошук поїздок' }).click();
  await expect(page).toHaveURL(/\/journeys\/search$/);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук' })).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/unknown-route');
  await expect(page.getByRole('heading', { name: 'Сторінку не знайдено' })).toBeVisible();
  await page.getByRole('button', { name: 'На головну' }).click();
  await expect(page).toHaveURL(/\/$/);

  for (const viewport of [
    { name: 'mobile-375', width: 375, height: 812 },
    { name: 'mobile-430', width: 430, height: 932 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'tablet-1024', width: 1024, height: 1366 },
    { name: 'desktop-1440', width: 1440, height: 1000 },
    { name: 'desktop-1920', width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(120);
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      content: document.querySelector('.home-screen')?.getBoundingClientRect().width ?? 0,
      navigation: getComputedStyle(document.querySelector('.app-tabbar')!).position,
    }));
    expect(metrics.document, `${browserName} ${viewport.name} has horizontal overflow`).toBeLessThanOrEqual(viewport.width);
    expect(metrics.content, `${browserName} ${viewport.name} main content is missing`).toBeGreaterThan(Math.min(viewport.width * 0.72, 680));
    if (viewport.width <= 430) {
      const passengerCounter = page.getByRole('button', { name: 'Менше пасажирів' }).locator('..');
      const itemBounds = await passengerCounter.locator(':scope > *').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      }));
      expect(itemBounds).toHaveLength(4);
      for (let index = 0; index < itemBounds.length; index++) {
        expect(itemBounds[index].width, `${browserName} phone passenger counter item ${index} has no width`).toBeGreaterThan(0);
        if (index > 0) expect(itemBounds[index].left, `${browserName} phone passenger counter items overlap`).toBeGreaterThanOrEqual(itemBounds[index - 1].right);
      }
    }
    if (viewport.width >= 1024) {
      await expect(page.getByRole('navigation', { name: 'Розділи MARSHGO' })).toBeVisible();
      expect(metrics.navigation).toBe('sticky');
    }
    const screenshot = await page.screenshot({ path: `/tmp/marshgo-${browserName}-${viewport.name}.png`, fullPage: true });
    await test.info().attach(`${browserName}-${viewport.name}`, {
      body: screenshot,
      contentType: 'image/png',
    });
  }

  expect(errors, `${browserName} emitted browser or server errors`).toEqual([]);
});
