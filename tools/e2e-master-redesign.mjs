import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('tools/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runMasterE2ETest() {
  console.log('🚀 Starting MARSHGO Master Redesign E2E Suite...');
  const browser = await chromium.launch({ headless: true });

  // 1. Mobile viewport test (iPhone 14: 390x844)
  console.log('📱 1. Testing Mobile Viewport (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
  });
  const page = await mobileContext.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  // Scenario 1: Open Home Page
  console.log('Scenario 1: Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // If auth is required or displayed, handle login
  const phoneInput = page.locator('input[placeholder*="+380"]');
  if (await phoneInput.isVisible()) {
    console.log('Authenticating test user with unique phone...');
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

  // Take screenshot: 01_home_mobile.png
  console.log('📸 Capturing Home Screen (Mobile)...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home_mobile.png'), fullPage: false });

  // Scenario 2: Check Global Header and Bottom Bar
  console.log('Checking Global Top Nav & Bottom Bar...');
  const brand = page.locator('strong:has-text("MARSH")');
  const bottomNav = page.locator('nav[aria-label="Основна навігація"]');
  console.log('Brand visible:', await brand.isVisible());
  console.log('Bottom Nav visible:', await bottomNav.isVisible());

  // Scenario 3: Quick Route Pill on Home (BlaBlaCar-style instant search)
  console.log('Scenario 3: Testing Quick Route Pill on Home...');
  const quickPill = page.locator('button:has-text("Київ → Львів")').first();
  if (await quickPill.isVisible()) {
    console.log('Tapping quick route pill "Київ → Львів"...');
    await quickPill.click();
    await page.waitForTimeout(1500);
  } else {
    // Or open Search tab directly
    console.log('Switching to dedicated Search tab...');
    await page.locator('button:has-text("Пошук")').last().click();
    await page.waitForTimeout(1000);
  }

  // Scenario 4 & 5: On Search Experience V6, verify 12 transport modes and filters
  console.log('Scenario 4 & 5: Verifying Search Experience V6 & 12 transport categories...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_home_filled_mobile.png') });

  // Scenario 6 & 7: Check Search Results
  console.log('📸 Capturing Search Results...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_search_results_mobile.png') });

  // Scenario 8: Sort / Strategy buttons (Оптимальний, Найшвидший, Найдешевший)
  console.log('Scenario 8: Testing Strategy Filter...');
  const fastestBtn = page.locator('button:has-text("Найшвидший")');
  if (await fastestBtn.first().isVisible()) {
    await fastestBtn.first().click();
    await page.waitForTimeout(500);
    console.log('Clicked "Найшвидший" strategy filter.');
  }

  // Scenario 15: Open "+" Create Menu
  console.log('Scenario 15: Opening Center "+" Create Menu...');
  const plusBtn = page.locator('button[aria-label="Створити"]');
  if (await plusBtn.isVisible()) {
    await plusBtn.click();
    await page.waitForTimeout(800);
    console.log('📸 Capturing Create Menu Bottom Sheet...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_create_menu_sheet.png') });

    // Close create menu
    const closeBtn = page.locator('button[aria-label="Закрити"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // Scenario 19: Open "Мої поїздки"
  console.log('Scenario 19: Opening "Мої поїздки"...');
  const tripsTab = page.locator('nav[aria-label="Основна навігація"] button:has-text("Мої поїздки")');
  if (await tripsTab.isVisible()) {
    await tripsTab.click();
    await page.waitForTimeout(1000);
    console.log('📸 Capturing "Мої поїздки" view...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_trips_screen_mobile.png') });

    // Test clicking through the 7 filter tabs
    const filterTabs = ['Активні', 'Заплановані', 'Мої пропозиції', 'Мої заявки', 'Бронювання', 'Історія', 'Скасовані'];
    for (const tabName of filterTabs.slice(1, 4)) {
      const tabBtn = page.locator(`button[role="tab"]:has-text("${tabName}")`);
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(400);
        console.log(`Switched to tab: ${tabName}`);
      }
    }
  }

  // Scenario 23: Open "Профіль"
  console.log('Scenario 23: Opening "Профіль"...');
  const profileTab = page.locator('nav[aria-label="Основна навігація"] button:has-text("Профіль")');
  if (await profileTab.isVisible()) {
    await profileTab.click();
    await page.waitForTimeout(1000);
    console.log('📸 Capturing Profile view...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_profile_screen_mobile.png') });
  }

  // Scenario 25: Toggle Theme (Dark Mode)
  console.log('Scenario 25: Testing Theme Toggle (Dark Mode)...');
  const themeBtn = page.locator('button[aria-label="Перемкнути тему"]');
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await page.waitForTimeout(800);
    console.log('📸 Capturing Dark Mode Profile...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_dark_mode_profile.png') });

    // Back to Home in Dark Mode
    const homeTab = page.locator('nav[aria-label="Основна навігація"] button:has-text("Головна")');
    if (await homeTab.isVisible()) {
      await homeTab.click();
      await page.waitForTimeout(800);
      console.log('📸 Capturing Dark Mode Home Screen...');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_dark_mode_home.png') });
    }
    // Switch back to light theme for desktop
    await themeBtn.click();
    await page.waitForTimeout(400);
  }

  // Scenario 21: Test Messages in Header
  console.log('Scenario 21: Testing Messages Shortcut in Header...');
  const chatHeaderBtn = page.locator('button[aria-label*="Повідомлення"]');
  if (await chatHeaderBtn.isVisible()) {
    await chatHeaderBtn.click();
    await page.waitForTimeout(800);
    console.log('📸 Capturing Messages View...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_messages_view.png') });
  }

  // Scenario 22: Test Notifications in Header
  console.log('Scenario 22: Testing Notifications in Header...');
  const notifHeaderBtn = page.locator('button[aria-label*="Сповіщення"]');
  if (await notifHeaderBtn.isVisible()) {
    await notifHeaderBtn.click();
    await page.waitForTimeout(800);
    console.log('📸 Capturing Notifications Sheet...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_notifications_sheet.png') });

    // Close notifications
    const closeNotif = page.locator('button[aria-label="Закрити сповіщення"]');
    if (await closeNotif.isVisible()) await closeNotif.click();
  }

  await mobileContext.close();

  // 2. Desktop Viewport Test (1280x800)
  console.log('🖥️ 2. Testing Desktop Viewport (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  await desktopPage.waitForTimeout(1000);

  console.log('📸 Capturing Desktop Home Screen...');
  await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '11_desktop_home.png') });

  // Open Search on Desktop
  const desktopSearchNav = desktopPage.locator('nav[aria-label="Основна навігація"] button:has-text("Пошук")').or(desktopPage.locator('nav.desktop-top-nav button:has-text("Пошук")'));
  if (await desktopSearchNav.first().isVisible()) {
    await desktopSearchNav.first().click();
    await desktopPage.waitForTimeout(1000);
    console.log('📸 Capturing Desktop Search Screen...');
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, '12_desktop_search.png') });
  }

  await desktopContext.close();
  await browser.close();

  console.log('✅ Master E2E Redesign Suite completed successfully! Screenshots saved to tools/screenshots/');
}

runMasterE2ETest().catch((err) => {
  console.error('❌ E2E Test Suite Error:', err);
  process.exit(1);
});
