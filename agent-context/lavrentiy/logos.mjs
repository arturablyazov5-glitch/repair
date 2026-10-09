import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 1366]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8099/index.html'); await p.addStyleTag({ content: '[class*=cookie]{display:none!important}' });
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
  await p.evaluate(() => document.querySelector('#brands').scrollIntoView()); await p.waitForTimeout(9000);
  const r = await p.evaluate(() => [...new Set([...document.querySelectorAll('#brands .brands__premium img[data-brand],#brands .brands__grid img[data-brand]')].map(i => i.dataset.brand + ':' + (i.naturalWidth > 0 ? 'ok' : 'wordmark')))]);
  console.log(w, r.join(' '), errs);
  await (await p.$('#brands')).screenshot({ path: `agent-context/lavrentiy/brands-${w}.png` });
}
await b.close();
