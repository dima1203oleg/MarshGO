import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/dima1203/.gemini/antigravity/brain/1f9fa7ba-be90-4738-b480-9d68a25264b7/visual-evidence/rotation-and-geometry';
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('🚀 Running Full Visual Verification: Rotation, Max Zoom, and All Transport Geometry...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    locale: 'uk-UA',
  });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('React DevTools') && !text.includes('GPU stall')) {
      console.log('BROWSER_LOG:', text);
    }
  });

  // 1. Load application
  await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const startBtn = page.locator('button:has-text("Почати")');
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  const skipBtn = page.locator('button:has-text("Пропустити")');
  if (await skipBtn.isVisible().catch(() => false)) await skipBtn.click();
  const toRegister = page.locator('button:has-text("Немає акаунта? Зареєструватися")');
  if (await toRegister.isVisible().catch(() => false)) {
    await toRegister.click();
    await page.locator('input').nth(0).fill('Маршрутник');
    await page.locator('input').nth(1).fill(`rot.geom.${Date.now()}@marshgo.ua`);
    await page.locator('input').nth(2).fill('Password2026!');
    await page.click('button:has-text("Зареєструватися")');
    await page.waitForTimeout(2000);
  }

  // 2. Open Search Tab
  await page.click('nav button:has-text("Пошук")');
  await page.waitForTimeout(600);

  // 3. Search Intercity Route: Київ -> Львів
  console.log('Searching Kyiv -> Lviv route...');
  const originInput = page.locator('input[placeholder="Місто відправлення"]');
  await originInput.click();
  await originInput.fill('Київ');
  await page.waitForTimeout(700);
  await page.locator('[role="option"]:has-text("Київ")').first().click();

  const destInput = page.locator('input[placeholder="Місто призначення"]');
  await destInput.click();
  await destInput.fill('Львів');
  await page.waitForTimeout(700);
  await page.locator('[role="option"]:has-text("Львів")').first().click();

  await page.click('button:has-text("Знайти маршрут")');
  await page.waitForTimeout(4000);

  // 4. Open Route Map Details
  await page.locator('button:has-text("Переглянути карту й деталі маршруту")').first().click();
  await page.waitForTimeout(3000);

  // 5. Verify Overview Map
  await page.screenshot({ path: path.join(outDir, '01-overview-full-route.png') });
  console.log('📸 01-overview-full-route.png saved');

  // 6. Click each ribbon pill to test animated rotation & max-area zoom!
  const ribbonPills = page.locator('.mg-route-ribbon__pill');
  const count = await ribbonPills.count();
  console.log(`Found ${count} ribbon segment pills.`);

  for (let i = 0; i < count; i++) {
    const pill = ribbonPills.nth(i);
    const label = await pill.getAttribute('aria-label');
    console.log(`Tapping pill #${i + 1}: ${label}`);
    await pill.click();
    await page.waitForTimeout(1600); // Wait for smooth camera rotation and zoom

    await page.screenshot({ path: path.join(outDir, `02-segment-${i + 1}-rotated-max-zoom.png`) });
    console.log(`📸 02-segment-${i + 1}-rotated-max-zoom.png saved`);
  }

  // 7. Click Approaching Vehicle Card
  const approachCard = page.locator('button:has-text("наближається")').first();
  if (await approachCard.isVisible().catch(() => false)) {
    console.log('Tapping Approaching Vehicle Card...');
    await approachCard.click();
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(outDir, '03-approaching-vehicle-focused.png') });
    console.log('📸 03-approaching-vehicle-focused.png saved');
  }

  // 8. Test Overview Reset
  const overviewChip = page.locator('button:has-text("Маршрут")').first();
  if (await overviewChip.isVisible().catch(() => false)) {
    await overviewChip.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '04-returned-to-overview-north-up.png') });
    console.log('📸 04-returned-to-overview-north-up.png saved');
  }

  // 9. Now test a Local Urban Route with Pedestrian Walk Geometry:
  console.log('Testing local urban route with pedestrian walking geometry...');
  // Click back or search again
  const closeBtn = page.locator('button[aria-label="Повернутися"]').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(800);
  }

  // Search local route
  await originInput.click();
  await originInput.fill('Хрещатик');
  await page.waitForTimeout(800);
  const kreschatikOpt = page.locator('[role="option"]:has-text("Хрещатик")').first();
  if (await kreschatikOpt.isVisible().catch(() => false)) {
    await kreschatikOpt.click();
  } else {
    await originInput.fill('Київ');
    await page.waitForTimeout(600);
    await page.locator('[role="option"]:has-text("Київ")').first().click();
  }

  await destInput.click();
  await destInput.fill('Вокзальна');
  await page.waitForTimeout(800);
  const vokzalnaOpt = page.locator('[role="option"]:has-text("Вокзальна")').first();
  if (await vokzalnaOpt.isVisible().catch(() => false)) {
    await vokzalnaOpt.click();
  }

  await page.click('button:has-text("Знайти маршрут")');
  await page.waitForTimeout(3500);

  const viewLocalDetails = page.locator('button:has-text("Переглянути карту й деталі маршруту")').first();
  if (await viewLocalDetails.isVisible().catch(() => false)) {
    await viewLocalDetails.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '05-local-pedestrian-walk-geometry.png') });
    console.log('📸 05-local-pedestrian-walk-geometry.png saved');

    // Tap first walk segment
    const localPill = page.locator('.mg-route-ribbon__pill').first();
    if (await localPill.isVisible().catch(() => false)) {
      await localPill.click();
      await page.waitForTimeout(1600);
      await page.screenshot({ path: path.join(outDir, '06-local-walk-segment-rotated.png') });
      console.log('📸 06-local-walk-segment-rotated.png saved');
    }
  }

  console.log('🎉 Verification successfully finished!');
  await browser.close();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
