// Lighthouse-замер: node tools/lighthouse.mjs <label> <dir> [runs]
//   label: before | after (имя отчёта perf/<label>.md и папки perf/raw/<label>/)
//   dir:   что раздаём (. — dev-сборка в корне, dist — прод)
// Профили: mobile (по умолчанию Lighthouse: Moto G Power, Slow 4G 150ms/1.6Mbps, CPU 4x, simulate)
//          desktop (desktop-config Lighthouse). Страницы: / и /legal/privacy.html.
// Каждая комбинация прогоняется N раз (по умолчанию 3), в сводку идёт медиана по Performance score.
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { serve } from './serve.mjs';

const [label = 'before', dir = '.', runsArg = '3'] = process.argv.slice(2);
const RUNS = Number(runsArg);
const PORT = label === 'after' ? 8092 : 8091;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PAGES = [['home', '/'], ['privacy', '/legal/privacy.html']];
const PROFILES = ['mobile', 'desktop'];
const rawDir = path.join('perf', 'raw', label);
fs.mkdirSync(rawDir, { recursive: true });

const TYPE = { Document: 'html', Stylesheet: 'css', Script: 'js', Font: 'fonts', Image: 'img', Media: 'media' };
const kb = (b) => (b / 1024).toFixed(1);
const ms = (v) => v == null ? '—' : Math.round(v) + ' ms';

function summarize(lhr) {
  const a = lhr.audits;
  const reqs = a['network-requests'].details.items;
  const bucket = { internal: {}, external: {} };
  const failedExternal = [];
  for (const r of reqs) {
    const host = new URL(r.url).hostname;
    if (r.url.startsWith('data:')) continue;
    const side = host === '127.0.0.1' || host === 'localhost' ? 'internal' : 'external';
    const t = TYPE[r.resourceType] || 'other';
    const b = bucket[side][t] ||= { n: 0, transfer: 0, resource: 0 };
    b.n++; b.transfer += r.transferSize || 0; b.resource += r.resourceSize || 0;
    if (side === 'external' && (!r.finished || r.statusCode < 200 || r.statusCode >= 400)) failedExternal.push(`${r.statusCode} ${r.url}`);
  }
  return {
    score: Math.round(lhr.categories.performance.score * 100),
    lcp: a['largest-contentful-paint'].numericValue,
    fcp: a['first-contentful-paint'].numericValue,
    si: a['speed-index'].numericValue,
    tbt: a['total-blocking-time'].numericValue,
    cls: a['cumulative-layout-shift'].numericValue,
    mpfid: a['max-potential-fid']?.numericValue,
    tti: a['interactive']?.numericValue,
    lcpElement: (() => { const its = a['lcp-breakdown-insight']?.details?.items || []; const n = its.find(i => i.type === 'node'); const t = its.find(i => i.type === 'table');
      return n ? `${n.selector} — ${(t?.items || []).map(x => `${x.label}: ${Math.round(x.duration)} ms`).join(', ')}` : ''; })(),
    longTasks: a['long-tasks']?.details?.items?.length ?? 0,
    renderBlocking: (a['render-blocking-insight'] || a['render-blocking-resources'])?.details?.items?.length ?? 0,
    unusedCss: a['unused-css-rules']?.details?.overallSavingsBytes ?? 0,
    unusedJs: a['unused-javascript']?.details?.overallSavingsBytes ?? 0,
    mainThread: a['mainthread-work-breakdown']?.numericValue,
    bucket, failedExternal,
    warnings: lhr.runWarnings || []
  };
}

