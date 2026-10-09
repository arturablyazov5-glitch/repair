// Скриншоты секций 20–22 + проверки переполнений, консоли, клавиатуры. Запуск: node agent-context/ippolit/shots.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const PORT = process.env.PORT || 8093;
const out = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errors = [];
for (const w of [320, 768, 1024, 1366, 1920]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${w} ${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${w} pageerror: ${e.message}`));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // переполнения: элементы наших секций шире вьюпорта
  const over = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth; const bad = [];
    document.querySelectorAll('#process *, #prices *, #guarantees *').forEach(el => {
      const r = el.getBoundingClientRect(); if (r.width && (r.right > vw + 0.5 || r.left < -0.5) && !el.closest('.process__rail')) bad.push(`${el.className || el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
    });
    return { docW: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 8) };
  });
  console.log(w, 'scrollW', over.docW, 'vw', over.vw, over.bad.length ? over.bad : 'ok');
  for (const id of ['process', 'prices', 'guarantees']) await page.locator('#' + id).screenshot({ path: `${out}${id}-${w}.png` });
  if (w === 1366) {
    // клавиатура: табы
    await page.focus('#process-tab-1'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    const t = await page.evaluate(() => [document.activeElement.id, document.querySelector('#process-panel-4').hidden, document.querySelectorAll('.process__msg:not(.is-future)').length]);
    console.log('tabs keyboard -> focus', t[0], 'panel4 hidden', t[1], 'msgs visible', t[2]);
    await page.keyboard.press('End'); console.log('End ->', await page.evaluate(() => document.activeElement.id));
    await page.locator('#process').screenshot({ path: `${out}process-1366-step6.png` });
    // клавиатура: калькулятор
    await page.focus('input[name="calc-device"][value="washer"]'); await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight'); // -> dishwasher
    await page.keyboard.press('Tab'); await page.keyboard.press('Space');
    const c = await page.evaluate(() => [document.querySelector('input[name="calc-device"]:checked')?.value, document.querySelector('[data-calc-sum]').textContent, document.querySelector('[data-calc-cause]').textContent, document.querySelector('[data-calc-wa]').href.slice(0, 60)]);
    console.log('calc keyboard ->', c);
    await page.locator('.prices__calc').screenshot({ path: `${out}calc-1366.png` });
    await page.click('[data-calc-lead]');
    console.log('modal prefill ->', await page.evaluate(() => { const m = document.getElementById('lead-modal'); return [m.classList.contains('is-open'), m.querySelector('[name=device]')?.value, m.querySelector('[name=problem]')?.value]; }));
  }
  await page.close();
}
console.log('console errors/warnings:', errors.length ? errors : 'none');
await browser.close();
