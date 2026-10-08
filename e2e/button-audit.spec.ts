import { expect, test, type Page } from '@playwright/test';

/**
 * Clicks every visible button, tab and link on each screen of the signed-in web app and checks that the click
 * does something (URL, DOM or network changes) without throwing. Destructive account actions are skipped.
 */
const routes = ['/', '/journeys/search', '/trips', '/trips/plan', '/map', '/profile', '/offers/new', '/demands/new', '/demands', '/demands/mine', '/messages'];
const skip = /Вийти|Видалити|Скасувати|Завершити|Вихід|Заблокувати|Поскаржитися/i;

async function signIn(page: Page, name: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Почати', exact: true }).first().click();
  await page.getByRole('button', { name: 'Далі', exact: true }).click();
  await page.getByRole('button', { name: 'Далі', exact: true }).click();
  await page.getByRole('button', { name: 'Пропустити', exact: true }).click();
  await page.getByPlaceholder('Ваше ім’я').fill(name);
  await page.getByPlaceholder('+380 номер телефону').fill(`+38092${String(Date.now()).slice(-7)}`);
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const notice = page.getByText(/Тестовий OTP локального середовища:/);
  await expect(notice).toBeVisible();
  const otp = (await notice.innerText()).match(/\b\d{6}\b/)?.[0];
  await page.locator('input[autocomplete="one-time-code"]').fill(otp!);
  await Promise.all([page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/otp/verify') && r.status() === 200), page.getByRole('button', { name: 'Підтвердити номер' }).click()]);
  await expect(page.locator('.production-app')).toBeVisible();
}

test('every button on every main screen responds without errors', async ({ browser }) => {
  test.setTimeout(900_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 49.8397, longitude: 24.0297, accuracy: 10 }, permissions: ['geolocation'] });
  const page = await context.newPage();
  const problems: string[] = []; const noEffect: string[] = []; const clicked: string[] = [];
  let requests = 0;
  page.on('pageerror', (error) => problems.push(`pageerror @${page.url()}: ${error.message}`));
  // The isolated E2E geocoder stub has no reverse lookup; the app must show a message for that (503 on /places/) rather than fail.
  page.on('response', (response) => { if (response.status() >= 500 && !new URL(response.url()).pathname.startsWith('/api/v1/places/')) problems.push(`http ${response.status()} ${response.url()}`); });
  page.on('request', () => { requests++; });
  await signIn(page, 'Button Audit');

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(400);
    const labels = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button, [role="tab"], [role="switch"], [role="radio"], a[href]')]
      .filter((el) => { const box = el.getBoundingClientRect(); const style = getComputedStyle(el); return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true'; })
      .map((el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim()));
    const unique = [...new Set(labels.filter((label) => label && !skip.test(label)))].slice(0, 40);
    for (const label of unique) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => undefined);
      const target = page.locator('button, [role="tab"], [role="switch"], [role="radio"], a[href]').filter({ hasText: label }).first();
      const fallback = page.getByLabel(label, { exact: true }).first();
      const locator = (await target.count()) ? target : fallback;
      if (!(await locator.count()) || !(await locator.isVisible().catch(() => false))) continue;
      const before = await page.evaluate(() => ({ url: location.href, html: document.body.innerHTML.length, text: document.body.innerText.slice(0, 4000) }));
      const requestsBefore = requests;
      try { await locator.click({ timeout: 3000 }); } catch { noEffect.push(`${route} → «${label}» (not clickable)`); continue; }
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => ({ url: location.href, html: document.body.innerHTML.length, text: document.body.innerText.slice(0, 4000) }));
      clicked.push(`${route} → ${label}`);
      if (before.url === after.url && before.html === after.html && before.text === after.text && requests === requestsBefore) noEffect.push(`${route} → «${label}»`);
    }
  }
  await test.info().attach('clicked', { body: clicked.join('\n'), contentType: 'text/plain' });
  await test.info().attach('no-visible-effect', { body: noEffect.join('\n'), contentType: 'text/plain' });
  console.log(`BUTTON AUDIT: clicked ${clicked.length}, without visible effect ${noEffect.length}`);
  console.log(noEffect.map((line) => `  no effect: ${line}`).join('\n'));
  expect(problems, problems.join('\n')).toEqual([]);
  await context.close();
});
