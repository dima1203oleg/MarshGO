import { expect, type Page } from '@playwright/test';

/** Read the OTP only from the loopback E2E API response, never from user-visible UI. */
export async function requestDevelopmentOtp(page: Page): Promise<string> {
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.hostname === '127.0.0.1'
      && url.port === '3300'
      && url.pathname === '/api/v1/auth/otp/request'
      && response.request().method() === 'POST';
  }, { timeout: 10_000 });
  await page.getByRole('button', { name: 'Почати', exact: true }).click();
  const response = await responsePromise;
  expect(response.status(), 'OTP must come from the isolated local E2E API').toBe(200);
  const payload = await response.json() as {
    data?: { developmentCode?: string };
    developmentCode?: string;
  };
  const code = payload.data?.developmentCode ?? payload.developmentCode;
  expect(code, 'the isolated E2E API should return its development OTP').toMatch(/^\d{6}$/);
  return code as string;
}
