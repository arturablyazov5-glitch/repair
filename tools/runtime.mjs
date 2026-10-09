// Рантайм-замер в реальном Chromium (Playwright + CDP): node tools/runtime.mjs <label> <dir>
// Профиль: мобильный 412×823, DPR 2.625, сеть ~Slow 4G (RTT 150 ms, 1.6 Mbps вниз, 750 Kbps вверх), CPU 4x.
// Сценарий: загрузка -> 2 с покоя -> плавная прокрутка до низа -> открыть/закрыть модалку -> клик в cookie-баннере.
// Собирает: long tasks (PerformanceObserver 'longtask'), layout-shift с источниками (CLS по окнам сессий),
// LCP, Event Timing (INP-прокси: макс. длительность взаимодействия), слушатели scroll/resize/touch* (CDP),
// бесконечные анимации (document.getAnimations). Результат: perf/runtime-<label>.json + .md
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const [label = 'before', dir = '.'] = process.argv.slice(2);
const PORT = label === 'after' ? 8094 : 8093;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PAGES = ['/', '/legal/privacy.html'];

const INIT = () => {
  window.__perf = { lt: [], ls: [], lcp: null, ev: [] };
  const sel = (n) => { if (!n || !n.tagName) return String(n && n.nodeName); let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; if (n.classList && n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); const p = n.parentElement; return (p && p.tagName !== 'BODY' ? (p.classList[0] ? '.' + p.classList[0] : p.tagName.toLowerCase()) + ' > ' : '') + s; };
  new PerformanceObserver((l) => l.getEntries().forEach(e => __perf.lt.push({ start: Math.round(e.startTime), dur: Math.round(e.duration), attr: (e.attribution || []).map(a => a.containerSrc || a.containerName || a.name).join(',') }))).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach(e => __perf.ls.push({ t: Math.round(e.startTime), v: e.value, input: e.hadRecentInput, src: (e.sources || []).map(s => sel(s.node)) }))).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { const e = l.getEntries().at(-1); __perf.lcp = { t: Math.round(e.startTime), el: sel(e.element), url: e.url || '' }; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach(e => { if (e.interactionId) __perf.ev.push({ name: e.name, dur: e.duration, target: sel(e.target) }); })).observe({ type: 'event', durationThreshold: 16, buffered: true });
};

function cls(shifts) { // CLS по Web Vitals: макс. сумма в окне сессии (разрыв < 1 с, окно ≤ 5 с), без сдвигов после ввода
  let max = 0, cur = 0, start = -1, prev = -1;
  for (const s of shifts.filter(s => !s.input)) {
    if (prev >= 0 && s.t - prev < 1000 && s.t - start < 5000) cur += s.v; else { cur = s.v; start = s.t; }
    prev = s.t; max = Math.max(max, cur);
  }
  return max;
}

