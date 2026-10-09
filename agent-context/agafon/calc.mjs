import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 768, 1024, 1366]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:8098/'); await p.evaluate(() => { document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')); document.querySelector('.cookie')?.remove(); });
  await p.locator('[data-calc-devices] label').nth(2).click(); await p.locator('[data-calc-faults] label').first().click();
  const r = await p.evaluate(() => { const s = document.querySelector('[data-calc-sum]'), c = document.querySelector('[data-calc-result]'); const a = s.getBoundingClientRect(), d = c.getBoundingClientRect(); return { text: s.textContent, sumR: Math.round(a.right), sumH: Math.round(a.height), boxR: Math.round(d.right), sw: s.scrollWidth, cw: s.clientWidth }; });
  console.log(w, JSON.stringify(r));
  if (w === 320 || w === 1366) await p.locator('[data-prices-calc]').screenshot({ path: `agent-context/agafon/calc-${w}.png` });
  await p.close();
}
await b.close();
