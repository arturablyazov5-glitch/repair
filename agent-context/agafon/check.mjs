// TASK-018 (Агафон): переполнения, консоль, калькулятор, аккордеоны, JSON-LD, скриншоты.
// node agent-context/agafon/check.mjs [port]  (нужен python3 -m http.server <port> из корня)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const port = process.argv[2] || 8098;
const base = `http://localhost:${port}/`;
const out = 'agent-context/agafon/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const log = [];
const pages = ['', 'legal/offer.html', 'legal/warranty.html', 'legal/privacy.html', 'legal/cookies.html', 'legal/consent.html', 'legal/terms.html'];
for (const w of [320, 360, 768, 1366]) {
  for (const p of pages) {
    if (w === 360 && p) continue;
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.push(`[${w} ${p}] console.${m.type()}: ${m.text()}`); });
    page.on('pageerror', e => log.push(`[${w} ${p}] pageerror: ${e.message}`));
    await page.goto(base + p, { waitUntil: 'load' });
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
    // раскрыть все аккордеоны услуг, чтобы проверить ссылки «Подробнее»
    if (!p) await page.evaluate(() => document.querySelectorAll('.services__trigger').forEach(b => b.click()));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth, bad = [];
      document.querySelectorAll('body *').forEach(el => {
        const b = el.getBoundingClientRect();
        if (b.width && b.right > vw + 0.5 && !el.closest('.hp,.brands__marquee,.sr-only,[aria-hidden="true"],.footer__word') && getComputedStyle(el).position !== 'fixed') {
          let a = el.parentElement, clipped = false;
          while (a) { const o = getComputedStyle(a).overflowX; if (o !== 'visible') { const ab = a.getBoundingClientRect(); if (ab.right <= vw + .5) { clipped = true; break; } } a = a.parentElement; }
          if (!clipped) bad.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + '');
        }
      });
      let ld = 0, ldErr = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => { try { JSON.parse(s.textContent); ld++; } catch (e) { ldErr.push(e.message); } });
      const txt = document.body.innerText;
      const ph = (txt.match(/TODO|\bX ₽|\bN (час|дн|мес)|example|\{\{/g) || []);
      const h1 = document.querySelector('h1'); const lh = h1 ? parseFloat(getComputedStyle(h1).lineHeight) : 0;
      return { sw: document.documentElement.scrollWidth, vw, bad: [...new Set(bad)].slice(0, 8), ld, ldErr, ph, h1lines: h1 && lh ? Math.round(h1.getBoundingClientRect().height / lh) : null };
    });
    console.log(`${w} ${p || 'index'}: sw=${r.sw} vw=${r.vw} ld=${r.ld} ${r.ldErr.join(';')} ph=${r.ph.join(',')} h1lines=${r.h1lines} ${r.bad.length ? 'OVER:' + r.bad.join(',') : ''}`);
    if (!p && w !== 360) {
      // калькулятор
      await page.evaluate(() => document.querySelector('.services__trigger') && 0);
      await page.locator('[data-calc-devices] label').first().click();
      await page.locator('[data-calc-faults] label').nth(2).click();
      const sum = await page.locator('[data-calc-sum]').textContent();
      const faqOpen = await page.evaluate(() => { const d = document.querySelectorAll('.faq__item')[2]; d.querySelector('summary').click(); return d.open; });
      console.log(`  calc: "${sum}"  faq#3 open=${faqOpen}`);
      for (const [sel, name] of [['#prices', 'prices'], ['#guarantees', 'guarantees'], ['#contacts', 'contacts'], ['.footer', 'footer'], ['#team', 'team'], ['#services', 'services'], ['#hero, .hero', 'hero']]) {
        const el = page.locator(sel).first();
        if (await el.count()) await el.screenshot({ path: `${out}${name}-${w}.png` }).catch(e => log.push('shot ' + name + ' ' + e.message));
      }
    }
    await page.close();
  }
}
console.log(log.length ? log.join('\n') : 'console clean');
await browser.close();
