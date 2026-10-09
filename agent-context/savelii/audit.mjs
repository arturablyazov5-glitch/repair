// Мобильный аудит (Савелий, TASK-019).
// node agent-context/savelii/audit.mjs [tag] [--shots]
//  - высоты страницы/секций, максимальные шрифты по секциям, текст < 14px, горизонтальный скролл, консоль
//  - --shots: скриншоты ключевых секций на 360/768/1366 в agent-context/savelii/shots/<tag>/
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = '/home/user/repair';
const tag = process.argv[2] || 'now'; const shots = process.argv.includes('--shots'); const noMobile = process.argv.includes('--nomobile');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { if (e) { r.statusCode = 404; r.end() } else { r.setHeader('content-type', types[path.extname(p)] || 'application/octet-stream'); r.end(d) } }) }).listen(8519);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const out = {};
for (const w of [320, 360, 375, 414, 768, 1024, 1366]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: w < 1024 });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
  pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  // внешние ресурсы (trace-logos, яндекс) — пустой ответ, чтобы офлайн не шумел в консоли
  await ctx.route(u => !u.href.startsWith('http://localhost:8519'), r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' }));
  if (noMobile) await ctx.route('**/css/mobile.css', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pg.goto('http://localhost:8519/index.html'); await pg.waitForTimeout(500);
  await pg.evaluate(() => { document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')) });
  const r = await pg.evaluate(() => {
    const secs = [...document.querySelectorAll('body > section, body > footer, body > header')].map(s => ({ id: s.id || s.className.split(' ')[0], h: Math.round(s.getBoundingClientRect().height), pt: Math.round(parseFloat(getComputedStyle(s).paddingTop)) }));
    const big = {}; const small = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(el.tagName)) continue;
      if (!el.getClientRects().length) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
      if (el.closest('.sr-only,[hidden],[aria-hidden="true"]')) continue;
      const fs = parseFloat(cs.fontSize); let top = el; while (top.parentElement && top.parentElement !== document.body) top = top.parentElement; const sec = top.id || top.className.toString().split(' ')[0] || top.tagName;
      const cls = (typeof el.className === 'string' ? el.className.split(' ')[0] : '') || el.tagName.toLowerCase();
      if (fs < 13.99) small.push(`${fs}px ${sec} .${cls} | ${t.textContent.trim().slice(0, 30)}`);
      (big[sec] ||= []).push([Math.round(fs), cls, t.textContent.trim().slice(0, 24)]);
    }
    const tops = {}; for (const [k, v] of Object.entries(big)) { const seen = new Set(); tops[k] = v.sort((a, b) => b[0] - a[0]).filter(x => !seen.has(x[1]) && seen.add(x[1])).slice(0, 5).map(x => `${x[0]} ${x[1]}`).join(', ') }
    const de = document.documentElement;
    // самые широкие элементы, если есть переполнение
    const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== 'visible') return true } return false };
    const wide = de.scrollWidth > de.clientWidth ? [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > de.clientWidth + 1 && !clipped(e)).slice(0, 8).map(e => e.tagName + '.' + e.className.toString().slice(0, 40)) : [];
    return { page: de.scrollHeight, sw: de.scrollWidth, cw: de.clientWidth, secs, tops, small: [...new Set(small)].slice(0, 40), wide, bodyPb: getComputedStyle(document.body).paddingBottom };
  });
  r.errs = errs; out[w] = r;
  if (shots && [360, 768, 1366].includes(w)) {
    const dir = `${root}/agent-context/savelii/shots/${tag}`; fs.mkdirSync(dir, { recursive: true });
    await pg.addStyleTag({ content: '.mbar,.hdr,.cookie{display:none!important} .js .reveal{transition:none!important}' });
    // высокий вьюпорт вместо fullPage: fullPage-склейка у Playwright сдвигает scroll-snap ленты
    await pg.setViewportSize({ width: w, height: Math.min(await pg.evaluate(() => document.documentElement.scrollHeight), 32000) }); await pg.waitForTimeout(300);
    for (const id of ['hero', 'trust', 'services', 'brands', 'process', 'prices', 'guarantees', 'reviews', 'gallery', 'team', 'faq', 'contacts']) {
      const el = await pg.$('#' + id); if (!el) continue;
      const [top, h] = await el.evaluate(e => { const r = e.getBoundingClientRect(); return [r.top + scrollY, r.height] });
      // длинные секции режем кусками по 1800px (иначе превью нечитаемо)
      for (let y = 0, i = 0; y < h; y += 1800, i++) {
        await pg.screenshot({ path: `${dir}/${w}-${id}-${i}.png`, clip: { x: 0, y: top + y, width: w, height: Math.min(1800, h - y) } });
      }
    }
  }
  await ctx.close();
}
fs.writeFileSync(`${root}/agent-context/savelii/audit-${tag}.json`, JSON.stringify(out, null, 1));
for (const [w, r] of Object.entries(out)) {
  console.log(`\n== ${w}px  page ${r.page}  overflow ${r.sw}/${r.cw}${r.wide.length ? ' WIDE: ' + r.wide.join(' | ') : ''}  bodyPb ${r.bodyPb}  errs ${r.errs.length}${r.errs.length ? ' ' + r.errs.slice(0, 3).join(' || ') : ''}`);
  console.log('  secs', r.secs.map(s => `${s.id}:${s.h}(${s.pt})`).join(' '));
  if (['360', '768'].includes(w)) for (const [k, v] of Object.entries(r.tops)) console.log('   ', k, '→', v);
  if (r.small.length) console.log('  SMALL<14:', r.small.join('\n    '));
}
await b.close(); srv.close();
