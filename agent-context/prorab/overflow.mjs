import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/user/repair'; const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end()}else{r.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');r.end(d)}})}).listen(8497);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const w of [320,375,768,1024,1366]) {
  const pg=await b.newPage({viewport:{width:w,height:800}});
  await pg.goto('http://localhost:8497/index.html'); await pg.waitForTimeout(800);
  const r=await pg.evaluate(()=>{const W=document.documentElement.clientWidth;const out=[];
    const clipped=(el)=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(['hidden','auto','scroll','clip'].includes(s.overflowX))return true;if(s.position==='fixed')return true}return false};
    document.querySelectorAll('body *').forEach(el=>{const b=el.getBoundingClientRect();if(b.right>W+1){const s=getComputedStyle(el);if(s.position==='fixed')return;out.push([el.tagName+'.'+(el.className&&el.className.baseVal===undefined?el.className:'').toString().split(' ').slice(0,2).join('.'),Math.round(b.left),Math.round(b.right)])}});
    return {sw:document.documentElement.scrollWidth,W,top:out.filter(x=>x[2]<2000).slice(0,25),n:out.length}});
  console.log(w,JSON.stringify(r)); await pg.close();
}
await b.close(); srv.close();
