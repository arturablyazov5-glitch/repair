import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = []; const O = '/home/user/repair/agent-context/feofan/v2-';
for (const [w, h] of [[320, 640], [1366, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && !/net::|ERR_/.test(m.text()) && errs.push(m.text()));
  await p.route(/fonts\.(googleapis|gstatic)|yandex/, r => r.abort());
  await p.goto('http://localhost:8077/'); await p.waitForTimeout(500);
  const bb = await p.locator('#cookie-banner').boundingBox();
  console.log(w, 'banner', Math.round(bb.width), Math.round(bb.height), (bb.height/h*100).toFixed(1)+'%');
  await p.screenshot({ path: `${O}home-${w}.png` });
  await p.click('[data-cookie-customize]'); await p.screenshot({ path: `${O}prefs-${w}.png` });
  await p.click('[data-cookie-necessary]');
  for (const n of ['privacy', 'offer']) {
    await p.goto(`http://localhost:8077/legal/${n}.html`); await p.waitForTimeout(300);
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(w, n, 'sw', sw, 'banner hidden', await p.evaluate(() => document.getElementById('cookie-banner').hidden));
    await p.screenshot({ path: `${O}${n}-${w}.png` });
    await p.locator('.legal__table, .legal__req').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    await p.screenshot({ path: `${O}${n}-${w}-mid.png` });
  }
  await p.close();
}
console.log('errors', errs); await b.close();
