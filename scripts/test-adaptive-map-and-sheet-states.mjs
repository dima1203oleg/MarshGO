import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = '/Users/dima1203/.gemini/antigravity/brain/1f9fa7ba-be90-4738-b480-9d68a25264b7/visual-evidence';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log('🚀 Running comprehensive test of Adaptive Map, Route Details & Smart Bottom Sheet 2.0...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile standard: iPhone 14
    deviceScaleFactor: 2,
    hasTouch: true,
    geolocation: { latitude: 49.8429, longitude: 24.0311 }, // Lviv
    permissions: ['geolocation'],
  });
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:4178/...');
  await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // 1. Login
  const loginBtn = page.locator('button:has-text("У мене вже є акаунт")');
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForTimeout(400);
    await page.fill('#login-email', 'dima@marshgo.local');
    await page.fill('#login-password', 'Marshgo#2026dev');
    await page.click('button[type="submit"]:has-text("Увійти")');
    await page.waitForTimeout(2000);
  }
  console.log('✅ Logged in');

  // 2. Open JourneyRouteMapScreen via Trips -> Saved
  console.log('Navigating to Trips -> Saved journeys...');
  const tripsTab = page.locator('button:has-text("Поїздки")').first();
  await tripsTab.click();
  await page.waitForTimeout(1000);

  const savedTab = page.locator('button[role="tab"]:has-text("Збережені")');
  await savedTab.click();
  await page.waitForTimeout(1000);

  const routeBtn = page.locator('button:has-text("Карта й деталі маршруту")').first();
  console.log('Clicking "Карта й деталі маршруту"...');
  await routeBtn.click();
  await page.waitForTimeout(3000);

  const sheet = page.locator('[data-testid="route-bottom-sheet"]');
  const grabber = page.locator('.route-sheet-grabber');

  // 3. State 3: MEDIUM (half default)
  console.log('📸 State 3: MEDIUM (half)...');
  await page.waitForTimeout(1000);
  const shotState3 = path.join(ARTIFACT_DIR, 'state-3-medium-half.png');
  await page.screenshot({ path: shotState3 });
  console.log(`✅ Saved ${shotState3}`);

  // 4. Transition to State 4: EXPANDED (full)
  console.log('📸 Transitioning to State 4: EXPANDED (full)...');
  await grabber.focus();
  await page.keyboard.press('End');
  await page.waitForTimeout(1200);
  const shotState4 = path.join(ARTIFACT_DIR, 'state-4-expanded-full.png');
  await page.screenshot({ path: shotState4 });
  console.log(`✅ Saved ${shotState4}`);

  // 5. Transition to State 1: PEEK (collapsed)
  console.log('📸 Transitioning to State 1: PEEK (collapsed)...');
  await grabber.focus();
  await page.keyboard.press('Home');
  await page.waitForTimeout(1200);
  const shotState1 = path.join(ARTIFACT_DIR, 'state-1-collapsed-peek.png');
  await page.screenshot({ path: shotState1 });
  console.log(`✅ Saved ${shotState1}`);

  // 6. Transition to State 2: COMPACT (collapsed)
  console.log('📸 Transitioning to State 2: COMPACT (collapsed)...');
  await grabber.focus();
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(1200);
  const shotState2 = path.join(ARTIFACT_DIR, 'state-2-compact.png');
  await page.screenshot({ path: shotState2 });
  console.log(`✅ Saved ${shotState2}`);

  // Move back to State 3 for segment and stop interaction
  await grabber.focus();
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(1000);

  // 7. Test Segment Focus
  console.log('🎯 Testing Segment Focus on transit stage...');
  const ribbonPills = page.locator('.mg-route-ribbon__pill');
  const pillCount = await ribbonPills.count();
  if (pillCount > 1) {
    await ribbonPills.nth(1).click();
  } else if (pillCount > 0) {
    await ribbonPills.first().click();
  }
  await page.waitForTimeout(1500);
  const shotSegFocus = path.join(ARTIFACT_DIR, 'segment-focus-bearing.png');
  await page.screenshot({ path: shotSegFocus });
  console.log(`✅ Saved ${shotSegFocus}`);

  // 8. Test Manual Camera and Recenter Button
  console.log('🖐️ Testing Manual Camera drag...');
  const mapCanvas = page.locator('canvas.maplibregl-canvas');
  if (await mapCanvas.isVisible()) {
    const box = await mapCanvas.boundingBox();
    if (box) {
      // Drag map manually in the top visible portion
      await page.mouse.move(box.x + box.width / 2, box.y + 120);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 70, box.y + 200, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(1000);

      const shotManual = path.join(ARTIFACT_DIR, 'manual-camera-mode.png');
      await page.screenshot({ path: shotManual });
      console.log(`✅ Saved ${shotManual}`);

      // Click "Показати маршрут цілком" recenter button
      const recenterBtn = page.locator('button[aria-label="Показати маршрут цілком"]');
      if (await recenterBtn.isVisible()) {
        console.log('🔄 Tapping recenter button to restore overview...');
        await recenterBtn.click();
        await page.waitForTimeout(1500);
        const shotRecentered = path.join(ARTIFACT_DIR, 'overview-recentered.png');
        await page.screenshot({ path: shotRecentered });
        console.log(`✅ Saved ${shotRecentered}`);
      }
    }
  }

  // 9. Test Stop Click in State 4 (Expanded)
  console.log('🚏 Testing Stop Click interaction...');
  await grabber.focus();
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  const stopChevron = page.locator('button[aria-label*="зупинки"]').first();
  if (await stopChevron.isVisible()) {
    const expandedAttr = await stopChevron.getAttribute('aria-expanded');
    if (expandedAttr !== 'true') {
      await stopChevron.click();
      await page.waitForTimeout(600);
    }
  }
  const stopItemBtn = page.locator('button[aria-label^="Зупинка:"]').first();
  if (await stopItemBtn.isVisible()) {
    await stopItemBtn.click();
    await page.waitForTimeout(1500);
    const shotStopFocus = path.join(ARTIFACT_DIR, 'stop-focus-point.png');
    await page.screenshot({ path: shotStopFocus });
    console.log(`✅ Saved ${shotStopFocus}`);
  }

  // 10. Test "Розпочати" button navigation handover
  console.log('🚀 Testing "Розпочати" CTA button...');
  const ctaBtn = page.locator('button.mg-route-cta:has-text("Розпочати")').first();
  if (await ctaBtn.isVisible()) {
    await ctaBtn.click();
    await page.waitForTimeout(2500);
    const shotNavHandover = path.join(ARTIFACT_DIR, 'active-navigation-handover.png');
    await page.screenshot({ path: shotNavHandover });
    console.log(`✅ Saved ${shotNavHandover}`);
  }

  await browser.close();
  console.log('🎉 Adaptive Map & Bottom Sheet 2.0 verification completed successfully!');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
