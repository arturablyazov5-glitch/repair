// Продакшен-сборка (Пантелеймон, TASK-017): `npm run build:prod` -> dist/
// Dev-режим не трогаем: сначала обычные `node build.mjs` (+ `node build-seo.mjs`, если есть), затем
// постобработка готовых HTML в dist/. Исходники секций не меняются. Подробности и бюджет — docs/PERF.md.
//  1. CSS: base + sections + cookie + fonts -> purge (осторожный) -> lightningcss minify -> хеш в имени.
//     Главная: критический слой (base, fonts, 01-header, 02-hero) инлайнится в <head>, остальное — один файл,
//     подключённый сразу после секции #hero (рендер первого экрана его не ждёт). Прочие страницы — 1–2 файла в <head>.
//  2. JS: те же файлы в том же порядке, каждый минифицирован esbuild (classic script, top-level не переименовывается)
//     и склеен в один defer-бандл на набор скриптов страницы.
//  3. Фото media/photos/*.jpg -> media/photos-opt/ (AVIF/WebP/JPEG, несколько ширин, sharp), <img> -> <picture>
//     с srcset; sizes измеряются по реальной раскладке (tools/measure-images.mjs). Hero: preload + fetchpriority=high.
//  4. HTML минификация (консервативная), предсжатие .br/.gz, хеш-имена ассетов для Cache-Control: immutable.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import { transform as cssTransform } from 'lightningcss';
import { PurgeCSS } from 'purgecss';
import sharp from 'sharp';
import { measureImages, toSizes } from './tools/measure-images.mjs';

const t0 = Date.now();
const DIST = 'dist';
const log = (...a) => console.log('[build:prod]', ...a);
const read = (p) => fs.readFileSync(p, 'utf8');
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]) : [];
const posix = (p) => p.split(path.sep).join('/');

// ---------- 0. dev-сборка ----------
execFileSync(process.execPath, ['build.mjs'], { stdio: 'inherit' });
if (fs.existsSync('build-seo.mjs')) execFileSync(process.execPath, ['build-seo.mjs'], { stdio: 'inherit' });

// Страницы: главная, legal/*, SEO-посадочные remont/**/index.html
const PAGES = ['index.html', ...walk('legal').filter(f => f.endsWith('.html')), ...walk('remont').filter(f => f.endsWith('.html'))].map(posix);
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

// ---------- хешированные ассеты ----------
const assetMap = new Map(); // исходный путь (от корня) -> путь в dist (от корня)
function emitAsset(srcPath, subdir = 'assets') {
  srcPath = posix(path.normalize(srcPath));
  if (assetMap.has(srcPath)) return assetMap.get(srcPath);
  const buf = fs.readFileSync(srcPath);
  const ext = path.extname(srcPath), base = path.basename(srcPath, ext);
  const out = `${subdir}/${base}.${hash(buf)}${ext}`;
  fs.mkdirSync(path.join(DIST, subdir), { recursive: true });
  fs.writeFileSync(path.join(DIST, out), buf);
  assetMap.set(srcPath, out);
  return out;
}
function emitText(name, ext, text) {
  const out = `assets/${name}.${hash(text)}${ext}`;
  fs.writeFileSync(path.join(DIST, out), text);
  return out;
}
const rel = (fromPage, target) => { const r = posix(path.relative(path.dirname(fromPage), target)); return r || './'; };

// ---------- разбор страниц ----------
const pages = PAGES.map(p => {
  const html = read(p);
  const dir = path.dirname(p);
  const resolveLocal = (href) => /^(https?:|data:|\/\/|#|mailto:|tel:)/.test(href) ? null : posix(path.normalize(path.join(dir, href.split(/[?#]/)[0])));
  const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => ({ tag: m[0], file: resolveLocal(m[1]) })).filter(x => x.file);
  const js = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(m => ({ tag: m[0], file: resolveLocal(m[1]) })).filter(x => x.file);
  return { path: p, html, css, js, resolveLocal };
});

