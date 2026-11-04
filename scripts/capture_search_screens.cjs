/* eslint-disable @typescript-eslint/no-require-imports, no-undef, no-empty */
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACTS_DIR = process.env.MARSHGO_SCREEN_ARTIFACTS_DIR || path.resolve('test-results/screenshots');

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  console.log('Launching headless Chrome with remote debugging on port 9222...');
  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-prefers-color-scheme=light',
      '--user-data-dir=/tmp/chrome_cdp_profile_' + Date.now(),
      '--window-size=430,932',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  // Poll for debugger URL
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await delay(300);
    try {
      const list = await fetchJson('http://localhost:9222/json/list');
      if (list && list[0] && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL from Chrome.');
    chrome.kill();
    process.exit(1);
  }

  console.log('Connecting to Chrome CDP at', wsUrl);
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const callbacks = new Map();

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  });

  await new Promise((res) => ws.on('open', res));

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function captureScreenshot(filepath) {
    console.log(`Capturing screenshot for: ${filepath}`);
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (!res || !res.data) {
      console.error('No data in Page.captureScreenshot response:', res);
      return;
    }
    fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
    console.log(`Successfully saved screenshot: ${filepath}`);
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  try {
    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    // Window size is already configured via CLI flag --window-size=430,932

    console.log('Navigating to http://localhost:3000/journeys/search...');
    await send('Page.navigate', { url: 'http://localhost:3000/journeys/search' });

    // Wait for page load and react render
    console.log('Waiting for search form to render...');
    await delay(3500);

    // SCREEN 1: Search Form
    const screen1Path = path.join(ARTIFACTS_DIR, 'actual_v6_screen1_search_form.png');
    await captureScreenshot(screen1Path);

    // Click "Знайти маршрут"
    console.log('Submitting search form...');
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const searchBtn = btns.find(b => b.textContent && b.textContent.includes('Знайти маршрут'));
        if (searchBtn) searchBtn.click();
      })()
    `);

    // Wait for search results to render
    console.log('Waiting for search results...');
    await delay(2500);

    // SCREEN 2: Results List
    const screen2Path = path.join(ARTIFACTS_DIR, 'actual_v6_screen2_results_list.png');
    await captureScreenshot(screen2Path);

    // Click "Фільтри" button
    console.log('Opening filters modal...');
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const filterBtn = btns.find(b => b.textContent && b.textContent.includes('Фільтри'));
        if (filterBtn) filterBtn.click();
      })()
    `);
    await delay(1000);

    // SCREEN 4: Filters Modal
    const screen4Path = path.join(ARTIFACTS_DIR, 'actual_v6_screen4_filters_modal.png');
    await captureScreenshot(screen4Path);

    // Close filters modal
    console.log('Closing filters modal...');
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const applyBtn = btns.find(b => b.textContent && b.textContent.includes('Показати'));
        if (applyBtn) applyBtn.click();
      })()
    `);
    await delay(800);

    // Click first result card (Андрій / Попутка)
    console.log('Clicking first result card...');
    await evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('div, button'));
        const carpoolCard = cards.find(el => el.textContent && el.textContent.includes('Андрій') && el.textContent.includes('420 ₴'));
        if (carpoolCard) {
          const clickable = carpoolCard.closest('button') || carpoolCard;
          clickable.click();
        }
      })()
    `);
    await delay(2500);

    // SCREEN 3: Map Details View
    const screen3Path = path.join(ARTIFACTS_DIR, 'actual_v6_screen3_map_details.png');
    await captureScreenshot(screen3Path);

    console.log('ALL 4 SCREENS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error in capture script:', err);
  } finally {
    ws.close();
    chrome.kill();
  }
}

main();
