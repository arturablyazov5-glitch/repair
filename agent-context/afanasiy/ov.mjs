import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url); const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 320, height: 800 } });
await p.goto('http://localhost:8086/'); await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in')));
console.log(await p.evaluate(() => [...document.querySelectorAll('#contacts *')].filter(e=>e.getBoundingClientRect().right>320).slice(0,12).map(e=>`${e.tagName}.${e.className} w=${Math.round(e.getBoundingClientRect().width)} min=${getComputedStyle(e).minWidth}`)));
await b.close();
