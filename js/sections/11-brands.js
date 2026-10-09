// «Бренды»: подстановка логотипов (trace-logos через window.SITE.logoUrl) и бегущая лента. Владелец: Лаврентий
(() => {
  const root = document.getElementById('brands');
  if (!root) return;

  // Лента: дублируем треки для бесшовной прокрутки (копии скрыты от скринридеров)
  const mq = root.querySelector('[data-marquee]');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (mq && !reduce) {
    mq.querySelectorAll('.brands__track').forEach((tr) => {
      const clone = tr.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach((i) => i.setAttribute('alt', ''));
      [...tr.children].forEach((li, idx) => { clone.children[idx].innerHTML = li.innerHTML; });
      [...clone.children].forEach((li) => { li.innerHTML = li.innerHTML; });
      [...clone.children].forEach((li) => li.querySelectorAll('img').forEach((i) => i.setAttribute('alt', '')));
      // копия внутри того же flex-контейнера (ширина трека = 2 копии, сдвиг на -50%)
      [...clone.children].forEach((li) => tr.appendChild(li));
    });
    mq.classList.add('is-run');
  }

  // Логотипы: пока logoUrl нет — остаётся вордмарк
  const logoUrl = window.SITE && window.SITE.logoUrl;
  if (typeof logoUrl !== 'function') return;
  root.querySelectorAll('img[data-brand]').forEach((img) => {
    const wrap = img.closest('.brands__logo');
    img.addEventListener('load', () => { img.hidden = false; wrap && wrap.classList.add('has-logo'); });
    img.addEventListener('error', () => { img.hidden = true; img.removeAttribute('src'); wrap && wrap.classList.remove('has-logo'); });
    try {
      const src = logoUrl(img.dataset.brand);
      if (src) img.src = src;
    } catch (e) { /* остаёмся на вордмарке */ }
  });
})();
