// Рендер SVG → PNG и контактный лист. node render.mjs [glob-prefix]
// NODE_PATH=/opt/node22/lib/node_modules
import { createRequire } from 'node:module';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../../media/illustrations');
const out = path.join(here, 'png');
fs.mkdirSync(out, { recursive: true });
const filter = process.argv[2] || '';
const sheetName = process.argv[3] || 'contact-sheet';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg') && filter.split(',').some(p => f.startsWith(p))).sort();

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
for (const f of files) {
  const svg = fs.readFileSync(path.join(dir, f), 'utf8');
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const [w, h] = [+m[1], +m[2]];
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${w}" height="${h}" style="display:block"></body></html>`);
  await page.waitForTimeout(50);
  await page.screenshot({ path: path.join(out, f.replace('.svg', '.png')) });
}
// контактный лист
const cells = files.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(out, f.replace('.svg', '.png'))).toString('base64')}"><figcaption>${f}</figcaption></figure>`).join('');
await page.setViewportSize({ width: 1500, height: 800 });
await page.setContent(`<html><body style="margin:0;padding:12px;background:#fbfaf7;font:12px sans-serif">
<style>main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}img{width:100%;display:block;border:1px solid #ddd}</style><main>${cells}</main></body></html>`);
await page.screenshot({ path: path.join(here, `${sheetName}.png`), fullPage: true });
await browser.close();
console.log('rendered', files.length, 'errors', errors);
