// Скриншоты hero (низ) и ленты доверия после анимаций: node agent-context/ibragim/trust.mjs
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 768, 1366, 1920]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:8091/'); await p.evaluate(() => document.getElementById('cookie-banner')?.remove());
  await p.evaluate(() => document.querySelector('.hero__devices').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `agent-context/ibragim/trust-${w}.png` });
  await p.close();
}
await b.close();
