import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root='/home/user/repair';
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f+='/index.html';if(!fs.existsSync(f)){r.statusCode=404;return r.end()}const t={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'}[path.extname(f)]||'application/octet-stream';r.setHeader('content-type',t);r.end(fs.readFileSync(f))}).listen(8123);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const w of [320,1366]){
 const p=await b.newPage({viewport:{width:w,height:800}});const errs=[];
 p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(String(e)));
 for(const pg of ['index.html','legal/privacy.html','legal/cookies.html']){
  await p.goto('http://localhost:8123/'+pg);await p.waitForTimeout(600);
  const r=await p.evaluate(()=>{const bad=[...document.querySelectorAll('use')].map(u=>u.getAttribute('href')).filter(h=>!document.querySelector(h));return{bad,ow:document.documentElement.scrollWidth-innerWidth}});
  console.log(w,pg,JSON.stringify(r));
 }
 await p.goto('http://localhost:8123/index.html');
 if(w===1366){
  await p.click('#svc-t01');await p.waitForTimeout(500);
  for(const id of ['services','process','faq','prices']){await p.evaluate(i=>document.getElementById(i).scrollIntoView(),id);await p.waitForTimeout(700);await p.screenshot({path:`agent-context/vissarion/${id}-${w}.png`});}
 } else { await p.evaluate(()=>document.getElementById('services').scrollIntoView());await p.waitForTimeout(500);await p.screenshot({path:'agent-context/vissarion/services-320.png'});}
 // gallery lightbox
 const n=await p.evaluate(()=>{document.querySelector('[data-lightbox]')?.click();return document.querySelectorAll('.gal-lb use').length});
 console.log(w,'lightbox uses',n,'errs',JSON.stringify(errs));
}
await b.close();srv.close();
