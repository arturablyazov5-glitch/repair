// Сборка фирменных файлов «Сервис-Люкс» → media/brand/
// Запуск: python3 agent-context/khariton/wordmark.py 700 -0.02 > $SCRATCH/wm.json && node agent-context/khariton/build-brand.mjs $SCRATCH/wm.json
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';

const ROOT = '/home/user/repair/';
const OUT = ROOT + 'media/brand/';
const wm = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const INK = '#0e1013', PAPER = '#ffffff', ACC = '#ff4f1a';

// ── Знак «Скоба»: сетка 28×28, модуль 2 (=1px при 16px-фавиконе на 32-сетке)
// С-скоба толщиной 6 + квадрат-индикатор 8×8 в проёме, выровнен по правому краю.
const C_PATH = 'M0 0H28V6H6V22H28V28H0Z';
const DOT = { x: 20, y: 10, w: 8, h: 8 };
const dotRect = (fill) => `<rect x="${DOT.x}" y="${DOT.y}" width="${DOT.w}" height="${DOT.h}" fill="${fill}"/>`;

// ── Вордмарк: высота прописной = 14 (половина знака), центр прописной = центр знака
const K = 0.2;            // em=100 → 20 ед.; cap ≈ 14.1
const GAP = 10;           // знак ↔ вордмарк
const BASE = 21;          // базовая линия
const WX = 28 + GAP;
const W = +(WX + wm.width * K).toFixed(2);
const H = 28;
const word = (fill) => `<path fill="${fill}" transform="translate(${WX} ${BASE}) scale(${K})" d="${wm.d}"/>`;

const head = (vb, title, w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${w ? ` width="${w}" height="${h}"` : ''} role="img" aria-labelledby="t">\n<title id="t">${title}</title>\n`;

const files = {
  'logo-mark.svg': head('0 0 28 28', 'Сервис-Люкс — знак', 28, 28) +
    `<path fill="${INK}" d="${C_PATH}"/>\n${dotRect(ACC)}\n</svg>\n`,
  'logo-mark-mono.svg': head('0 0 28 28', 'Сервис-Люкс — знак, монохром', 28, 28) +
    `<path fill="${INK}" d="${C_PATH}"/>\n${dotRect(INK)}\n</svg>\n`,
  'logo.svg': head(`0 0 ${W} ${H}`, 'Сервис-Люкс', W, H) +
    `<path fill="${INK}" d="${C_PATH}"/>\n${dotRect(ACC)}\n${word(INK)}\n</svg>\n`,
  'logo-mono.svg': head(`0 0 ${W} ${H}`, 'Сервис-Люкс — монохром', W, H) +
    `<path fill="${INK}" d="${C_PATH}"/>\n${dotRect(INK)}\n${word(INK)}\n</svg>\n`,
  'logo-light.svg': head(`0 0 ${W} ${H}`, 'Сервис-Люкс — для тёмного фона', W, H) +
    `<path fill="${PAPER}" d="${C_PATH}"/>\n${dotRect(ACC)}\n${word(PAPER)}\n</svg>\n`,
  // Фавикон: сетка 32, поле 2 (=1px при 16px), все координаты чётные → пиксельно чётко.
  // В тёмной теме браузера знак инвертируется в белый.
  'favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n<title>Сервис-Люкс</title>\n` +
    `<style>.c{fill:${INK}}@media (prefers-color-scheme:dark){.c{fill:${PAPER}}}</style>\n` +
    `<path class="c" d="M2 2H30V8H8V24H30V30H2Z"/>\n<rect x="22" y="12" width="8" height="8" fill="${ACC}"/>\n</svg>\n`,
};
for (const [n, s] of Object.entries(files)) fs.writeFileSync(OUT + n, s);

