# 6 иллюстраций шагов процесса 320×240
from lib import *

W, H = 320, 240
SW = 2.5


def bg(pid, shadow_rx=64, cx=160):
    return "".join([R(0, 0, W, H, 0, TINT),
                    R(16, 16, 96, 64, 0, f"url(#{pid}-dots)"),
                    C(160, 116, 88, BSOFT),
                    C(282, 40, 16, ASOFT),
                    C(40, 200, 8, ASOFT),
                    E(cx, 204, shadow_rx, 6, INK, 'opacity=".08"')])


def step(name, title, desc, body, shadow=64, cx=160, extra_defs=""):
    defs = dots_pattern(f"{name}-dots", 12, 1.3) + extra_defs
    print(name, svg(name + ".svg", W, H, title, desc, bg(name, shadow, cx) + body, defs))


def mini_washer(x, y):
    """стиральная 92×112, левый верхний угол x,y"""
    return G(R(x, y, 92, 112, 10) + S(f"M{x} {y + 22}H{x + 92}") +
             R(x + 10, y + 7, 24, 9, 3, SOFT) + R(x + 44, y + 7, 22, 9, 3, BRAND) + C(x + 78, y + 11.5, 5, ACC) +
             C(x + 46, y + 66, 30, SOFT) + C(x + 46, y + 66, 20, BSOFT) +
             R(x + 8, y + 112, 14, 5, 2, INK) + R(x + 70, y + 112, 14, 5, 2, INK), SW) + \
        S(f"M{x + 32} {y + 56}a18 18 0 0 1 10 -8", WHITE, 3.5)


def request():
    body = G(
        P("M40 96L98 72L82 120L71 100Z", ACC) + S("M71 100L98 72") +
        R(122, 26, 76, 162, 14, INK) +
        R(128, 38, 64, 138, 8, WHITE) +
        R(150, 30, 20, 4, 2, LINE) +
        R(134, 48, 40, 14, 7, BSOFT) +
        R(146, 68, 40, 22, 8, BRAND) +
        R(134, 96, 44, 14, 7, BSOFT) +
        R(152, 116, 34, 14, 7, ACC) +
        R(132, 160, 56, 11, 5.5, SOFT) +
        P("M232 48H282Q292 48 292 58V86Q292 96 282 96H240L226 108L228 94Q222 92 222 86V58Q222 48 232 48Z"), SW)
    det = NS(C(242, 72, 4, BRAND) + C(257, 72, 4, BRAND) + C(272, 72, 4, BRAND) +
             S("M154 76h22M154 83h14", WHITE, 2.5))
    trail = S("M30 140q14 -6 24 -22", BRAND, 2.5, 'stroke-dasharray="2 7" stroke-linecap="round" opacity=".7"')
    step("step-request", "Шаг 1: заявка",
         "Смартфон с перепиской с сервисом и бумажный самолётик — заявка по телефону, в WhatsApp или на сайте.",
         trail + body + det + sparkle(300, 128, 6) + sparkle(104, 40, 6, BRAND))


def confirm():
    cells = ""
    for j in range(3):
        for i in range(4):
            x, y = 104 + i * 26, 92 + j * 24
            cells += R(x, y, 18, 16, 4, ACC if (i, j) == (2, 1) else SOFT)
    body = G(
        R(92, 52, 124, 124, 12) +
        P("M92 64Q92 52 104 52H204Q216 52 216 64V80H92Z", BRAND) +
        R(116, 42, 7, 20, 3.5, INK) + R(185, 42, 7, 20, 3.5, INK) +
        cells +
        C(230, 160, 30) + S("M230 160V143M230 160L242 168") + C(230, 160, 3, INK), SW)
    ck = S("M161 125l4 4 7 -8", INK, 2.5, 'stroke-linecap="round" stroke-linejoin="round"')
    ticks = NS(S("M230 134v4M230 182v4M204 160h4M252 160h4", BRAND, 2.5, 'stroke-linecap="round"'))
    step("step-confirm", "Шаг 2: подтверждение",
         "Календарь с отмеченным днём и часы — время визита подтверждаем сообщением.",
         body + ck + ticks + check_badge(84, 168, 16) + sparkle(264, 92, 6) + sparkle(64, 60, 6, BRAND), 70, 166)


