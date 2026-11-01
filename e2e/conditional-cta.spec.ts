import { expect, test } from '@playwright/test';
import { requestDevelopmentOtp } from './support/developmentOtp';

async function signIn(page: import('@playwright/test').Page, label: string) {
  await page.goto('/');
  const loginHeading = page.getByRole('heading', { name: 'Вхід за номером телефону' });
  const welcome = page.getByRole('button', { name: /У мене вже є акаунт/i });
  await expect(loginHeading.or(welcome).first()).toBeVisible();
  if (await welcome.isVisible()) await welcome.click();
  await expect(loginHeading).toBeVisible();
  await page.getByPlaceholder('Ваше ім’я').fill(label);
  await page.getByPlaceholder('+380 номер телефону').fill(`+38093${String(Date.now()).slice(-7)}`);
  const otp = await requestDevelopmentOtp(page);
  await page.locator('input[autocomplete="one-time-code"]').fill(otp!);
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/v1/auth/otp/verify') && response.status() === 200),
    page.getByRole('button', { name: 'Підтвердити номер' }).click(),
  ]);
  await expect(page.locator('.production-app')).toBeVisible();
}

test('create-demand empty state opens the demand form', async ({ page, browserName }) => {
  await signIn(page, `CTA ${browserName}`);
  await page.goto('/demands/mine');
  await expect(page.getByRole('heading', { name: 'Мої заявки' })).toBeVisible();
  await page.getByRole('button', { name: 'Створити заявку' }).click();
  await expect(page).toHaveURL(/\/demands\/new$/);
  await expect(page.getByRole('heading', { name: 'Шукаю поїздку' })).toBeVisible();
});

test('home publish action opens the publish choices', async ({ page, browserName }) => {
  await signIn(page, `Publish CTA ${browserName}`);
  await page.goto('/');
  await page.getByRole('button', { name: 'Опублікувати поїздку', exact: true }).first().click();
  await expect(page).toHaveURL(/\/trips\/plan$/);
  await expect(page.getByRole('heading', { name: 'Як ви їдете?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Я їду автомобілем/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Я хочу поїхати' })).toBeVisible();
});

test('transient form feedback can be dismissed and is cleared when changing sections', async ({ page, browserName }) => {
  await signIn(page, `Status lifecycle ${browserName}`);
  await page.goto('/demands/new');
  await page.getByRole('button', { name: 'Знайти', exact: true }).first().click();
  const status = page.getByRole('status');
  await expect(status).toContainText('Введіть щонайменше 3 символи для пошуку місця.');
  await status.getByRole('button', { name: 'Закрити повідомлення' }).click();
  await expect(status).toHaveCount(0);

  await page.getByRole('button', { name: 'Знайти', exact: true }).first().click();
  await expect(status).toBeVisible();
  await page.getByRole('button', { name: 'Профіль', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Профіль', exact: true })).toBeVisible();
  await expect(status).toHaveCount(0);
});

test('search origin and destination swap preserves both entered values', async ({ page, browserName }) => {
  await signIn(page, `Search swap ${browserName}`);
  await page.goto('/search');
  const origin = page.getByPlaceholder('Місто відправлення');
  const destination = page.getByPlaceholder('Місто призначення');
  await origin.fill('Львів');
  await destination.fill('Стрий');
  await page.getByRole('button', { name: 'Поміняти місцями', exact: true }).click();
  await expect(origin).toHaveValue('Стрий');
  await expect(destination).toHaveValue('Львів');
});

test('navigation starts without a destination when a fresh GPS fix is available', async ({ page, browserName }) => {
  if (browserName === 'firefox') {
    await page.addInitScript(() => {
      const geolocation = navigator.geolocation;
      const normalize = (position: GeolocationPosition) => new Proxy(position, {
        get(target, property) {
          if (property === 'timestamp') return target.timestamp - 24 * 60 * 60 * 1000;
          return Reflect.get(target, property, target);
        },
      });
      const current = geolocation.getCurrentPosition.bind(geolocation);
      const watch = geolocation.watchPosition.bind(geolocation);
      Object.defineProperty(geolocation, 'getCurrentPosition', { configurable: true, value: (success: PositionCallback, error?: PositionErrorCallback | null, options?: PositionOptions) => current(position => success(normalize(position)), error, options) });
      Object.defineProperty(geolocation, 'watchPosition', { configurable: true, value: (success: PositionCallback, error?: PositionErrorCallback | null, options?: PositionOptions) => watch(position => success(normalize(position)), error, options) });
    });
  }
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 49.8397, longitude: 24.0297, accuracy: 5 });
  await signIn(page, `Navigation start ${browserName} ${Date.now()}`);
  await page.goto('/navigation');

  let sessionId: string | undefined;
  try {
    const createSession = page.waitForResponse(response => response.url().endsWith('/api/v1/navigation/sessions') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Почати без пункту призначення', exact: true }).click();
    const response = await createSession;
    expect(response.status(), await response.text()).toBe(201);
    sessionId = (await response.json()).data.id as string;
    await expect(page.getByRole('button', { name: 'Завершити навігацію' })).toBeVisible();

    const finishSession = page.waitForResponse(result => result.url().endsWith(`/api/v1/navigation/sessions/${sessionId}/end`) && result.request().method() === 'POST');
    await page.getByRole('button', { name: 'Завершити навігацію' }).click();
    expect((await finishSession).status()).toBe(200);
    sessionId = undefined;
  } finally {
    if (sessionId && await page.getByRole('button', { name: 'Завершити навігацію' }).isVisible().catch(() => false)) {
      const finishSession = page.waitForResponse(response => response.url().endsWith(`/api/v1/navigation/sessions/${sessionId}/end`) && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Завершити навігацію' }).click();
      await finishSession;
    }
  }
});
