import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = '/Users/dima1203/.gemini/antigravity/brain/1f9fa7ba-be90-4738-b480-9d68a25264b7/visual-evidence';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function verifyCinematicNavigation() {
  console.log('🎬 Starting Cinematic Navigation 4.0 E2E visual verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  const page = await context.newPage();

  // 1. Open the user-requested journey URL
  const targetUrl = 'http://127.0.0.1:4178/journeys/ab73fa4c-0561-446d-aa3a-2ad30a4f12b2';
  console.log(`🌐 Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // If login form is shown, log in
  const loginBtn = page.locator('button:has-text("У мене вже є акаунт")');
  if (await loginBtn.isVisible()) {
    console.log('🔑 Logging in with registered user session...');
    await loginBtn.click();
    await page.waitForTimeout(400);
    await page.fill('#login-email', 'dima@marshgo.local');
    await page.fill('#login-password', 'Marshgo#2026dev');
    await page.click('button[type="submit"]:has-text("Увійти")');
    await page.waitForTimeout(1500);

    // Re-navigate to the target journey
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  }

  // Verify JourneyRouteMapScreen loaded
  const mapElement = page.locator('[data-testid="journey-route-map"]');
  await mapElement.waitFor({ state: 'visible', timeout: 8000 });
  console.log('✅ Route map screen is visible.');

  // Shot 1: Initial overview
  const shot1 = path.join(ARTIFACT_DIR, 'cinematic-01-overview.png');
  await page.screenshot({ path: shot1 });
  console.log(`📸 Saved initial overview: ${shot1}`);

  // 2. Select first segment in ribbon to trigger Cinematic Focus & Reveal
  const pills = page.locator('.mg-route-ribbon__pill');
  const pillCount = await pills.count();
  console.log(`Found ${pillCount} stage pills in ribbon.`);

  if (pillCount > 0) {
    console.log('✨ Clicking 1st segment pill for Cinematic Reveal & Callouts...');
    await pills.first().click();
    await page.waitForTimeout(1200);

    // Check smart guidance banner in bottom sheet
    const guidance = page.locator('[data-testid="smart-step-guidance"]');
    const guidanceVisible = await guidance.isVisible();
    const guidanceText = guidanceVisible ? await guidance.textContent() : '';
    console.log(`📢 Smart step guidance visible: ${guidanceVisible}, text: ${guidanceText}`);

    // Check for callouts
    const callouts = page.locator('[data-testid^="glass-callout-"]');
    const calloutCount = await callouts.count();
    console.log(`📍 Glass guidance callouts found: ${calloutCount}`);

    const shot2 = path.join(ARTIFACT_DIR, 'cinematic-02-segment-focused-callouts.png');
    await page.screenshot({ path: shot2 });
    console.log(`📸 Saved segment focused callouts: ${shot2}`);

    // 3. Select 2nd segment if available
    if (pillCount > 1) {
      console.log('✨ Clicking 2nd segment pill...');
      await pills.nth(1).click();
      await page.waitForTimeout(1200);

      const shot3 = path.join(ARTIFACT_DIR, 'cinematic-03-second-segment-callouts.png');
      await page.screenshot({ path: shot3 });
      console.log(`📸 Saved 2nd segment callouts: ${shot3}`);
    }

    // 4. Manual map pan to test MANUAL_CAMERA mode & recenter button
    console.log('🖐️ Simulating manual map drag...');
    await page.mouse.move(195, 250);
    await page.mouse.down();
    await page.mouse.move(195, 120, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(800);

    const recenterBtn = page.locator('button[aria-label="Показати маршрут цілком"]');
    const recenterVisible = await recenterBtn.isVisible();
    console.log(`🎯 Floating recenter button visible: ${recenterVisible}`);

    const shot4 = path.join(ARTIFACT_DIR, 'cinematic-04-manual-camera-recenter.png');
    await page.screenshot({ path: shot4 });
    console.log(`📸 Saved manual camera recenter: ${shot4}`);

    if (recenterVisible) {
      console.log('🔄 Clicking recenter button...');
      await recenterBtn.click();
      await page.waitForTimeout(1000);

      const shot5 = path.join(ARTIFACT_DIR, 'cinematic-05-recentered-overview.png');
      await page.screenshot({ path: shot5 });
      console.log(`📸 Saved recentered overview: ${shot5}`);
    }
  }

  await browser.close();
  console.log('🎉 Cinematic Navigation verification completed successfully!');
}

verifyCinematicNavigation().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
