import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url); const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const w of [320, 768]) { const p = await b.newPage({ viewport: { width: w, height: 800 } });
await p.goto('http://localhost:8086/'); await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in')));
console.log(w, await p.evaluate((w) => [...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>w+1).filter(e=>!e.parentElement.closest('*') || e.parentElement.getBoundingClientRect().right<=w+1).slice(0,8).map(e=>`${e.tagName}.${typeof e.className==='string'?e.className:''} r=${Math.round(e.getBoundingClientRect().right)} in ${e.closest('section,footer,header')?.id||e.closest('section,footer,header')?.className}`), w)); }
await b.close();
