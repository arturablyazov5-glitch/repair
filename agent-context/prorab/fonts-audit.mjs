import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/user/repair'; const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end()}else{r.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');r.end(d)}})}).listen(8494);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = process.argv[2]||'index.html';
for (const w of [320,1366]) {
  const pg=await b.newPage({viewport:{width:w,height:800}});
  await pg.goto('http://localhost:8494/'+page); await pg.waitForTimeout(600);
  await pg.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true);document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in'))});
  const r=await pg.evaluate(()=>{const m=new Map();const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const t=walker.currentNode;if(!t.textContent.trim())continue;const el=t.parentElement;if(['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;const fs=parseFloat(cs.fontSize);if(fs<13.99){const key=(el.closest('section,header,footer,nav,[class]')?.className||'').toString().split(' ')[0]+' > '+el.tagName.toLowerCase()+'.'+(el.className&&el.className.baseVal===undefined?el.className:'').toString().split(' ')[0];const o=m.get(key)||{fs,n:0,ex:t.textContent.trim().slice(0,30)};o.n++;m.set(key,o)}}
    return [...m.entries()].sort((a,b)=>b[1].n-a[1].n).slice(0,40)});
  console.log(w,r.length); for(const [k,v] of r) console.log('  ',v.fs+'px',v.n,k,'|',v.ex);
  await pg.close();
}
await b.close(); srv.close();
