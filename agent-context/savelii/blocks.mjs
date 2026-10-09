// Высоты подблоков секций на заданной ширине: node blocks.mjs 360
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/user/repair'; const W=+process.argv[2]||360;
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp'};
const srv=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end()}else{r.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');r.end(d)}})}).listen(8521);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const ctx=await b.newContext({viewport:{width:W,height:800}});
await ctx.route(u=>!u.href.startsWith('http://localhost:8521'),r=>r.fulfill({status:200,body:''}));
const pg=await ctx.newPage(); await pg.goto('http://localhost:8521/index.html'); await pg.waitForTimeout(400);
const r=await pg.evaluate(()=>[...document.querySelectorAll('body > section, body > footer')].map(s=>{const c=s.querySelector('.container')||s;return (s.id||s.className)+': '+[...c.children].map(e=>{const h=Math.round(e.getBoundingClientRect().height);const kids=h>700?' ['+[...e.children].map(k=>(k.className.toString().split(' ')[0]||k.tagName)+' '+Math.round(k.getBoundingClientRect().height)).join(', ')+']':'';return (e.className.toString().split(' ')[0]||e.tagName)+' '+h+kids}).join(' | ')}));
console.log(r.join('\n')); await b.close(); srv.close();
