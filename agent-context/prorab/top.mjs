import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/user/repair'; const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.statusCode=404;r.end()}else{r.setHeader('content-type',types[path.extname(p)]||'application/octet-stream');r.end(d)}})}).listen(8498);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const [w,h] of [[1366,900],[320,640]]) {
  const pg=await b.newPage({viewport:{width:w,height:h}});
  await pg.goto('http://localhost:8498/index.html'); await pg.waitForTimeout(1500);
  await pg.screenshot({path:`/home/user/repair/agent-context/prorab/top-${w}.png`,fullPage:false});
  if (w===320) { const r = await pg.evaluate(()=>{const bar=document.querySelector('[class*=mobile-bar],[class*=bottom-bar],[class*=dock]'); if(!bar) return 'no bar'; return [...bar.querySelectorAll('a,button')].map(e=>{const b=e.getBoundingClientRect();return [e.textContent.trim(),Math.round(b.left),Math.round(b.right)]})}); console.log(JSON.stringify(r)); }
  await pg.close();
}
await b.close(); srv.close();
