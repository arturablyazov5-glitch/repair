import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url); const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 375, 768, 1024, 1366, 1920]) { const p = await b.newPage({ viewport: { width: w, height: 800 } }); await p.goto('http://localhost:8086/');
console.log(w, await p.evaluate(async () => { await document.fonts.ready; const a = document.querySelector('.contacts__phone'); const c = a.parentElement; return [a.scrollWidth, c.clientWidth, getComputedStyle(a).fontSize]; })); await p.close(); }
await b.close();
