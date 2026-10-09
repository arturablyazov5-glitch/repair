import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url); const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 320, height: 800 } }); await p.goto('http://localhost:8086/');
console.log(await p.evaluate(async () => { await document.fonts.ready; const a = document.querySelector('.contacts__phone'); a.style.fontSize = '100px'; return a.scrollWidth; }));
await b.close();
