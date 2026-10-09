import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/user/repair'; const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end()}else{r.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');r.end(d)}})}).listen(8493);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await b.newPage({viewport:{width:360,height:800}});
await pg.goto('http://localhost:8493/index.html'); await pg.waitForTimeout(600);
await pg.evaluate(()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in'))});
const r=await pg.evaluate(()=>{const m=new Map();const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){const t=walker.currentNode;if(!t.textContent.trim())continue;const el=t.parentElement;const cs=getComputedStyle(el);if(cs.display==='none')continue;const fs=parseFloat(cs.fontSize);if(fs>=36){const sec=el.closest('section,header,footer')?.id||el.closest('section,header,footer')?.className.split(' ')[0];const key=sec+' > '+el.tagName.toLowerCase()+'.'+(el.className&&el.className.baseVal===undefined?el.className:'').toString().split(' ')[0];m.set(key,[Math.round(fs),t.textContent.trim().slice(0,28)])}}
 return [...m.entries()].sort((a,b)=>b[1][0]-a[1][0])});
for(const [k,v] of r) console.log(v[0]+'px',k,'|',v[1]);
const hs=await pg.evaluate(()=>[...document.querySelectorAll('section')].map(s=>[s.id||s.className.split(' ')[0],Math.round(parseFloat(getComputedStyle(s).paddingTop)),Math.round(s.getBoundingClientRect().height)]));
console.log(JSON.stringify(hs));
console.log('page height',await pg.evaluate(()=>document.documentElement.scrollHeight));
await b.close(); srv.close();