const server = await serve(dir, PORT);
const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
const results = {};
try {
  for (const [pageName, urlPath] of PAGES) for (const profile of PROFILES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const url = `http://127.0.0.1:${PORT}${urlPath}`;
      const res = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] },
        profile === 'desktop' ? desktopConfig : undefined);
      fs.writeFileSync(path.join(rawDir, `${pageName}-${profile}-${i + 1}.json`), res.report);
      runs.push(summarize(res.lhr));
      process.stdout.write(`${pageName}/${profile} #${i + 1}: ${runs.at(-1).score}\n`);
    }
    runs.sort((x, y) => x.score - y.score);
    results[`${pageName}-${profile}`] = { median: runs[Math.floor(runs.length / 2)], scores: runs.map(r => r.score) };
  }
} finally {
  await chrome.kill();
  server.close();
}
fs.writeFileSync(path.join('perf', `${label}.json`), JSON.stringify(results, null, 2));

// ---- Markdown-сводка ----
const L = [];
L.push(`# Lighthouse: ${label === 'before' ? 'ДО оптимизации (dev-сборка, корень репо)' : 'ПОСЛЕ оптимизации (dist/)'}`, '');
L.push(`Дата: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · Lighthouse ${JSON.parse(fs.readFileSync('node_modules/lighthouse/package.json')).version} · Chromium ${CHROME}`);
L.push(`Каталог: \`${dir}\` через tools/serve.mjs (${label === 'before' ? 'без сжатия — как есть' : 'с предсжатыми .br/.gz'}) · прогонов на комбинацию: ${RUNS}, ниже — медиана по Performance.`);
L.push('Мобильный профиль = дефолт Lighthouse (Slow 4G: RTT 150 ms, 1.6 Mbps; CPU 4x; simulated throttling). Десктоп = desktop-config.', '');
L.push('| Страница / профиль | Perf | LCP | FCP | Speed Index | TBT | CLS | Max FID | Long tasks | Все прогоны |');
L.push('|---|---|---|---|---|---|---|---|---|---|');
for (const [k, { median: m, scores }] of Object.entries(results))
  L.push(`| ${k} | **${m.score}** | ${ms(m.lcp)} | ${ms(m.fcp)} | ${ms(m.si)} | ${ms(m.tbt)} | ${m.cls.toFixed(3)} | ${ms(m.mpfid)} | ${m.longTasks} | ${scores.join(', ')} |`);
L.push('');
for (const [k, { median: m }] of Object.entries(results)) {
  if (!k.endsWith('mobile')) continue;
  L.push(`## Ресурсы: ${k} (медианный прогон)`, '');
  L.push('| Сторона | Тип | Запросов | Передано, КБ | Распаковано, КБ |', '|---|---|---|---|---|');
  for (const side of ['internal', 'external']) {
    let tn = 0, tt = 0, tr = 0;
    for (const [t, b] of Object.entries(m.bucket[side]).sort()) { L.push(`| ${side === 'internal' ? 'внутренние' : 'внешние'} | ${t} | ${b.n} | ${kb(b.transfer)} | ${kb(b.resource)} |`); tn += b.n; tt += b.transfer; tr += b.resource; }
    L.push(`| **${side === 'internal' ? 'внутренние' : 'внешние'}** | **итого** | **${tn}** | **${kb(tt)}** | **${kb(tr)}** |`);
  }
  L.push('', `LCP-элемент: \`${m.lcpElement.replace(/`/g, "'").slice(0, 160)}\``, '');
  L.push(`Диагностика: render-blocking ресурсов ${m.renderBlocking}; неиспользуемый CSS ≈ ${kb(m.unusedCss)} КБ; неиспользуемый JS ≈ ${kb(m.unusedJs)} КБ; main-thread ${ms(m.mainThread)}.`);
  if (m.failedExternal.length) L.push('', 'Внешние запросы, не загрузившиеся в песочнице (сеть ограничена):', ...m.failedExternal.map(u => `- ${u}`));
  if (m.warnings.length) L.push('', 'Предупреждения Lighthouse:', ...m.warnings.map(w => `- ${w}`));
  L.push('');
}
L.push('Сырые отчёты: `perf/raw/' + label + '/*.json` (в .gitignore), агрегат: `perf/' + label + '.json`.');
fs.writeFileSync(path.join('perf', `${label}.md`), L.join('\n') + '\n');
console.log('written perf/' + label + '.md');
