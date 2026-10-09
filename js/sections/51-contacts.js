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

  // Карта: если iframe не загрузился (блокировщик, сеть) — прячем его и показываем фоллбэк под ним
  document.querySelectorAll('[data-map]').forEach(box => {
    const frame = box.querySelector('iframe');
    if (!frame) return;
    let loaded = false;
    frame.addEventListener('load', () => { loaded = true; box.classList.remove('is-failed'); });
    frame.addEventListener('error', () => box.classList.add('is-failed'));
    // loading=lazy: таймер запускаем, только когда карта рядом с экраном
    const arm = () => setTimeout(() => { if (!loaded) box.classList.add('is-failed'); }, 12000);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); arm(); } }, { rootMargin: '200px' });
      io.observe(box);
    } else arm();
  });
})();