// ---------- 1. CSS ----------
// Критический слой: всё, что влияет на шапку и первый экран: base, 01-header, 02-hero и глобальные css/*.css
// (fonts, mobile — последний переопределяет hero на ≤1023px), кроме cookie.css. Порядок — исходный.
const CRITICAL = (f) => /^css\/sections\/0[12]-/.test(f) || (/^css\/[^/]+\.css$/.test(f) && f !== 'css/cookie.css');
const allCssFiles = [...new Set(pages.flatMap(p => p.css.map(c => c.file)))];

// <picture> вокруг <img>: правила вида `X > img` и `:has(> img)` дублируем для `X > picture > img`,
// а сам picture.pic получает display: contents — раскладка и каскад остаются как у голого <img>.
function pictureCompat(css) {
  return css
    .replace(/([^{}]+)\{/g, (m, prelude) => {
      if (prelude.trim().startsWith('@') || !/>\s*img\b/.test(prelude)) return m;
      const sels = prelude.split(',').map(s => s.trim()).filter(Boolean);
      const extra = sels.filter(s => /(^|[^,(])>\s*img\b/.test(s.replace(/:has\([^)]*\)/g, ''))).map(s => s.replace(/>\s*img\b(?![^(]*\))/g, '> picture > img'));
      return extra.length ? `${[...sels, ...extra].join(', ')} {` : m;
    })
    .replace(/:has\(>\s*img\b/g, ':has(> picture, > img');
}
// url(...) -> хешированный ассет; маркер __A__/ раскрывается при выводе (файл в assets/ или инлайн в странице)
function rewriteCssUrls(css, cssFile) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
    if (/^(data:|https?:|#)/.test(u)) return m;
    const src = path.join(path.dirname(cssFile), u);
    if (!fs.existsSync(src)) { console.warn('CSS: нет файла', u, 'в', cssFile); return m; }
    return `url("__A__/${path.basename(emitAsset(src))}")`;
  });
}
const content = [...pages.map(p => ({ raw: p.html, extension: 'html' })), ...walk('js').filter(f => f.endsWith('.js')).map(f => ({ raw: read(f), extension: 'js' }))];
const purger = new PurgeCSS();
const PURGE_SAFE = {
  standard: ['js', 'pic', 'picture', /:focus/, /^is-/, /^has-/, /^no-/, /^was-/],
  deep: [/^is-/, /^has-/],
  greedy: [/data-/, /aria-/]
};
const cssBytesBefore = allCssFiles.reduce((s, f) => s + fs.statSync(f).size, 0);
const cssReady = {};
const unused = [];
for (const f of allCssFiles) {
  const css = rewriteCssUrls(pictureCompat(read(f)), f);
  // PurgeCSS — только АНАЛИЗ (perf/unused-css.txt), не применяется: на этом проекте он даёт <1 КБ после сжатия,
  // но выкидывает нужное (:focus-visible, правила для <picture>, классы из JS-шаблонов). Вывод — владельцам секций.
  const [res] = await purger.purge({ content, css: [{ raw: css }], safelist: PURGE_SAFE, fontFace: false, keyframes: false, variables: false, rejected: true });
  if (res.rejected?.length) unused.push(`## ${f}`, ...res.rejected.map(s => s.trim()));
  cssReady[f] = css;
}
fs.mkdirSync('perf', { recursive: true });
fs.writeFileSync('perf/unused-css.txt', '# Селекторы, не найденные ни в одной странице/JS (PurgeCSS, анализ). Перед удалением проверить вручную.\n' + unused.join('\n') + '\n');
const minCss = (code) => cssTransform({ filename: 'bundle.css', code: Buffer.from(code), minify: true }).code.toString();
const PIC_CSS = 'picture.pic{display:contents}';
const cssOut = new Map(); // ключ набора -> имя файла
function cssBundle(files, name) {
  const key = files.join('|');
  if (!cssOut.has(key)) cssOut.set(key, emitText(name, '.css', minCss(files.map(f => cssReady[f]).join('\n') + PIC_CSS).replaceAll('__A__/', '')));
  return cssOut.get(key);
}
let cssBytesAfter = 0;
for (const p of pages) {
  if (!p.css.length) continue;
  const files = p.css.map(c => c.file);
  const crit = files.filter(CRITICAL);
  let html = p.html;
  for (const c of p.css) html = html.replace(c.tag + '\n', '').replace(c.tag, '');
  const heroEnd = (() => { const i = html.search(/<section[^>]*\bid="hero"/); if (i < 0) return -1; const j = html.indexOf('</section>', i); return j < 0 ? -1 : j + '</section>'.length; })();
  if (heroEnd > 0 && crit.length) {
    // Инлайн критического слоя + ПОЛНЫЙ бандл сразу после #hero (тот же файл, что на legal-страницах — общий кеш).
    // Полный бандл повторяет критические правила в исходном порядке, поэтому итоговый каскад 1:1 как в dev.
    const inline = minCss(crit.map(f => cssReady[f]).join('\n') + PIC_CSS).replaceAll('__A__/', rel(p.path, 'assets') + '/');
    // порядок важен: сначала вставка по индексу heroEnd, потом <style> в <head> (иначе индекс съедет)
    html = html.slice(0, heroEnd) + `\n<link rel="stylesheet" href="${rel(p.path, cssBundle(files, 'app'))}">` + html.slice(heroEnd);
    html = html.replace('</head>', `<style>${inline}</style>\n</head>`);
  } else {
    const main = files.filter(f => !f.startsWith('seo/')), extra = files.filter(f => f.startsWith('seo/'));
    const links = [cssBundle(main, 'app'), ...(extra.length ? [cssBundle(extra, 'seo')] : [])].map(h => `<link rel="stylesheet" href="${rel(p.path, h)}">`);
    html = html.replace('</head>', links.join('\n') + '\n</head>');
  }
  p.html = html;
}
for (const f of new Set(cssOut.values())) cssBytesAfter += fs.statSync(path.join(DIST, f)).size;

// ---------- 2. JS ----------
const jsMin = {};
for (const f of new Set(pages.flatMap(p => p.js.map(j => j.file)))) {
  // без format: esbuild не переименовывает верхнеуровневые имена classic-скрипта (window.SITE и т.п. остаются)
  jsMin[f] = (await esbuild.transform(read(f), { minify: true, target: 'es2020', legalComments: 'none' })).code;
}
const jsOut = new Map();
for (const p of pages) {
  if (!p.js.length) continue;
  const files = p.js.map(j => j.file), key = files.join('|');
  if (!jsOut.has(key)) jsOut.set(key, emitText('app', '.js', files.map(f => `/* ${f} */\n${jsMin[f]}`).join(';\n')));
  let html = p.html;
  for (const j of p.js) html = html.replace(j.tag + '\n', '').replace(j.tag, '');
  p.html = html.replace('</body>', `<script src="${rel(p.path, jsOut.get(key))}" defer></script>\n</body>`);
}

// ---------- 3. Изображения ----------
const OPT = 'media/photos-opt';
fs.mkdirSync(OPT, { recursive: true });
const WIDTHS = [320, 480, 640, 800, 960, 1280];
const FORMATS = { avif: { quality: 50, effort: 6 }, webp: { quality: 74, effort: 5 }, jpg: { quality: 76, mozjpeg: true } };
async function variants(src) { // кэш в media/photos-opt/, пересоздаётся, если исходник новее
  const meta = await sharp(src).metadata();
  const ws = [...new Set([...WIDTHS.filter(w => w < meta.width), meta.width])];
  const name = path.basename(src, path.extname(src));
  const res = { width: meta.width, height: meta.height, files: {} };
  for (const [fmt, opt] of Object.entries(FORMATS)) {
    res.files[fmt] = [];
    for (const w of ws) {
      const out = `${OPT}/${name}-${w}.${fmt}`;
      if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs) {
        const img = sharp(src).resize({ width: w, withoutEnlargement: true });
        await (fmt === 'jpg' ? img.jpeg({ ...opt, progressive: true }) : img[fmt](opt)).toFile(out);
      }
      res.files[fmt].push([w, out]);
    }
  }
  return res;
}
const IMG_RE = /<img\b[^>]*\bsrc="([^"]*media\/photos\/[^"]+\.jpe?g)"[^>]*>/g;
const pagesWithPhotos = pages.filter(p => new RegExp(IMG_RE.source).test(p.html.replace(/<!--[\s\S]*?-->/g, '')));
const measured = pagesWithPhotos.length ? await measureImages('.', pagesWithPhotos.map(p => p.path)) : {};
const varCache = {};
let imgCount = 0;
for (const p of pagesWithPhotos) {
  const m = measured[p.path] || [];
  let k = 0, heroPreload = '';
  const parts = p.html.split(/(<!--[\s\S]*?-->)/); // не трогаем закомментированные примеры
  for (let i = 0; i < parts.length; i += 2) {
    const chunks = [];
    let last = 0;
    for (const mt of parts[i].matchAll(IMG_RE)) {
      const tag = mt[0], src = p.resolveLocal(mt[1]);
      const info = m[k++];
      chunks.push(parts[i].slice(last, mt.index)); last = mt.index + tag.length;
      if (!fs.existsSync(src)) { chunks.push(tag); continue; }
      const v = varCache[src] ||= await variants(src);
      const set = (fmt) => v.files[fmt].map(([w, f]) => `${rel(p.path, emitAsset(f, 'media/photos-opt'))} ${w}w`).join(', ');
      const sizes = info && info.src === mt[1] ? toSizes(info.widths) : '100vw';
      const isHero = /fetchpriority="high"/.test(tag) || p.html.lastIndexOf('id="hero"', p.html.indexOf(tag)) > p.html.lastIndexOf('</section>', p.html.indexOf(tag));
      const fallback = v.files.jpg.find(([w]) => w >= 960) || v.files.jpg.at(-1);
      let img = tag
        .replace(/\ssrc="[^"]*"/, ` src="${rel(p.path, emitAsset(fallback[1], 'media/photos-opt'))}" srcset="${set('jpg')}" sizes="${sizes}"`)
        ;
      if (!/\swidth=/.test(img)) img = img.replace('<img', `<img width="${v.width}" height="${v.height}"`);
      // полный размер для лайтбокса (js/sections/40-gallery.js может брать data-full вместо currentSrc)
      img = img.replace('<img', `<img data-full="${rel(p.path, emitAsset(v.files.jpg.at(-1)[1], 'media/photos-opt'))}"`);
      if (isHero) {
        if (!/fetchpriority=/.test(img)) img = img.replace('<img', '<img fetchpriority="high"');
        img = img.replace(/\sloading="lazy"/, '');
        heroPreload ||= `<link rel="preload" as="image" type="image/avif" imagesrcset="${set('avif')}" imagesizes="${sizes}" fetchpriority="high">`;
      } else {
        if (!/\sloading=/.test(img)) img = img.replace('<img', '<img loading="lazy"');
        if (!/\sdecoding=/.test(img)) img = img.replace('<img', '<img decoding="async"');
      }
      chunks.push(`<picture class="pic"><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">${img}</picture>`);
      imgCount++;
    }
    chunks.push(parts[i].slice(last));
    parts[i] = chunks.join('');
  }
  p.html = parts.join('');
  if (heroPreload) p.html = p.html.replace(/(<link rel="preload"[^>]*as="font"[^>]*>\s*)+/, (s) => s + heroPreload + '\n');
}

// ---------- прочие локальные ссылки: шрифты (preload), favicon, og-image, видео и т.п. ----------
const NO_HASH = /^(media\/brand\/|robots\.txt|sitemap\.xml)/; // og:image и favicon — стабильные URL для внешних сервисов
for (const p of pages) {
  p.html = p.html.replace(/\s(href|src|poster)="([^"]+)"/g, (m, attr, u) => {
    const src = p.resolveLocal(u);
    if (!src || !fs.existsSync(src) || fs.statSync(src).isDirectory() || src.endsWith('.html') || src.startsWith('dist/') || src.startsWith('assets/') || src.startsWith(OPT)) return m;
    if (NO_HASH.test(src)) { copyPlain(src); return m; }
    return ` ${attr}="${rel(p.path, emitAsset(src, /^fonts\//.test(src) ? 'assets' : path.dirname(src)))}"`;
  });
}
function copyPlain(src) { const out = path.join(DIST, src); if (fs.existsSync(out)) return; fs.mkdirSync(path.dirname(out), { recursive: true }); fs.copyFileSync(src, out); }
for (const f of ['robots.txt', 'sitemap.xml', ...walk('media/brand').filter(f => !f.endsWith('.md') && !f.endsWith('.html'))]) if (fs.existsSync(f)) copyPlain(posix(f));
// og-image: PNG -> палитровый PNG (без потерь по виду при плоской графике), если выходит меньше
for (const f of walk(path.join(DIST, 'media/brand')).filter(f => f.endsWith('.png'))) {
  const buf = await sharp(f).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer();
  if (buf.length < fs.statSync(f).size) fs.writeFileSync(f, buf);
}

