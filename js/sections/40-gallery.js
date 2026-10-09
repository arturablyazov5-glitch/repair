// Галерея: лайтбокс (мышь, клавиатура, aria) и слайдер «До / После». Vanilla.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const icon = (n) => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#lucide-${n}"/></svg>`;

  // --- До / После ---
  $$('[data-compare]').forEach((fig) => {
    const view = fig.querySelector('.gal__ba-view'), rng = fig.querySelector('input[type=range]');
    if (!view || !rng) return;
    const set = () => { view.style.setProperty('--pos', rng.value + '%'); rng.setAttribute('aria-valuetext', `Показано ${rng.value}% «до»`); };
    rng.addEventListener('input', set); set();
  });

  // --- Лайтбокс ---
  const items = $$('[data-lightbox]');
  if (!items.length) return;
  const lb = document.createElement('div');
  lb.className = 'gal-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Просмотр фотографии'); lb.hidden = true;
  lb.innerHTML = `<button type="button" class="gal-lb__btn gal-lb__close" aria-label="Закрыть">${icon('x')}</button>
    <button type="button" class="gal-lb__btn gal-lb__prev" aria-label="Предыдущее фото">${icon('chevron-left')}</button>
    <button type="button" class="gal-lb__btn gal-lb__next" aria-label="Следующее фото">${icon('chevron-right')}</button>
    <div class="gal-lb__box"><div class="gal-lb__media"></div><p class="gal-lb__cap" aria-live="polite"></p><span class="gal-lb__count"></span></div>`;
  document.body.appendChild(lb);
  const media = lb.querySelector('.gal-lb__media'), cap = lb.querySelector('.gal-lb__cap'), count = lb.querySelector('.gal-lb__count');
  const btns = $$('button', lb);
  let cur = 0, opener = null;

  const show = (i) => {
    cur = (i + items.length) % items.length;
    const it = items[cur], img = it.querySelector('img'), ph = it.querySelector('.ph');
    media.textContent = '';
    if (img) { const c = new Image(); c.src = img.currentSrc || img.src; c.alt = img.alt || it.dataset.caption || ''; media.appendChild(c); }
    else if (ph) {
      const c = ph.cloneNode(true); c.removeAttribute('style'); c.style.setProperty('--ar', '4/3'); c.style.setProperty('--lb-ar', '1.333');
      if (it.classList.contains('gal__item--tall')) { c.style.setProperty('--ar', '3/4'); c.style.setProperty('--lb-ar', '0.75'); }
      if (it.classList.contains('gal__item--wide')) { c.style.setProperty('--ar', '16/9'); c.style.setProperty('--lb-ar', '1.778'); }
      c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Заглушка фото: ' + (ph.dataset.ph || ''));
      media.appendChild(c);
    }
    cap.textContent = it.dataset.caption || '';
    count.textContent = `${cur + 1} / ${items.length}`;
  };
  const open = (i, from) => { opener = from; show(i); lb.hidden = false; lb.classList.add('is-open'); document.body.classList.add('no-scroll'); lb.querySelector('.gal-lb__close').focus(); };
  const close = () => { lb.classList.remove('is-open'); lb.hidden = true; if (!document.querySelector('.modal.is-open')) document.body.classList.remove('no-scroll'); opener && opener.focus(); };

  items.forEach((it, i) => it.addEventListener('click', () => open(i, it)));
  lb.addEventListener('click', (e) => {
    if (e.target.closest('.gal-lb__close') || e.target === lb || e.target.classList.contains('gal-lb__box')) close();
    else if (e.target.closest('.gal-lb__prev')) show(cur - 1);
    else if (e.target.closest('.gal-lb__next')) show(cur + 1);
  });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'Tab') { // фокус-ловушка
      const i = btns.indexOf(document.activeElement);
      e.preventDefault(); btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
    }
  }, true);
  // свайп на тач-экранах
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });
})();
