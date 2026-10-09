# Рантайм (before): Playwright, мобильный 412×823, Slow 4G (150 ms, 1.6 Mbps), CPU 4x

| Страница | FCP | LCP (элемент) | CLS | Long tasks: шт / сумма / макс | Σ(dur−50) | INP-прокси | Ошибки консоли | Внешние ok/failed |
|---|---|---|---|---|---|---|---|---|
| / | 2228 ms | 3692 ms (`.hero__photo > img`) | 0.0023 | 6 / 845 / 405 ms | 545 ms | 112 ms | 0 | 27/4 |
| /legal/privacy.html | 1860 ms | 1860 ms (`.legal__head > h1`) | 0.0001 | 1 / 218 / 218 ms | 168 ms | 88 ms | 0 | 2/0 |

## /

Long tasks: 405 ms @1801, 129 ms @2226, 100 ms @3076, 60 ms @7279, 79 ms @18644, 72 ms @18857
Сдвиги (>0.0005): 0.0023 @7943 [.brands__track > li.brands__tick; .brands__track > li.brands__tick]
Слушатели scroll/resize/touch/wheel: window.scroll passive=true @:9 · window.scroll passive=true @:51 · window.resize passive=false @:21
Бесконечные анимации: .brands__track brands-run [transform] running
Взаимодействия: pointerdown 112 ms → .mbar > button.mbar__cta · pointerup 112 ms → .mbar > button.mbar__cta · click 112 ms → .mbar > button.mbar__cta · keydown 72 ms → .field > input#lm-name.input · keyup 56 ms → .mbar > button.mbar__cta · pointerdown 32 ms → .cookie__actions > button.btn.btn--sm · pointerup 32 ms → .cookie__actions > button.btn.btn--sm · click 32 ms → .cookie__actions > button.btn.btn--sm

## /legal/privacy.html

Long tasks: 218 ms @1601
Сдвиги (>0.0005): нет
Слушатели scroll/resize/touch/wheel: window.scroll passive=true @:9 · window.scroll passive=true @:51
Бесконечные анимации: нет
Взаимодействия: pointerdown 88 ms → .mbar > button.mbar__cta · pointerup 88 ms → .mbar > button.mbar__cta · click 88 ms → .mbar > button.mbar__cta · keydown 48 ms → .field > input#lm-name.input · keyup 40 ms → .mbar > button.mbar__cta · pointerdown 24 ms → .cookie__actions > button.btn.btn--sm · pointerup 24 ms → .cookie__actions > button.btn.btn--sm · click 24 ms → .cookie__actions > button.btn.btn--sm
