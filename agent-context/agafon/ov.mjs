import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 320, height: 900 } });
await p.goto('http://localhost:8098/'); await p.evaluate(() => document.querySelectorAll('.services__trigger').forEach(b => b.click())); await p.waitForTimeout(400);
console.log(await p.evaluate(() => { const a=document.documentElement.scrollWidth; const pk=document.querySelector(".services__pick"); const kids=[...pk.children].map(c=>{const s=c.style.display; c.style.display="none"; const w=document.documentElement.scrollWidth; c.style.display=s; return c.className+":"+w;}); return a+" | "+kids.join(" ; "); }));
await b.close();