def intake():
    doc = G(f'<g transform="rotate(8 262 150)">' + R(232, 110, 60, 78, 6) +
            S("M242 126h40M242 136h40M242 146h28") + C(270, 170, 9, "none", f'stroke="{ACC}"') + "</g>", SW)
    phone = G(R(166, 52, 84, 132, 12, INK) + R(172, 62, 72, 112, 7, BSOFT) +
              R(190, 88, 36, 50, 5) + C(208, 120, 11, BSOFT) + S("M190 98H226"), SW)
    corners = S("M178 78v-8h8M238 78v-8h-8M178 158v8h8M238 158v8h-8", ACC, 3, 'stroke-linecap="round" stroke-linejoin="round"')
    flash = G(S("M258 38l8 -8M266 52h10M248 30v-10"), 3, f'stroke="{ACC}"')
    step("step-intake", "Шаг 3: приём с фотофиксацией",
         "Стиральная машина на приёмке, её фотографируют на телефон, рядом акт приёма — состояние техники фиксируем.",
         mini_washer(52, 80) + doc + phone + corners + flash + C(208, 57, 1.8, LINE), 110, 160)


def diagnostics():
    body = G(
        R(56, 112, 134, 80, 8, BRAND) +
        R(74, 128, 32, 24, 3, INK) + R(122, 142, 24, 24, 3, INK) +
        C(166, 132, 8, BSOFT) +
        S("M196 152C196 206 120 214 92 180") + S("M256 152C256 206 186 210 170 174", BRAND) +
        R(196, 38, 76, 130, 12, ACC) +
        R(206, 50, 56, 32, 5) +
        C(234, 118, 17) + S("M234 118l9 -9") +
        C(214, 152, 4.5, INK) + C(256, 152, 4.5, INK), SW)
    tr = NS(S("M106 140H120V154M146 154H160V140M74 170H120V166M130 166V180H176", BSOFT, 2, 'opacity=".7"') +
            C(92, 180, 4.5, ACC) + C(170, 174, 4.5, ACC) +
            S("M212 68h8l4 -10 6 18 5 -12 4 4h15", BRAND, 2.5, 'stroke-linecap="round" stroke-linejoin="round"'))
    step("step-diagnostics", "Шаг 4: диагностика",
         "Мультиметр проверяет электронную плату — находим причину неисправности.",
         body + tr + sparkle(286, 110, 6, BRAND) + sparkle(48, 70, 7), 100, 162)


def repair():
    g = gear(150, 116, 58, 46, 10, BRAND) + C(150, 116, 18, BSOFT)
    g2 = gear(242, 160, 28, 21, 8, BSOFT) + C(242, 160, 8, WHITE)
    wrench = (f'<g transform="rotate(-42 150 116)">' + tube("M150 56V176", 12, WHITE, SW) +
              G(C(150, 46, 17) + C(150, 46, 7, BSOFT) + C(150, 186, 14) + C(150, 186, 6, BSOFT), SW) + "</g>")
    screw = (f'<g transform="rotate(42 150 116)">' + tube("M150 40V128", 4, LINE, SW) +
             G(R(139, 126, 22, 58, 9, ACC) + S("M146 140V170M154 140V170"), SW) + "</g>")
    step("step-repair", "Шаг 5: ремонт",
         "Шестерёнка, гаечный ключ и отвёртка — ремонт с оригинальными запчастями.",
         G(g + g2, SW) + wrench + screw + sparkle(64, 64, 7) + sparkle(270, 96, 6, BRAND), 84)


def handover():
    doc = G(f'<g transform="rotate(6 222 112)">' + R(180, 52, 86, 116, 8) +
            P("M180 60Q180 52 188 52H258Q266 52 266 60V72H180Z", BRAND) +
            S("M192 88h62M192 100h62M192 112h40") +
            P("M214 150l-6 24 10 -6 6 10 4 -24z", ACC) + P("M234 150l6 24 -10 -6 -6 10 -4 -24z", ACC) +
            C(224, 140, 15, ACC) + S("M217 140l5 5 9 -9", INK) + "</g>", SW)
    step("step-handover", "Шаг 6: выдача с гарантией",
         "Отремонтированная стиральная машина и гарантийный талон с печатью — выдаём технику с документами.",
         mini_washer(64, 84) + doc + check_badge(150, 86, 16) + sparkle(52, 72, 7) + sparkle(284, 150, 6, BRAND) +
         sparkle(46, 150, 5), 110, 168)


if __name__ == "__main__":
    for f in (request, confirm, intake, diagnostics, repair, handover):
        f()
