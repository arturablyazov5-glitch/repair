// 20 · Как проходит ремонт: табы шагов (WAI-ARIA tabs) + макет переписки WhatsApp. Владелец: Ипполит
(() => {
  const root = document.querySelector('[data-process]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const chat = root.querySelector('[data-process-chat]');
  const msgs = chat ? [...chat.querySelectorAll('.process__msg')] : [];
  const rail = root.querySelector('[role="tablist"]');
  const prev = root.querySelector('[data-process-prev]');
  const next = root.querySelector('[data-process-next]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;

  function select(i, { focus = false, animate = true } = {}) {
    i = Math.max(0, Math.min(tabs.length - 1, i));
    const forward = i > current;
    current = i;
    const step = i + 1;
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-done', k < i);
    });
    panels.forEach((p, k) => {
      p.hidden = k !== i;
      p.classList.remove('is-anim');
      if (k === i && animate && !reduce) { void p.offsetWidth; p.classList.add('is-anim'); }
    });
    root.style.setProperty('--step', step);
    // Переписка: показываем сообщения до текущего шага, новые — с анимацией
    let n = 0;
    msgs.forEach((m) => {
      const s = Number(m.dataset.step);
      m.classList.toggle('is-future', s > step);
      m.classList.remove('is-new');
      if (s === step && animate) { m.style.setProperty('--md', (n++ * 0.35) + 's'); if (forward || !reduce) { void m.offsetWidth; m.classList.add('is-new'); } }
    });
    if (chat) chat.scrollTop = chat.scrollHeight;
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === tabs.length - 1;
    // На узких экранах докручиваем рельс к активному шагу (без прокрутки страницы)
    const t = tabs[i];
    if (rail && rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({ left: t.offsetLeft - (rail.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (focus) t.focus({ preventScroll: true });
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  rail.addEventListener('keydown', (e) => {
    const k = e.key; let i = current;
    if (k === 'ArrowRight' || k === 'ArrowDown') i++;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') i--;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = tabs.length - 1;
    else return;
    e.preventDefault();
    if (i < 0) i = tabs.length - 1;
    if (i >= tabs.length) i = 0;
    select(i, { focus: true });
  });
  prev?.addEventListener('click', () => select(current - 1));
  next?.addEventListener('click', () => select(current + 1));

  select(0, { animate: false });
})();
