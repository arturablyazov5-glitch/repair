import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = '/home/user/repair';
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.statusCode = 404; r.end(); } else { r.setHeader('content-type', {'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(p)] || 'application/octet-stream'); r.end(d); } }); }).listen(8431);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const logs = [];
for (const w of [320, 768, 1366, 1920]) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 } });
  pg.on('console', m => { if (['error','warning'].includes(m.type())) logs.push(w + ' ' + m.text()); });
  pg.on('pageerror', e => logs.push(w + ' PE ' + e.message));
  await pg.goto('http://localhost:8431/index.html'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
  const ov = await pg.evaluate(() => { const s = document.querySelector('#reviews'); const W = document.documentElement.clientWidth; const bad = [...s.querySelectorAll('*')].filter(e => !e.closest('.rv-track') && e.getBoundingClientRect().right > W + 1).map(e => e.className || e.tagName); return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 5) }; });
  console.log(w, JSON.stringify(ov));
  await pg.waitForTimeout(1200);
  await (await pg.$('#reviews')).screenshot({ path: `/home/user/repair/agent-context/akakiy/reviews-${w}.png` });
  if (w === 1366) {
    await pg.focus('[data-rv-track]'); await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(800);
    console.log('scrollLeft after key', await pg.evaluate(() => document.querySelector('[data-rv-track]').scrollLeft), await pg.textContent('[data-rv-count]'));
    await pg.click('[data-filter=premium]'); await pg.waitForTimeout(200);
    console.log('premium', await pg.textContent('[data-rv-count]'));
  }
  await pg.close();
}
console.log('logs', logs); await b.close(); srv.close();
