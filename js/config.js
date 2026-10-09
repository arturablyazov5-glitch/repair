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
// slug бренда → полный URL логотипа (по ссылке, локально не храним) или null → вордмарк.
// Источники: trace-logos.ru (Samsung, LG), simple-icons через jsDelivr (Bosch, Siemens), Wikimedia Commons Special:FilePath (остальные). См. media/BRANDS-LOGOS.md
window.SITE.BRAND_LOGOS = {
  bosch: 'https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/bosch.svg',
  siemens: 'https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/siemens.svg',
  liebherr: 'https://commons.wikimedia.org/wiki/Special:FilePath/Liebherr_logo.svg',
  smeg: 'https://commons.wikimedia.org/wiki/Special:FilePath/Smeg_logo.svg',
  gorenje: 'https://commons.wikimedia.org/wiki/Special:FilePath/Gorenje_logo_2024.svg',
  aeg: 'https://commons.wikimedia.org/wiki/Special:FilePath/AEG_Logo_Red_CMYK.svg',
  haier: 'https://commons.wikimedia.org/wiki/Special:FilePath/Haier_Logo.svg',
  midea: 'https://commons.wikimedia.org/wiki/Special:FilePath/Midea.svg',
  electrolux: 'https://commons.wikimedia.org/wiki/Special:FilePath/Electrolux_2015.svg',
  whirlpool: 'https://commons.wikimedia.org/wiki/Special:FilePath/Whirlpool_Corporation_Logo_(as_of_2017).svg',
  // PLACEHOLDER_MORE
};
window.SITE.logoUrl = (slug) => {
  if (window.SITE.BRAND_LOGOS[slug]) return window.SITE.BRAND_LOGOS[slug];
  const f = window.SITE.LOGOS[slug];
  return f ? 'https://trace-logos.ru/assets/logos/svgs/' + encodeURIComponent(f).replace(/%28/g, '(').replace(/%29/g, ')') + '.svg' : null;
};
