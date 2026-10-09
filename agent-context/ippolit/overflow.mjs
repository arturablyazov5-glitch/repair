import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 768]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:8093/', { waitUntil: 'networkidle' });
  console.log(w, await p.evaluate(() => { const vw = document.documentElement.clientWidth; const r = [];
    document.querySelectorAll('body *').forEach(el => { const b = el.getBoundingClientRect(); if (b.width && b.right > vw + 1) { const s = el.closest('section,header,footer,div[id]'); r.push((s?.id || s?.className || '') + ' :: ' + el.tagName + '.' + el.className + ' ' + Math.round(b.right)); } });
    return r.slice(0, 6); }));
}
await b.close();
