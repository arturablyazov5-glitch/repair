// Проверка SEO-страниц (Евлампий): битые ссылки/ресурсы по локальным файлам, JSON-LD, один H1, sitemap↔файлы,
// затем браузер: консоль, 404, горизонтальный скролл, скриншоты 320/1366.
// Запуск: NODE_PATH=<каталог с playwright-core> node agent-context/evlampiy/check.mjs [http://localhost:8716]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(process.env.NODE_PATH ? process.env.NODE_PATH + '/' : import.meta.url);
const ROOT = process.cwd();
const BASE = process.argv[2] || 'http://localhost:8716';
const errs = [];

const htmlFiles = ['index.html', ...fs.readdirSync('legal').map(f => 'legal/' + f), 'remont/index.html',
  ...fs.readdirSync('remont').filter(d => fs.statSync('remont/' + d).isDirectory()).map(d => `remont/${d}/index.html`)];

for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const h1 = (noComments.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errs.push(`${f}: H1 = ${h1}`);
  for (const m of noComments.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { errs.push(`${f}: JSON-LD invalid: ${e.message}`); }
  }
  const t = (noComments.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const d = (noComments.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (f.startsWith('remont')) console.log(`${t.length.toString().padStart(3)} / ${d.length.toString().padStart(3)}  ${f}`);
  if (t.length > 70) errs.push(`${f}: title ${t.length} симв.`);
  if (d.length > 160) errs.push(`${f}: description ${d.length} симв.`);
  for (const m of noComments.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|tel:|mailto:|data:|#|javascript:)/.test(u)) continue;
    u = u.split('#')[0].split('?')[0];
    if (!u) continue;
    let p = path.normalize(path.join(path.dirname(f), u));
    if (u.endsWith('/') || fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) errs.push(`${f}: битая ссылка ${m[1]}`);
  }
}
// sitemap ↔ файлы
const sm = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>https?:\/\/[^/]+\/([^<]*)<\/loc>/g)].map(m => m[1]);
const smFiles = sm.map(l => (l === '' || l.endsWith('/')) ? l + 'index.html' : l);
for (const s of smFiles) if (!fs.existsSync(s)) errs.push(`sitemap: нет файла ${s}`);
for (const f of htmlFiles) if (!smFiles.includes(f)) errs.push(`sitemap: нет URL для ${f}`);
console.log(`статически: ${htmlFiles.length} HTML, sitemap ${sm.length} URL`);

// Браузер
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const shots = ['remont/stiralnye-mashiny/', 'remont/bosch/', 'remont/'];
const all = htmlFiles.filter(f => f.startsWith('remont')).map(f => f.replace(/index\.html$/, ''));
fs.mkdirSync('agent-context/evlampiy/png', { recursive: true });
for (const w of [320, 1366]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  for (const u of all) {
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`${w} ${u}: console ${m.type()}: ${m.text()}`); });
    page.on('pageerror', e => errs.push(`${w} ${u}: pageerror ${e.message}`));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errs.push(`${w} ${u}: ${r.status()} ${r.url()}`); });
    await page.goto(`${BASE}/${u}`, { waitUntil: 'networkidle' });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) errs.push(`${w} ${u}: горизонтальный скролл ${sw}px`);
    if (shots.includes(u)) {
      await page.evaluate(() => document.querySelectorAll('details').forEach((d, i) => { if (i === 0) d.open = true; }));
      await page.screenshot({ path: `agent-context/evlampiy/png/${u.replace(/\//g, '_') || 'hub'}-${w}.png`, fullPage: true });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(errs.length ? 'ОШИБКИ:\n' + errs.join('\n') : 'OK: ошибок нет');
