// Конфигурация клиента. Владелец: прораб.
window.SITE = {
  phone: '+79288847790',
  whatsapp: '79180606918',
  whatsappText: 'Обращение с сайта\nЗдравствуйте! Меня заинтересовало ваше предложение',
  // TODO: боевой endpoint приёма заявок (Telegram-бот / CRM / форма-бэкенд). Пока пусто => заявка уходит в WhatsApp.
  leadEndpoint: '',
  yandexMetrikaId: '', // TODO
};

// Логотипы — по ссылке с trace-logos.ru (локально не храним). Каталог: https://trace-logos.ru/logos.json
// В каталоге есть только перечисленные slug'и; остальные бренды (Bosch, Siemens, Miele…) там отсутствуют → у них вордмарк-fallback.
window.SITE.LOGOS = {
  samsung: 'samsung', lg: 'lg(2023)', xiaomi: 'xiaomi',                     // бренды техники
  whatsapp: 'whatsapp', telegram: 'telegram', max: 'max',                    // мессенджеры
  'yandex-maps': 'yandex-maps', '2gis': '2gis',                              // карты/отзывы
  sbp: 'sbp', mir: 'mir', visa: 'visa', mastercard: 'mastercard',            // оплата
};
// slug бренда → URL логотипа или null (тогда показываем текстовый вордмарк)
window.SITE.logoUrl = (slug) => {
  const f = window.SITE.LOGOS[slug];
  return f ? 'https://trace-logos.ru/assets/logos/svgs/' + encodeURIComponent(f).replace(/%28/g, '(').replace(/%29/g, ')') + '.svg' : null;
};
