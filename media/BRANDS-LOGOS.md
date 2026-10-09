# Логотипы брендов (подключены по ссылке, в репозиторий не скачиваются)

Подстановка: `window.SITE.logoUrl(slug)` в `js/config.js` (`BRAND_LOGOS` + каталог trace-logos), код загрузки и fallback на вордмарк: `js/sections/11-brands.js`.
Права: товарные знаки принадлежат правообладателям; логотипы используются только для указания обслуживаемых брендов, не означают партнёрства или авторизации (статус — TODO, подтвердить).

| Бренд | Источник | URL | Заметка |
|---|---|---|---|
| Samsung, LG | trace-logos.ru | `https://trace-logos.ru/assets/logos/svgs/<имя>.svg` (см. `LOGOS`) | оттенок серый через CSS grayscale |
| Bosch, Siemens | simple-icons (jsDelivr, v13.21.0) | `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/{bosch,siemens}.svg` | одноцветные SVG, лицензия CC0 на иконки; знаки — правообладателей |
| Liebherr | Wikimedia Commons | `https://commons.wikimedia.org/wiki/Special:FilePath/Liebherr_logo.svg` | редирект на upload.wikimedia.org |
| Smeg | Wikimedia Commons | `.../Special:FilePath/Smeg_logo.svg` | |
| Gorenje | Wikimedia Commons | `.../Special:FilePath/Gorenje_logo_2024.svg` | |
| AEG | Wikimedia Commons | `.../Special:FilePath/AEG_Logo_Red_CMYK.svg` | красный, выводится серым |
| Haier | Wikimedia Commons | `.../Special:FilePath/Haier_Logo.svg` | |
| Midea | Wikimedia Commons | `.../Special:FilePath/Midea.svg` | |
| Electrolux | Wikimedia Commons | `.../Special:FilePath/Electrolux_2015.svg` | |
| Whirlpool | Wikimedia Commons | `.../Special:FilePath/Whirlpool_Corporation_Logo_(as_of_2017).svg` | |
| Miele, V-Zug, Indesit, Asko, Candy, Hotpoint-Ariston, Hansa, Beko | не найдено | — | вордмарк. На Commons Miele только JPG; V-Zug/Indesit/Asko найдены по имени, но не проверены из-за лимита 429 (Special:FilePath: `V-Zug_logo.svg`, `Indesit_Company_logo.svg`, `ASKO_logo.png`) |

Заметка: Wikimedia ограничивает частые запросы (429); на проде логотипы грузятся браузером посетителя и кэшируются. При проблемах — скачать в `media/` (решение заказчика/прораба).
