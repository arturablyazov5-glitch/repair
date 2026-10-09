// 21 · Прозрачные цены: калькулятор-прикидка. Владелец: Ипполит
// TODO: заменить диапазоны-заглушки на реальные цены работ (min/max в рублях). Пока null => показываем «от X до Y ₽».
(() => {
  const form = document.querySelector('[data-prices-calc]');
  if (!form) return;

  // device: имя для заявки совпадает с <option> в модалке #lead-modal (поле device)
  const DATA = {
    washer:     { name: 'Стиральная машина', faults: [
      ['Не сливает воду', 'Чаще всего засор фильтра или патрубка, реже неисправен насос слива.', null, null],
      ['Не греет воду', 'Обычно ТЭН, датчик температуры или модуль управления.', null, null],
      ['Шумит, стучит на отжиме', 'Подшипники, амортизаторы или посторонний предмет в баке.', null, null],
      ['Течёт', 'Манжета люка, шланги, дозатор или бак.', null, null],
      ['Не включается, ошибка', 'Питание, замок люка или электроника. Код ошибки поможет мастеру.', null, null]] },
    dishwasher: { name: 'Посудомоечная машина', faults: [
      ['Не сливает воду', 'Засор фильтра или насос слива.', null, null],
      ['Не греет воду', 'Нагреватель, датчик температуры или циркуляционный насос.', null, null],
      ['Течёт, срабатывает «аквастоп»', 'Уплотнители, шланги, поддон или датчик протечки.', null, null],
      ['Не включается, ошибка', 'Питание, дверной замок или модуль управления.', null, null]] },
    fridge:     { name: 'Холодильник', faults: [
      ['Плохо морозит или не морозит', 'Датчик, термостат, вентилятор, утечка хладагента или компрессор.', null, null],
      ['Наледь, вода под ящиками', 'Система оттайки или засор дренажа.', null, null],
      ['Шумит', 'Вентилятор, крепления компрессора.', null, null],
      ['Не включается', 'Питание, реле, модуль управления.', null, null]] },
    oven:       { name: 'Духовой шкаф', faults: [
      ['Не греет', 'Нагревательный элемент, термостат или датчик.', null, null],
      ['Не работает вентилятор или подсветка', 'Мотор конвекции, лампа, проводка.', null, null],
      ['Ошибка, не включается', 'Модуль управления, датчики, питание.', null, null],
      ['Повреждена дверца или стекло', 'Замена стекла, петель или уплотнителя.', null, null]] },
    hob:        { name: 'Варочная панель / плита', faults: [
      ['Не греет конфорка или зона', 'Нагревательный элемент, индукционная катушка или плата.', null, null],
      ['Не реагирует на касания, ошибка', 'Сенсорный блок или модуль управления.', null, null],
      ['Выбивает автомат', 'Пробой нагревателя или проводки.', null, null]] },
    hood:       { name: 'Вытяжка', faults: [
      ['Не работает мотор', 'Двигатель, конденсатор, плата.', null, null],
      ['Не горит свет', 'Лампы, драйвер, проводка.', null, null],
      ['Не переключаются режимы', 'Кнопки, сенсор или модуль управления.', null, null]] },
    coffee:     { name: 'Кофемашина', faults: [
      ['Не подаёт воду или кофе', 'Накипь, помпа, заварочный блок.', null, null],
      ['Течёт', 'Уплотнители, трубки, заварочный блок.', null, null],
      ['Не мелет', 'Жернова, мотор кофемолки, посторонний предмет.', null, null],
      ['Ошибка, не включается', 'Датчики, нагреватель, плата.', null, null]] },
    dryer:      { name: 'Сушильная машина', faults: [
      ['Не греет, не сушит', 'Нагреватель или тепловой насос, датчики, засор фильтров.', null, null],
      ['Не вращается барабан', 'Ремень, мотор, ролики.', null, null],
      ['Ошибка', 'Датчики, модуль управления.', null, null]] },
    tv:         { name: 'Телевизор', faults: [
      ['Нет изображения, звук есть', 'Подсветка, матрица или плата.', null, null],
      ['Не включается', 'Блок питания или основная плата.', null, null],
      ['Полосы, пятна на экране', 'Матрица, шлейфы или T-con.', null, null]] },
    vacuum:     { name: 'Пылесос / робот-пылесос', faults: [
      ['Не заряжается, не включается', 'Аккумулятор, зарядная станция, плата.', null, null],
      ['Слабо тянет', 'Фильтры, засор, мотор.', null, null],
      ['Не крутятся щётки или колёса', 'Моторы приводов, редуктор.', null, null]] },
    small:      { name: 'Мелкая техника (блендер, мясорубка)', faults: [
      ['Не включается', 'Кнопка, проводка, мотор.', null, null],
      ['Мотор гудит, нож не крутится', 'Муфта, редуктор, шестерни.', null, null],
      ['Другое', 'Опишите поломку — подскажем.', null, null]] },
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
      sum.textContent = `от ${fmt(min) || 'X ₽'} до ${fmt(max) || 'Y ₽'}`;
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