// ---------- 4. HTML: минификация, запись ----------
// Консервативный минификатор: убирает комментарии и схлопывает пробельные последовательности в ТЕКСТЕ до одного
// пробела (как их и так рендерит браузер). Теги/атрибуты, <script>, <style>, <pre>, <textarea> не трогаются.
// (html-minifier-terser падает с Parse Error на спрайте Lucide — свой проход проще проверить.)
function minifyHtml(html) {
  const keep = [];
  html = html.replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, (m) => `\u0000${keep.push(m) - 1}\u0000`);
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
  html = html.replace(/(<[^>]*>)|([^<]+)/g, (m, tag, text) => tag ? tag : text.replace(/[ \t\n\r\f]+/g, (w) => (w.includes('\n') ? '\n' : ' ')) /* НЕ \s: он съедает U+00A0 (неразрывные пробелы) */);
  html = html.replace(/\n+/g, '\n');
  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
}
let htmlBefore = 0, htmlAfter = 0;
for (const p of pages) {
  htmlBefore += Buffer.byteLength(p.html);
  const out = minifyHtml(p.html);
  htmlAfter += Buffer.byteLength(out);
  fs.mkdirSync(path.join(DIST, path.dirname(p.path)), { recursive: true });
  fs.writeFileSync(path.join(DIST, p.path), out);
}

