const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 }, // iPhone 15/16 Pro Max
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const outDir = process.env.MARSHGO_SCREEN_ARTIFACTS_DIR || path.resolve('test-results/screenshots');

  console.log('Capturing Active Trip Hub...');
  await page.goto('http://localhost:3000/search?view=active_trip', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'actual_v7_active_trip_hub.png') });

  console.log('Capturing Chat View...');
  const writeBtn = page.getByRole('button', { name: 'Написати' });
  if (await writeBtn.isVisible()) {
    await writeBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'actual_v7_chat_view.png') });
    const backBtn = page.getByRole('button', { name: 'Назад' });
    await backBtn.click();
    await page.waitForTimeout(400);
  }

  console.log('Capturing Review Modal...');
  const reviewBtn = page.getByRole('button', { name: /Завершити поїздку/i });
  if (await reviewBtn.isVisible()) {
    await reviewBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'actual_v7_review_modal.png') });
    const closeBtn = page.getByRole('button', { name: 'Закрити' });
    await closeBtn.click();
    await page.waitForTimeout(400);
  }

  console.log('Capturing Rescue Modal...');
  const rescueBtn = page.getByRole('button', { name: /Скасувати бронювання/i });
  if (await rescueBtn.isVisible()) {
    await rescueBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'actual_v7_rescue_modal.png') });
    const closeBtn = page.getByRole('button', { name: 'Закрити' });
    await closeBtn.click();
    await page.waitForTimeout(400);
  }

  console.log('Done!');
  await browser.close();
}

capture().catch(console.error);
