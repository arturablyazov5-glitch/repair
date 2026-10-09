// Наброски 5 направлений знака + контактный лист (Playwright).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const S = '/tmp/claude-0/-home-user-repair/7ec7db38-2523-5b7e-a6b8-2da334f70f46/scratchpad';
const wm = JSON.parse(fs.readFileSync(S + '/wm700.json', 'utf8'));
const A = '#ff4f1a';
// Все знаки на сетке 32×32, fill/stroke = currentColor, акцент = A
const marks = {
  'A Иллюминатор': `<rect width="32" height="32" rx="5" fill="currentColor"/><circle cx="16" cy="17.5" r="8" fill="none" stroke="var(--bg)" stroke-width="3.5"/><rect x="22" y="4" width="5" height="3" fill="${A}"/>`,
  'B Л-дверца': `<path d="M5 28 L9 4 H27 V28" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="miter"/><rect x="13.5" y="20" width="6" height="8" fill="${A}"/>`,
  'C Угол-рамка': `<path d="M3 15 V3 H15 M29 17 V29 H17" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="square"/><rect x="12.5" y="12.5" width="7" height="7" fill="${A}"/>`,
  'D С-кольцо': `<path d="M25.2 7.6 A12.5 12.5 0 1 0 25.2 24.4" fill="none" stroke="currentColor" stroke-width="5.5"/><circle cx="26.5" cy="16" r="3.5" fill="${A}"/>`,
  'E С-скоба': `<path d="M28 5.5 H5.5 V26.5 H28" fill="none" stroke="currentColor" stroke-width="5.5"/><rect x="21" y="12.5" width="7" height="7" fill="${A}"/>`,
};
const svg = (k, size) => `<svg viewBox="0 0 32 32" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${marks[k]}</svg>`;
const wordSvg = (h) => `<svg viewBox="0 -73 ${wm.width} 75" height="${h}" fill="currentColor"><path d="${wm.d}"/></svg>`;
let rows = '';
for (const k of Object.keys(marks)) {
  rows += `<section><h3>${k}</h3>
  <div class="cell w">${svg(k, 120)}</div>
  <div class="cell b">${svg(k, 120)}</div>
  <div class="cell w px"><canvas data-k="${k}" data-s="16"></canvas><canvas data-k="${k}" data-s="32"></canvas><span class="real">${svg(k,16)}${svg(k,32)}</span></div>
  <div class="hdr"><span class="logo">${svg(k, 32)}${wordSvg(16)}</span><nav>01 Услуги&nbsp;&nbsp; 02 Бренды&nbsp;&nbsp; 03 Цены</nav><b>Вызвать мастера</b></div>
  <div class="hdr dk"><span class="logo">${svg(k, 32)}${wordSvg(16)}</span></div>
  </section>`;
}
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;font:13px system-ui;background:#fff;--bg:#fff}
section{display:grid;grid-template-columns:150px 150px 150px 560px 300px;gap:12px;align-items:center;margin-bottom:14px}
h3{grid-column:1/-1;margin:0;font:600 13px system-ui}
.cell{height:150px;display:grid;place-items:center;border:1px solid #ddd}
.w{color:#0e1013;background:#fff}.b{color:#fff;background:#0e1013;--bg:#0e1013}
.px{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-content:center}
canvas{image-rendering:pixelated;border:1px solid #eee}
canvas[data-s="16"]{width:64px;height:64px}canvas[data-s="32"]{width:64px;height:64px}
.real{display:flex;gap:8px;align-items:center;width:100%;justify-content:center}
.hdr{height:72px;border-bottom:1px solid #e5e5e2;display:flex;align-items:center;gap:24px;padding:0 20px;color:#0e1013;background:#fff}
.hdr.dk{background:#0e1013;color:#fff;--bg:#0e1013}
.logo{display:inline-flex;align-items:center;gap:10px;margin-right:auto}
nav{font-size:13px;color:#4b4f57}.hdr b{background:${A};color:#fff;padding:10px 14px;border-radius:8px;font-size:13px}
</style>${rows}<script>
for (const c of document.querySelectorAll('canvas')) {
  const s=+c.dataset.s; c.width=s; c.height=s;
  const src=c.parentElement.querySelector('.real svg[width="'+s+'"]').outerHTML.replace('<svg','<svg style="color:#0e1013;--bg:#fff"').replace(/currentColor/g,'#0e1013').replace(/var\\(--bg\\)/g,'#fff');
  const img=new Image(); img.onload=()=>c.getContext('2d').drawImage(img,0,0,s,s); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src);
}
</script>`;
fs.writeFileSync(S + '/concepts.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1420, height: 900 } });
await p.goto('file://' + S + '/concepts.html'); await p.waitForTimeout(400);
await p.screenshot({ path: S + '/concepts.png', fullPage: true });
await b.close();
