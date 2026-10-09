import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root='/home/user/repair';
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f+='/index.html';if(!fs.existsSync(f)){r.statusCode=404;return r.end()}const t={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'}[path.extname(f)]||'application/octet-stream';r.setHeader('content-type',t);r.end(fs.readFileSync(f))}).listen(8124);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:320,height:800}});
await p.goto('http://localhost:8124/index.html');await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>325&&getComputedStyle(e).position!=='fixed').slice(0,12).map(e=>e.tagName+'.'+e.className.toString().slice(0,40)+' '+Math.round(e.getBoundingClientRect().right)))));
await b.close();srv.close();
