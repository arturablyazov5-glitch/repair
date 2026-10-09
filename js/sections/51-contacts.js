// #contacts · владелец: Афанасий. Часы работы (статус «Открыто/Закрыто» по времени Краснодара) и фоллбэк карты.
(() => {
  // Расписание: день недели (0 = Вс) -> [открытие, закрытие] в минутах; null = выходной. Синхронно с site.config.json.hours
  const SCHEDULE = { 0: null, 1: [540, 1080], 2: [540, 1080], 3: [540, 1080], 4: [540, 1080], 5: [540, 1080], 6: [600, 960] };
  const DAY_ACC = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  const initHours = (box) => {
    const status = box.querySelector('[data-hours-status]');
    const update = () => {
      const now = new Date(Date.now() + 3 * 3600e3); // Краснодар: UTC+3, без перехода на летнее время
      const day = now.getUTCDay(), min = now.getUTCHours() * 60 + now.getUTCMinutes();
      box.querySelectorAll('[data-day]').forEach(li => {
        const today = +li.dataset.day === day;
        li.classList.toggle('is-today', today);
        if (today) li.setAttribute('aria-current', 'date'); else li.removeAttribute('aria-current');
      });
      // короткий список для мобилы: группа дней (data-days="1,2,3,4,5"), подсветка на уровне группы
      box.querySelectorAll('[data-days]').forEach(li => {
        const today = li.dataset.days.split(',').map(Number).includes(day);
        li.classList.toggle('is-today', today);
        if (today) li.setAttribute('aria-current', 'date'); else li.removeAttribute('aria-current');
      });
      if (!status) return;
      const t = SCHEDULE[day];
      let open = false, text;
      if (t && min >= t[0] && min < t[1]) { open = true; text = 'Открыто до ' + hhmm(t[1]); }
      else {
        let d = day, offset = 0;
        if (t && min < t[0]) text = 'Закрыто · откроемся в ' + hhmm(t[0]);
        else {
          do { d = (d + 1) % 7; offset++; } while (!SCHEDULE[d] && offset < 7);
          text = 'Закрыто · откроемся ' + (offset === 1 ? 'завтра' : DAY_ACC[d]) + ' в ' + hhmm(SCHEDULE[d][0]);
        }
      }
      status.textContent = text;
      status.classList.toggle('is-open', open);
      status.hidden = false;
    };
    update();
    setInterval(update, 60e3);
  };
  document.querySelectorAll('[data-hours]').forEach(initHours);

  // Карта: iframe Яндекса создаём только по клику «Показать карту» (до этого — статичная плитка, запросов к Яндексу нет)
  document.querySelectorAll('[data-map]').forEach(box => {
    const btn = box.querySelector('[data-map-show]');
    const fail = box.querySelector('.contacts__map-fail');
    if (!btn) return;
    const label = btn.innerHTML;
    btn.addEventListener('click', () => {
      box.querySelector('iframe')?.remove();
      box.classList.remove('is-failed');
      btn.disabled = true; btn.textContent = 'Загружаем карту…';
      const frame = document.createElement('iframe');
      frame.className = 'contacts__map-frame';
      frame.src = box.dataset.mapSrc;
      frame.title = box.dataset.mapTitle || 'Карта';
      frame.setAttribute('allowfullscreen', '');
      let done = false;
      const failNow = () => {
        if (done) return; done = true;
        frame.remove(); box.classList.add('is-failed');
        if (fail) fail.textContent = 'Карту не удалось загрузить (возможно, её блокирует браузер или расширение). Откройте адрес в Яндекс Картах по ссылке ниже.';
        btn.disabled = false; btn.innerHTML = label;
      };
      frame.addEventListener('load', () => { if (done) return; done = true; box.classList.add('is-loaded'); frame.focus({ preventScroll: true }); });
      frame.addEventListener('error', failNow);
      setTimeout(failNow, 12000);
      box.prepend(frame);
    });
  });
})();
