import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGEERROR] ${err.stack}`));
  page.on('requestfailed', req => logs.push(`[REQ_FAILED] ${req.url()} - ${req.failure()?.errorText}`));

  console.log('Navigating to http://localhost:3000 ...');
  try {
    await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000); // Wait for React to mount and API requests
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('=== LOGS ===');
  console.log(logs.join('\n'));

  const title = await page.title();
  console.log('Page title:', title);

  try {
    const rootHtml = await page.$eval('#root', el => el.outerHTML);
    console.log('=== ROOT HTML ===');
    console.log(rootHtml.slice(0, 1000));
  } catch (e) {
    console.log('Failed to get #root HTML:', e.message);
  }

  await browser.close();
}

test().catch(e => console.error('Error running test:', e));
