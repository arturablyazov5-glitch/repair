// Проверка js/analytics.js и e2e-отправки формы в node-server (Telegram замокан).
// node agent-context/spiridon/check-analytics.mjs
// index.html ещё не пересобран с analytics.js — вставляем <script> на лету; main.js подменяем версией с патчем lead:sent.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createServer } from '../../server/node-server.mjs';

const root = '/home/user/repair';
const SITE_PORT = 8461, API_PORT = 8462;
const ORIGIN = `http://localhost:${SITE_PORT}`;

// патч для main.js (тот же, что в отчёте)
const patchMain = (s) => s
  .replace("const r = await fetch(window.SITE.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });\n      return { ok: r.ok };",
    "const r = await fetch(window.SITE.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });\n      const j = await r.json().catch(() => ({}));\n      return { ok: r.ok && j.ok !== false, error: j.error };")
  .replace("if (r.ok) form.reset();", "if (r.ok) { document.dispatchEvent(new CustomEvent('lead:sent', { detail: { source: form.dataset.source || 'site', via: r.via || 'endpoint' } })); form.reset(); }");

const site = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, 'utf8', (e, d) => {
    if (e) { r.statusCode = 404; return r.end(); }
    if (p.endsWith('index.html') && !d.includes('js/analytics.js')) d = d.replace('<script src="js/cookie.js" defer></script>', '<script src="js/analytics.js" defer></script>\n<script src="js/cookie.js" defer></script>');
    if (p.endsWith('js/main.js')) { const n = patchMain(d); if (n === d || !n.includes('lead:sent')) throw new Error('patch not applied'); d = n; }
    r.setHeader('content-type', { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }[path.extname(p)] || 'application/octet-stream'); r.end(d);
  });
}).listen(SITE_PORT);

const tgCalls = [];
const tg = http.createServer((q, r) => { let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => { tgCalls.push(JSON.parse(b)); r.setHeader('content-type', 'application/json'); r.end('{"ok":true}'); }); }).listen(0);
await new Promise((r) => tg.once('listening', r));
const api = createServer({ ALLOWED_ORIGIN: ORIGIN, BOT_TOKEN: 'T', CHAT_ID: '1', TELEGRAM_API_BASE: `http://127.0.0.1:${tg.address().port}` }, { log: () => {} }).listen(API_PORT);

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const problems = [];
const watch = (pg, tag) => {
  pg.on('console', (m) => { if (m.type() === 'error' && !/mc\.yandex|trace-logos|fonts\.g|net::ERR/.test(m.text() + m.location().url)) problems.push(`${tag} console: ${m.text()}`); });
  pg.on('pageerror', (e) => problems.push(`${tag} pageerror: ${e.message}`));
};
const clickAll = async (pg) => pg.evaluate(() => {
  // клики без перехода: отменяем навигацию у ссылок (в bubble, после capture-обработчика analytics.js)
  document.addEventListener('click', (e) => { if (e.target.closest('a[href]')) e.preventDefault(); });
  const q = (s) => document.querySelector(s);
  [q('a[href^="tel:"]'), q('a[href*="wa.me"]'), q('a[href*="/maps/org/"][href*="reviews"]'), q('a[href*="/gallery/"]'), q('.goodplace')].forEach((el) => el && el.click());
});
const scrollDown = async (pg) => { for (let y = 0; y <= 40; y++) { await pg.evaluate((k) => window.scrollTo(0, document.documentElement.scrollHeight * k / 40), y); await pg.waitForTimeout(40); } };

// 1) Без Метрики: никаких ошибок, track() возвращает false
{
  const pg = await b.newPage({ viewport: { width: 1366, height: 900 } }); watch(pg, 'no-ym');
  await pg.goto(ORIGIN + '/index.html'); await pg.waitForTimeout(300);
  const t = await pg.evaluate(() => ({ type: typeof window.track, ret: window.track('x'), ym: typeof window.ym }));
  await clickAll(pg); await scrollDown(pg);
  await pg.evaluate(() => document.dispatchEvent(new CustomEvent('lead:sent', { detail: { source: 'x' } })));
  await pg.evaluate(() => document.dispatchEvent(new CustomEvent('lead:sent'))); // без detail
  console.log('1) без ym:', JSON.stringify(t));
  await pg.close();
}

// 2) С заглушкой ym: собираем цели
{
  const pg = await b.newPage({ viewport: { width: 390, height: 800 } }); watch(pg, 'ym');
  await pg.addInitScript(() => { window.__goals = []; window.ym = (...a) => window.__goals.push(a); });
  await pg.goto(ORIGIN + '/index.html'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { window.SITE.yandexMetrikaId = '12345678'; window.SITE.leadEndpoint = 'http://localhost:8462/lead'; });
  await clickAll(pg);
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.locator('[data-modal-open="lead-modal"]:visible').first().click();
  // e2e: заполнить модалку и отправить в node-server
  await pg.fill('#lm-name', 'Тест <i>Тестов</i>'); await pg.type('#lm-phone', '9288847790');
  await pg.selectOption('#lm-device', { index: 1 }); await pg.check('#lead-modal input[name=consent]');
  await pg.click('#lead-modal [type=submit]'); await pg.waitForTimeout(600);
  const status = await pg.textContent('#lead-modal .form__status');
  await pg.keyboard.press('Escape');
  await scrollDown(pg);
  console.log('   dbg', await pg.evaluate(() => [document.body.className, scrollY, document.documentElement.scrollHeight, innerHeight]));
  const goals = await pg.evaluate(() => window.__goals.filter((g) => g[1] === 'reachGoal').map((g) => g[2] + (g[3] && Object.keys(g[3]).length ? JSON.stringify(g[3]) : '')));
  console.log('2) статус формы:', status);
  console.log('   Telegram получил:', tgCalls.length, tgCalls[0] && tgCalls[0].text.replace(/\n/g, ' | '));
  console.log('   цели:', goals.join('\n         '));
  await pg.close();
}
console.log(problems.length ? 'ПРОБЛЕМЫ:\n' + problems.join('\n') : 'консоль: ошибок нет');
await b.close(); site.close(); api.close(); tg.close();
