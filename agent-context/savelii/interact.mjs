// Интерактив на мобиле: меню, модалка, табы, аккордеоны, калькулятор, отзывы, mbar/cookie. node interact.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = '/home/user/repair';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.statusCode = 404; r.end() } else { r.setHeader('content-type', types[path.extname(p)] || 'application/octet-stream'); r.end(d) } }) }).listen(8523);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 360, 768]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 740 }, hasTouch: true, isMobile: w < 768 });
  await ctx.route(u => !u.href.startsWith('http://localhost:8523'), r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }));
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto('http://localhost:8523/index.html'); await pg.waitForTimeout(400);
  const res = [];
  const ok = (n, v) => res.push((v ? 'ok ' : 'FAIL ') + n);
  // cookie-баннер виден? перекрывает ли mbar?
  const ck = await pg.evaluate(() => { const c = document.getElementById('cookie-banner'); const m = document.querySelector('.mbar'); if (!c || c.hidden) return 'hidden'; const a = c.getBoundingClientRect(), bb = m.getBoundingClientRect(); return `cookie ${Math.round(a.top)}-${Math.round(a.bottom)} mbar ${Math.round(bb.top)} ${getComputedStyle(m).display}` });
  res.push('cookie: ' + ck);
  await pg.evaluate(() => document.querySelector('[data-cookie-accept], .cookie .btn')?.click());
  // меню
  if (w < 1280) { await pg.click('.hdr__burger'); await pg.waitForTimeout(250); ok('menu open', await pg.evaluate(() => document.querySelector('.hdr').classList.contains('is-menu'))); await pg.click('.hdr__burger'); }
  // модалка
  await pg.evaluate(() => document.querySelector('[data-modal-open="lead-modal"]').click()); await pg.waitForTimeout(300);
  ok('modal open', await pg.evaluate(() => document.getElementById('lead-modal').classList.contains('is-open')));
  const mfs = await pg.evaluate(() => { const d = document.querySelector('#lead-modal .modal__dialog').getBoundingClientRect(); return [Math.round(d.width), Math.round(d.height)] }); res.push('modal ' + mfs);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  ok('modal closed', await pg.evaluate(() => !document.getElementById('lead-modal').classList.contains('is-open')));
  // аккордеон услуг
  await pg.evaluate(() => document.querySelector('.services__trigger').click()); await pg.waitForTimeout(400);
  ok('services accordion', await pg.evaluate(() => document.querySelector('.services__trigger').getAttribute('aria-expanded') === 'true'));
  // табы услуг
  await pg.evaluate(() => document.querySelectorAll('.services__tab')[1]?.click()); await pg.waitForTimeout(200);
  ok('services tab', await pg.evaluate(() => document.querySelectorAll('.services__tab')[1]?.getAttribute('aria-selected') === 'true'));
  // процесс-табы
  await pg.evaluate(() => document.querySelectorAll('.process__tab')[2]?.click()); await pg.waitForTimeout(200);
  ok('process tab', await pg.evaluate(() => document.querySelectorAll('.process__tab')[2]?.getAttribute('aria-selected') === 'true'));
  // калькулятор
  await pg.evaluate(() => document.querySelector('[data-calc-devices] input')?.click()); await pg.waitForTimeout(200);
  ok('calc faults enabled', await pg.evaluate(() => !!document.querySelector('[data-calc-faults] input')));
  // отзывы: стрелка
  await pg.evaluate(() => document.querySelector('.rv-arrow:not(:disabled)')?.click()); await pg.waitForTimeout(500);
  ok('reviews slide', await pg.evaluate(() => document.querySelector('.rv-track').scrollLeft > 0));
  // FAQ
  await pg.evaluate(() => { const d = document.querySelectorAll('.faq__item')[2]; d.querySelector('summary').click() }); await pg.waitForTimeout(100);
  ok('faq open', await pg.evaluate(() => document.querySelectorAll('.faq__item')[2].open));
  // тач-цели < 44 среди видимых интерактивных в main
  const small = await pg.evaluate(() => [...document.querySelectorAll('section button, section a.btn, section [role=tab], section summary, .mbar a, .mbar button')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && r.height < 43.5 && getComputedStyle(e).visibility !== 'hidden' }).map(e => e.className.toString().split(' ')[0] + ':' + Math.round(e.getBoundingClientRect().height)));
  res.push('tap<44: ' + [...new Set(small)].join(' '));
  // последний элемент подвала не под mbar
  const tail = await pg.evaluate(() => { scrollTo(0, 1e7); const f = document.querySelector('.footer__bottom').getBoundingClientRect(); const m = document.querySelector('.mbar'); return getComputedStyle(m).display === 'none' ? 'no mbar' : `footer bottom ${Math.round(f.bottom)} / mbar top ${Math.round(m.getBoundingClientRect().top)}` });
  res.push(tail);
  console.log(`== ${w}: errs ${errs.length} ${errs.slice(0, 2).join(' | ')}\n  ` + res.join('\n  '));
  await ctx.close();
}
await b.close(); srv.close();
