// Мобильные «свёртки» (Савелий, TASK-019). Только ≤ 767px — на планшете и десктопе кнопки скрыты CSS-ом, всё раскрыто.
// Разметка: <button data-mfold-btn aria-controls="ID" aria-expanded="false" data-open-text="…">…</button>
//   ID = контейнер .mfold (скрывает вложенные .mfold__more) или сам скрываемый блок .mfold-self.
// Без JS ничего не скрыто (правила в css/mobile.css действуют под .js).
(() => {
  document.querySelectorAll('[data-mfold-btn]').forEach(btn => {
    const box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    const closedText = btn.innerHTML, openText = btn.dataset.openText || 'Свернуть';
    btn.addEventListener('click', () => {
      const open = !box.classList.contains('is-mopen');
      box.classList.toggle('is-mopen', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = open ? openText : closedText;
      if (open) [box, ...box.querySelectorAll('.reveal')].forEach(el => el.classList.contains('reveal') && el.classList.add('is-in'));
    });
  });

  // FAQ: на мобиле все вопросы закрыты при загрузке (на десктопе первый остаётся открытым, как в разметке)
  if (matchMedia('(max-width: 767px)').matches) {
    document.querySelectorAll('.faq__item[open]').forEach(d => d.removeAttribute('open'));
  }
})();
