import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
for (const [w, h] of [[320, 640], [375, 812], [1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && !/net::|ERR_/.test(m.text()) && errs.push(m.text()));
  await p.route(/fonts\.(googleapis|gstatic)|yandex/, r => r.abort());
  await p.goto('http://localhost:8077/'); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const c = document.getElementById('cookie-banner').getBoundingClientRect();
    const f = document.querySelector('.hero__quick')?.getBoundingClientRect();
    const m = document.querySelector('.mbar'); const mb = m && getComputedStyle(m).display !== 'none' ? m.getBoundingClientRect().top : null;
    const btn = document.querySelector('[data-cookie-accept]').getBoundingClientRect().height;
    const overlap = f ? Math.max(0, Math.min(c.right, f.right) - Math.max(c.left, f.left)) * Math.max(0, Math.min(c.bottom, f.bottom) - Math.max(c.top, f.top)) : 0;
    return { h: Math.round(c.height), w: Math.round(c.width), pct: +(c.height / innerHeight * 100).toFixed(1), bottom: Math.round(c.bottom), mbarTop: mb && Math.round(mb), btnH: btn, formOverlap: Math.round(overlap), sw: document.documentElement.scrollWidth };
  });
  console.log(w, JSON.stringify(r));
  await p.screenshot({ path: `/home/user/repair/agent-context/feofan/compact-${w}.png` });
  await p.click('[data-cookie-customize]'); await p.waitForTimeout(100);
  console.log(w, 'prefs h', Math.round((await p.locator('#cookie-banner').boundingBox()).height), 'analytics checked:', await p.isChecked('[name=analytics]'));
  await p.screenshot({ path: `/home/user/repair/agent-context/feofan/compact-prefs-${w}.png` });
  await p.close();
}
console.log('errors', errs);
await b.close();
