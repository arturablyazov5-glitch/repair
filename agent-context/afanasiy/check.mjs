// Проверка секций Афанасия: node agent-context/afanasiy/check.mjs [port]
// Требует запущенного сервера: python3 -m http.server 8086 (из корня проекта)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');

const port = process.argv[2] || 8086;
const base = `http://localhost:${port}/`;
const out = 'agent-context/afanasiy/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const log = [];
const report = (...a) => { console.log(...a); };

for (const w of [320, 768, 1024, 1366, 1920]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.push(`[${w}] console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => log.push(`[${w}] pageerror: ${e.message}`));
  page.on('requestfailed', r => log.push(`[${w}] requestfailed: ${r.url().slice(0, 90)} ${r.failure()?.errorText}`));
  await page.goto(base, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
  await page.evaluate(() => document.querySelectorAll('body *').forEach(e => { const p = getComputedStyle(e).position; if ((p === 'fixed' || p === 'sticky') && !e.closest('#faq,#contacts,.footer')) e.style.visibility = 'hidden'; }));
  const ov = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('#faq *, #contacts *, .footer *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 0.5 || r.left < -0.5) && !el.closest('.hp')) bad.push(el.className || el.tagName);
    });
    return { sw: document.documentElement.scrollWidth, vw, bad: [...new Set(bad)].slice(0, 10) };
  });
  report(`${w}: scrollWidth=${ov.sw} vw=${ov.vw} overflow=${JSON.stringify(ov.bad)}`);
  for (const [sel, name] of [['#faq', 'faq'], ['#contacts', 'contacts'], ['.footer', 'footer']]) {
    await page.locator(sel).screenshot({ path: `${out}${name}-${w}.png` });
  }
  await page.close();
}

// Сценарии: форма, аккордеон, часы
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.on('pageerror', e => log.push(`[flow] pageerror: ${e.message}`));
await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
await page.goto(base, { waitUntil: 'load' });
const form = page.locator('#contacts form[data-lead-form]');
await form.locator('[type=submit]').click();
report('empty submit: invalid fields =', await form.locator('.field.is-invalid').count(), '| status:', await form.locator('.form__status').textContent());
await form.locator('[name=name]').fill('Иван');
await form.locator('[name=phone]').pressSequentially('9181234567');
report('phone mask:', await form.locator('[name=phone]').inputValue());
await form.locator('[type=submit]').click();
report('no consent: status =', await form.locator('.form__status').textContent(), '| opened:', await page.evaluate(() => window.__opened.length));
await form.locator('[name=device]').selectOption('Холодильник');
await form.locator('[name=brand]').fill('Liebherr');
await form.locator('[name=consent]').check();
await form.locator('[type=submit]').click();
await page.waitForTimeout(300);
report('with consent: status =', await form.locator('.form__status').textContent());
const opened = await page.evaluate(() => window.__opened);
report('whatsapp url:', opened[0] ? decodeURIComponent(opened[0]).replace(/\n/g, ' | ') : 'none');

// Аккордеон с клавиатуры
const s2 = page.locator('#faq summary').nth(1);
await s2.focus();
const before = await page.locator('#faq details').nth(1).evaluate(d => d.open);
await page.keyboard.press('Enter');
const afterEnter = await page.locator('#faq details').nth(1).evaluate(d => d.open);
await page.keyboard.press('Space');
const afterSpace = await page.locator('#faq details').nth(1).evaluate(d => d.open);
report(`accordion keyboard: before=${before} Enter=>${afterEnter} Space=>${afterSpace}`);
// Tab-навигация доходит до summary
await page.locator('#faq-title').evaluate(e => { e.tabIndex = -1; e.focus(); });
const tabTargets = [];
for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); tabTargets.push(await page.evaluate(() => document.activeElement.tagName + '.' + document.activeElement.className)); }
report('tab order:', tabTargets.join(' → '));

report('hours:', await page.locator('[data-hours-status]').textContent(), '| today:', await page.locator('.contacts__days .is-today span').first().textContent());
const ld = await page.$$eval('script[type="application/ld+json"]', ss => ss.map(s => { try { const j = JSON.parse(s.textContent); return [].concat(j['@type']).join('+'); } catch (e) { return 'INVALID: ' + e.message; } }));
report('JSON-LD:', ld.join(', '));
report('year:', await page.locator('[data-year]').textContent());
await page.close();

// Подвал на legal-странице
const lp = await browser.newPage({ viewport: { width: 768, height: 900 } });
lp.on('pageerror', e => log.push(`[legal] pageerror: ${e.message}`));
const resp = await lp.goto(base + 'legal/privacy.html', { waitUntil: 'load' });
if (resp.ok()) {
  const hrefs = await lp.$$eval('.footer a[href]', as => as.map(a => a.getAttribute('href')).filter(h => !h.startsWith('http') && !h.startsWith('tel')));
  report('legal footer links:', hrefs.slice(0, 4).join(' '), '...');
  await lp.locator('.footer').screenshot({ path: `${out}footer-legal-768.png` });
}
await lp.close();
await browser.close();
report('\n--- console/network ---\n' + (log.length ? [...new Set(log)].join('\n') : 'чисто'));
