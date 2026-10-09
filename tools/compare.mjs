// Таблица «до/после»: node tools/compare.mjs -> дописывает раздел в perf/after.md (из perf/before.json, perf/after.json, perf/runtime-*.json)
import fs from 'node:fs';
const B = JSON.parse(fs.readFileSync('perf/before.json')), A = JSON.parse(fs.readFileSync('perf/after.json'));
const rt = (l) => fs.existsSync(`perf/runtime-${l}.json`) ? JSON.parse(fs.readFileSync(`perf/runtime-${l}.json`)) : null;
const RB = rt('before'), RA = rt('after');
const ms = (v) => v == null ? '—' : Math.round(v) + ' ms';
const tot = (m, side) => Object.values(m.bucket[side] || {}).reduce((s, b) => ({ n: s.n + b.n, t: s.t + b.transfer }), { n: 0, t: 0 });
const L = ['', '## До / после (медианы Lighthouse, одинаковый профиль)', '',
  '| Страница / профиль | Perf | LCP | FCP | Speed Index | TBT | CLS | Запросы внутр. | Передано внутр., КБ |', '|---|---|---|---|---|---|---|---|---|'];
for (const k of Object.keys(A)) {
  const b = B[k]?.median, a = A[k].median; if (!b) continue;
  const tb = tot(b, 'internal'), ta = tot(a, 'internal');
  L.push(`| ${k} | ${b.score} → **${a.score}** | ${ms(b.lcp)} → **${ms(a.lcp)}** | ${ms(b.fcp)} → ${ms(a.fcp)} | ${ms(b.si)} → ${ms(a.si)} | ${ms(b.tbt)} → ${ms(a.tbt)} | ${b.cls.toFixed(3)} → ${a.cls.toFixed(3)} | ${tb.n} → ${ta.n} | ${(tb.t / 1024).toFixed(0)} → **${(ta.t / 1024).toFixed(0)}** |`);
}
const types = ['html', 'css', 'js', 'fonts', 'img', 'other'];
L.push('', '### Вес главной по типам (мобильный, внутренние ресурсы, передано по сети)', '', '| Тип | До: запросов / КБ | После: запросов / КБ |', '|---|---|---|');
for (const t of types) { const b = B['home-mobile'].median.bucket.internal[t], a = A['home-mobile'].median.bucket.internal[t]; if (!b && !a) continue; L.push(`| ${t} | ${b ? b.n + ' / ' + (b.transfer / 1024).toFixed(1) : '—'} | ${a ? a.n + ' / ' + (a.transfer / 1024).toFixed(1) : '—'} |`); }
const ext = (m) => tot(m, 'external');
L.push('', `Внешние ресурсы главной (мобильный): до ${ext(B['home-mobile'].median).n} запр. / ${(ext(B['home-mobile'].median).t / 1024).toFixed(1)} КБ, после ${ext(A['home-mobile'].median).n} запр. / ${(ext(A['home-mobile'].median).t / 1024).toFixed(1)} КБ (сеть песочницы ограничена; в бою это иконка «Хорошее место» и логотипы trace-logos, все lazy).`);
if (RB && RA) {
  L.push('', '### Рантайм (Playwright, 412×823, Slow 4G, CPU 4x, прокрутка + клики)', '', '| Страница | LCP | CLS | Long tasks шт / Σ / макс | INP-прокси |', '|---|---|---|---|---|');
  for (const p of Object.keys(RA)) { const b = RB[p], a = RA[p]; if (!b) continue;
    L.push(`| ${p} | ${b.lcp?.t ?? '—'} → **${a.lcp?.t ?? '—'} ms** | ${b.cls} → **${a.cls}** | ${b.longTasks.n}/${b.longTasks.total}/${b.longTasks.max} → ${a.longTasks.n}/${a.longTasks.total}/${a.longTasks.max} ms | ${Math.round(b.inp)} → ${Math.round(a.inp)} ms |`); }
}
const txt = fs.readFileSync('perf/after.md', 'utf8').split('\n## До / после')[0];
fs.writeFileSync('perf/after.md', txt.trimEnd() + '\n' + L.join('\n') + '\n');
console.log(L.join('\n'));