// ---------- предсжатие ----------
let br = 0;
for (const f of walk(DIST).filter(f => /\.(html|css|js|svg|xml|txt|json|webmanifest)$/.test(f))) {
  const buf = fs.readFileSync(f);
  if (buf.length < 512) continue;
  fs.writeFileSync(f + '.br', zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } }));
  fs.writeFileSync(f + '.gz', zlib.gzipSync(buf, { level: 9 }));
  br++;
}
const missing = pages.flatMap(p => [...p.html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\s(?:href|src)="([^"]+)"/g)].map(m => p.resolveLocal(m[1])).filter(s => s && !s.endsWith('/') && !fs.existsSync(path.join(DIST, s)) && !fs.existsSync(s)));
if (missing.length) console.warn('[build:prod] ссылки на несуществующие файлы:', [...new Set(missing)].join(', '));
log(`страниц ${pages.length}; CSS исходники ${(cssBytesBefore / 1024).toFixed(1)} КБ → бандлы ${[...new Set(cssOut.values())].map(f => path.basename(f) + ' ' + (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(1)).join(', ')} КБ (+крит. инлайн на главной); HTML ${(htmlBefore / 1024).toFixed(0)} → ${(htmlAfter / 1024).toFixed(0)} КБ; <picture> ${imgCount}; предсжато ${br} файлов; ${((Date.now() - t0) / 1000).toFixed(1)} c`);
