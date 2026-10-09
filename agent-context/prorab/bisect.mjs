import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/user/repair'; const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end()}else{r.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');r.end(d)}})}).listen(8496);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await b.newPage({viewport:{width:320,height:800}});
await pg.goto('http://localhost:8496/index.html'); await pg.waitForTimeout(800);
const res=await pg.evaluate(()=>{const out=[];const kids=[...document.body.children];
 const base=document.documentElement.scrollWidth; out.push(['base',base]);
 for(const k of kids){const old=k.style.display;k.style.display='none';const sw=document.documentElement.scrollWidth;k.style.display=old;if(sw!==base)out.push([k.tagName+'#'+k.id+'.'+(k.className||'')+' '+(k.querySelector('h1,h2')?.textContent||'').slice(0,30),sw]);}
 return out});
console.log(JSON.stringify(res,null,1)); await b.close(); srv.close();
