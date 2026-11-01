import { chromium } from 'playwright';

async function testZrokScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGEERROR] ${err.stack}`));
  page.on('requestfailed', req => logs.push(`[REQ_FAILED] ${req.url()} - ${req.failure()?.errorText}`));

  console.log('Navigating to https://marshgo-dima.shares.zrok.io ...');
  try {
    // Navigate with a specific user-agent to avoid simple bot blocks if any, though zrok interstitial is handled by bypass header or clicking
    await page.goto('https://marshgo-dima.shares.zrok.io', { timeout: 15000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check if we are on the zrok interstitial
    const title = await page.title();
    console.log('Title before click:', title);

    const visitShareBtn = page.locator('text=Visit Share');
    if (await visitShareBtn.count() > 0) {
      console.log('Found zrok interstitial. Clicking "Visit Share"...');
      await visitShareBtn.click();
      await page.waitForTimeout(5000);
    } else {
      console.log('No "Visit Share" button found. Trying bypass header if needed...');
    }

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'tools/zrok-screenshot.png', fullPage: true });

    console.log('Title after:', await page.title());
    const rootHtml = await page.$eval('body', el => el.outerHTML);
    console.log('Body HTML length:', rootHtml.length);
    if (rootHtml.length < 1000) {
       console.log('Body HTML content:', rootHtml);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('=== LOGS ===');
  console.log(logs.join('\n'));

  await browser.close();
}

testZrokScreenshot().catch(e => console.error(e));
