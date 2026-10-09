// Проверка секций 01–03: node agent-context/ibragim/check.mjs [port]
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const port = process.argv[2] || 8091;
const base = `http://localhost:${port}/`;
const out = 'agent-context/ibragim/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const log = [];
for (const w of [320, 375, 768, 1024, 1100, 1366, 1920]) {
  const p = await browser.newPage({ viewport: { width: w, height: w < 768 ? 740 : 900 } });
  const errs = [];
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto(base, { waitUntil: 'load' });
  await p.waitForTimeout(400);
  const over = await p.evaluate(() => {
    const W = document.documentElement.clientWidth; const bad = [];
    document.querySelectorAll('.hdr *, .hero *, .trust *, .mbar *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && !el.closest('.hero__chips') && !el.closest('.hero__bg') && !el.closest('.hdr__nav')) bad.push(el.className.baseVal ?? el.className); });
    return { sw: document.documentElement.scrollWidth, W, bad: [...new Set(bad)].slice(0, 8) };
  });
  await p.screenshot({ path: `${out}w${w}.png` });
  await p.screenshot({ path: `${out}w${w}-full.png`, fullPage: true, clip: undefined });
  await p.evaluate(() => scrollTo(0, 400)); await p.waitForTimeout(500);
  const compact = await p.evaluate(() => [document.querySelector('.hdr').classList.contains('is-scrolled'), Math.round(document.querySelector('.hdr').getBoundingClientRect().height)]);
  await p.screenshot({ path: `${out}w${w}-scrolled.png` });
  log.push(`${w}: scrollW=${over.sw}/${over.W} overflowEls=${JSON.stringify(over.bad)} compact=${compact} errs=${JSON.stringify(errs)}`);
  if (w === 375) {
    await p.click('[data-hdr-burger]'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}menu-375.png` });
    const vis = await p.isVisible('.hdr__menu a[href="#faq"]');
    await p.click('.hdr__menu a[href="#faq"]'); await p.waitForTimeout(300);
    log.push(`menu: linkVisible=${vis} closedAfterClick=${!(await p.evaluate(() => document.querySelector('.hdr').classList.contains('is-menu')))} noScroll=${await p.evaluate(() => document.body.classList.contains('no-scroll'))}`);
    await p.evaluate(() => scrollTo(0, 0));
  }
  if (w === 1366 || w === 375) {
    await p.evaluate(() => scrollTo(0, 0));
    await p.click('.hero__chip[data-device="Холодильник"]'); await p.waitForTimeout(400);
    const dev = await p.$eval('#lm-device', s => s.value);
    await p.screenshot({ path: `${out}modal-${w}.png` });
    await p.click('#lead-modal [type=submit]'); await p.waitForTimeout(200);
    const errsTxt = await p.$$eval('#lead-modal .field.is-invalid', a => a.length);
    const st = await p.$eval('#lead-modal .form__status', e => e.textContent);
    await p.screenshot({ path: `${out}modal-invalid-${w}.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const escClosed = !(await p.evaluate(() => document.getElementById('lead-modal').classList.contains('is-open')));
    await p.click('.hdr__cta, .mbar__btn--cta >> visible=true'); await p.waitForTimeout(200);
    await p.mouse.click(5, 300); await p.waitForTimeout(200);
    const bgClosed = !(await p.evaluate(() => document.getElementById('lead-modal').classList.contains('is-open')));
    // быстрая форма hero
    await p.click('.hero__quick [type=submit]'); await p.waitForTimeout(200);
    const qInvalid = await p.$$eval('.hero__quick .field.is-invalid', a => a.length);
    log.push(`modal@${w}: device=${dev} invalidFields=${errsTxt} status="${st}" escClosed=${escClosed} bgClosed=${bgClosed} heroInvalid=${qInvalid} focusBack=${await p.evaluate(() => document.activeElement?.className)}`);
  }
  await p.close();
}
// legal-подобная проверка: статус и шапка без hero
const p = await browser.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(base); log.push('status: ' + await p.textContent('.hdr__top [data-open-status-text]') + ' pageErrors=' + errs.length);
await browser.close();
console.log(log.join('\n'));
