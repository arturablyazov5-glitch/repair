// Cookie-согласие (Феофан, TASK-007).
// Выбор хранится в localStorage (ключ sl-cookie-consent). Аналитика (Яндекс.Метрика) грузится ТОЛЬКО
// после согласия и только если задан window.SITE.yandexMetrikaId (пусто = не грузить).
// Открыть настройки повторно: любая кнопка/ссылка с атрибутом [data-cookie-settings] или window.CookieConsent.open().
// Событие: document 'cookieconsent' (detail = {necessary, analytics, ts, v}).
(() => {
  const KEY = 'sl-cookie-consent';
  const VERSION = 1; // увеличить при изменении состава cookie — баннер покажется заново
  const box = document.getElementById('cookie-banner');
  if (!box) return;
  const prefs = box.querySelector('#cookie-prefs');
  const analyticsBox = prefs.elements.analytics;
  const btnCustomize = box.querySelector('[data-cookie-customize]');
  const btnSave = box.querySelector('[data-cookie-save]');
  let lastFocus = null;

  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  };
  const write = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* приватный режим — выбор живёт до перезагрузки */ } };

  let metrikaLoaded = false;
  function loadMetrika() {
    const id = Number((window.SITE && window.SITE.yandexMetrikaId) || 0);
    if (!id || metrikaLoaded) return;
    metrikaLoaded = true;
    // Стандартный загрузчик тега Метрики (асинхронно). Вебвизор по умолчанию выключен — включать только после оценки рисков (см. LEGAL.md).
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(s);
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }

  function apply(c) {
    document.documentElement.dataset.cookieAnalytics = c && c.analytics ? 'on' : 'off';
    if (c && c.analytics) loadMetrika();
    // Отзыв согласия на аналитику: уже загруженный скрипт выгрузить нельзя — перезагрузка страницы
    // (после сохранения выбора) остановит сбор. Cookie Метрики (_ym*) удаляем, насколько это возможно со своего домена.
    if (c && !c.analytics) {
      document.cookie.split(';').map((p) => p.split('=')[0].trim()).filter((n) => /^_ym/.test(n)).forEach((n) => {
        document.cookie = `${n}=; Max-Age=0; path=/`;
        document.cookie = `${n}=; Max-Age=0; path=/; domain=.${location.hostname}`;
      });
    }
    document.dispatchEvent(new CustomEvent('cookieconsent', { detail: c }));
  }

  function setPrefsOpen(open) {
    prefs.hidden = !open;
    btnSave.hidden = !open;
    btnCustomize.hidden = open;
    btnCustomize.setAttribute('aria-expanded', String(open));
  }

  function show(withPrefs, moveFocus = true) {
    const c = read();
    analyticsBox.checked = !!(c && c.analytics); // по умолчанию НЕ отмечено
    setPrefsOpen(!!withPrefs);
    box.hidden = false;
    // При автопоказе фокус не отнимаем (баннер немодальный и стоит первым по Tab после контента);
    // при открытии из футера — переводим фокус в настройки и вернём его на кнопку после закрытия.
    if (moveFocus) { lastFocus = document.activeElement; (withPrefs ? analyticsBox : box).focus({ preventScroll: true }); }
  }

  function hide() {
    box.hidden = true;
    if (lastFocus && document.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }

  function save(analytics) {
    const prev = read();
    const c = { v: VERSION, necessary: true, analytics: !!analytics, ts: new Date().toISOString() };
    write(c);
    hide();
    const revoked = prev && prev.analytics && !c.analytics && metrikaLoaded;
    apply(c);
    if (revoked) location.reload(); // полностью остановить уже запущенную аналитику
  }

  box.querySelector('[data-cookie-accept]').addEventListener('click', () => save(true));
  box.querySelector('[data-cookie-necessary]').addEventListener('click', () => save(false));
  btnSave.addEventListener('click', () => save(analyticsBox.checked));
  btnCustomize.addEventListener('click', () => { setPrefsOpen(true); analyticsBox.focus(); });
  box.querySelector('[data-cookie-close]').addEventListener('click', hide);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); hide(); } });
  prefs.addEventListener('submit', (e) => { e.preventDefault(); save(analyticsBox.checked); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cookie-settings]');
    if (!t) return;
    e.preventDefault();
    show(true);
  });

  window.CookieConsent = { get: read, open: () => show(true) };

  const saved = read();
  if (saved) apply(saved);
  else show(false, false);
})();
