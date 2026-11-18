import { chromium } from 'playwright';
import path from 'path';

async function captureModal() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // Authenticate if needed
  const phoneInput = page.locator('input[placeholder*="+380"]');
  if (await phoneInput.isVisible()) {
    const randomPhone = `+38050${Math.floor(1000000 + Math.random() * 9000000)}`;
    await page.locator('input[placeholder*="ім’я"]').fill('Тестовий Користувач');
    await phoneInput.fill(randomPhone);
    await page.getByRole('button', { name: 'Почати', exact: true }).click();
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    const codeMatch = bodyText.match(/Тестовий OTP[^\d]*(\d{6})/) || bodyText.match(/\b\d{6}\b/);
    const code = codeMatch ? codeMatch[1] || codeMatch[0] : '123456';
    const otpInput = page.locator('input[placeholder="••••••"]');
    if (await otpInput.isVisible()) {
      await otpInput.fill(code);
      await page.getByRole('button', { name: 'Підтвердити номер' }).click();
      await page.waitForTimeout(1500);
    }
  }

  // Click "+" button in bottom nav
  const createButton = page.locator('.app-create-button');
  await createButton.click();
  await page.waitForTimeout(600);

  // Take screenshot of modal
  await page.screenshot({ path: path.resolve('tools/screenshots/02_publish_modal_mobile.png') });
  console.log('Captured 02_publish_modal_mobile.png');

  await browser.close();
}

captureModal().catch(console.error);
