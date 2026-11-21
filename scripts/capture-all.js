import { execSync } from 'child_process';
import path from 'path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\8239881f-c405-4b71-a7f3-f3f0a7bfeab0';

const targets = [
  { file: 'qa-mobile-home.png', url: 'http://localhost:3000/', size: '375,812' },
  { file: 'qa-category-coords.png', url: 'http://localhost:3000/category/co-ord-sets', size: '1280,900' },
  { file: 'qa-product-coords.png', url: 'http://localhost:3000/products/ivory-embroidered-linen-coord-set', size: '1280,900' },
  { file: 'qa-order-tracking.png', url: 'http://localhost:3000/profile/orders/NT-349167', size: '1280,900' },
];

for (const t of targets) {
  const outPath = path.join(OUT_DIR, t.file);
  const cmd = `"${EDGE}" --headless=new --screenshot="${outPath}" --window-size=${t.size} ${t.url}`;
  console.log(`Capturing ${t.file}...`);
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 15000 });
  } catch (e) {
    console.error(`Failed ${t.file}:`, e.message);
  }
}
console.log('Done capturing all screenshots!');
