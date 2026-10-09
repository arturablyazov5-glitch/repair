// Контактный лист финальных файлов: белый/чёрный, 16/32 (реальные пиксели ×4), шапка 72px, подвал.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const B = '/home/user/repair/media/brand/';
const S = process.env.SCRATCH;
const rd = n => fs.readFileSync(B + n, 'utf8');
const snip = rd('header-snippet.html');
const hdrA = snip.match(/<a class="logo hdr__logo"[\s\S]*?<\/a>/)[0];
const ftA = snip.match(/<a class="logo logo--footer"[\s\S]*?<\/a>/)[0];
const css = snip.match(/<style>([\s\S]*?)<\/style>/)[1];
const html = `<!doctype html><meta charset="utf-8"><style>:root{--ink:#0e1013;--accent:#ff4f1a}
body{margin:0;padding:20px;font:13px system-ui;background:#fff}${css}
.row{display:flex;gap:16px;align-items:center;margin-bottom:16px}
.box{padding:28px;border:1px solid #ddd}.dk{background:#0e1013}
img.px{image-rendering:pixelated;border:1px solid #eee}
.hdr{height:72px;display:flex;align-items:center;gap:28px;padding:0 24px;border-bottom:1px solid #e5e5e2;width:1100px;box-sizing:border-box}
.hdr nav{font:500 14px system-ui;color:#4b4f57;display:flex;gap:22px;margin-left:auto}.cta{background:#ff4f1a;color:#fff;padding:12px 16px;border-radius:10px;font:600 14px system-ui}
.ft{background:#0e1013;padding:40px 24px;width:1100px;box-sizing:border-box}
</style>
<div class="row"><div class="box"><img src="file://${B}logo.svg" height="84"></div><div class="box dk"><img src="file://${B}logo-light.svg" height="84"></div><div class="box"><img src="file://${B}logo-mono.svg" height="42"></div></div>
<div class="row"><div class="box"><img src="file://${B}logo-mark.svg" width="200"></div><div class="box dk"><img src="file://${B}apple-touch-icon.png" width="180"></div>
<div class="box"><canvas id="c16"></canvas> <canvas id="c32"></canvas><br><img src="file://${B}favicon.svg" width="16"> <img src="file://${B}favicon.svg" width="32"></div>
<div class="box"><img src="file://${B}logo.svg" height="16"><br><br><img src="file://${B}logo.svg" height="20"></div></div>
<div class="hdr">${hdrA}<nav><span>01 Услуги</span><span>02 Бренды</span><span>03 Цены</span><span>04 Контакты</span></nav><span class="cta">Вызвать мастера</span></div>
<div class="hdr is-scrolled" style="height:56px">${hdrA}<nav><span>скролл 24px</span></nav></div>
<div class="ft">${ftA}</div>
<div class="hdr" style="width:375px">${hdrA}<span style="margin-left:auto">☰</span></div>
<script>
for (const s of [16,32]) { const c=document.getElementById('c'+s); c.width=s;c.height=s; c.style.width=c.style.height=(s*4)+'px'; c.className='px'; c.style.imageRendering='pixelated';
 const i=new Image(); i.onload=()=>c.getContext('2d').drawImage(i,0,0,s,s); i.src='file://${B}favicon.svg'; }
</script>`;
fs.writeFileSync(S + '/verify.html', html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto('file://' + S + '/verify.html'); await p.waitForTimeout(500);
await p.screenshot({ path: S + '/verify.png', fullPage: true });
const p2 = await b.newPage({ viewport: { width: 400, height: 100 }, deviceScaleFactor: 4 });
await p2.goto('file://' + S + '/verify.html'); await p2.waitForTimeout(300);
await p2.locator('.hdr').first().locator('.logo').screenshot({ path: S + '/hdr-zoom.png' });
console.log('errors', errs); await b.close();
