// Проверка нижней панели и cookie-баннера: node agent-context/ibragim/mbar.mjs
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 360, 375, 414]) {
  const p = await b.newPage({ viewport: { width: w, height: 700 } });
  await p.goto('http://localhost:8091/'); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const bar = document.querySelector('.mbar').getBoundingClientRect();
    const btns = [...document.querySelectorAll('.mbar__btn')].map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), x.scrollWidth > x.clientWidth]; });
    const ck = document.getElementById('cookie-banner'); const cr = ck && getComputedStyle(ck).display !== 'none' ? ck.getBoundingClientRect() : null;
    return { barH: Math.round(bar.height), barRight: Math.round(bar.right), btns, cookieBottom: cr && Math.round(cr.bottom), barTop: Math.round(bar.top), overlap: cr ? cr.bottom > bar.top : null };
  });
  await p.screenshot({ path: `agent-context/ibragim/mbar-${w}.png` });
  console.log(w, JSON.stringify(r));
  await p.close();
}
await b.close();