const server = await serve(dir, PORT);
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const results = {};
try {
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, locale: 'ru-RU' });
    const page = await ctx.newPage();
    const consoleErr = [];
    page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text()); });
    page.on('pageerror', e => consoleErr.push('pageerror: ' + e.message));
    const external = { ok: 0, failed: 0 };
    page.on('requestfinished', r => { if (!r.url().includes('127.0.0.1')) external.ok++; });
    page.on('requestfailed', r => { if (!r.url().includes('127.0.0.1') && !r.url().startsWith('data:')) external.failed++; });
    await page.addInitScript(INIT);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${PORT}${p}`, { waitUntil: 'load', timeout: 120000 });
    const loadMs = Date.now() - t0;
    await page.waitForTimeout(2000);
    // слушатели (до прокрутки)
    const { result: win } = await cdp.send('Runtime.evaluate', { expression: 'window' });
    const { result: doc } = await cdp.send('Runtime.evaluate', { expression: 'document' });
    const listeners = [];
    for (const [name, obj] of [['window', win], ['document', doc]]) {
      const { listeners: ls } = await cdp.send('DOMDebugger.getEventListeners', { objectId: obj.objectId });
      for (const l of ls) if (/^(scroll|resize|touchstart|touchmove|wheel|mousemove|pointermove)$/.test(l.type)) listeners.push(`${name}.${l.type} passive=${l.passive} ${l.scriptId ? '' : ''}@${(l.url || '').replace(/^.*127\.0\.0\.1:\d+\//, '')}:${l.lineNumber + 1}`);
    }
    // прокрутка
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(120); }
    await page.waitForTimeout(1000);
    const anims = await page.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.getComputedTiming().iterations === Infinity).map(a => {
      const kf = a.effect.getKeyframes ? a.effect.getKeyframes() : []; const props = [...new Set(kf.flatMap(k => Object.keys(k).filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))];
      const t = a.effect.target; return `${t && t.className ? '.' + String(t.className).split(' ')[0] : '?'} ${a.animationName || ''} [${props.join(',')}] ${a.playState}`; }));
    // взаимодействия (INP-прокси)
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    const opener = page.locator('[data-modal-open="lead-modal"]:visible').first();
    if (await opener.count()) { await opener.click(); await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    const cookie = page.locator('#cookie-banner [data-cookie-necessary]:visible');
    if (await cookie.count()) { await cookie.click(); await page.waitForTimeout(400); }
    const perf = await page.evaluate(() => window.__perf);
    const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null }; });
    results[p] = {
      loadMs, nav, lcp: perf.lcp, cls: +cls(perf.ls).toFixed(4), shifts: perf.ls.filter(s => s.v > 0.0005),
      longTasks: { n: perf.lt.length, total: perf.lt.reduce((s, x) => s + x.dur, 0), max: Math.max(0, ...perf.lt.map(x => x.dur)), tbtLike: perf.lt.reduce((s, x) => s + Math.max(0, x.dur - 50), 0), list: perf.lt },
      inp: perf.ev.length ? Math.max(...perf.ev.map(e => e.dur)) : 0, events: perf.ev, listeners, infiniteAnimations: anims, consoleErr, external
    };
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
fs.writeFileSync(`perf/runtime-${label}.json`, JSON.stringify(results, null, 2));
const L = [`# Рантайм (${label}): Playwright, мобильный 412×823, Slow 4G (150 ms, 1.6 Mbps), CPU 4x`, '',
  '| Страница | FCP | LCP (элемент) | CLS | Long tasks: шт / сумма / макс | Σ(dur−50) | INP-прокси | Ошибки консоли | Внешние ok/failed |', '|---|---|---|---|---|---|---|---|---|'];
for (const [p, r] of Object.entries(results))
  L.push(`| ${p} | ${r.nav.fcp} ms | ${r.lcp ? r.lcp.t + ' ms (`' + r.lcp.el + '`)' : '—'} | ${r.cls} | ${r.longTasks.n} / ${r.longTasks.total} / ${r.longTasks.max} ms | ${r.longTasks.tbtLike} ms | ${Math.round(r.inp)} ms | ${r.consoleErr.length} | ${r.external.ok}/${r.external.failed} |`);
for (const [p, r] of Object.entries(results)) {
  L.push('', `## ${p}`, '', `Long tasks: ${r.longTasks.list.map(t => `${t.dur} ms @${t.start}`).join(', ') || 'нет'}`);
  L.push(`Сдвиги (>0.0005): ${r.shifts.map(s => `${s.v.toFixed(4)} @${s.t}${s.input ? ' (после ввода)' : ''} [${s.src.join('; ')}]`).join(' · ') || 'нет'}`);
  L.push(`Слушатели scroll/resize/touch/wheel: ${r.listeners.join(' · ') || 'нет'}`);
  L.push(`Бесконечные анимации: ${r.infiniteAnimations.join(' · ') || 'нет'}`);
  L.push(`Взаимодействия: ${r.events.map(e => `${e.name} ${Math.round(e.dur)} ms → ${e.target}`).join(' · ') || 'нет > 16 ms'}`);
  if (r.consoleErr.length) L.push('Консоль: ' + r.consoleErr.join(' | '));
}
fs.writeFileSync(`perf/runtime-${label}.md`, L.join('\n') + '\n');
console.log(L.slice(0, 6).join('\n'));
