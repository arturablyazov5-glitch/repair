// SEO-посадочные (Евлампий, TASK-016): seo/pages.json -> remont/index.html, remont/<slug>/index.html,
// а также sitemap.xml и robots.txt (генерируются из списка страниц). Запуск: `node build-seo.mjs` (после или до build.mjs — не зависит).
// Можно и импортировать: `import buildSeo from './build-seo.mjs'; buildSeo();` (аргументы не обязательны).
// Шапка/подвал — те же src/sections/01-*.html и 99-*.html, <head> — src/head.html (те же плейсхолдеры, что в build.mjs).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const read = (p) => fs.readFileSync(p, 'utf8');
const list = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort() : [];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Текст для JSON-LD: без HTML-комментариев (TODO) и тегов
const plain = (s) => String(s).replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const ico = (n, cls = '') => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#lucide-${n}"/></svg>`;

export default function buildSeo(opts = {}) {
  const cfg = opts.cfg || JSON.parse(read('site.config.json'));
  const data = JSON.parse(read('seo/pages.json'));
  const origin = String(cfg.domain).replace(/^TODO:\s*/, '').replace(/\/+$/, ''); // TODO: боевой домен в site.config.json
  const today = new Date().toISOString().slice(0, 10);

  const fill = (html, root) => html.replaceAll('{{root}}', root).replace(/\{\{cfg\.([\w.]+)\}\}/g, (_, p) => {
    const v = p.split('.').reduce((o, k) => (o == null ? o : o[k]), cfg);
    if (v == null) throw new Error('Нет значения в site.config.json: ' + p);
    return String(v);
  });

  // Спрайт Lucide: все #lucide-* из src/, js/ и seo/ + из сгенерированных тел страниц
  const spriteFor = (extra) => {
    const files = [...['src/sections', 'src/partials', 'seo'].flatMap(d => [...list(d, '.html'), ...list(d, '.json')].map(f => `${d}/${f}`)),
      'js/main.js', 'js/config.js', ...list('js/sections', '.js').filter(f => /^(01|99)-/.test(f)).map(f => 'js/sections/' + f)];
    const names = new Set();
    for (const t of [...files.map(read), extra]) for (const m of t.matchAll(/lucide-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) names.add(m[1]);
    const dir = 'node_modules/lucide-static/icons/';
    const sym = [...names].sort().map(n => {
      if (!fs.existsSync(dir + n + '.svg')) return '';
      const inner = read(dir + n + '.svg').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
      return `<symbol id="lucide-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${sym}</svg>`;
  };

  const head = read('src/head.html');
  const header = list('src/sections', '.html').filter(f => f.startsWith('01-')).map(f => read('src/sections/' + f)).join('\n');
  const footer = list('src/sections', '.html').filter(f => f.startsWith('99-')).map(f => read('src/sections/' + f)).join('\n');
  const partials = list('src/partials', '.html').map(f => read('src/partials/' + f)).join('\n');
  const css = ['css/base.css', 'css/fonts.css', 'css/sections/01-header.css', 'css/sections/99-footer.css', 'css/cookie.css', 'seo/seo-page.css'].filter(f => fs.existsSync(f));
  const js = ['js/config.js', 'js/main.js', 'js/sections/01-header.js', 'js/sections/99-footer.js', 'js/cookie.js', 'js/analytics.js'].filter(f => fs.existsSync(f));

  const page = ({ root, title, description, canonicalPath, body }) => {
    const h = head.replaceAll('{{title}}', esc(title)).replaceAll('{{description}}', esc(description))
      .replaceAll('{{canonicalPath}}', canonicalPath).replaceAll('{{robots}}', 'index,follow');
    const full = `${header}\n${body}\n${footer}`;
    return fill(`<!doctype html>\n<html lang="ru">\n<head>\n${h}\n${css.map(f => `<link rel="stylesheet" href="${root}${f}">`).join('\n')}\n</head>\n<body class="seo-body">\n${spriteFor(full)}\n${full}\n${partials}\n${js.map(f => `<script src="${root}${f}" defer></script>`).join('\n')}\n</body>\n</html>\n`, root);
  };

  const cats = data.categories, brands = data.brands;
  const bySlug = Object.fromEntries([...cats, ...brands].map(p => [p.slug, p]));
  const url = (slug) => `${origin}/remont/${slug ? slug + '/' : ''}`;
  const wa = (text) => `https://wa.me/{{cfg.whatsapp}}?text=${encodeURIComponent(text)}`;
  const crumbsLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: u })) });
  const crumbsHtml = (items) => `<nav class="seo-crumbs" aria-label="Хлебные крошки"><ol>${items.map(([name, href], i) =>
    i === items.length - 1 ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${href}">${esc(name)}</a></li>`).join('')}</ol></nav>`;

  // Общие блоки
  const ctaButtons = (subject) => `<div class="seo-cta-row">
        <button class="btn btn--accent" type="button" data-modal-open="lead-modal">Вызвать мастера${ico('arrow-right')}</button>
        <a class="btn btn--ghost" href="tel:{{cfg.phoneHref}}">${ico('phone')}{{cfg.phone}}</a>
        <a class="btn btn--wa" href="${wa(`Здравствуйте! Нужен ремонт: ${subject}. Модель: `)}" target="_blank" rel="noopener">${ico('message-circle')}WhatsApp</a>
      </div>`;
  const facts = `<dl class="seo-facts">
        <div><dt>Сервис</dt><dd>ул. Березанская, 89<br>Краснодар, мкр. Центральный</dd></div>
        <div><dt>Часы</dt><dd>Пн–Пт 09:00–18:00<br>Сб 10:00–16:00, Вс выходной</dd></div>
        <div><dt>Отзывы</dt><dd><a href="{{cfg.yandex.reviewsUrl}}" target="_blank" rel="noopener">73 отзыва на Яндекс Картах ↗</a></dd></div>
        <div><dt>Ремонт</dt><dd><!-- TODO: цена по категории — уточнить у владельца -->от X ₽, смета до начала работ</dd></div>
      </dl>`;
  const steps = [
    ['Заявка', 'Звонок, WhatsApp или форма на сайте: опишите технику и поломку.'],
    ['Подтверждаем время', 'Время визита или приёма подтверждаем в WhatsApp.'],
    ['Приём или выезд', 'Фиксируем состояние техники на фото и в акте приёма.'],
    ['Диагностика и смета', 'Называем причину и стоимость до начала работ.'],
    ['Ремонт', 'Ставим оригинальные запчасти, согласованные заранее.'],
    ['Выдача', 'Акт, чек и гарантийный талон на руки.']
  ];
  const process = (n) => `<section class="section section--dark seo-sec" aria-labelledby="seo-process">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">${n} — Как работаем</p><h2 id="seo-process">Как проходит ремонт</h2>
        <p class="seo-muted">Подробно о каждом шаге, ценах и гарантиях — на главной.</p>
        <p class="seo-links-inline"><a href="{{root}}#process">Этапы ремонта</a><a href="{{root}}#prices">Цены</a><a href="{{root}}#guarantees">Гарантии</a></p></header>
      <ol class="seo-steps">${steps.map(([t, d], i) => `<li><span class="seo-steps__n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    </div>
  </section>`;
  const faqBlock = (n, items) => `<section class="section section--soft seo-sec" aria-labelledby="seo-faq">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">${n} — Вопросы</p><h2 id="seo-faq">Частые вопросы</h2>
        <p class="seo-muted">Не нашли ответ — <a href="{{root}}#faq">все вопросы</a> или напишите нам.</p></header>
      <div class="seo-faq">${items.map(([q, a]) => `<details class="seo-faq__item"><summary>${q}${ico('chevron-down', 'seo-faq__arr')}</summary><div class="seo-faq__a"><p>${a}</p></div></details>`).join('')}</div>
    </div>
  </section>`;
  const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) });
  const ctaFinal = (subject) => `<section class="section seo-final" aria-labelledby="seo-final">
    <div class="container">
      <h2 id="seo-final" class="seo-final__title">Расскажите, что сломалось</h2>
      <p class="lead">Цену диагностики назовём до визита. Пришлите модель и фото поломки в WhatsApp — так мастер подготовится заранее.</p>
      ${ctaButtons(subject)}
    </div>
  </section>`;
  const linkList = (slugs, cur) => `<ul class="seo-linklist">${slugs.filter(s => s !== cur && bySlug[s]).map(s => {
    const p = bySlug[s]; const isBrand = brands.includes(p);
    return `<li><a href="{{root}}remont/${s}/">${isBrand ? ico('arrow-up-right') : ico(p.icon)}<span>${isBrand ? 'Техника ' + p.name : p.name}</span></a></li>`;
  }).join('')}</ul>`;
  const serviceLd = (p, name) => ({ '@context': 'https://schema.org', '@type': 'Service', name, serviceType: name, url: url(p.slug),
    description: p.description, provider: { '@id': `${origin}/#business` }, areaServed: { '@type': 'City', name: 'Краснодар' } });
  const genericFaq = (p, isBrand) => [
    ['Сколько стоит ремонт?', `Работа по категории — от X ₽ <!-- TODO: цена — уточнить у владельца -->. Точную стоимость мастер называет после диагностики и согласует до начала работ. Цену диагностики назовём до визита.`],
    [isBrand ? `Можно привезти технику ${p.name} в сервис самому?` : `Можно привезти ${p.acc} в сервис самому?`,
      'Да, приём на ул. Березанской, 89 (мкр. Центральный): Пн–Пт 09:00–18:00, Сб 10:00–16:00. Рядом парковка, технику удобно выгрузить. Крупную и встроенную технику удобнее ремонтировать на месте — вызовите мастера.'],
    ['Какая гарантия на ремонт?', 'На выполненную работу и установленные запчасти выдаём гарантийный талон <!-- TODO: срок гарантии -->. Условия — на странице «Гарантия и порядок приёма».']
  ];
  const photo = `<figure class="seo-photo"><img src="{{root}}media/photos/photo-06.jpg" alt="Зона приёма в сервисе «Сервис-Люкс»: стойка приёмки и витрина с запчастями" loading="lazy" decoding="async" width="1280" height="720"><figcaption>Приём техники — ул. Березанская, 89</figcaption></figure>`;

  const pages = [];
  const write = (slug, html) => { const dir = 'remont/' + (slug ? slug + '/' : ''); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + 'index.html', html); pages.push(dir); };
  const root2 = '../../';

  // Категории
  for (const p of cats) {
    const crumbs = [['Главная', '{{root}}'], ['Ремонт техники', '{{root}}remont/'], [p.name, '']];
    const faq = [...p.faq, ...genericFaq(p, false)].slice(0, 5);
    const body = `<main class="seo" id="main">
  <section class="seo-hero" aria-labelledby="seo-h1">
    <div class="container">
      ${crumbsHtml(crumbs)}
      <p class="seo-index">Ремонт — Краснодар</p>
      <h1 id="seo-h1" class="seo-hero__title">${p.h1}</h1>
      <div class="seo-hero__grid"><p class="seo-hero__lead">${p.lead}</p>${ctaButtons(p.name.toLowerCase())}</div>
      ${facts}
    </div>
  </section>
  <section class="section section--soft seo-sec" aria-labelledby="seo-faults">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">01 — Поломки</p><h2 id="seo-faults">С чем обращаются чаще всего</h2><p class="seo-muted">${p.intro}</p></header>
      <ol class="seo-faults">${p.faults.map(([t, d], i) => `<li><span class="seo-faults__n">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol>
    </div>
  </section>
  <section class="section seo-sec" aria-labelledby="seo-tips">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">02 — До визита</p><h2 id="seo-tips">Что сделать до приезда мастера</h2></header>
      <div class="seo-tips"><ul class="seo-checks">${p.tips.map(t => `<li>${ico('check')}<span>${t}</span></li>`).join('')}</ul>${photo}</div>
    </div>
  </section>
  ${process('03')}
  ${p.brands.length ? `<section class="section seo-sec" aria-labelledby="seo-brands">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">04 — Бренды</p><h2 id="seo-brands">Работаем с техникой брендов</h2>
        <p class="seo-muted">Не нашли свой бренд — <a href="{{root}}#brands">полный список</a> на главной. <!-- TODO: подтвердить статус авторизации по брендам --></p></header>
      ${linkList(p.brands)}
    </div>
  </section>` : ''}
  ${faqBlock(p.brands.length ? '05' : '04', faq)}
  ${ctaFinal(p.name.toLowerCase())}
  <nav class="section seo-sec seo-more" aria-labelledby="seo-more">
    <div class="container"><h2 id="seo-more" class="seo-more__title">Другая техника</h2>${linkList(cats.map(c => c.slug), p.slug)}</div>
  </nav>
</main>
${ld(crumbsLd([['Главная', origin + '/'], ['Ремонт техники', url('')], [p.name, url(p.slug)]]))}
${ld(serviceLd(p, `Ремонт ${p.gen}`))}
${ld(faqLd(faq))}`;
    write(p.slug, page({ root: root2, title: p.title, description: p.description, canonicalPath: `remont/${p.slug}/`, body }));
  }

  // Бренды
  for (const p of brands) {
    const crumbs = [['Главная', '{{root}}'], ['Ремонт техники', '{{root}}remont/'], [p.name, '']];
    const faq = [...p.faq, ...genericFaq(p, true)].slice(0, 5);
    const body = `<main class="seo" id="main">
  <!-- ${p.todo} -->
  <section class="seo-hero" aria-labelledby="seo-h1">
    <div class="container">
      ${crumbsHtml(crumbs)}
      <p class="seo-index">Бренд — Краснодар</p>
      <h1 id="seo-h1" class="seo-hero__title">${p.h1}</h1>
      <div class="seo-hero__grid"><p class="seo-hero__lead">${p.lead}</p>${ctaButtons('техника ' + p.name)}</div>
      ${facts}
    </div>
  </section>
  <section class="section section--soft seo-sec" aria-labelledby="seo-types">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">01 — Техника</p><h2 id="seo-types">Какую технику ${p.name} ремонтируем</h2><p class="seo-muted">${p.intro}</p></header>
      <ol class="seo-faults seo-faults--links">${p.categories.map((s, i) => { const c = bySlug[s]; return `<li><span class="seo-faults__n">${String(i + 1).padStart(2, '0')}</span><div><h3><a href="{{root}}remont/${s}/">${c.name} ${p.name}</a></h3><p>${c.faults.slice(0, 3).map(f => f[0]).join(' · ')}</p></div></li>`; }).join('')}</ol>
    </div>
  </section>
  <section class="section seo-sec" aria-labelledby="seo-tips">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">02 — До визита</p><h2 id="seo-tips">Что подготовить</h2></header>
      <div class="seo-tips"><ul class="seo-checks">
        <li>${ico('check')}<span>Модель и серийный номер с заводской таблички — по ним подбираем оригинальные запчасти.</span></li>
        <li>${ico('check')}<span>Фото или видео поломки и кода ошибки — пришлите в WhatsApp, мастер подготовится заранее.</span></li>
        <li>${ico('check')}<span>Если техника на гарантии — чек и гарантийный талон.</span></li>
      </ul>${photo}</div>
    </div>
  </section>
  ${process('03')}
  ${faqBlock('04', faq)}
  ${ctaFinal('техника ' + p.name)}
  <nav class="section seo-sec seo-more" aria-labelledby="seo-more">
    <div class="container"><h2 id="seo-more" class="seo-more__title">Другие бренды</h2>${linkList(brands.map(b => b.slug), p.slug)}</div>
  </nav>
</main>
${ld(crumbsLd([['Главная', origin + '/'], ['Ремонт техники', url('')], [p.name, url(p.slug)]]))}
${ld({ ...serviceLd(p, `Ремонт техники ${p.name}`), brand: { '@type': 'Brand', name: p.name } })}
${ld(faqLd(faq))}`;
    write(p.slug, page({ root: root2, title: p.title, description: p.description, canonicalPath: `remont/${p.slug}/`, body }));
  }

  // Хаб /remont/
  const h = data.hub;
  const hubBody = `<main class="seo" id="main">
  <section class="seo-hero" aria-labelledby="seo-h1">
    <div class="container">
      ${crumbsHtml([['Главная', '{{root}}'], ['Ремонт техники', '']])}
      <p class="seo-index">Услуги — Краснодар</p>
      <h1 id="seo-h1" class="seo-hero__title">${h.h1}</h1>
      <div class="seo-hero__grid"><p class="seo-hero__lead">${h.lead}</p>${ctaButtons('бытовая техника')}</div>
      ${facts}
    </div>
  </section>
  <section class="section section--soft seo-sec" aria-labelledby="seo-cats">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">01 — Техника</p><h2 id="seo-cats">Что ремонтируем</h2></header>
      <ol class="seo-faults seo-faults--links">${cats.map((c, i) => `<li><span class="seo-faults__n">${String(i + 1).padStart(2, '0')}</span><div><h3><a href="{{root}}remont/${c.slug}/">${c.name}</a></h3><p>${c.faults.slice(0, 3).map(f => f[0]).join(' · ')}</p></div></li>`).join('')}</ol>
    </div>
  </section>
  <section class="section seo-sec" aria-labelledby="seo-brands">
    <div class="container seo-split">
      <header class="seo-split__head"><p class="seo-index">02 — Бренды</p><h2 id="seo-brands">Ремонт по брендам</h2><p class="seo-muted">Полный список брендов — <a href="{{root}}#brands">на главной</a>. <!-- TODO: подтвердить статус авторизации по брендам --></p></header>
      ${linkList(brands.map(b => b.slug))}
    </div>
  </section>
  ${process('03')}
  ${ctaFinal('бытовая техника')}
</main>
${ld(crumbsLd([['Главная', origin + '/'], ['Ремонт техники', url('')]]))}
${ld({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Ремонт бытовой техники в Краснодаре',
    itemListElement: [...cats, ...brands].map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.h1, url: url(p.slug) })) })}`;
  write('', page({ root: '../', title: h.title, description: h.description, canonicalPath: 'remont/', body: hubBody }));

  // Сниппет ссылок для подвала главной (вставляет владелец подвала; страницы иначе доступны только из sitemap)
  fs.writeFileSync('seo/footer-links.html', `<!-- Сгенерировано build-seo.mjs: колонка «Ремонт» для src/sections/99-footer.html (ссылки с {{root}}) -->
