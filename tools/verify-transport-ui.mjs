import { chromium } from 'playwright';
import path from 'node:path';

const ARTIFACT_DIR = '/Users/dima1203/.gemini/antigravity-ide/brain/6982cff1-2cc8-4d69-9810-1b24fd4dde36';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 viewport
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check if login screen is present
  const nameInput = page.locator('input[placeholder="Ваше ім’я"]');
  if (await nameInput.isVisible()) {
    console.log('Logging in with test account...');
    await nameInput.fill('Олег');
    await page.fill('input[type="tel"]', '+380501234567');
    await page.click('button:has-text("Почати")');
    await page.waitForTimeout(1000);

    // Check for devCode or OTP input
    const devCodeEl = page.locator('text=Тестовий OTP');
    let otp = '111111';
    if (await devCodeEl.isVisible()) {
      const txt = await devCodeEl.textContent();
      const match = txt.match(/\d{6}/);
      if (match) otp = match[0];
    }
    console.log('Filling OTP code:', otp);
    const codeInput = page.locator('input[inputmode="numeric"]');
    if (await codeInput.isVisible()) {
      await codeInput.fill(otp);
      await page.click('button:has-text("Підтвердити номер")');
      await page.waitForTimeout(2000);
    }
  }

  // 1. Home screen screenshot
  console.log('Capturing Home screen...');
  const homeShot = path.join(ARTIFACT_DIR, 'live_transport_home_success.png');
  await page.screenshot({ path: homeShot });
  console.log('Saved home screen screenshot to:', homeShot);

  // 2. Click "Карта Live" button on header or banner
  console.log('Opening Live Transport Map...');
  const mapBtn = page.locator('text=Карта Live').first();
  const liveBanner = page.locator('text=Онлайн-рух транспорту на карті').first();
  if (await mapBtn.isVisible()) {
    await mapBtn.click();
  } else if (await liveBanner.isVisible()) {
    await liveBanner.click();
  } else {
    await page.goto('http://localhost:3000/map', { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(3500);

  // 3. Map Overview screenshot
  console.log('Capturing Live Transport Map Overview...');
  const mapOverviewShot = path.join(ARTIFACT_DIR, 'live_transport_map_overview.png');
  await page.screenshot({ path: mapOverviewShot });
  console.log('Saved map overview screenshot to:', mapOverviewShot);

  // 4. Click "Івано-Франківськ" city pill in city selector bar
  console.log('Selecting Ivano-Frankivsk city...');
  const cityPill = page.locator('button:has-text("Івано-Франківськ")').first();
  if (await cityPill.isVisible()) {
    await cityPill.click();
    await page.waitForTimeout(3000);
    const ifShot = path.join(ARTIFACT_DIR, 'live_transport_ivano_frankivsk.png');
    await page.screenshot({ path: ifShot });
    console.log('Saved Ivano-Frankivsk screenshot to:', ifShot);
  }

  // 5. Test vehicle bottom sheet selection
  console.log('Testing Live Vehicle Bottom Sheet...');
  await page.evaluate(() => {
    window.__MARSHGO_TRANSPORT__?.setSelectedVehicle({
      id: 'if-bus-28',
      route: '28',
      transport: 'bus',
      bearing: 320,
      speed: 34,
      observedAt: new Date().toISOString(),
      stopId: 'stop-vokzal',
      providerId: 'if_city_buses',
      coordinates: [24.7095, 48.9500],
    });
  });

  await page.waitForTimeout(1500);
  const vehicleSheetShot = path.join(ARTIFACT_DIR, 'live_transport_vehicle_sheet.png');
  await page.screenshot({ path: vehicleSheetShot });
  console.log('Saved vehicle sheet screenshot to:', vehicleSheetShot);

  // 6. Test stop arrival board selection
  console.log('Testing Stop Arrivals Board...');
  await page.evaluate(() => {
    window.__MARSHGO_TRANSPORT__?.setSelectedVehicle(null);
    window.__MARSHGO_TRANSPORT__?.setSelectedStop({
      id: 'lviv-stop-stryiska',
      name: 'Стрийська — Наукова',
      transports: ['Автобуси', 'Тролейбуси'],
      coordinates: [24.025, 49.835],
    });
  });

  await page.waitForTimeout(2000);
  const stopSheetShot = path.join(ARTIFACT_DIR, 'live_transport_stop_arrivals.png');
  await page.screenshot({ path: stopSheetShot });
  console.log('Saved stop arrivals screenshot to:', stopSheetShot);

  await browser.close();
  console.log('Verification completed successfully!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exitCode = 1;
});
/* global window */
