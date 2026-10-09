import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root='/home/user/repair';
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f+='/index.html';if(!fs.existsSync(f)){r.statusCode=404;return r.end()}const t={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'}[path.extname(f)]||'application/octet-stream';r.setHeader('content-type',t);r.end(fs.readFileSync(f))}).listen(8125);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1366,height:900}});
await p.goto('http://localhost:8125/index.html');await p.waitForTimeout(500);
await p.evaluate(()=>{const c=document.querySelector('.cookie-banner,[class*=cookie]');if(c)c.style.display='none'});
for(const [sel,n] of [['.process__tab[aria-selected=true]','a'],['.prices__term--free','b'],['.guar__table','c'],['.services__nf, .services__notfound','d']]){const e=await p.$(sel);if(e){await e.scrollIntoViewIfNeeded();await e.screenshot({path:`el-${n}.png`});}else console.log('none',sel)}
const e=await p.$('#process .container');await p.evaluate(()=>document.querySelector('#process-panel-1')?.scrollIntoView({block:'center'}));await p.waitForTimeout(500);await p.screenshot({path:'el-proc.png'});
await b.close();srv.close();