// ── Inline-фрагменты для шапки и подвала (currentColor + var(--accent))
const inlineMark = `<svg class="logo__mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path fill="currentColor" d="${C_PATH}"/><rect x="${DOT.x}" y="${DOT.y}" width="${DOT.w}" height="${DOT.h}" style="fill:var(--accent,${ACC})"/></svg>`;
const inlineWord = `<svg class="logo__word" viewBox="0 -18 ${+(wm.width * K).toFixed(2)} 22" aria-hidden="true" focusable="false"><path fill="currentColor" transform="scale(${K})" d="${wm.d}"/></svg>`;
const snippet = `<!-- Логотип «Сервис-Люкс» (TASK-015, Харитон). Источник: media/brand/. Цвет — currentColor, индикатор — var(--accent).
     Знак 28×28 ед., вордмарк в кривых Onest 700 (без зависимости от шрифта). Пропорции: высота вордмарка-блока = 22/28 знака. -->

<!-- ШАПКА (01-header): заменить <a class="hdr__logo">…</a> и <symbol id="ico-logo"> -->
<a class="logo hdr__logo" href="{{root}}index.html" aria-label="{{cfg.name}} — на главную">
  ${inlineMark}
  ${inlineWord}
</a>

<!-- ПОДВАЛ (99-footer): на тёмном фоне color:#fff, акцент остаётся оранжевым -->
<a class="logo logo--footer" href="{{root}}#" aria-label="{{cfg.name}} — на главную">
  ${inlineMark}
  ${inlineWord}
</a>

<!-- CSS (в css/sections/01-header.css; размеры — от высоты знака) -->
<style>
.logo { display: inline-flex; align-items: center; gap: calc(var(--logo-h, 28px) * .357); color: var(--ink); text-decoration: none; line-height: 0; }
.logo:hover { color: var(--ink); }
.logo__mark { width: var(--logo-h, 28px); height: var(--logo-h, 28px); flex: none; }
.logo__word { height: calc(var(--logo-h, 28px) * .786); width: auto; aspect-ratio: ${+(wm.width * K).toFixed(2)} / 22; flex: none; }
.hdr .logo { --logo-h: 28px; }
.hdr.is-scrolled .logo { --logo-h: 24px; }
.logo--footer { --logo-h: 40px; color: #fff; }
.logo--footer:hover { color: #fff; }
@media (max-width: 380px) { .hdr .logo { --logo-h: 24px; } }
</style>
`;
fs.writeFileSync(OUT + 'header-snippet.html', snippet);

// ── PNG: apple-touch-icon 180×180, og-image 1200×630
const fontFace = [400, 500, 700].map(w => ['cyrillic', 'latin'].map(s =>
  `@font-face{font-family:Onest;font-weight:${w};src:url('file://${ROOT}fonts/onest-${w}-${s}.woff2') format('woff2')}`).join('')).join('');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 180, height: 180 } });
// apple-touch-icon: тёмная плитка (iOS скругляет сам), знак 100×100 по центру (поле ~22%)
await p.setContent(`<style>body{margin:0;background:${INK}}</style><div style="width:180px;height:180px;display:grid;place-items:center">
<svg viewBox="0 0 28 28" width="96" height="96"><path fill="${PAPER}" d="${C_PATH}"/>${dotRect(ACC)}</svg></div>`);
await p.screenshot({ path: OUT + 'apple-touch-icon.png', clip: { x: 0, y: 0, width: 180, height: 180 } });

await p.setViewportSize({ width: 1200, height: 630 });
const ogHtml = `<!doctype html><meta charset="utf-8"><style>${fontFace}
body{margin:0;background:${PAPER};font-family:Onest,sans-serif;color:${INK}}
.og{box-sizing:border-box;width:1200px;height:630px;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;border-bottom:12px solid ${INK}}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.tag{font:500 18px/1 Onest;letter-spacing:.1em;text-transform:uppercase;color:#82858c;padding-top:10px}
h1{margin:0;font:700 84px/1.0 Onest;letter-spacing:-.04em;max-width:960px}
.foot{display:flex;justify-content:space-between;border-top:1px solid #dcdcd8;padding-top:22px;font:500 20px/1 Onest;color:#4b4f57}
</style><div class="og"><div class="top">${files['logo.svg'].replace(/width="[^"]+" height="[^"]+"/, `width="${(W * 2.2).toFixed(0)}" height="${(H * 2.2).toFixed(0)}"`)}<span class="tag">Краснодар</span></div>
<h1>Ремонт бытовой техники в&nbsp;Краснодаре</h1>
<div class="foot"><span>Miele · Liebherr · Bosch · Siemens · Smeg</span><span>Премиальная и встраиваемая техника</span></div></div>`;
const ogFile = (process.env.SCRATCH || '/tmp') + '/og.html';
fs.writeFileSync(ogFile, ogHtml);
await p.goto('file://' + ogFile);
await p.evaluate(() => document.fonts.ready);
const fontsOk = await p.evaluate(() => document.fonts.check('700 84px Onest', 'Ремонт'));
console.log('Onest loaded:', fontsOk);
await p.screenshot({ path: OUT + 'og-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await b.close();
for (const n of fs.readdirSync(OUT)) console.log(n, fs.statSync(OUT + n).size);
console.log('logo W×H', W, H);