<nav class="footer__col" aria-label="Ремонт техники">
  <p class="footer__title">Ремонт</p>
  <ul class="footer__links">
${cats.map(c => `    <li><a href="{{root}}remont/${c.slug}/">${c.name}</a></li>`).join('\n')}
    <li><a href="{{root}}remont/">Все услуги и бренды</a></li>
  </ul>
</nav>
`);

  // sitemap.xml и robots.txt
  const legal = list('src/legal', '.html').map(f => 'legal/' + f);
  const locs = ['', ...pages, ...legal];
  fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<!-- Генерирует build-seo.mjs (не править руками). Домен — из site.config.json (domain); TODO: боевой домен -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map(l => `  <url><loc>${origin}/${l}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
  fs.writeFileSync('robots.txt', `# Генерирует build-seo.mjs (не править руками). TODO: боевой домен — site.config.json (domain)
User-agent: *
Disallow: /agent-context/
Disallow: /reports/
Disallow: /src/
Disallow: /seo/
Disallow: /server/
Disallow: /docs/
Disallow: /node_modules/
Disallow: /media/_archive/
Disallow: /*.md$
Disallow: /*.mjs$
Disallow: /package
Disallow: /site.config.json
Allow: /

# Яндекс: склеить UTM и рекламные метки, чтобы не плодить дубли
User-agent: Yandex
Disallow: /agent-context/
Disallow: /reports/
Disallow: /src/
Disallow: /seo/
Disallow: /server/
Disallow: /docs/
Disallow: /node_modules/
Disallow: /media/_archive/
Disallow: /*.md$
Disallow: /*.mjs$
Disallow: /package
Disallow: /site.config.json
Allow: /
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&fbclid&ysclid

Sitemap: ${origin}/sitemap.xml
`);
  console.log(`build-seo ok: ${pages.length} страниц, sitemap ${locs.length} URL`);
  return pages;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) buildSeo();
