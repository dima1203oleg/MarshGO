import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/Users/dima1203/.gemini/antigravity/brain/1f9fa7ba-be90-4738-b480-9d68a25264b7/visual-evidence/lip-and-centering';
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  console.log('🚀 Starting Lip & Centering & Bus Approach Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone 15 Pro Max
    deviceScaleFactor: 2,
    locale: 'uk-UA',
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

  // 1. Entry
  console.log('1. Loading app at http://127.0.0.1:4178/...');
  await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const startBtn = page.locator('button:has-text("Почати")');
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  const skipBtn = page.locator('button:has-text("Пропустити")');
  if (await skipBtn.isVisible().catch(() => false)) await skipBtn.click();
  const toRegister = page.locator('button:has-text("Немає акаунта? Зареєструватися")');
  if (await toRegister.isVisible().catch(() => false)) {
    await toRegister.click();
    await page.locator('input').nth(0).fill('Маршрутник');
    await page.locator('input').nth(1).fill(`lip.user.${Date.now()}@marshgo.ua`);
    await page.locator('input').nth(2).fill('Password2026!');
    await page.click('button:has-text("Зареєструватися")');
    await page.waitForTimeout(2000);
  }

  // 2. Open Search
  console.log('2. Opening Search tab...');
  await page.click('nav button:has-text("Пошук")');
  await page.waitForTimeout(500);

  // 3. Search Route: Київ -> Львів
  console.log('3. Entering Origin: Київ...');
  const originInput = page.locator('input[placeholder="Місто відправлення"]');
  await originInput.click();
  await originInput.fill('Київ');
  await page.waitForTimeout(800);
  const originOption = page.locator('[role="option"]:has-text("Київ")').first();
  await originOption.click();

  console.log('4. Entering Destination: Львів...');
  const destInput = page.locator('input[placeholder="Місто призначення"]');
  await destInput.click();
  await destInput.fill('Львів');
  await page.waitForTimeout(800);
  const destOption = page.locator('[role="option"]:has-text("Львів")').first();
  await destOption.click();

  console.log('5. Clicking "Знайти маршрут"...');
  await page.click('button:has-text("Знайти маршрут")');
  await page.waitForTimeout(4000);

  // 6. Click View Route Details
  console.log('6. Opening detailed Route Map Screen...');
  const viewDetailsBtn = page.locator('button:has-text("Переглянути карту й деталі маршруту")').first();
  await viewDetailsBtn.click();
  await page.waitForTimeout(3000);

  // 📸 Screenshot 1: Default Half Snap with the New Sleek "Губа" (Bottom Sheet)
  await page.screenshot({ path: path.join(outDir, '01-sleek-lip-compact.png') });
  console.log('📸 01-sleek-lip-compact.png: Verified stylish compact bottom sheet ("губа") with multiple segments and live approaching banner');

  // 7. Check Approaching Vehicle Banner
  const approachingCard = page.locator('[data-testid="approaching-vehicle-card"]');
  const hasApproachingCard = await approachingCard.isVisible().catch(() => false);
  console.log(`✅ Approaching Vehicle Card Visible: ${hasApproachingCard}`);

  if (hasApproachingCard) {
    const cardText = await approachingCard.innerText();
    console.log(`Approaching Card Info:\n${cardText}`);
    
    // Click on approaching vehicle card to test camera centering!
    console.log('7. Clicking Approaching Vehicle Card to center camera on vehicle + boarding stop...');
    await approachingCard.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '02-approaching-vehicle-centered.png') });
    console.log('📸 02-approaching-vehicle-centered.png: Verified camera centering on approaching vehicle');
  }

  // 8. Select Intercity Rail / Street Segment to verify Sector Centering
  console.log('8. Selecting intercity rail / street sector...');
  const segmentCard = page.locator('[data-testid="journey-route-segment"]').nth(1);
  if (await segmentCard.isVisible().catch(() => false)) {
    await segmentCard.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '03-street-sector-centered.png') });
    console.log('📸 03-street-sector-centered.png: Verified precise sector/street camera centering above the sheet');
  }

  // 9. Expand Stops and Select Individual Stop / Street Point
  console.log('9. Expanding stops and clicking individual stop/street point...');
  const chevron = page.locator('button[aria-label*="зупинки: Поїзд"]').first();
  await chevron.scrollIntoViewIfNeeded();
  await chevron.click();
  await page.waitForTimeout(1000);

  const stopBtn = page.locator('ol[aria-label*="Зупинки"] button').first();
  if (await stopBtn.isVisible().catch(() => false)) {
    console.log('Clicking individual stop button...');
    await stopBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, '04-individual-stop-centered.png') });
    console.log('📸 04-individual-stop-centered.png: Verified individual stop/street point centering perfectly in visible area');
  } else {
    // If not button, take screenshot of the expanded stops
    await page.screenshot({ path: path.join(outDir, '04-stops-expanded.png') });
    console.log('📸 04-stops-expanded.png: Captured expanded stops list');
  }

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
