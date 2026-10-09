// Доп.проверка: карта по клику, локальные шрифты, OG. node agent-context/afanasiy/check2.mjs [port]
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url); const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const base = `http://localhost:${process.argv[2] || 8086}/`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const url of ['', 'legal/privacy.html']) {
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const ext = [], errs = [];
  p.on('request', r => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:')) ext.push(u.slice(0, 70)); });
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const f = await p.evaluate(() => ({
    inter: document.fonts.check('400 16px Inter', 'Привет'), manrope: document.fonts.check('800 16px Manrope', 'Привет'),
    loaded: [...document.fonts].filter(x => x.status === 'loaded').map(x => x.family + ' ' + x.weight),
    h2: getComputedStyle(document.querySelector('h2')).fontFamily,
    og: ['og:title', 'og:url', 'og:image'].map(k => document.querySelector(`meta[property="${k}"]`)?.content),
  }));
  console.log(`[${url || 'index'}] external requests before click:`, [...new Set(ext)]);
  console.log('  fonts:', JSON.stringify(f));
  if (!url) {
    console.log('  iframes before click:', await p.locator('#contacts iframe').count());
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
    await p.evaluate(() => document.querySelectorAll('body *').forEach(e => { const ps = getComputedStyle(e).position; if ((ps === 'fixed' || ps === 'sticky') && !e.closest('#contacts')) e.style.visibility = 'hidden'; }));
    await p.locator('.contacts__map').screenshot({ path: 'agent-context/afanasiy/map-before-1366.png' });
    await p.locator('[data-map-show]').focus(); await p.keyboard.press('Enter');
    await p.waitForTimeout(500);
    console.log('  iframe after click:', await p.locator('#contacts iframe').getAttribute('src'));
    await p.waitForTimeout(13000);
    console.log('  map classes:', await p.locator('[data-map]').getAttribute('class'), '| ext after:', [...new Set(ext)].filter(u => u.includes('yandex')).length, 'yandex reqs');
    await p.locator('.contacts__map').screenshot({ path: 'agent-context/afanasiy/map-after-1366.png' });
  }
  console.log('  errors:', errs);
  await p.close();
}
const m = await b.newPage({ viewport: { width: 320, height: 800 } });
await m.goto(base); await m.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
await m.evaluate(() => document.querySelectorAll('body *').forEach(e => { const ps = getComputedStyle(e).position; if ((ps === 'fixed' || ps === 'sticky') && !e.closest('#contacts')) e.style.visibility = 'hidden'; }));
await m.locator('.contacts__map').screenshot({ path: 'agent-context/afanasiy/map-before-320.png' });
await b.close();
