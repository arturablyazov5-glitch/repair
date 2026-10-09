import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = '/home/user/repair';
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8095);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const out = [];
for (const w of [320, 768, 1366, 1920]) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 } });
  const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('http://localhost:8095/index.html'); await pg.waitForTimeout(300);
  await pg.addStyleTag({ content: '.cookie,[class*=cookie]{display:none!important}.js .reveal{opacity:1!important;transform:none!important}' });
  const over = await pg.evaluate(() => { const W = document.documentElement.clientWidth; const bad = []; document.querySelectorAll('#gallery *, #team *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && !e.closest('.gal-lb')) bad.push(e.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); }); return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 8) }; });
  out.push([w, JSON.stringify(over), errs.join('|')]);
  for (const id of ['gallery', 'team']) { await (await pg.$('#' + id)).screenshot({ path: `agent-context/veniamin/${id}-${w}.png` }); }
  if (w === 1366 || w === 320) {
    // слайдер: мышь
    const rng = await pg.$('.gal__ba-range'); await rng.scrollIntoViewIfNeeded(); const bb = await rng.boundingBox();
    await pg.mouse.click(bb.x + bb.width * .8, bb.y + bb.height / 2); const v1 = await rng.inputValue();
    await pg.mouse.move(bb.x + bb.width * .5, bb.y + bb.height / 2); await pg.mouse.down(); await pg.mouse.move(bb.x + bb.width * .2, bb.y + bb.height / 2, { steps: 5 }); await pg.mouse.up(); const v2 = await rng.inputValue();
    await rng.focus(); await pg.keyboard.press('ArrowRight'); const v3 = await rng.inputValue();
    const pos = await pg.$eval('.gal__ba-view', e => e.style.getPropertyValue('--pos'));
    // лайтбокс
    await pg.click('.gal__item:nth-child(1) .gal__open'); const o1 = await pg.$eval('.gal-lb', e => e.classList.contains('is-open'));
    await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(300); const c1 = await pg.$eval('.gal-lb__cap', e => e.textContent);
    await pg.screenshot({ path: `agent-context/veniamin/lightbox-${w}.png` });
    await pg.keyboard.press('Escape'); const o2 = await pg.$eval('.gal-lb', e => e.classList.contains('is-open')); const f = await pg.evaluate(() => document.activeElement.className);
    out.push(['interact', w, { v1, v2, v3, pos, o1, c1, o2, f }]);
  }
  await pg.close();
}
console.log(out.map(x => JSON.stringify(x)).join('\n')); await b.close(); srv.close();
