# QA прод-сборки (tools/qa.mjs)

## Визуальное сравнение dev ↔ dist

| Страница | Ширина | Размер dev / dist | Отличающихся пикселей | % |
|---|---|---|---|---|
| / | 320 | 320×33612 / 320×33612 | 7319 | 0.068 |
| / | 1366 | 1366×30039 / 1366×30039 | 311434 | 0.759 |
| /legal/privacy.html | 320 | 320×18993 / 320×19134 | — | — |
| /legal/privacy.html | 1366 | 1366×11149 / 1366×11298 | — | — |
| /remont/bosch/ | 320 | 320×8718 / 320×8718 | 64 | 0.002 |
| /remont/bosch/ | 1366 | 1366×5614 / 1366×5614 | 226 | 0.003 |

## Smoke dist/ (мобильный 390 и десктоп 1366)

- ✔ [390] Onest вариативный: веса из одного файла, 700 шире 400 (настоящий жирный, не синтетика) — {"faces":["400 700:loaded","400 700:loaded","400 700:loaded","400 700:loaded"],"h1w":"700","synth":"auto","w4":402.79962158203125,"w7":417.15960693359375}
- ✔ [390] cookie-баннер показан
- ✔ [390] cookie-баннер закрывается
- ✔ [390] модалка заявки открывается
- ✔ [390] валидация формы (пустая отправка → ошибки)
- ✔ [390] модалка закрывается по Esc
- ✔ [390] шаги «Процесс» переключаются
- ✔ [390] слайдер отзывов листается — 0→358
- ✔ [390] лайтбокс открывается — 480px photo-06-480.70a16a0843.avif
- ✔ [390] карта по клику создаёт iframe Яндекса
- ✔ [390] все <picture> загрузились (8) — photo-01-480.735364d3dc.avif@358px, photo-06-480.70a16a0843.avif@358px, photo-10-320.8d54fdfda8.avif@175px, photo-01-480.735364d3dc.avif@358px, photo-03-320.66694ad8bc.avif@175px, photo-05-320.47821c8897.avif@175px, photo-04-480.0e90b29cac.avif@358px, photo-06-480.70a16a0843.avif@358px
- ✔ [390] нет 404 у локальных ресурсов
- ✔ [390] консоль без ошибок (кроме заблокированных внешних) — [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED
- ✔ [1366] Onest вариативный: веса из одного файла, 700 шире 400 (настоящий жирный, не синтетика) — {"faces":["400 700:loaded","400 700:loaded","400 700:loaded","400 700:loaded"],"h1w":"700","synth":"auto","w4":402.79962158203125,"w7":417.15960693359375}
- ✔ [1366] cookie-баннер показан
- ✔ [1366] cookie-баннер закрывается
- ✔ [1366] модалка заявки открывается
- ✔ [1366] валидация формы (пустая отправка → ошибки)
- ✔ [1366] модалка закрывается по Esc
- ✔ [1366] шаги «Процесс» переключаются
- ✔ [1366] слайдер отзывов листается — 0→600
- ✔ [1366] лайтбокс открывается — 800px photo-06-800.6637dd3df6.avif
- ✔ [1366] карта по клику создаёт iframe Яндекса
- ✔ [1366] все <picture> загрузились (8) — photo-01-480.735364d3dc.avif@408px, photo-06-800.6637dd3df6.avif@636px, photo-10-320.8d54fdfda8.avif@314px, photo-01-800.6a5e03c5e6.avif@636px, photo-03-320.66694ad8bc.avif@314px, photo-05-320.47821c8897.avif@314px, photo-04-800.b297412cf9.avif@719px, photo-06-640.1400375bcf.avif@616px
- ✔ [1366] нет 404 у локальных ресурсов
- ✔ [1366] консоль без ошибок (кроме заблокированных внешних) — [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED | [внешн.] Failed to load resource: net::ERR_FAILED
- ✔ /legal/privacy.html: без ошибок и 404
- ✔ /remont/bosch/: без ошибок и 404

**Итог: есть замечания (см. ✘ / % выше 0.5)**
