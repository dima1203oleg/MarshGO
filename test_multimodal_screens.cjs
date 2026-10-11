const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const artifactDir = '/Users/dima1203/.gemini/antigravity-ide/brain/6982cff1-2cc8-4d69-9810-1b24fd4dde36';

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check if we see the intro screen
  const haveAccountBtn = page.locator('button:has-text("У мене вже є акаунт")');
  if (await haveAccountBtn.isVisible()) {
    console.log('Clicking "У мене вже є акаунт"...');
    await haveAccountBtn.click();
    await page.waitForTimeout(500);
  }

  // Check if we need to log in
  const nameInput = page.locator('input[placeholder="Ваше ім’я"]');
  if (await nameInput.isVisible()) {
    console.log('Entering name and phone...');
    await nameInput.fill('Олексій');
    const phoneInput = page.locator('input[placeholder="+380 номер телефону"]');
    await phoneInput.fill('+380501234567');
    await page.locator('button:has-text("Почати")').click();
    await page.waitForTimeout(1000);

    // Look for devCode or wait for OTP input
    const devCodeElement = page.locator('text=Тестовий OTP локального середовища:');
    if (await devCodeElement.isVisible()) {
      const text = await devCodeElement.innerText();
      const match = text.match(/\d{6}/);
      const code = match ? match[0] : '123456';
      console.log('Found OTP devCode:', code);
      const codeInput = page.locator('input[placeholder="••••••"]');
      await codeInput.fill(code);
      await page.locator('button:has-text("Підтвердити номер")').click();
      await page.waitForTimeout(1500);
    }
  }

  console.log('Switching to search view via SPA navigation...');
  const searchTabBtn = page.locator('button:has-text("Пошук")').last();
  if (await searchTabBtn.isVisible()) {
    await searchTabBtn.click();
  } else {
    await page.evaluate(() => {
      window.history.pushState(null, '', '/search');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }
  await page.waitForTimeout(1000);

  // 1. Take screenshot of search form with strategy selector
  console.log('Capturing Search Form with Strategy Selector...');
  await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_form.png') });

  // Click on "Знайти маршрут"
  console.log('Executing Search (Default BALANCED)...');
  const searchBtn = page.locator('button:has-text("Знайти маршрут")').first();
  if (await searchBtn.isVisible()) {
    await searchBtn.click();
    await page.waitForTimeout(1500);
  }

  // 2. Capture Results with Multimodal Chains (BALANCED)
  console.log('Capturing Results (BALANCED)...');
  await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_results_balanced.png') });

  // 3. Click on "Найшвидше ⚡" strategy ribbon
  const fastestRibbon = page.locator('button:has-text("Найшвидше")').first();
  if (await fastestRibbon.isVisible()) {
    console.log('Selecting FASTEST strategy...');
    await fastestRibbon.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_results_fastest.png') });
  }

  // 4. Click on "Найдешевше 🪙" strategy ribbon
  const cheapestRibbon = page.locator('button:has-text("Найдешевше")').first();
  if (await cheapestRibbon.isVisible()) {
    console.log('Selecting CHEAPEST strategy...');
    await cheapestRibbon.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_results_cheapest.png') });
  }

  // 5. Click on "Мультимодальні" filter tab
  const transferTab = page.locator('button:has-text("Мультимодальні")').first();
  if (await transferTab.isVisible()) {
    console.log('Selecting Мультимодальні filter tab...');
    await transferTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_filter_tab.png') });
  }

  // 6. Click on a multimodal chain item to open Map Details / Timeline
  const multimodalCard = page.locator('button:has-text("Мультимодальний")').first();
  if (await multimodalCard.isVisible()) {
    console.log('Opening Multimodal Chain Details...');
    await multimodalCard.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_chain_details.png') });
  } else {
    const firstCard = page.locator('button.group').first();
    if (await firstCard.isVisible()) {
      console.log('Opening First Result Card Details...');
      await firstCard.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(artifactDir, 'actual_multimodal_chain_details.png') });
    }
  }

  console.log('Done capturing all multimodal screenshots!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
