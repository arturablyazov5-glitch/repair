// Цели Яндекс.Метрики (Спиридон, TASK-009). Список целей и настройка — docs/LEADS.md.
// Метрику здесь НЕ загружаем: это делает js/cookie.js и только после согласия на аналитику.
// Пока Метрики нет (нет согласия / пустой yandexMetrikaId / заблокировал AdBlock) — track() молча ничего не делает.
// API: window.track('goal_name', {param: 'value'}) — можно звать из любого скрипта, в любой момент.
//      <a data-goal="price_pdf">…</a> — произвольная цель по клику без JS.
(() => {
  if (window.track && window.track.__sl) return; // защита от двойного подключения
  const counterId = () => Number((window.SITE && window.SITE.yandexMetrikaId) || 0);
  const sentOnce = new Set();

  const track = (goal, params) => {
    try {
      const id = counterId();
      if (!goal || !id || typeof window.ym !== 'function') return false;
      window.ym(id, 'reachGoal', String(goal), params && typeof params === 'object' ? params : undefined);
      return true;
    } catch (e) { return false; } // аналитика никогда не должна ломать сайт
  };
  // цели «один раз за визит страницы» (глубина скролла, просмотр секций)
  const trackOnce = (goal, params) => { if (sentOnce.has(goal)) return; if (track(goal, params)) sentOnce.add(goal); };
  track.__sl = true;
  window.track = track;

  // --- клики (делегирование, capture — чтобы сработать раньше чужих обработчиков) ---
  const MAP_RE = /(yandex\.[a-z]+\/maps|maps\.yandex\.|2gis\.|google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl)/i;
  const REVIEWS_RE = /(\/reviews|\/tab\/reviews|otzyvy|#reviews$)/i;
  const sectionOf = (el) => { const c = el.closest('.modal[id], section[id], header, footer'); if (c) return c.id || c.tagName.toLowerCase(); const k = el.closest('[class]'); return k ? String(k.classList[0] || '').split('__')[0] : ''; }; // вне секций (моб. панель) — BEM-блок: mbar

  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null; if (!t) return;
    const custom = t.closest('[data-goal]'); if (custom) track(custom.dataset.goal, { section: sectionOf(custom) });
    if (t.closest('[data-modal-open="lead-modal"]')) track('lead_modal_open', { section: sectionOf(t) });
    const a = t.closest('a[href]'); if (!a) return;
    const href = a.getAttribute('href') || '';
    const p = { section: sectionOf(a) };
    if (/^tel:/i.test(href)) track('phone_click', p);
    else if (/^(https?:)?\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href) || /^whatsapp:/i.test(href)) track('whatsapp_click', p);
    else if (/^(https?:)?\/\/(t\.me|telegram\.me)\//i.test(href) || /^tg:/i.test(href)) track('telegram_click', p);
    else if (REVIEWS_RE.test(href) && (MAP_RE.test(href) || href.startsWith('#'))) track('reviews_click', p);
    else if (MAP_RE.test(href)) track('map_click', p);
  }, true);

  // --- успешная отправка формы: main.js диспатчит document 'lead:sent' {source, via} ---
  document.addEventListener('lead:sent', (e) => {
    const d = (e && e.detail) || {};
    track('lead_submit', { source: d.source || 'site', via: d.via || 'endpoint' });
  });

  // --- глубина скролла 25/50/75/100 ---
  const marks = [25, 50, 75, 100]; let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const de = document.documentElement;
      const max = Math.max(de.scrollHeight, document.body ? document.body.scrollHeight : 0);
      const pct = max ? ((window.scrollY + window.innerHeight) / max) * 100 : 0;
      marks.forEach((m) => { if (pct >= m - 0.5) trackOnce('scroll_' + m); });
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- просмотр секций по фиксированным якорям: цель view_<id> ---
  const ids = ['services', 'brands', 'process', 'prices', 'guarantees', 'reviews', 'gallery', 'faq', 'contacts'];
  if ('IntersectionObserver' in window) {
    // секция «просмотрена», когда её верх дошёл до середины экрана (работает и для секций выше экрана)
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) trackOnce('view_' + en.target.id); }), { rootMargin: '0px 0px -50% 0px', threshold: 0 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  // Метрика могла загрузиться уже после того, как пользователь прокрутил страницу (согласие дали позже) —
  // досчитываем текущую глубину скролла после выбора в cookie-баннере.
  document.addEventListener('cookieconsent', () => setTimeout(onScroll, 0));
})();
