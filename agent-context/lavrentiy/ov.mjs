import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320,768]) { const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto('http://localhost:8099/index.html'); await p.waitForTimeout(400);
console.log(w, await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.brands__track,.services__tabs')).slice(0, 6).map(e => (e.closest('section')?.id || e.tagName) + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right))));}
await b.close();
