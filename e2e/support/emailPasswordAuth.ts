import { randomBytes, scryptSync } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { Client } from 'pg';

export const E2E_AUTH_PASSWORD = 'MarshgoE2e!2026';

export function e2eEmailForPhone(phone: string): string {
  return `${phone.replace(/\D/g, '')}@e2e.marshgo.test`;
}

export function hashE2ePassword(password: string = E2E_AUTH_PASSWORD): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

// Verified phone state is a database fixture, not proof of real-world verification.
async function seedVerifiedE2eProfile(databaseUrl: string, email: string, phone: string): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query(
      'UPDATE users SET phone_e164=$1, is_verified=true WHERE lower(email)=lower($2)',
      [phone, email],
    );
    expect(result.rowCount, 'the signed-in E2E account should exist in the isolated database').toBe(1);
  } finally {
    await client.end();
  }
}

export async function signInWithEmailPassword(page: Page, name: string, phone: string): Promise<string> {
  const databaseUrl = process.env.E2E_DATABASE_URL;
  if (!databaseUrl) throw new Error('E2E_DATABASE_URL must point to the isolated local PostGIS test database');
  const database = new URL(databaseUrl);
  if (!['127.0.0.1', 'localhost', '::1'].includes(database.hostname)
    || !/^marshgo_e2e(?:_[a-z0-9_]+)?$/.test(database.pathname.slice(1))) {
    throw new Error('Browser E2E tests require a loopback marshgo_e2e-prefixed database');
  }
  const email = e2eEmailForPhone(phone);
  await page.goto('/');
  const browserUrl = new URL(page.url());
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(browserUrl.hostname) || browserUrl.port !== '3300') {
    throw new Error('Email E2E fixtures require the isolated loopback browser on port 3300');
  }
  const loginHeading = page.getByRole('heading', { name: 'Вхід до MARSHGO' });
  const registerHeading = page.getByRole('heading', { name: 'Реєстрація', exact: true });
  const welcome = page.getByRole('button', { name: /У мене вже є акаунт/i });
  await expect(loginHeading.or(registerHeading).or(welcome).first()).toBeVisible();
  if (await welcome.isVisible()) await welcome.click();
  if (await loginHeading.isVisible()) {
    await page.getByRole('button', { name: 'Немає акаунта? Зареєструватися' }).click();
  }
  await expect(registerHeading).toBeVisible();
  await page.locator('#register-name').fill(name);
  await page.locator('#register-email').fill(email);
  await page.locator('#register-password').fill(E2E_AUTH_PASSWORD);
  let [authResponse] = await Promise.all([
    page.waitForResponse(response => response.url() === new URL('/api/v1/auth/register', page.url()).href
      && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Зареєструватися', exact: true }).click(),
  ]);
  if (authResponse.status() === 409) {
    expect((await authResponse.json()).error?.code).toBe('email_already_registered');
    await page.getByRole('button', { name: 'Вже є акаунт? Увійти' }).click();
    await expect(loginHeading).toBeVisible();
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(E2E_AUTH_PASSWORD);
    [authResponse] = await Promise.all([
      page.waitForResponse(response => response.url() === new URL('/api/v1/auth/login', page.url()).href
        && response.request().method() === 'POST'),
      page.getByRole('button', { name: 'Увійти', exact: true }).click(),
    ]);
  }
  expect([200, 201], 'email auth should succeed through the isolated E2E API').toContain(authResponse.status());
  expect(Boolean((await authResponse.allHeaders())['set-cookie']), 'email auth should issue a refresh cookie').toBe(true);
  await expect(page.locator('.production-app')).toBeVisible();
  await seedVerifiedE2eProfile(databaseUrl, email, phone);
  await page.reload();
  await expect(page.locator('.production-app')).toBeVisible();
  return (await authResponse.json()).data.accessToken as string;
}