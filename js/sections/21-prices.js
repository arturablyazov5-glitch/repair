// 21 · Прозрачные цены: калькулятор-прикидка. Владелец: Ипполит
// DEMO: диапазоны работ (min/max, ₽, без запчастей) придуманы для макета по рынку Краснодара 2025–26 — менять ЗДЕСЬ (см. DEMO-DATA.md).
// Нижняя граница не ниже facts.priceFrom.* из site.config.json — держите их согласованными.
(() => {
  const form = document.querySelector('[data-prices-calc]');
  if (!form) return;

  // device: имя для заявки совпадает с <option> в модалке #lead-modal (поле device)
  const DATA = {
    washer:     { name: 'Стиральная машина', faults: [
      ['Не сливает воду', 'Чаще всего засор фильтра или патрубка, реже неисправен насос слива.', 1500, 4500],
      ['Не греет воду', 'Обычно ТЭН, датчик температуры или модуль управления.', 2000, 5500],
      ['Шумит, стучит на отжиме', 'Подшипники, амортизаторы или посторонний предмет в баке.', 3500, 9000],
      ['Течёт', 'Манжета люка, шланги, дозатор или бак.', 1800, 6500],
      ['Не включается, ошибка', 'Питание, замок люка или электроника. Код ошибки поможет мастеру.', 2000, 8500]] },
    dishwasher: { name: 'Посудомоечная машина', faults: [
      ['Не сливает воду', 'Засор фильтра или насос слива.', 1500, 5000],
      ['Не греет воду', 'Нагреватель, датчик температуры или циркуляционный насос.', 2000, 6500],
      ['Течёт, срабатывает «аквастоп»', 'Уплотнители, шланги, поддон или датчик протечки.', 2000, 6000],
      ['Не включается, ошибка', 'Питание, дверной замок или модуль управления.', 2000, 8500]] },
    fridge:     { name: 'Холодильник', faults: [
      ['Плохо морозит или не морозит', 'Датчик, термостат, вентилятор, утечка хладагента или компрессор.', 2500, 12000],
      ['Наледь, вода под ящиками', 'Система оттайки или засор дренажа.', 2000, 5500],
      ['Шумит', 'Вентилятор, крепления компрессора.', 1800, 4500],
      ['Не включается', 'Питание, реле, модуль управления.', 1800, 7500]] },
    oven:       { name: 'Духовой шкаф', faults: [
      ['Не греет', 'Нагревательный элемент, термостат или датчик.', 1800, 5500],
      ['Не работает вентилятор или подсветка', 'Мотор конвекции, лампа, проводка.', 1500, 4000],
      ['Ошибка, не включается', 'Модуль управления, датчики, питание.', 2000, 8000],
      ['Повреждена дверца или стекло', 'Замена стекла, петель или уплотнителя.', 1500, 5000]] },
    hob:        { name: 'Варочная панель / плита', faults: [
      ['Не греет конфорка или зона', 'Нагревательный элемент, индукционная катушка или плата.', 1800, 6500],
      ['Не реагирует на касания, ошибка', 'Сенсорный блок или модуль управления.', 2500, 9000],
      ['Выбивает автомат', 'Пробой нагревателя или проводки.', 1800, 5000]] },
    hood:       { name: 'Вытяжка', faults: [
      ['Не работает мотор', 'Двигатель, конденсатор, плата.', 1500, 4500],
      ['Не горит свет', 'Лампы, драйвер, проводка.', 1200, 3000],
      ['Не переключаются режимы', 'Кнопки, сенсор или модуль управления.', 1500, 4500]] },
    coffee:     { name: 'Кофемашина', faults: [
      ['Не подаёт воду или кофе', 'Накипь, помпа, заварочный блок.', 2000, 6000],
      ['Течёт', 'Уплотнители, трубки, заварочный блок.', 1800, 5000],
      ['Не мелет', 'Жернова, мотор кофемолки, посторонний предмет.', 2000, 5500],
      ['Ошибка, не включается', 'Датчики, нагреватель, плата.', 2000, 7000]] },
    dryer:      { name: 'Сушильная машина', faults: [
      ['Не греет, не сушит', 'Нагреватель или тепловой насос, датчики, засор фильтров.', 2500, 9000],
      ['Не вращается барабан', 'Ремень, мотор, ролики.', 1800, 5000],
      ['Ошибка', 'Датчики, модуль управления.', 2000, 7000]] },
    tv:         { name: 'Телевизор', faults: [
      ['Нет изображения, звук есть', 'Подсветка, матрица или плата.', 2500, 9000],
      ['Не включается', 'Блок питания или основная плата.', 1800, 6500],
      ['Полосы, пятна на экране', 'Матрица, шлейфы или T-con.', 3000, 12000]] },
    vacuum:     { name: 'Пылесос / робот-пылесос', faults: [
      ['Не заряжается, не включается', 'Аккумулятор, зарядная станция, плата.', 1500, 5000],
      ['Слабо тянет', 'Фильтры, засор, мотор.', 1200, 3500],
      ['Не крутятся щётки или колёса', 'Моторы приводов, редуктор.', 1500, 4500]] },
    small:      { name: 'Мелкая техника (блендер, мясорубка)', faults: [
      ['Не включается', 'Кнопка, проводка, мотор.', 800, 2500],
      ['Мотор гудит, нож не крутится', 'Муфта, редуктор, шестерни.', 1000, 3000],
      ['Другое', 'Опишите поломку — подскажем.', 800, 3000]] },
  };

  const devices = form.querySelector('[data-calc-devices]');
  const faultsWrap = form.querySelector('[data-calc-faults-wrap]');
  const faults = form.querySelector('[data-calc-faults]');
  const sum = form.querySelector('[data-calc-sum]');
  const cause = form.querySelector('[data-calc-cause]');
  const result = form.querySelector('[data-calc-result]');
  const wa = form.querySelector('[data-calc-wa]');
  const lead = form.querySelector('[data-calc-lead]');
  const SITE = window.SITE || {};
  const fmt = (n) => n == null ? null : n.toLocaleString('ru-RU') + ' ₽';
  let dev = null, fault = null;

  function waHref() {
    let text = (SITE.whatsappText || 'Здравствуйте!');
    if (dev) text += `\n\nТехника: ${DATA[dev].name}`;
    if (fault) text += `\nПроблема: ${fault[0]}`;
    return `https://wa.me/${SITE.whatsapp || ''}?text=${encodeURIComponent(text)}`;
  }

  function render() {
    if (!dev) return;
    if (!fault) {
      sum.textContent = '—';
      cause.textContent = 'Выберите, что происходит с техникой.';
    } else {
      const [, why, min, max] = fault;
      sum.textContent = (min != null && max != null) ? `${min.toLocaleString('ru-RU')} – ${fmt(max)}` : 'по смете';
      cause.textContent = 'Частые причины: ' + why.charAt(0).toLowerCase() + why.slice(1);
      result.classList.remove('is-pulse'); void result.offsetWidth; result.classList.add('is-pulse');
    }
    wa.href = waHref();
  }

  devices.addEventListener('change', (e) => {
    dev = e.target.value; fault = null;
    faults.textContent = '';
    DATA[dev].faults.forEach((f, i) => {
      const l = document.createElement('label'); l.className = 'prices__chip';
      const inp = document.createElement('input'); inp.type = 'radio'; inp.name = 'calc-fault'; inp.value = String(i);
      const s = document.createElement('span'); s.textContent = f[0];
      l.append(inp, s); faults.append(l);
    });
    faultsWrap.disabled = false;
    render();
  });
  faults.addEventListener('change', (e) => { fault = DATA[dev].faults[Number(e.target.value)]; render(); });
  form.addEventListener('submit', (e) => e.preventDefault());

  // Перед открытием модалки (обработчик main.js на document) подставляем выбор в форму заявки
  lead.addEventListener('click', () => {
    const m = document.getElementById('lead-modal'); if (!m) return;
    const d = m.querySelector('[name="device"]'), p = m.querySelector('[name="problem"]');
    if (d && dev) { const opt = [...(d.options || [])].find(o => (o.value || o.text) === DATA[dev].name); if (opt || d.tagName !== 'SELECT') d.value = DATA[dev].name; }
    if (p && fault && !p.value) p.value = fault[0];
  });
  wa.href = waHref();
})();
