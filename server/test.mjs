// Тесты приёмника заявок: node server/test.mjs
// Поднимает заглушку Telegram Bot API и node-server.mjs (отдельным процессом), гоняет успешные/ошибочные запросы.
// Дополнительно прогоняет worker.js (fetch-handler) через глобальные Request/Response Node.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://servis-lux.test';
const TOKEN = 'TEST_TOKEN', CHAT = '-100123';

// --- заглушка Telegram ---
const tgCalls = []; let tgFail = false;
const tg = http.createServer((q, r) => {
  let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
    tgCalls.push({ url: q.url, body: JSON.parse(b || '{}') });
    r.writeHead(tgFail ? 500 : 200, { 'Content-Type': 'application/json' });
    r.end(JSON.stringify(tgFail ? { ok: false, description: 'mock fail' } : { ok: true, result: {} }));
  });
}).listen(0, '127.0.0.1');
await new Promise((r) => tg.once('listening', r));
const TG_BASE = `http://127.0.0.1:${tg.address().port}`;

// --- node-server ---
const PORT = 18000 + Math.floor(Math.random() * 1000);
const logs = [];
const srv = spawn(process.execPath, [path.join(dir, 'node-server.mjs')], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', ALLOWED_ORIGIN: `${ORIGIN},https://www.servis-lux.test`, BOT_TOKEN: TOKEN, CHAT_ID: CHAT, TELEGRAM_API_BASE: TG_BASE, TRUST_PROXY: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stdout.on('data', (d) => logs.push(...String(d).trim().split('\n')));
srv.stderr.on('data', (d) => logs.push('ERR ' + d));
await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('server did not start')), 5000); srv.stdout.on('data', (d) => { if (/leads server/.test(d)) { clearTimeout(t); res(); } }); });

