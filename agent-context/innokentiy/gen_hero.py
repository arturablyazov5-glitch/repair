# hero-scene.svg 960×720
from lib import *

W, H = 960, 720
SK = ASOFT  # кожа — тёплый светлый из палитры
SW = 3


def hero():
    defs = (dots_pattern("hero-dots", 18, 2) +
            '<pattern id="hero-tile" width="36" height="36" patternUnits="userSpaceOnUse">'
            f'<path d="M36 0V36H0" fill="none" stroke="{BSOFT}" stroke-width="2"/></pattern>'
            '<clipPath id="hero-glass"><circle cx="702" cy="550" r="36"/></clipPath>')
    deco = (R(0, 0, W, H, 0, TINT) +
            R(36, 36, 216, 144, 0, "url(#hero-dots)") +
            C(380, 360, 262, BSOFT) +
            C(380, 360, 300, "none", f'stroke="{BSOFT}" stroke-width="2" stroke-dasharray="4 10"') +
            C(860, 70, 64, ASOFT) + C(96, 560, 22, ASOFT) +
            R(0, 620, W, 100, 0, SOFT) + f'<path d="M0 620H960" stroke="{LINE}" stroke-width="2"/>' +
            R(466, 620, 476, 8, 0, INK, 'opacity=".06"') + E(330, 624, 132, 10, INK, 'opacity=".09"'))

    # ---- кухня
    kitchen = G(
        # фартук
        R(470, 226, 312, 204, 0, WHITE) + R(470, 226, 312, 204, 0, "url(#hero-tile)", 'stroke="none"') +
        # верхние шкафы
        R(470, 110, 312, 116) + S("M574 110V226M678 110V226") +
        R(556, 196, 6, 20, 3, LINE) + R(586, 196, 6, 20, 3, LINE) + R(764, 196, 6, 20, 3, LINE) +
        '<g transform="translate(-44 0)">' +
        P("M738 352Q718 326 724 300Q744 316 746 352Z", BRAND) +
        P("M750 352Q760 318 786 306Q784 336 758 356Z", BRAND) +
        P("M744 352Q736 312 748 286Q760 312 752 352Z", BSOFT) +
        P("M728 352H772L766 430H734Z", ASOFT) +
        "</g>" +
        # столешница
        R(458, 430, 330, 20, 4, LINE) +
        # посудомоечная
        R(478, 450, 148, 162) + R(478, 450, 148, 30, 0, BSOFT) +
        C(498, 465, 6, ACC) + R(530, 459, 48, 12, 3, BRAND) + C(604, 465, 4.5, WHITE) +
        R(514, 498, 76, 10, 5, LINE) +
        # стиральная (встроенная)
        R(632, 450, 142, 162) + S("M632 478H774") +
        R(644, 458, 36, 12, 4, SOFT) + R(690, 458, 34, 12, 3, BRAND) + C(754, 464, 7, ACC) +
        C(702, 550, 50, SOFT) + C(702, 550, 36, BSOFT) +
        # цоколь
        R(466, 612, 316, 8, 0, LINE) +
        # колонна с духовым шкафом
        R(782, 110, 156, 510) +
        S("M782 290H938M782 528H938") +
        R(800, 260, 40, 8, 4, LINE) +
        R(796, 302, 128, 144, 8) + S("M796 330H924") +
        C(814, 316, 6, LINE) + C(906, 316, 6, LINE) + R(842, 309, 36, 13, 3, BRAND) +
        R(820, 340, 80, 8, 4, LINE) +
        R(810, 358, 100, 74, 8, INK) +
        R(796, 456, 128, 56, 6, SOFT) + R(836, 470, 48, 7, 3.5, LINE) +
        R(800, 542, 40, 8, 4, LINE), SW)
    kdet = NS(R(820, 368, 80, 54, 5, BRAND, 'opacity=".75"') + C(830, 378, 4, ACC) +
              S("M818 408H902", BSOFT, 2.5) + C(892, 316, 4, ACC))
    water = ('<g clip-path="url(#hero-glass)" stroke="none">'
             f'<path d="M662 556q10 -8 20 0t20 0t20 0t20 0V600H662Z" fill="{BRAND}" opacity=".28"/></g>' +
             G(C(702, 550, 36, "none"), SW) + S("M678 534a28 28 0 0 1 18 -12", WHITE, 5))

    # ---- мастер
    toolbox = G(R(222, 468, 120, 76, 12, ACC) + S("M222 494H342") +
                R(244, 486, 16, 14, 3, INK) + R(304, 486, 16, 14, 3, INK) +
                S("M262 468V458Q262 450 270 450H294Q302 450 302 458V468", INK, 7), SW)
    legs = G(P("M308 462H392L390 610H356L350 520L344 610H310Z", INK) +
             P("M312 604H346V622H298Q298 608 312 604Z", LINE) +
             P("M354 604H388Q404 606 404 622H354Z", LINE), SW)
    arm_l = tube("M310 324Q284 392 282 446", 26, BRAND, SW)
    torso = G(P("M302 334Q302 306 328 302H372Q398 306 398 334L394 472H306Z", BRAND) +
              R(340, 288, 20, 18, 0, SK) +
              P("M334 302L350 324L366 302Z", BSOFT) +
              S("M350 324V470", INK, 2.5) +
              R(368, 344, 20, 14, 3, ACC) +
              R(306, 452, 88, 14, 0, INK), SW)
    head = G(C(350, 262, 32, SK) + C(322, 268, 6.5, SK) +
             P("M318 258Q318 224 350 224Q380 224 382 254Z", BRAND) +
             P("M374 250H404Q410 250 408 258H372Z", BRAND) +
             P("M319 258Q316 274 324 284Q327 272 328 262Z", INK), SW)
    hand_l = G(C(282, 452, 11, SK), SW)
    tablet = G('<g transform="rotate(-8 372 402)">' + R(334, 356, 76, 96, 9, INK) + R(341, 364, 62, 80, 5, BSOFT) +
               R(348, 374, 30, 6, 3, BRAND, 'stroke="none"') +
               R(348, 388, 46, 6, 3, WHITE, 'stroke="none"') + R(348, 400, 38, 6, 3, WHITE, 'stroke="none"') +
               R(348, 420, 22, 14, 4, ACC, 'stroke="none"') + "</g>", SW)
    arm_r = tube("M394 326Q420 372 404 404", 26, BRAND, SW)
    hand_r = G(C(400, 408, 11, SK), SW)

    # ---- плавающая карточка
    cardf = (R(200, 140, 168, 66, 16, INK, 'opacity=".06" transform="translate(4 6)"') +
             G(R(200, 140, 168, 66, 16), SW) + badge(234, 173, 20) +
             NS(R(266, 160, 82, 8, 4, INK) + R(266, 178, 60, 8, 4, BSOFT)))
    chk = check_badge(626, 452, 18)
    spark = sparkle(144, 300, 11) + sparkle(452, 120, 8, BRAND) + sparkle(870, 200, 9) + sparkle(430, 560, 7, BRAND)

    body = (deco + kitchen + kdet + water + legs + arm_l + torso + head + toolbox + hand_l +
            tablet + arm_r + hand_r + cardf + chk + spark)
    print("hero-scene", svg("hero-scene.svg", W, H, "Мастер сервиса у встроенной техники",
                            "Плоская иллюстрация: мастер в фирменной куртке с планшетом и янтарным чемоданчиком "
                            "стоит у кухни со встроенной посудомоечной и стиральной машинами и духовым шкафом.",
                            body, defs))


if __name__ == "__main__":
    hero()
