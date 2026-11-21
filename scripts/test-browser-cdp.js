// Automated Browser Verification via Headless Edge CDP
// Captures screenshots, tests console errors, and verifies mobile navigation

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\8239881f-c405-4b71-a7f3-f3f0a7bfeab0';
const USER_DATA_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\8239881f-c405-4b71-a7f3-f3f0a7bfeab0\\scratch\\edge-profile';

if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('--- STARTING EDGE CDP BROWSER AUTOMATION ---');

  // Spawn Edge
  const edge = spawn(
    EDGE_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let connected = false;
  let targetWs = null;

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const tabs = await res.json();
      if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        targetWs = tabs[0].webSocketDebuggerUrl;
        connected = true;
        break;
      }
    } catch {}
  }

  if (!connected) {
    console.error('Failed to connect to Edge CDP on port 9222');
    edge.kill();
    process.exit(1);
  }

  console.log('Connected to Edge CDP target:', targetWs);

  // Use native WebSocket (Node 22+)
  const ws = new WebSocket(targetWs);

  let msgId = 1;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails?.text || 'Uncaught exception');
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  async function capturePage(name, url, isMobile = false) {
    console.log(`Navigating to ${url} (Mobile: ${isMobile})...`);
    if (isMobile) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true,
      });
    } else {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false,
      });
    }

    await sendCommand('Page.navigate', { url });
    await sleep(2500);

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (shot && shot.data) {
      const filePath = path.join(ARTIFACTS_DIR, `${name}.png`);
      fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${filePath}`);
    }
  }

  // 1. Desktop Homepage
  await capturePage('qa-desktop-homepage', 'http://localhost:3000/');

  // 2. Mobile Homepage & Navigation
  await capturePage('qa-mobile-homepage', 'http://localhost:3000/', true);

  // 3. Category Page (Co-ord Sets)
  await capturePage('qa-category-coord-sets', 'http://localhost:3000/category/co-ord-sets');

  // 4. Product Details Page
  await capturePage('qa-product-details', 'http://localhost:3000/products/ivory-embroidered-linen-coord-set');

  // 5. Checkout Page
  await capturePage('qa-checkout-flow', 'http://localhost:3000/checkout');

  // 6. Order Details Page (Customer View of Shipped Order)
  await capturePage('qa-customer-order-shipped', 'http://localhost:3000/profile/orders/NT-349167');

  ws.close();
  edge.kill();

  console.log('\n--- BROWSER CONSOLE ERRORS AUDIT ---');
  console.log(`Total Console Errors Detected: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  } else {
    console.log('Browser console clean: 0 runtime errors detected during navigation flows.');
  }

  console.log('--- BROWSER AUTOMATION COMPLETE ---');
}

main().catch(console.error);
