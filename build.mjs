// Сборка статического сайта: src/* -> index.html и legal/*.html
// Плейсхолдеры в src: {{root}} (префикс до корня), {{cfg.path.to.value}} (из site.config.json)
import fs from 'node:fs';
import path from 'node:path';

const cfg = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const read = (p) => fs.readFileSync(p, 'utf8');
const list = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort() : [];

function fill(html, root) {
  return html
    .replaceAll('{{root}}', root)
    .replace(/\{\{cfg\.([\w.]+)\}\}/g, (_, p) => {
      const v = p.split('.').reduce((o, k) => (o == null ? o : o[k]), cfg);
      if (v == null) throw new Error('Нет значения в site.config.json: ' + p);
      return String(v);
    });
}

const cssLinks = (root) => ['css/base.css', ...list('css/sections', '.css').map(f => 'css/sections/' + f), ...list('css', '.css').filter(f => f !== 'base.css').map(f => 'css/' + f)]
  .map(f => `<link rel="stylesheet" href="${root}${f}">`).join('\n');
const jsScripts = (root) => ['js/config.js', 'js/main.js', ...list('js/sections', '.js').map(f => 'js/sections/' + f), ...list('js', '.js').filter(f => !['config.js', 'main.js'].includes(f)).map(f => 'js/' + f)]
  .map(f => `<script src="${root}${f}" defer></script>`).join('\n');

// Спрайт иконок Lucide (ISC): собираем только те, на которые есть ссылки #lucide-<имя> в src/ и js/
function lucideSprite() {
  const files = [...['src/sections', 'src/legal', 'src/partials'].flatMap(d => list(d, '.html').map(f => `${d}/${f}`)), ...list('js/sections', '.js').map(f => 'js/sections/' + f), ...list('js', '.js').map(f => 'js/' + f)];
  const names = new Set();
  for (const f of files) for (const m of read(f).matchAll(/lucide-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) names.add(m[1]);
  const dir = 'node_modules/lucide-static/icons/';
  if (!fs.existsSync(dir)) throw new Error('Нет lucide-static: выполните npm install');
  const symbols = [...names].sort().map(n => {
    if (!fs.existsSync(dir + n + '.svg')) { console.warn('Lucide: нет иконки', n); return ''; }
    const inner = read(dir + n + '.svg').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
    return `<symbol id="lucide-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${symbols}</svg>`;
}
const sprite = lucideSprite();
const head = read('src/head.html');
const sections = list('src/sections', '.html').map(f => read('src/sections/' + f));
const partials = list('src/partials', '.html').map(f => read('src/partials/' + f)).join('\n');

function page({ root, title, description, body, canonicalPath, noindex }) {
  let h = head
    .replaceAll('{{title}}', title).replaceAll('{{description}}', description)
    .replaceAll('{{canonicalPath}}', canonicalPath).replaceAll('{{robots}}', noindex ? 'noindex,follow' : 'index,follow');
  return fill(`<!doctype html>\n<html lang="ru">\n<head>\n${h}\n${cssLinks(root)}\n</head>\n<body>\n${sprite}\n${body}\n${partials}\n${jsScripts(root)}\n</body>\n</html>\n`, root);
}

// Главная: первая секция (01-header) и последняя (99-footer) входят в общий список
fs.writeFileSync('index.html', page({
  root: '', title: `${cfg.name} — ${cfg.tagline}`, canonicalPath: '',
  description: 'Ремонт бытовой техники в Краснодаре: Bosch, Siemens, Miele, Smeg, Gorenje и др. Диагностика, оригинальные запчасти, гарантия.',
  body: sections.join('\n')
}));

// Юридические страницы: src/legal/*.html = <!-- title: ...; description: ... --> + контент <main>
fs.mkdirSync('legal', { recursive: true });
const header = list('src/sections', '.html').filter(f => f.startsWith('01-')).map(f => read('src/sections/' + f)).join('\n');
const footer = list('src/sections', '.html').filter(f => f.startsWith('99-')).map(f => read('src/sections/' + f)).join('\n');
for (const f of list('src/legal', '.html')) {
  const src = read('src/legal/' + f);
  const m = src.match(/<!--\s*title:\s*(.*?)\s*;\s*description:\s*(.*?)\s*-->/s);
  if (!m) throw new Error(f + ': нужен комментарий <!-- title: ...; description: ... -->');
  fs.writeFileSync('legal/' + f, page({
    root: '../', title: `${m[1]} — ${cfg.name}`, description: m[2], canonicalPath: 'legal/' + f,
    body: `${header}\n${src}\n${footer}`, noindex: false
  }));
}
console.log('build ok');
