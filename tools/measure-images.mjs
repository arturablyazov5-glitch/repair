// Замер реальной ширины отрисовки <img> с локальными фото на разных ширинах окна -> атрибут sizes.
// Используется build-prod.mjs: sizes не угадываются, а берутся из фактической раскладки dev-сборки,
// поэтому переживают правки секций. Запуск отдельно: node tools/measure-images.mjs index.html
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

export const VIEWPORTS = [320, 375, 414, 640, 768, 1024, 1280, 1366, 1440, 1920];
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

// pages: ['index.html', 'legal/privacy.html', ...] относительно rootDir. Возвращает { page: [{src, widths:{vw:px}}] } в порядке документа.
export async function measureImages(rootDir, pages, match = /media\/photos\/[^"']+\.jpe?g/) {
  const port = 8097;
  const server = await serve(rootDir, port);
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const out = {};
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort()); // внешние ресурсы раскладку не меняют
    for (const p of pages) {
      out[p] = [];
      for (const vw of VIEWPORTS) {
        await page.setViewportSize({ width: vw, height: 900 });
        await page.goto(`http://127.0.0.1:${port}/${p}`, { waitUntil: 'load' });
        const res = await page.evaluate((re) => [...document.images]
          .filter(i => new RegExp(re).test(i.getAttribute('src') || ''))
          .map(i => ({ src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width) })), match.source);
        res.forEach((r, k) => { (out[p][k] ||= { src: r.src, widths: {} }).widths[vw] = r.w; });
      }
    }
  } finally { await browser.close(); server.close(); }
  return out;
}

// widths {vw: px} -> "(min-width: 1366px) 37vw, ..., 94vw". Между точками берём долю от ближайшей меньшей
// ширины окна: для резиновой раскладки это точно, для ограниченного контейнера — с запасом (не мыло).
export function toSizes(widths) {
  const vws = Object.keys(widths).map(Number).sort((a, b) => b - a);
  if (vws.every(v => !widths[v])) return '100vw';
  const ranges = []; // [нижняя граница окна, доля vw], по убыванию
  for (const v of vws) {
    // >100vw бывает законно: hero на 640–1099 увеличен transform: scale(1.25) — нужны пиксели под масштаб
    const ratio = Math.min(200, Math.max(1, Math.ceil((widths[v] || 1) / v * 100)));
    if (ranges.length && ranges.at(-1)[1] === ratio) ranges.at(-1)[0] = v; // тот же процент — расширяем диапазон вниз
    else ranges.push([v, ratio]);
  }
  const last = ranges.pop();
  return [...ranges.map(([v, r]) => `(min-width: ${v}px) ${r}vw`), `${last[1]}vw`].join(', ');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html'];
  const r = await measureImages('.', pages);
  for (const [p, imgs] of Object.entries(r)) for (const i of imgs) console.log(p, i.src, JSON.stringify(i.widths), '=>', toSizes(i.widths));
}
