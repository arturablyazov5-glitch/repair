// Проверка юр. страниц и cookie-баннера. Запуск: node agent-context/feofan/check.mjs (сервер на :8077)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const BASE = 'http://localhost:8077/';
const OUT = '/home/user/repair/agent-context/feofan/';
const pages = ['privacy', 'consent', 'cookies', 'terms', 'offer', 'warranty'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
const metrikaReqs = [];
async function ctx(w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  await c.route(/fonts\.(googleapis|gstatic)\.com|mc\.yandex\.ru|api-maps\.yandex/, (r) => { if (/mc\.yandex/.test(r.request().url())) metrikaReqs.push(r.request().url()); r.abort(); });
  return c;
}
const watch = (p, tag) => {
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
};
for (const [w, h] of [[320, 640], [1366, 900]]) {
  const c = await ctx(w, h);
  const p = await c.newPage(); watch(p, `${w}`);
  for (const name of pages) {
    await p.goto(`${BASE}legal/${name}.html`, { waitUntil: 'load' });
    const r = await p.evaluate(() => {
      const de = document.documentElement;
      const wide = [...document.querySelectorAll('.legal *')].filter((el) => { const b = el.getBoundingClientRect(); return b.right > de.clientWidth + 1 && !el.closest('.legal__table-wrap'); }).map((el) => el.tagName + '.' + el.className).slice(0, 5);
      return { sw: de.scrollWidth, cw: de.clientWidth, wide, banner: !document.getElementById('cookie-banner').hidden, toc: getComputedStyle(document.querySelector('.legal__toc')).position };
    });
    console.log(w, name, JSON.stringify(r));
    await p.waitForTimeout(450);
    await p.screenshot({ path: `${OUT}${name}-${w}.png`, fullPage: name === 'offer' || name === 'cookies' });
  }
  await c.close();
}
// Сценарии баннера
for (const w of [375, 1366]) {
  const c = await ctx(w, 800);
  const p = await c.newPage(); watch(p, `banner${w}`);
  const vis = () => p.evaluate(() => !document.getElementById('cookie-banner').hidden);
  const store = () => p.evaluate(() => localStorage.getItem('sl-cookie-consent'));
  await p.goto(`${BASE}legal/terms.html`);
  console.log(w, 'first visit visible:', await vis());
  await p.waitForTimeout(450);
  const box = await p.locator('#cookie-banner').boundingBox();
  console.log(w, 'banner box bottom gap:', Math.round(800 - box.y - box.height), 'height', Math.round(box.height));
  await p.screenshot({ path: `${OUT}banner-${w}.png` });
  await p.click('[data-cookie-customize]');
  console.log(w, 'prefs open, analytics checked by default:', await p.isChecked('#cookie-prefs [name=analytics]'), 'focused:', await p.evaluate(() => document.activeElement.name));
  await p.screenshot({ path: `${OUT}banner-prefs-${w}.png` });
  await p.keyboard.press('Escape');
  console.log(w, 'after Esc visible:', await vis(), 'store:', await store());
  await p.reload();
  console.log(w, 'reload w/o choice visible:', await vis());
  await p.click('[data-cookie-necessary]');
  console.log(w, 'necessary -> visible:', await vis(), 'store:', await store());
  await p.reload();
  console.log(w, 'reload after choice visible:', await vis());
  await p.goto(`${BASE}legal/cookies.html`);
  await p.click('.legal__summary [data-cookie-settings]');
  console.log(w, 'settings btn opens:', await vis(), 'focus:', await p.evaluate(() => document.activeElement.name));
  await p.check('#cookie-prefs [name=analytics]');
  await p.click('[data-cookie-save]');
  console.log(w, 'saved:', await store(), 'visible:', await vis(), 'focus back:', await p.evaluate(() => document.activeElement.textContent.trim()));
  await p.goto(`${BASE}legal/privacy.html`);
  await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.click('[data-cookie-accept]');
  console.log(w, 'accept all:', await store());
  await c.close();
}
// Метрика: при пустом id не грузится; с id — только после согласия
console.log('metrika requests with empty id:', metrikaReqs.length);
{
  const c = await ctx(1366, 800);
  await c.route('**/js/config.js', async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace("yandexMetrikaId: ''", "yandexMetrikaId: '12345678'") }); });
  const p = await c.newPage(); watch(p, 'metrika');
  await p.goto(`${BASE}legal/terms.html`);
  const before = metrikaReqs.length;
  await p.waitForTimeout(300);
  console.log('metrika before consent:', metrikaReqs.length - before);
  await p.click('[data-cookie-necessary]'); await p.waitForTimeout(300);
  console.log('metrika after necessary-only:', metrikaReqs.length - before);
  await p.evaluate(() => window.CookieConsent.open()); await p.click('[data-cookie-accept]'); await p.waitForTimeout(500);
  console.log('metrika after accept:', metrikaReqs.length - before);
  await c.close();
}
console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
