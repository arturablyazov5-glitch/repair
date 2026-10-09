// Проверка прод-сборки: node tools/qa.mjs
//  1) визуальная идентичность dev (корень) и dist/: полностраничные скриншоты 320 и 1366 (главная, privacy, одна SEO-страница),
//     попиксельно через pixelmatch. Детерминизм: prefers-reduced-motion, внешние запросы заблокированы в обоих вариантах,
//     страница прокручивается до низа (срабатывают reveal), фиксированное время.
//  2) smoke dist/: модалка, валидация формы, шаги процесса, слайдер отзывов, лайтбокс, карта по клику, cookie-баннер,
//     вариативный шрифт (вес 700 реальный, не синтетический), чистая консоль.
// Результат: perf/qa.md, картинки различий — perf/shots/ (в .gitignore).
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { serve } from './serve.mjs';
import { execFileSync } from 'node:child_process';
// dev и dist собираются одним заходом (build-prod сам вызывает build.mjs) — иначе параллельные правки секций дают ложные различия
if (!process.env.QA_NO_BUILD) execFileSync(process.execPath, ['build-prod.mjs'], { stdio: 'inherit' });

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const seo = fs.existsSync('dist/remont') ? fs.readdirSync('dist/remont', { withFileTypes: true }).find(d => d.isDirectory()) : null;
const PAGES = ['/', '/legal/privacy.html', ...(seo ? [`/remont/${seo.name}/`] : [])];
const WIDTHS = [320, 1366];
fs.mkdirSync('perf/shots', { recursive: true });
const devSrv = await serve('.', 8095), distSrv = await serve('dist', 8096);
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--font-render-hinting=none'] });
const L = ['# QA прод-сборки (tools/qa.mjs)', '', '## Визуальное сравнение dev ↔ dist', '', '| Страница | Ширина | Размер dev / dist | Отличающихся пикселей | % |', '|---|---|---|---|---|'];
let ok = true;

async function shot(port, path, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', locale: 'ru-RU' });
  await ctx.addInitScript(() => { const fixed = new Date('2026-10-07T10:00:00+03:00').getTime(); const D = Date; Date.now = () => fixed; window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [fixed])); } static now() { return fixed; } }; try { localStorage.setItem('cookie-consent-qa', '1'); } catch {} });
  const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0); });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  await page.waitForTimeout(500);
  const buf = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await ctx.close();
  return PNG.sync.read(buf);
}
for (const p of PAGES) for (const w of WIDTHS) {
  const a = await shot(8095, p, w), b = await shot(8096, p, w);
  const name = p.replace(/\W+/g, '_') + w;
  let diff = '—', pct = '—';
  if (a.width === b.width && a.height === b.height) {
    const d = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.1 });
    diff = n; pct = (n / (a.width * a.height) * 100).toFixed(3);
    if (n) fs.writeFileSync(`perf/shots/${name}-diff.png`, PNG.sync.write(d));
    if (n / (a.width * a.height) > 0.005) ok = false;
  } else ok = false;
  fs.writeFileSync(`perf/shots/${name}-dev.png`, PNG.sync.write(a)); fs.writeFileSync(`perf/shots/${name}-dist.png`, PNG.sync.write(b));
  L.push(`| ${p} | ${w} | ${a.width}×${a.height} / ${b.width}×${b.height} | ${diff} | ${pct} |`);
}

