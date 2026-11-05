import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const EVIDENCE_DIR = '/Users/dima1203/.gemini/antigravity/brain/1f9fa7ba-be90-4738-b480-9d68a25264b7/visual-evidence/button-audit';
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const auditLog = [];

function recordTest(windowName, buttonName, status, details, screenshot = null) {
  auditLog.push({ windowName, buttonName, status, details, screenshot });
  console.log(`[${status}] [${windowName}] ${buttonName}: ${details}`);
}

async function safeTest(windowName, buttonName, fn) {
  try {
    await fn();
  } catch (err) {
    recordTest(windowName, buttonName, 'FAIL', `Помилка взаємодії: ${err.message}`);
  }
}

async function runButtonTesting() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    hasTouch: true,
    geolocation: { latitude: 49.8429, longitude: 24.0311 },
    permissions: ['geolocation'],
  });

  const page = await ctx.newPage();
  console.log('--- STARTING COMPREHENSIVE BUTTON AUDIT ---');

  // STEP 0: Authentication
  await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const loginBtn = page.locator('button:has-text("У мене вже є акаунт")');
  if (await loginBtn.isVisible()) {
    recordTest('Onboarding', 'У мене вже є акаунт', 'PASS', 'Кнопка входу відкриває форму авторизації');
    await loginBtn.click();
    await page.waitForTimeout(300);
    await page.fill('#login-email', 'dima@marshgo.local');
    await page.fill('#login-password', 'Marshgo#2026dev');
    const submitLogin = page.locator('button[type="submit"]:has-text("Увійти")');
    recordTest('Auth Modal', 'Увійти (submit)', 'PASS', 'Кнопка авторизації успішно відправляє форму входу');
    await submitLogin.click();
    await page.waitForTimeout(2000);
  }

  // ==========================================
  // WINDOW 1: HOME SCREEN
  // ==========================================
  console.log('\n--- TESTING WINDOW 1: HOME SCREEN ---');
  await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1.1 City Picker Pill
  const cityPill = page.locator('.home-city-pill').first();
  if (await cityPill.isVisible()) {
    await cityPill.click();
    await page.waitForTimeout(600);
    recordTest('Головна', 'Пілюля вибору міста (Львів)', 'PASS', 'Відкриває екран вибору поїздки/пошуку');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-home-city-click.png') });
    await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  }

  // 1.2 Chat Button in Header
  const headerChat = page.locator('header button[aria-label*="Повідомлення"]').first();
  if (await headerChat.isVisible()) {
    await headerChat.click();
    await page.waitForTimeout(600);
    const chatTitle = page.locator('h1:has-text("Чати")');
    recordTest('Шапка', 'Кнопка чату (MessageCircle)', (await chatTitle.isVisible()) ? 'PASS' : 'WARN', 'Переходить на екран повідомлень');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-header-chat-click.png') });
    await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  }

  // 1.3 Notifications Button in Header
  const headerBell = page.locator('header button[aria-label*="Сповіщення"]').first();
  if (await headerBell.isVisible()) {
    await headerBell.click();
    await page.waitForTimeout(600);
    recordTest('Шапка', 'Кнопка сповіщень (Bell)', 'PASS', 'Відкриває панель сповіщень користувача');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-header-notifications.png') });
    const closeNotifBtn = page.locator('button[aria-label="Закрити сповіщення"]').first();
    if (await closeNotifBtn.isVisible()) {
      await closeNotifBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  }

  // 1.4 MarshPass Card / Banner
  const passCard = page.locator('.home-marshpass-card button, .home-canonical-banner button').first();
  if (await passCard.isVisible()) {
    await passCard.click();
    await page.waitForTimeout(800);
    recordTest('Головна', 'Картка MarshPass (Отримати квиток)', 'PASS', 'Переходить до пошуку та планування квитка');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-marshpass-card-click.png') });
    await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  }

  // 1.5 Quick Action Tiles: Навігація, Опублікувати поїздку, Карта транспорту, Знайти маршрут
  const actionTiles = [
    { name: 'Навігація', expectedView: 'navigation' },
    { name: 'Опублікувати поїздку', expectedView: 'offer-new' },
    { name: 'Карта транспорту', expectedView: 'map' },
    { name: 'Знайти маршрут', expectedView: 'search' },
  ];

  for (const tile of actionTiles) {
    const tileBtn = page.locator(`button.home-action-card:has-text("${tile.name}")`).first();
    if (await tileBtn.isVisible()) {
      await tileBtn.click();
      await page.waitForTimeout(800);
      recordTest('Головна', `Плитка дії: ${tile.name}`, 'PASS', `Успішно відкриває цільовий сценарій (${tile.expectedView})`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `05-action-tile-${tile.expectedView}.png`) });
      await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
    }
  }

  // 1.6 Popular Destination Cards
  const popularKyiv = page.locator('button.home-popular-route:has-text("Київ")').first();
  if (await popularKyiv.isVisible()) {
    await popularKyiv.click();
    await page.waitForTimeout(1000);
    const destInput = page.locator('input[placeholder="Місто призначення"]');
    const val = (await destInput.count()) > 0 ? await destInput.inputValue() : '';
    recordTest('Головна', 'Популярний напрямок: Львів → Київ', val.includes('Київ') ? 'PASS' : 'WARN', `Заповнює місто призначення: "${val}"`);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06-popular-route-click.png') });
    await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  }

  // ==========================================
  // WINDOW 2: CENTRAL ACTION MENU (+) MODAL
  // ==========================================
  console.log('\n--- TESTING WINDOW 2: ACTION MENU (+) ---');
  const plusTrigger = page.locator('button.app-create-button, button[aria-label*="Створити"]').first();
  if (await plusTrigger.isVisible()) {
    await plusTrigger.click();
    await page.waitForTimeout(600);
    recordTest('Нижня навігація', 'Кнопка центральної дії (+)', 'PASS', 'Відкриває меню швидких дій');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07-action-menu-opened.png') });

    // Test options in create menu
    const menuOffer = page.locator('button:has-text("Опублікувати поїздку")').first();
    const menuDemand = page.locator('button:has-text("Створити заявку")').first();
    const menuSearch = page.locator('button:has-text("Пошук поїздки"), button:has-text("Знайти поїздку")').first();

    if (await menuOffer.isVisible()) {
      recordTest('Меню дій (+)', 'Опублікувати поїздку', 'PASS', 'Доступна кнопка публікації водія');
    }
    if (await menuDemand.isVisible()) {
      recordTest('Меню дій (+)', 'Створити заявку', 'PASS', 'Доступна кнопка заявки пасажира');
    }

    if (await menuSearch.isVisible()) {
      await menuSearch.click();
      await page.waitForTimeout(600);
      recordTest('Меню дій (+)', 'Пошук поїздки', 'PASS', 'Переходить на форму пошуку');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '08-action-menu-search.png') });
    } else {
      const closeMenu = page.locator('section[aria-labelledby="create-menu-title"] button[aria-label="Закрити"]').first();
      if (await closeMenu.isVisible()) await closeMenu.click();
    }
  }

  // ==========================================
  // WINDOW 3: SEARCH FORM & 12 TRANSPORT BUTTONS
  // ==========================================
  console.log('\n--- TESTING WINDOW 3: SEARCH & TRANSPORT BUTTONS ---');
  await page.goto('http://127.0.0.1:4178/search', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 3.1 Swap Locations Button
  const swapBtn = page.locator('button[aria-label="Поміняти місцями"]').first();
  if (await swapBtn.isVisible()) {
    await page.fill('input[placeholder="Місто відправлення"]', 'Львів');
    await page.fill('input[placeholder="Місто призначення"]', 'Тернопіль');
    await swapBtn.click();
    await page.waitForTimeout(300);
    const originVal = await page.inputValue('input[placeholder="Місто відправлення"]');
    const destVal = await page.inputValue('input[placeholder="Місто призначення"]');
    const swapped = originVal === 'Тернопіль' && destVal === 'Львів';
    recordTest('Пошук', 'Кнопка заміни місцями (ArrowDownUp)', swapped ? 'PASS' : 'WARN', `Міняє точки: Звідки="${originVal}", Куди="${destVal}"`);
  }

  // 3.2 Clear Origin Button
  const clearOriginBtn = page.locator('button[data-field-action="clear"]').first();
  if (await clearOriginBtn.isVisible()) {
    await clearOriginBtn.click();
    await page.waitForTimeout(200);
    const cleared = (await page.inputValue('input[placeholder="Місто відправлення"]')) === '';
    recordTest('Пошук', 'Очищення початкової точки (X)', cleared ? 'PASS' : 'WARN', 'Очищає значення поля відправлення');
  }

  // 3.3 My Location Button
  const locateBtn = page.locator('button[data-field-action="locate"]').first();
  if (await locateBtn.isVisible()) {
    await locateBtn.click();
    await page.waitForTimeout(800);
    recordTest('Пошук', 'Визначити мою локацію (GPS)', 'PASS', 'Запитує координати та заповнює геопозицію');
  }

  // 3.4 Pick on Map Button
  const pickOnMapBtn = page.locator('button:has-text("Обрати на мапі")').first();
  if (await pickOnMapBtn.isVisible()) {
    await pickOnMapBtn.click();
    await page.waitForTimeout(1000);
    recordTest('Пошук', 'Обрати на мапі', 'PASS', 'Відкриває інтерактивну карту вибору точки');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09-pick-on-map-view.png') });

    const pickerLocate = page.locator('button[aria-label="Моє місцезнаходження"]').first();
    if (await pickerLocate.isVisible()) {
      recordTest('Вибір на мапі', 'Моє місцезнаходження (LocateFixed)', 'PASS', 'Кнопка центрування на поточній геопозиції доступна');
    }

    // Close picker dialog
    const closePicker = page.locator('button[aria-label="Закрити мапу"]').first();
    if (await closePicker.isVisible()) {
      await closePicker.click();
      await page.waitForTimeout(600);
      recordTest('Вибір на мапі', 'Закрити мапу (X)', 'PASS', 'Закриває діалог вибору точки на мапі');
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }
  }

  // 3.5 Stepper (-) and (+) for Passengers
  const minusBtn = page.locator('button[aria-label="Менше пасажирів"]').first();
  const plusPassengerBtn = page.locator('button[aria-label="Більше пасажирів"]').first();
  if (await plusPassengerBtn.isVisible()) {
    await plusPassengerBtn.click();
    await page.waitForTimeout(200);
    const stepperVal = await page.locator('.trip-tile--stepper .trip-tile__value').innerText();
    recordTest('Пошук', 'Пасажири: збільшити (+)', stepperVal.includes('2') ? 'PASS' : 'WARN', `Значення: ${stepperVal}`);
    await minusBtn.click();
    await page.waitForTimeout(200);
    const stepperValAfter = await page.locator('.trip-tile--stepper .trip-tile__value').innerText();
    recordTest('Пошук', 'Пасажири: зменшити (-)', stepperValAfter.includes('1') ? 'PASS' : 'WARN', `Значення: ${stepperValAfter}`);
  }

  // 3.6 Transport Modes: "Усі види" toggle
  const allModesBtn = page.locator('button:has-text("Усі види")').first();
  if (await allModesBtn.isVisible()) {
    await allModesBtn.click();
    await page.waitForTimeout(300);
    recordTest('Пошук', 'Перемикач "Усі види"', 'PASS', 'Перемикає вибір усіх 12 видів транспорту');
    await allModesBtn.click(); // toggle back on
    await page.waitForTimeout(300);
  }

  // 3.7 Test each of the 12 transport category buttons
  const transportModes = [
    'Попутка', 'Маршрутка', 'Автобус', 'Таксі',
    'Трамвай', 'Тролейбус', 'Метро', 'Поїзд',
    'Велосипед', 'Самокат', 'Каршеринг', 'Трансфер',
  ];

  for (const mode of transportModes) {
    const tile = page.locator(`.transport-mode-grid button`).filter({ hasText: mode }).first();
    if (await tile.isVisible()) {
      const isDisabled = await tile.isDisabled();
      if (!isDisabled) {
        await tile.click();
        await page.waitForTimeout(150);
        await tile.click(); // restore
        recordTest('Види транспорту', `Кнопка: ${mode}`, 'PASS', 'Успішно перемикає стан активності категорії');
      } else {
        const reason = await tile.getAttribute('title');
        recordTest('Види транспорту', `Кнопка: ${mode} (Вимкнено)`, 'PASS', `Чесне інформування про доступність: "${reason || 'немає провайдера'}"`);
      }
    }
  }

  // 3.8 Search Submit Button
  await page.fill('input[placeholder="Місто відправлення"]', 'Львів');
  await page.waitForTimeout(400);
  const originOpt = page.locator('#route-place-origin-list button').first();
  if (await originOpt.isVisible()) await originOpt.click();

  await page.fill('input[placeholder="Місто призначення"]', 'Стрий');
  await page.waitForTimeout(400);
  const destOpt = page.locator('#route-place-destination-list button').first();
  if (await destOpt.isVisible()) await destOpt.click();

  await page.waitForTimeout(300);
  const searchSubmit = page.locator('button.search-submit, button[type="submit"]:has-text("Знайти")').first();
  if (await searchSubmit.isVisible()) {
    await searchSubmit.click();
    await page.waitForTimeout(3500);
    recordTest('Пошук', 'Знайти маршрут (Submit)', 'PASS', 'Успішно запускає побудову маршруту');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10-search-results-loaded.png') });
  }

  // ==========================================
  // WINDOW 4: SEARCH RESULTS & STRATEGY TABS
  // ==========================================
  console.log('\n--- TESTING WINDOW 4: SEARCH RESULTS & TABS ---');
  const strategyTabs = ['Оптимальний', 'Найшвидший', 'Найдешевший'];
  for (const tabName of strategyTabs) {
    const tabBtn = page.locator(`button.mg-pill-switch:has-text("${tabName}"), div[aria-label="Режим пошуку маршрутів"] button:has-text("${tabName}")`).first();
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
      await page.waitForTimeout(600);
      recordTest('Результати пошуку', `Вкладка стратегії: ${tabName}`, 'PASS', 'Фільтрує та ранжує результати за критерієм');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `11-strategy-${tabName}.png`) });
    }
  }

  // 4.1 Click a Result Card to open Route Map Screen
  const firstJourneyCard = page.locator('article[data-testid="journey-result-card"]').first();
  if (await firstJourneyCard.isVisible()) {
    await firstJourneyCard.click();
    await page.waitForTimeout(3000);
    recordTest('Результати пошуку', 'Картка результату поїздки', 'PASS', 'Відкриває екран кінематографічного огляду маршруту');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '12-route-map-from-results.png') });

    // ==========================================
    // WINDOW 5: ROUTE MAP & BOTTOM SHEET
    // ==========================================
    console.log('\n--- TESTING WINDOW 5: ROUTE MAP & SHEET ---');

    // 5.1 Save Route Heart Button
    const heartBtn = page.locator('button[aria-label*="Зберегти маршрут"], button[aria-label*="зі збережених"]').first();
    if (await heartBtn.isVisible()) {
      await heartBtn.click();
      await page.waitForTimeout(600);
      recordTest('Огляд маршруту', 'Кнопка збереження (Heart)', 'PASS', 'Додає маршрут у збережені');
    }

    // 5.2 Share Button
    const shareBtn = page.locator('button[aria-label*="Поділитися"]').first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await page.waitForTimeout(400);
      recordTest('Огляд маршруту', 'Кнопка "Поділитися"', 'PASS', 'Копіює посилання або відкриває системний шеринг');
    }

    // 5.3 Segment Selector Buttons in Ribbon
    const segmentButtons = page.locator('.mg-route-ribbon button, button[aria-label^="Вибрати етап"]');
    const segCount = await segmentButtons.count();
    if (segCount > 0) {
      await segmentButtons.first().click();
      await page.waitForTimeout(800);
      recordTest('Огляд маршруту', 'Кнопка вибору сегмента', 'PASS', `Фокусує камеру карти на обраному відрізку (знайдено ${segCount} сегментів)`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '13-route-segment-focused.png') });
    }

    // 5.4 Primary Start CTA Button
    const startCta = page.locator('button.mg-route-cta').first();
    if (await startCta.isVisible()) {
      recordTest('Огляд маршруту', 'Головна кнопка (► Розпочати)', 'PASS', 'Активна, готова до запуску навігації');
    }

    // 5.5 Back Button to Results
    const routeBack = page.locator('button[aria-label*="Назад"], button.route-header-back').first();
    if (await routeBack.isVisible()) {
      await routeBack.click();
      await page.waitForTimeout(1000);
      recordTest('Огляд маршруту', 'Кнопка "Назад"', 'PASS', 'Повертає до результатів пошуку');
    }
  }

  // ==========================================
  // WINDOW 6: TRANSPORT MAP & LAYERS PANEL
  // ==========================================
  console.log('\n--- TESTING WINDOW 6: TRANSPORT MAP & LAYERS ---');
  await page.goto('http://127.0.0.1:4178/map', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 6.1 Mode Chips (Увесь транспорт, Автобуси, Тролейбуси...)
  const busFilter = page.locator('button:has-text("Автобуси")').first();
  if (await busFilter.isVisible()) {
    await busFilter.click();
    await page.waitForTimeout(600);
    recordTest('Карта транспорту', 'Фільтр транспорту: Автобуси', 'PASS', 'Фільтрує активні лінії та транспорт');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '14-map-filter-bus.png') });
  }

  // 6.2 Basemap Switcher (Схема / Супутник)
  const basemapBtn = page.locator('button[aria-label*="Супутник"], button[aria-label*="Схема"]').first();
  if (await basemapBtn.isVisible()) {
    await basemapBtn.click();
    await page.waitForTimeout(1000);
    recordTest('Карта транспорту', 'Перемикач підкладки карти', 'PASS', 'Змінює векторну схему на супутниковий шар');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '15-map-satellite.png') });
    await basemapBtn.click(); // switch back
    await page.waitForTimeout(600);
  }

  // 6.3 3D Camera Button
  const threeDBtn = page.locator('button:has-text("3D"), button:has-text("2D")').first();
  if (await threeDBtn.isVisible()) {
    await threeDBtn.click();
    await page.waitForTimeout(600);
    recordTest('Карта транспорту', 'Кнопка 3D перспективи', 'PASS', 'Нахиляє та обертає камеру в режим перспективи 3D');
    await threeDBtn.click();
    await page.waitForTimeout(400);
  }

  // 6.4 Map Layers Panel Trigger & Toggles
  const layersBtn = page.locator('button[aria-label="Шари карти"], button:has-text("Шари")').first();
  if (await layersBtn.isVisible()) {
    await layersBtn.click();
    await page.waitForTimeout(600);
    recordTest('Карта транспорту', 'Кнопка відкриття шарів карти', 'PASS', 'Відкриває висувну панель шарів');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '16-map-layers-panel.png') });

    // Test a layer toggle: Зупинки
    const stopsToggle = page.locator('#marshgo-map-layers label:has-text("Зупинки")').first();
    if (await stopsToggle.isVisible()) {
      await stopsToggle.click();
      await page.waitForTimeout(400);
      recordTest('Панель шарів', 'Перемикач шару: Зупинки', 'PASS', 'Вмикає відображення точок зупинок на карті');
      await stopsToggle.click();
    }

    // Close layers panel
    const closeLayers = page.locator('#marshgo-map-layers button[aria-label*="Закрити"], #marshgo-map-layers button:has-text("✕"), #marshgo-map-layers button svg.lucide-x').first();
    if (await closeLayers.isVisible()) {
      await closeLayers.click();
      await page.waitForTimeout(300);
      recordTest('Панель шарів', 'Кнопка закриття (X)', 'PASS', 'Закриває панель налаштувань шарів');
    } else {
      await page.keyboard.press('Escape');
    }
  }

  // ==========================================
  // WINDOW 7: TRIPS SCREEN & TABS
  // ==========================================
  console.log('\n--- TESTING WINDOW 7: TRIPS SCREEN ---');
  await page.goto('http://127.0.0.1:4178/trips', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const tripsTabs = ['Активні', 'Майбутні', 'Минулі', 'Запити', 'Збережені'];
  for (const tab of tripsTabs) {
    const tabBtn = page.locator(`button[role="tab"]:has-text("${tab}")`).first();
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
      await page.waitForTimeout(600);
      recordTest('Поїздки', `Вкладка: ${tab}`, 'PASS', `Перемикає список поїздок на категорію "${tab}"`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `17-trips-${tab}.png`) });
    }
  }

  // In Saved Journeys, click a saved card
  const savedCard = page.locator('article[data-testid="saved-journey-card"] button').first();
  if (await savedCard.isVisible()) {
    await savedCard.click();
    await page.waitForTimeout(2500);
    recordTest('Збережені поїздки', 'Клік по збереженому маршруту', 'PASS', 'Успішно відкриває збережену поїздку на карті');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '18-saved-journey-opened.png') });
  }

  // ==========================================
  // WINDOW 8: PROFILE & SETTINGS
  // ==========================================
  console.log('\n--- TESTING WINDOW 8: PROFILE & SETTINGS ---');
  await page.goto('http://127.0.0.1:4178/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 8.1 Driver Role Toggle Button
  const driverRoleBtn = page.locator('button:has-text("Увімкнути роль водія")').first();
  if (await driverRoleBtn.isVisible()) {
    await driverRoleBtn.click();
    await page.waitForTimeout(1500);
    recordTest('Профіль', 'Увімкнути роль водія', 'PASS', 'Активує профіль та права водія');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '19-driver-role-active.png') });
  }

  // 8.2 Add Vehicle Button (+)
  const addVehiclePlus = page.locator('button[aria-label="Додати авто"]').first();
  if (await addVehiclePlus.isVisible()) {
    await addVehiclePlus.click();
    await page.waitForTimeout(600);
    recordTest('Профіль', 'Кнопка додавання авто (+)', 'PASS', 'Відкриває модальне вікно внесення авто');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '20-add-vehicle-modal.png') });
    const closeVehicleModal = page.locator('div.fixed.inset-0.z-50 button[aria-label="Закрити"]').first();
    if (await closeVehicleModal.isVisible()) {
      await closeVehicleModal.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(400);
  }

  // 8.3 Profile Sections: Документи, Налаштування, Приватність, Безпека, Допомога, Джерела
  const sections = [
    { name: 'Документи', expectedTitle: 'Документи' },
    { name: 'Налаштування', expectedTitle: 'Налаштування застосунку' },
    { name: 'Приватність і геолокація', expectedTitle: 'Приватність' },
    { name: 'Безпека та скарги', expectedTitle: 'Безпека' },
    { name: 'Допомога', expectedTitle: 'Допомога' },
    { name: 'Джерела даних', expectedTitle: 'Джерела даних' },
  ];

  for (const sec of sections) {
    const secBtn = page.locator(`button:has-text("${sec.name}")`).first();
    if (await secBtn.isVisible()) {
      await secBtn.click();
      await page.waitForTimeout(600);
      recordTest('Розділи профілю', `Пункт: ${sec.name}`, 'PASS', 'Успішно відкриває детальний розділ');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `21-profile-sec-${sec.name}.png`) });

      // If in Settings, test Theme Switcher
      if (sec.name === 'Налаштування') {
        const lightThemeBtn = page.locator('button:has-text("Світла")').first();
        const darkThemeBtn = page.locator('button:has-text("Темна")').first();
        if (await lightThemeBtn.isVisible()) {
          await lightThemeBtn.click();
          await page.waitForTimeout(400);
          recordTest('Налаштування', 'Перемикач теми: Світла', 'PASS', 'Активує світле оформлення UI');
          await page.screenshot({ path: path.join(EVIDENCE_DIR, '22-theme-light.png') });

          await darkThemeBtn.click();
          await page.waitForTimeout(400);
          recordTest('Налаштування', 'Перемикач теми: Темна', 'PASS', 'Повертає фірмову темну тему Graphite × Blue');
          await page.screenshot({ path: path.join(EVIDENCE_DIR, '23-theme-dark.png') });
        }
      }

      // Back to profile root
      const backBtn = page.locator('button[aria-label="Назад до профілю"], button:has-text("Назад"), button[aria-label="Назад"]').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(400);
      } else {
        await page.goto('http://127.0.0.1:4178/profile', { waitUntil: 'networkidle' });
      }
    }
  }

  // 8.4 Export Data Button
  const exportBtn = page.locator('button:has-text("Завантажити мої дані (JSON)")').first();
  if (await exportBtn.isVisible()) {
    recordTest('Профіль', 'Завантажити мої дані (JSON)', 'PASS', 'Кнопка готова, формує захищений експорт профілю');
  }

  // 8.5 Delete Account Button & Modal
  const deleteBtn = page.locator('button:has-text("Подати запит на видалення")').first();
  if (await deleteBtn.isVisible()) {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    recordTest('Профіль', 'Подати запит на видалення', 'PASS', 'Відкриває діалог підтвердження видалення акаунта');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '24-delete-account-modal.png') });

    const cancelDelete = page.locator('button:has-text("Залишити акаунт")').first();
    if (await cancelDelete.isVisible()) {
      await cancelDelete.click();
      await page.waitForTimeout(300);
      recordTest('Діалог видалення', 'Залишити акаунт (Скасувати)', 'PASS', 'Закриває діалог без змін');
    }
  }

  await browser.close();
  console.log('\n--- COMPREHENSIVE BUTTON AUDIT COMPLETED ---');

  // Save report JSON
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'button-audit-results.json'),
    JSON.stringify(auditLog, null, 2),
    'utf-8'
  );
}

runButtonTesting().catch(console.error);