const URL_ = `http://127.0.0.1:${PORT}/lead`;
let ipN = 1;
const post = (body, { origin = ORIGIN, ct = 'application/json', ip = `10.0.0.${ipN++}`, raw } = {}) =>
  fetch(URL_, { method: 'POST', headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': ct, 'X-Real-IP': ip }, body: raw ?? JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, json: await r.json().catch(() => null), acao: r.headers.get('access-control-allow-origin') }));

const good = { name: 'Анна <b>Тест</b>', phone: '+7 (928) 884-77-90', device: 'Стиральная машина', brand: 'Miele', problem: 'Не сливает & шумит', consent: 'on', source: 'hero', page: 'https://servis-lux.test/', website: '' };

let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ', name); } catch (e) { fail++; console.log('  FAIL', name, '\n       ', e.message); } };

console.log('node-server.mjs');
await t('успешная заявка -> 200 {ok:true}, ушло в Telegram, HTML экранирован', async () => {
  const n = tgCalls.length; const r = await post(good);
  assert.equal(r.status, 200); assert.deepEqual(r.json, { ok: true }); assert.equal(r.acao, ORIGIN);
  assert.equal(tgCalls.length, n + 1);
  const c = tgCalls.at(-1); assert.equal(c.url, `/bot${TOKEN}/sendMessage`); assert.equal(c.body.chat_id, CHAT); assert.equal(c.body.parse_mode, 'HTML');
  assert.match(c.body.text, /Анна &lt;b&gt;Тест&lt;\/b&gt;/); assert.match(c.body.text, /Не сливает &amp; шумит/); assert.match(c.body.text, /\+7 \(928\) 884-77-90/);
});
await t('consent:true (boolean) и телефон 8XXXXXXXXXX принимаются; www-домен разрешён', async () => {
  const r = await post({ name: 'Иван', phone: '89288847790', consent: true }, { origin: 'https://www.servis-lux.test' }); assert.equal(r.status, 200); assert.equal(r.json.ok, true);
});
await t('preflight OPTIONS c разрешённого домена -> 204 + CORS', async () => {
  const r = await fetch(URL_, { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST' } });
  assert.equal(r.status, 204); assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
});
await t('чужой Origin -> 403 origin, без CORS-заголовка', async () => { const r = await post(good, { origin: 'https://evil.test' }); assert.equal(r.status, 403); assert.equal(r.json.error, 'origin'); assert.equal(r.acao, null); });
await t('без Origin -> 403', async () => { const r = await post(good, { origin: null }); assert.equal(r.status, 403); });
await t('короткий телефон -> 400 phone', async () => { const r = await post({ ...good, phone: '+7 (928) 884-77' }); assert.equal(r.status, 400); assert.equal(r.json.error, 'phone'); });
await t('не-российский номер -> 400 phone', async () => { const r = await post({ ...good, phone: '+1 202 555 0147' }); assert.equal(r.json.error, 'phone'); });
await t('пустое имя -> 400 name', async () => { const r = await post({ ...good, name: '  ' }); assert.equal(r.json.error, 'name'); });
await t('без согласия -> 400 consent', async () => { const r = await post({ ...good, consent: undefined }); assert.equal(r.json.error, 'consent'); });
await t('consent:"false" -> 400 consent', async () => { const r = await post({ ...good, consent: 'false' }); assert.equal(r.json.error, 'consent'); });
await t('слишком длинная проблема -> 400 too_long_problem', async () => { const r = await post({ ...good, problem: 'x'.repeat(1001) }); assert.equal(r.json.error, 'too_long_problem'); });
await t('поле-объект -> 400', async () => { const r = await post({ ...good, device: { a: 1 } }); assert.equal(r.status, 400); });
await t('honeypot заполнен -> 200 {ok:true}, но в Telegram НЕ уходит', async () => { const n = tgCalls.length; const r = await post({ ...good, website: 'http://spam' }); assert.equal(r.status, 200); assert.equal(r.json.ok, true); assert.equal(tgCalls.length, n); });
await t('битый JSON -> 400 bad_json', async () => { const r = await post(null, { raw: '{oops' }); assert.equal(r.json.error, 'bad_json'); });
await t('не JSON content-type -> 415', async () => { const r = await post(good, { ct: 'text/plain' }); assert.equal(r.status, 415); });
await t('тело > 8 КБ -> 413', async () => { const r = await post(null, { raw: JSON.stringify({ ...good, x: 'y'.repeat(9000) }) }); assert.equal(r.status, 413); });
await t('GET -> 405, GET /health -> 200', async () => {
  assert.equal((await fetch(URL_)).status, 405);
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/health`)).status, 200);
});
await t('rate-limit: 6-я заявка с одного IP за 10 мин -> 429', async () => {
  const st = []; for (let i = 0; i < 6; i++) st.push((await post(good, { ip: '10.9.9.9' })).status);
  assert.deepEqual(st, [200, 200, 200, 200, 200, 429]);
});
await t('Telegram недоступен -> 502 delivery', async () => { tgFail = true; const r = await post(good); tgFail = false; assert.equal(r.status, 502); assert.equal(r.json.error, 'delivery'); });
await t('в логах нет ПДн: телефон и IP замаскированы, имени нет', async () => {
  await new Promise((r) => setTimeout(r, 100));
  const all = logs.join('\n');
  assert.ok(!all.includes('8847790') && !all.includes('884-77-90'), 'телефон в логах'); assert.ok(!all.includes('Анна'), 'имя в логах');
  assert.ok(!all.includes('10.9.9.9'), 'полный IP в логах'); assert.match(all, /\+7 \*\*\* \*\*\*-\*\*-90/);
});

// --- worker.js тем же набором ключевых сценариев ---
console.log('worker.js');
const { default: worker } = await import('./worker.js');
const wenv = { ALLOWED_ORIGIN: ORIGIN, BOT_TOKEN: TOKEN, CHAT_ID: CHAT, TELEGRAM_API_BASE: TG_BASE };
const wpost = (body, { origin = ORIGIN, ip = '1.2.3.4' } = {}) => worker.fetch(new Request('https://w.test/', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) }), wenv)
  .then(async (r) => ({ status: r.status, json: await r.json(), acao: r.headers.get('access-control-allow-origin') }));
const origLog = console.log; const wlogs = []; console.log = (...a) => (typeof a[0] === 'string' && a[0].startsWith('{') ? wlogs.push(a[0]) : origLog(...a));
await t('worker: успешная заявка -> 200, CORS, ушло в Telegram', async () => { const n = tgCalls.length; const r = await wpost(good); assert.equal(r.status, 200); assert.equal(r.acao, ORIGIN); assert.equal(tgCalls.length, n + 1); });
await t('worker: чужой Origin -> 403', async () => { assert.equal((await wpost(good, { origin: 'https://evil.test' })).status, 403); });
await t('worker: без согласия -> 400 consent', async () => { assert.equal((await wpost({ ...good, consent: false })).json.error, 'consent'); });
await t('worker: rate-limit по CF-Connecting-IP (память) -> 429', async () => { const st = []; for (let i = 0; i < 6; i++) st.push((await wpost(good, { ip: '5.5.5.5' })).status); assert.equal(st.at(-1), 429); });
await t('worker: rate-limit через KV-заглушку', async () => {
  const store = new Map(); const kv = { get: async (k) => store.get(k) ?? null, put: async (k, v) => store.set(k, v) };
  const e = { ...wenv, RATE_KV: kv }; const st = [];
  for (let i = 0; i < 6; i++) st.push((await worker.fetch(new Request('https://w.test/', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '7.7.7.' + i }, body: JSON.stringify(good) }), e)).status);
  assert.deepEqual(st, [200, 200, 200, 200, 200, 200]); // разные IP — не режем
  assert.ok([...store.keys()].every((k) => k.startsWith('rl:7.7.7.')));
});
await t('worker: без BOT_TOKEN -> 502 not_configured', async () => { const r = await worker.fetch(new Request('https://w.test/', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': '8.8.8.8' }, body: JSON.stringify(good) }), { ALLOWED_ORIGIN: ORIGIN }); assert.equal(r.status, 502); assert.equal((await r.json()).error, 'not_configured'); });
console.log = origLog;
await t('worker: логи без ПДн', async () => { const all = wlogs.join('\n'); assert.ok(wlogs.length > 0); assert.ok(!all.includes('8847790') && !all.includes('Анна') && !all.includes('5.5.5.5')); });

srv.kill(); tg.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