// ---- smoke ----
L.push('', '## Smoke dist/ (мобильный 390 и десктоп 1366)', '');
const checks = [];
const check = (name, pass, info = '') => { checks.push(`- ${pass ? '✔' : '✘'} ${name}${info ? ' — ' + info : ''}`); if (!pass) ok = false; };
for (const width of [390, 1366]) {
  const ctx = await browser.newContext({ viewport: { width, height: 860 }, locale: 'ru-RU' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !/127\.0\.0\.1/.test(m.location().url || '') === false) errs.push(m.text()); else if (m.type() === 'error') errs.push('[внешн.] ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  const local404 = [];
  page.on('response', r => { if (r.url().includes('127.0.0.1') && r.status() >= 400) local404.push(r.status() + ' ' + r.url()); });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto('http://127.0.0.1:8096/', { waitUntil: 'load' });
  const w = `[${width}] `;
  // шрифт: один вариативный файл, вес 700 реальный
  const font = await page.evaluate(async () => { await document.fonts.ready; const f = [...document.fonts].filter(f => f.family.replace(/"/g, '') === 'Onest'); const h = document.querySelector('h1'); const cs = getComputedStyle(h);
    const c = document.createElement('canvas').getContext('2d'); const t = 'Ремонт техники 0123'; c.font = `400 40px Onest`; const w4 = c.measureText(t).width; c.font = `700 40px Onest`; const w7 = c.measureText(t).width;
    return { faces: f.map(x => `${x.weight}:${x.status}`), h1w: cs.fontWeight, synth: cs.fontSynthesisWeight, w4, w7 }; });
  check(w + 'Onest вариативный: веса из одного файла, 700 шире 400 (настоящий жирный, не синтетика)', font.faces.every(x => x.startsWith('400 700')) && font.w7 > font.w4 * 1.03, JSON.stringify(font));
  // cookie
  const cookie = page.locator('#cookie-banner');
  const cookieVisible = await cookie.isVisible();
  check(w + 'cookie-баннер показан', cookieVisible);
  if (cookieVisible) { await page.locator('#cookie-banner [data-cookie-necessary]').click(); await page.waitForTimeout(300); check(w + 'cookie-баннер закрывается', !(await cookie.isVisible())); }
  // модалка + валидация
  await page.locator('[data-modal-open="lead-modal"]:visible').first().click();
  await page.waitForTimeout(300);
  check(w + 'модалка заявки открывается', await page.locator('#lead-modal.is-open').count() === 1);
  await page.locator('#lead-modal [type=submit]').click();
  check(w + 'валидация формы (пустая отправка → ошибки)', await page.locator('#lead-modal .field.is-invalid').count() > 0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  check(w + 'модалка закрывается по Esc', await page.locator('#lead-modal.is-open').count() === 0);
  // процесс
  const next = page.locator('[data-process-next]');
  if (await next.count()) { await next.scrollIntoViewIfNeeded(); const before = await page.locator('#process [aria-selected="true"]').first().textContent(); await next.click(); await page.waitForTimeout(300); const after = await page.locator('#process [aria-selected="true"]').first().textContent(); check(w + 'шаги «Процесс» переключаются', before !== after); }
  // отзывы
  const rvNext = page.locator('[data-rv-next]');
  if (await rvNext.count() && !(await rvNext.isEnabled())) check(w + 'слайдер отзывов: кнопка «вперёд» неактивна (все карточки видны или фильтр)', true, 'пропуск');
  else if (await rvNext.count()) { await rvNext.scrollIntoViewIfNeeded(); const s0 = await page.locator('[data-rv-track]').evaluate(e => e.scrollLeft); await rvNext.click(); await page.waitForTimeout(900); const s1 = await page.locator('[data-rv-track]').evaluate(e => e.scrollLeft); check(w + 'слайдер отзывов листается', s1 > s0, `${s0}→${s1}`); }
  // лайтбокс
  const lbItem = page.locator('[data-lightbox]').first();
  if (await lbItem.count()) { await lbItem.scrollIntoViewIfNeeded(); await lbItem.click(); await page.waitForTimeout(400); const vis = await page.locator('.gal-lb').isVisible(); const src = vis ? await page.locator('.gal-lb img').first().evaluate(i => `${i.naturalWidth}px ${i.src.split('/').pop()}`).catch(() => 'нет img') : ''; check(w + 'лайтбокс открывается', vis, src); await page.keyboard.press('Escape'); }
  // карта по клику (внешний запрос заблокирован -> ожидаем iframe в DOM)
  const mapBtn = page.locator('[data-map-show]').first();
  if (await mapBtn.count()) { await mapBtn.scrollIntoViewIfNeeded(); await mapBtn.click(); await page.waitForTimeout(500); check(w + 'карта по клику создаёт iframe Яндекса', await page.locator('[data-map] iframe').count() === 1); }
  // картинки: picture + srcset отданы и декодированы
  const imgs = await page.evaluate(async () => { const r = []; for (const i of document.querySelectorAll('picture.pic img')) { i.scrollIntoView(); await new Promise(x => setTimeout(x, 150)); r.push({ ok: i.complete && i.naturalWidth > 0, cur: i.currentSrc.split('/').pop(), w: Math.round(i.getBoundingClientRect().width) }); } return r; });
  check(w + `все <picture> загрузились (${imgs.length})`, imgs.every(i => i.ok), imgs.map(i => `${i.cur}@${i.w}px`).join(', '));
  check(w + 'нет 404 у локальных ресурсов', !local404.length, local404.join(', '));
  check(w + 'консоль без ошибок (кроме заблокированных внешних)', !errs.filter(e => !e.startsWith('[внешн.]')).length, errs.join(' | '));
  await ctx.close();
}
for (const p of ['/legal/privacy.html', ...(seo ? [`/remont/${seo.name}/`] : [])]) {
  const page = await browser.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('response', r => { if (r.url().includes('127.0.0.1') && r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto('http://127.0.0.1:8096' + p, { waitUntil: 'load' });
  check(`${p}: без ошибок и 404`, !errs.length, errs.join(' | ')); await page.close();
}
L.push(...checks, '', ok ? '**Итог: OK**' : '**Итог: есть замечания (см. ✘ / % выше 0.5)**');
await browser.close(); devSrv.close(); distSrv.close();
fs.writeFileSync('perf/qa.md', L.join('\n') + '\n');
console.log(L.join('\n'));
