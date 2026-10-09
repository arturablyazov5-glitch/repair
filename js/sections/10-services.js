// «Что чиним»: фильтр-табы и мини-подбор. Владелец: Лаврентий
(() => {
  const root = document.getElementById('services');
  if (!root) return;

  // ---- Табы ----
  const tabs = [...root.querySelectorAll('.services__tab')];
  const items = [...root.querySelectorAll('.services__row')];
  const panel = root.querySelector('#svc-panel');
  const count = root.querySelector('#svc-count');
  const plural = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'категория' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'категории' : 'категорий');
  const apply = (key, announce) => {
    let n = 0;
    items.forEach((it) => {
      const show = key === 'all' || it.dataset.groups.split(' ').includes(key);
      it.hidden = !show;
            if (show) n++;
    });
    panel.setAttribute('aria-labelledby', 'svc-tab-' + key);
    count.textContent = announce ? `Показано: ${n} ${plural(n)}` : '';
  };
  const select = (tab, focus) => {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    apply(tab.dataset.filter, true);
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t, false));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      select(tabs[(k + tabs.length) % tabs.length], true);
    });
  });

  // ---- Аккордеон строк ----
  root.querySelectorAll('.services__trigger').forEach((b) => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    root.querySelectorAll('.services__trigger').forEach((x) => {
      const on = x === b && open;
      x.setAttribute('aria-expanded', on);
      document.getElementById(x.getAttribute('aria-controls')).classList.toggle('is-open', on);
    });
  }));

  // ---- Подбор ----
  const D = {
    heat: ['Не греет воду', 'Вышел из строя нагревательный элемент (ТЭН)|Неисправен датчик температуры или термостат|Проблема с модулем управления|Накипь на нагревателе'],
    leak: ['Течёт', 'Износилась уплотнительная манжета или резинка|Негерметичные шланги и патрубки|Засор в сливе или фильтре|Трещина в баке или поддоне'],
    off: ['Не включается', 'Неисправна кнопка или сетевой фильтр|Перегорел предохранитель или повреждён шнур|Неисправность модуля управления|Сработала блокировка двери или защита'],
    noise: ['Шумит', 'Износ подшипников|Посторонний предмет в корпусе или фильтре|Ослабли крепления, дисбаланс|Износился мотор, насос или вентилятор'],
    err: ['Ошибка на дисплее', 'Код ошибки указывает на узел: датчик, насос, нагрев|Сбой электроники или обрыв проводки|Загрязнён фильтр или датчик|Нужна диагностика по коду для вашей модели'],
    cold: ['Не охлаждает', 'Проблема с компрессором или пусковым реле|Утечка хладагента|Неисправен датчик температуры или вентилятор испарителя|Нарушена герметичность двери']
  };
  const pick = root.querySelector('#svc-pick');
  if (!pick) return;
  const res = pick.querySelector('#svc-result');
  const btn = pick.querySelector('#svc-pick-btn');
  const wa = pick.dataset.wa;
  const syms = [...pick.querySelectorAll('.services__sym')];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  syms.forEach((s) => s.addEventListener('click', () => {
    const on = s.getAttribute('aria-pressed') === 'true';
    syms.forEach((x) => x.setAttribute('aria-pressed', 'false'));
    if (on) {
      res.innerHTML = '<p class="services__hint">Пока ничего не выбрано.</p>';
      btn.hidden = true;
      return;
    }
    s.setAttribute('aria-pressed', 'true');
    const [title, causes] = D[s.dataset.sym];
    res.innerHTML = `<h4>Что чаще всего с этим связано: ${esc(title.toLowerCase())}</h4><ul class="services__causes">${causes.split('|').map((c) => `<li>${esc(c)}</li>`).join('')}</ul><p class="services__disc">Это возможные причины, а не диагноз. Точную причину и стоимость назовёт мастер после осмотра.</p>`;
    const text = `Здравствуйте! Хочу вызвать мастера. Симптом: ${title.toLowerCase()}. Техника и модель: `;
    btn.href = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    btn.hidden = false;
  }));
})();
