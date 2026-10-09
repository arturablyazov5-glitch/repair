import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
for (const w of [320, 768, 1366, 1920]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  p.on('console', m => { if (m.type() === 'error') errs.push(w + ' ' + m.text()); });
  p.on('pageerror', e => errs.push(w + ' ' + e.message));
  await p.goto('http://localhost:8099/index.html'); await p.addStyleTag({content:'[class*=cookie]{display:none!important}'}); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
  const ov = await p.evaluate(() => { const W = document.documentElement.clientWidth; const bad = [];
    document.querySelectorAll('#services *, #brands *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && !e.closest('.brands__track') && !e.closest('.services__tabs')) bad.push(e.className + ' ' + Math.round(r.right)); });
    return { sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 5) }; });
  console.log(w, JSON.stringify(ov));
  for (const id of ['services', 'brands']) { if (id==='services') { await p.click('#svc-t03'); await p.waitForTimeout(500); } await (await p.$('#' + id)).screenshot({ path: `agent-context/lavrentiy/${id}-${w}.png` }); }
  if (w === 1366) {
    await p.focus('#svc-tab-all'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    console.log('tab', await p.evaluate(() => [document.activeElement.id, document.querySelectorAll('.services__row:not([hidden])').length]));
    await p.click('#svc-tab-all'); await p.click('#svc-t01'); await p.waitForTimeout(500); await p.focus('.services__sym'); await p.keyboard.press('Enter');
    console.log('pick', await p.evaluate(() => [document.querySelector('#svc-result h4')?.textContent, document.getElementById('svc-pick-btn').hidden, document.getElementById('svc-pick-btn').href.slice(0, 60)]));
  }
  await p.close();
}
console.log('errors', errs);
await b.close();
