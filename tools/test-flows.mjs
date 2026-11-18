import { chromium } from 'playwright';
import path from 'path';

async function testFlows() {
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

  // 1. Click "+" in bottom bar -> opens QuickNavModal (Screen 3)
  console.log('Tapping "+" in bottom nav...');
  const createButton = page.locator('.app-create-button');
  await createButton.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve('tools/screenshots/flow_plus_quick_nav.png') });
  console.log('Captured flow_plus_quick_nav.png');

  // 2. Click "Опублікувати" inside QuickNavModal -> opens PublishTripModal (Screen 2)
  console.log('Tapping "Опублікувати" card inside QuickNavModal...');
  const publishCard = page.locator('button:has-text("Опублікувати")').last();
  await publishCard.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve('tools/screenshots/flow_publish_modal.png') });
  console.log('Captured flow_publish_modal.png');

  await browser.close();
  console.log('All flows tested successfully!');
}

testFlows().catch(console.error);
