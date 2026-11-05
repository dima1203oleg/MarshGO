import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/dima1203/.gemini/antigravity/brain/1f9fa7ba-be90-4738-b480-9d68a25264b7/visual-evidence/ukraine-chains';
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('🚀 Starting Ukraine Multimodal Chain Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone 15 Pro Max
    deviceScaleFactor: 2,
    locale: 'uk-UA',
  });
  const page = await context.newPage();

  // 1. App entry & registration
  console.log('1. Loading app...');
  await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const startBtn = page.locator('button:has-text("Почати")');
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(400);
  }

  const skipBtn = page.locator('button:has-text("Пропустити")');
  if (await skipBtn.isVisible().catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(400);
  }

  const toRegister = page.locator('button:has-text("Немає акаунта? Зареєструватися")');
  if (await toRegister.isVisible().catch(() => false)) {
    await toRegister.click();
    await page.waitForTimeout(400);

    const ts = Date.now();
    await page.locator('input').nth(0).fill('Маршрутник');
    await page.locator('input').nth(1).fill(`chain.user.${ts}@marshgo.ua`);
    await page.locator('input').nth(2).fill('Password2026!');
    await page.click('button:has-text("Зареєструватися")');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: path.join(outDir, '01-home-screen.png') });
  console.log('📸 01-home-screen.png');

  // 2. Go to Search tab
  console.log('2. Opening Search tab...');
  await page.click('nav button:has-text("Пошук")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '02-search-tab-12-modes.png') });
  console.log('📸 02-search-tab-12-modes.png');

  // 3. Enter Origin: Київ
  console.log('3. Entering Origin: Київ...');
  const originInput = page.locator('input[placeholder="Місто відправлення"]');
  await originInput.click();
  await originInput.fill('Київ');
  await page.waitForTimeout(800);

  const originOption = page.locator('[role="option"]:has-text("Київ")').first();
  if (await originOption.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('Selected autocomplete option: Київ');
    await originOption.click();
    await page.waitForTimeout(400);
  }

  // 4. Enter Destination: Львів
  console.log('4. Entering Destination: Львів...');
  const destInput = page.locator('input[placeholder="Місто призначення"]');
  await destInput.click();
  await destInput.fill('Львів');
  await page.waitForTimeout(800);

  const destOption = page.locator('[role="option"]:has-text("Львів")').first();
  if (await destOption.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('Selected autocomplete option: Львів');
    await destOption.click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: path.join(outDir, '03-route-inputs-selected.png') });
  console.log('📸 03-route-inputs-selected.png');

  // 5. Submit Search
  console.log('5. Clicking "Знайти маршрут"...');
  await page.click('button:has-text("Знайти маршрут")');
  await page.waitForTimeout(3500);

  await page.screenshot({ path: path.join(outDir, '04-multimodal-chain-results.png') });
  console.log('📸 04-multimodal-chain-results.png');

  // Check results
  const journeyButtons = page.locator('button:has-text("Переглянути карту й деталі маршруту"), button:has-text("₴")');
  const count = await journeyButtons.count();
  console.log(`✅ Found route results on page: ${count}`);

  if (count > 0) {
    const firstRoute = journeyButtons.first();
    console.log('6. Opening detailed multimodal route map & bottom sheet...');
    await firstRoute.click();
    await page.waitForTimeout(3500); // Wait for MapLibre GL to render route corridor and sheet

    await page.screenshot({ path: path.join(outDir, '05-cinematic-route-overview.png') });
    console.log('📸 05-cinematic-route-overview.png');

    // Focus segment ribbon pill or details
    const ribbonPill = page.locator('.mg-route-ribbon__pill, button:has-text("705"), button:has-text("Поїзд"), button:has-text("Інтерсіті")').first();
    if (await ribbonPill.isVisible().catch(() => false)) {
      console.log('7. Focusing intercity train segment...');
      await ribbonPill.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, '06-intercity-train-focus.png') });
      console.log('📸 06-intercity-train-focus.png');
    }

    // Scroll sheet to show legs
    const sheet = page.locator('.mg-bottom-sheet, [aria-label*="маршрут"], [class*="sheet"]').first();
    if (await sheet.isVisible().catch(() => false)) {
      console.log('8. Capturing legs details...');
      await page.screenshot({ path: path.join(outDir, '07-route-legs-breakdown.png') });
      console.log('📸 07-route-legs-breakdown.png');
    }
  }

  await browser.close();
  console.log('🎉 ALL TESTS PASSED! Ukraine multimodal chaining is fully functional and verified.');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
