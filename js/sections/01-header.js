// 01 · Шапка: компактный режим при скролле, бургер-меню, статус «открыто/закрыто» по времени Краснодара,
// подсветка пункта меню, доп. поведение модалки заявки (предвыбор техники, фокус-ловушка, возврат фокуса).
(() => {
  const hdr = document.querySelector('[data-hdr]');
  if (!hdr) return;

  /* --- компактная шапка (с гистерезисом, без дрожания) --- */
  let scrolled = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (!scrolled && y > 60) { scrolled = true; hdr.classList.add('is-scrolled'); }
    else if (scrolled && y < 16) { scrolled = false; hdr.classList.remove('is-scrolled'); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- бургер-меню --- */
  const burger = hdr.querySelector('[data-hdr-burger]');
  const nav = hdr.querySelector('[data-hdr-nav]');
  const mq = window.matchMedia('(min-width: 1240px)');
  const setMenu = (open) => {
    if (!burger) return;
    if (open) hdr.style.setProperty('--hdr-now', hdr.querySelector('.hdr__main').getBoundingClientRect().bottom + 'px');
    hdr.classList.toggle('is-menu', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (!document.querySelector('.modal.is-open')) document.body.classList.toggle('no-scroll', open);
    if (nav && !mq.matches) nav.inert = !open;
  };
  if (nav && !mq.matches) nav.inert = true;
  burger?.addEventListener('click', () => setMenu(!hdr.classList.contains('is-menu')));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a, [data-modal-open]')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && hdr.classList.contains('is-menu')) { setMenu(false); burger.focus(); } });
  mq.addEventListener('change', () => { setMenu(false); if (nav) nav.inert = !mq.matches && !hdr.classList.contains('is-menu'); });

  /* --- статус работы по времени Краснодара (UTC+3, без перехода на летнее время) --- */
  // Часы из CONTRACT / site.config.json: Пн–Пт 9–18, Сб 10–16, Вс выходной. Индекс = getUTCDay() (0 = Вс).
  const HOURS = [null, [9, 18], [9, 18], [9, 18], [9, 18], [9, 18], [10, 16]];
  const DAYS_ACC = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  const hh = (h) => h + ':00';
  const status = () => {
    const now = new Date(Date.now() + 3 * 3600e3);
    const d = now.getUTCDay(), m = now.getUTCHours() * 60 + now.getUTCMinutes();
    const t = HOURS[d];
    if (t && m >= t[0] * 60 && m < t[1] * 60) return { open: true, text: `Открыто сейчас · до ${hh(t[1])}`, short: `Открыто до ${hh(t[1])}` };
    if (t && m < t[0] * 60) return { open: false, text: `Закрыто · откроемся сегодня в ${hh(t[0])}`, short: `Откроемся в ${hh(t[0])}` };
    for (let i = 1; i <= 7; i++) {
      const nd = (d + i) % 7, nt = HOURS[nd];
      if (!nt) continue;
      const when = i === 1 ? 'завтра' : DAYS_ACC[nd];
      return { open: false, text: `Закрыто · откроемся ${when} в ${hh(nt[0])}`, short: `Откроемся ${when} в ${hh(nt[0])}` };
    }
  };
  const paint = () => {
    const s = status();
    document.querySelectorAll('[data-open-status]').forEach(el => {
      el.classList.toggle('is-open', s.open); el.classList.toggle('is-closed', !s.open);
      const tx = el.querySelector('[data-open-status-text]'); if (tx) tx.textContent = s.text;
    });
    document.querySelectorAll('[data-open-status-short]').forEach(el => { el.textContent = s.short; });
  };
  paint();
  setInterval(paint, 60e3);

  /* --- подсветка активного пункта меню (только на главной) --- */
  const links = [...hdr.querySelectorAll('.hdr__menu a')];
  const targets = links.map(a => { const id = a.hash.slice(1); const el = id && a.pathname === location.pathname ? document.getElementById(id) : null; return el ? [a, el] : null; }).filter(Boolean);
  if (targets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      targets.find(([, el]) => el === e.target)?.[0].setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(([, el]) => io.observe(el));
  }

  /* --- модалка заявки: предвыбор техники, aria-hidden, фокус --- */
  const modal = document.getElementById('lead-modal');
  if (!modal) return;
  let opener = null;
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-modal-open="lead-modal"]');
    if (!o) return;
    opener = o;
    const sel = modal.querySelector('select[name="device"]');
    if (sel && o.dataset.device) sel.value = o.dataset.device;
    if (hdr.classList.contains('is-menu')) setMenu(false);
  });
  new MutationObserver(() => {
    const open = modal.classList.contains('is-open');
    modal.setAttribute('aria-hidden', String(!open));
    if (open) { document.body.classList.add('no-scroll'); }
    else if (opener) { opener.focus({ preventScroll: true }); opener = null; }
  }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not(.hp), select, textarea')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
