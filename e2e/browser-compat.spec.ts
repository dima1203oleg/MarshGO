import { expect, test } from '@playwright/test';

test('production sign-in, home and search stay usable across screen sizes', async ({ page, browserName }) => {
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
  await expect(page.getByRole('heading', { name: 'Вхід за номером телефону' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: /Їдеш\? MARSHGO знайде попутника/ })).toBeVisible();

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
      const cta = [...document.querySelectorAll('button')].find(button => button.textContent?.includes('Почати навігацію'))?.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        body: { width: document.body.scrollWidth, bounds: document.body.getBoundingClientRect().toJSON() },
        root: { width: document.documentElement.scrollWidth, bounds: document.documentElement.getBoundingClientRect().toJSON() },
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
    const screenshot = await page.screenshot({ path: `/tmp/marshgo-${browserName}-${viewport.name}.png`, fullPage: true });
    await test.info().attach(`${browserName}-${viewport.name}`, { body: screenshot, contentType: 'image/png' });
  }

  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Пошук', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Знайди маршрут' })).toBeVisible();
  await expect(page.getByPlaceholder('Місто, адреса або зупинка').first()).toBeVisible();
  await page.getByRole('navigation', { name: 'Основна навігація' }).getByRole('button', { name: 'Головна', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Їдеш\? MARSHGO знайде попутника/ })).toBeVisible();

  await page.goto('/unknown-route');
  await expect(page.getByRole('heading', { name: 'Сторінку не знайдено' })).toBeVisible();
  expect(errors, `${browserName} emitted browser or server errors`).toEqual([]);
});
