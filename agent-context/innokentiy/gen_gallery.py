# Сцены галереи 640×480 + декоративные фоны
import math
from lib import *

W, H = 640, 480
SW = 3
SK = ASOFT


def bg(pid, floor=400, shadow=None):
    out = (R(0, 0, W, H, 0, TINT) + R(28, 28, 160, 96, 0, f"url(#{pid}-dots)") +
           C(560, 70, 40, ASOFT) + R(0, floor, W, H - floor, 0, SOFT) +
           f'<path d="M0 {floor}H{W}" stroke="{LINE}" stroke-width="2"/>')
    if shadow:
        cx, rx = shadow
        out += E(cx, floor + 2, rx, 9, INK, 'opacity=".08"')
    return out


def scene(name, title, desc, body, floor=400, shadow=None, extra_defs=""):
    defs = dots_pattern(f"{name}-dots", 16, 1.6) + extra_defs
    print(name, svg(name + ".svg", W, H, title, desc, bg(name, floor, shadow) + body, defs))


def logo_mark(x, y, s=1):
    """условный знак сервиса без текста: янтарный круг + две белые плашки"""
    return (f'<g transform="translate({x} {y}) scale({s})">' + badge(0, 0, 16) +
            NS(R(26, -10, 96, 8, 4, WHITE) + R(26, 4, 64, 6, 3, BSOFT)) + "</g>")


def intake_desk():
    body = G(
        R(200, 52, 240, 60, 14, BRAND) +
        # администратор
        P("M346 246Q346 208 376 204H424Q454 208 454 246Z", BRAND) +
        P("M386 204L400 222L414 204Z", BSOFT) +
        R(391, 188, 18, 18, 0, SK) +
        C(400, 166, 26, SK) +
        P("M374 166Q372 136 400 136Q428 136 426 166Q414 150 390 152Q380 156 374 166Z", INK) +
        C(428, 146, 10, INK) +
        # монитор (вид сзади)
        R(272, 172, 84, 58, 6, LINE) + P("M306 230H322L326 242H302Z", LINE) +
        # стойка
        R(108, 240, 424, 16, 5, LINE) +
        R(120, 256, 400, 144, 0, WHITE) +
        S("M200 256V400M280 256V400M360 256V400M440 256V400") +
        # кофемашина клиента
        R(150, 146, 66, 94, 10) + R(160, 156, 46, 16, 4, BRAND) + R(160, 180, 46, 50, 5, SOFT) +
        R(176, 180, 14, 10, 3, LINE) + R(172, 206, 22, 18, 3) +
        # телефон на штативе — фотофиксация
        S("M244 240L234 226M244 240L254 226M244 240V212") + R(226, 188, 36, 24, 5, INK) +
        C(244, 200, 7, BSOFT) +
        # акт
        P("M450 238L462 214H514L502 238Z", WHITE) +
        # растение
        P("M560 330Q540 300 548 270Q570 292 568 330Z", BRAND) + P("M572 330Q584 296 608 286Q606 316 580 334Z", BRAND) +
        P("M566 330Q558 292 572 262Q584 292 576 330Z", BSOFT) +
        P("M546 330H602L594 400H554Z", ASOFT), SW)
    det = NS(C(254, 200, 2, ACC) + S("M470 224H500M466 230H490", BRAND, 2) + C(196, 164, 3.5, ACC) +
             R(180, 290, 280, 10, 5, BSOFT))
    flash = G(S("M218 176l-8 -8M230 168v-10"), 3, f'stroke="{ACC}"')
    scene("intake-desk", "Стойка приёмки",
          "Администратор за стойкой приёмки, на стойке кофемашина клиента, телефон на штативе для фотофиксации и акт приёма.",
          body + det + flash + logo_mark(236, 82) + sparkle(110, 200, 9) + sparkle(560, 180, 7, BRAND), shadow=(320, 230))


def workshop():
    defs = ('<pattern id="workshop-peg" width="20" height="20" patternUnits="userSpaceOnUse">'
            f'<circle cx="10" cy="10" r="2" fill="{LINE}"/></pattern>')
    body = G(
        # окно
        R(440, 46, 150, 116, 8, BSOFT) + S("M515 46V162M440 104H590") +
        # перфопанель
        R(70, 56, 320, 150, 10) + R(70, 56, 320, 150, 10, "url(#workshop-peg)", 'stroke="none"'), SW)
    tools = (tube("M120 90V170", 9, WHITE, SW) + G(C(120, 84, 13) + C(120, 84, 5, BSOFT) + C(120, 178, 11) + C(120, 178, 4.5, BSOFT), SW) +
             tube("M170 80V128", 3, LINE, SW) + G(R(160, 126, 20, 52, 8, ACC) + S("M167 138V166M173 138V166"), SW) +
             tube("M214 82L234 176M254 82L234 176", 7, BRAND, SW) + G(C(234, 104, 6, LINE), SW) +
             tube("M300 96V180", 8, ASOFT, SW) + G(R(276, 78, 48, 22, 6, INK), SW) +
             G(R(340, 90, 30, 70, 8, BSOFT) + C(355, 112, 7, WHITE) + S("M345 140h20M345 150h20"), SW))
    bench = G(
        R(60, 264, 520, 18, 4, LINE) + R(80, 282, 16, 118, 0, LINE) + R(544, 282, 16, 118, 0, LINE) +
        R(96, 350, 448, 10, 0, LINE) +
        R(120, 316, 70, 34, 4, ASOFT) + R(204, 322, 60, 28, 4, BSOFT) + R(420, 312, 90, 38, 4, WHITE) +
        # мотор
        R(250, 206, 120, 58, 12, LINE) + E(250, 235, 10, 29, SOFT) + S("M276 206V264M300 206V264M324 206V264") +
        R(370, 228, 26, 14, 3, INK) +
        # мультиметр
        R(150, 186, 56, 78, 8, ACC) + R(158, 194, 40, 22, 4) + C(178, 236, 11) + S("M178 236l6 -6") +
        # лампа
        E(480, 262, 34, 6, INK) +
        tube("M480 256L452 180L510 132", 8, BRAND, SW) +
        P("M492 118L536 142L520 158Z", BRAND) +
        C(466, 410, 0.1, "none"), SW)
    light = NS(P("M528 150L520 158L470 256H560Z", ASOFT, 'opacity=".85"') + S("M164 205h6l3 -6 4 10 3 -6h18", BRAND, 2))
    scene("workshop", "Мастерская",
          "Рабочее место мастера: перфопанель с инструментом, верстак с электродвигателем, мультиметром и лампой.",
          body + tools + light + bench + sparkle(600, 220, 8) + sparkle(44, 230, 7, BRAND), shadow=(320, 270), extra_defs=defs)


def parts_shelf():
    shelves = [140, 240, 340]
    rows = [
        [(140, 50, 52, ASOFT), (196, 70, 64, WHITE), (272, 44, 40, BSOFT), (322, 80, 70, BRAND), (412, 54, 46, WHITE), (474, 38, 34, ASOFT)],
        [(140, 64, 56, WHITE), (210, 48, 44, ACC), (264, 70, 60, BSOFT), (440, 66, 52, WHITE)],
        [(140, 90, 60, BSOFT), (236, 56, 46, ASOFT), (300, 74, 70, WHITE), (382, 50, 38, BRAND), (440, 70, 56, ASOFT)],
    ]
    boxes = ""
    for sy, row in zip(shelves, rows):
        for (x, w, h, c) in row:
            boxes += R(x, sy - h, w, h, 4, c)
            lab = WHITE if c != WHITE else SOFT
            boxes += R(x + w / 2 - 12, sy - h / 2 - 6, 24, 12, 2, lab)
    body = G(
        R(112, 40, 16, 360, 4, LINE) + R(512, 40, 16, 360, 4, LINE) +
        "".join(R(112, y, 416, 12, 2, LINE) for y in shelves) + boxes +
        # насос и плата на средней полке
        C(364, 214, 22, LINE) + C(364, 214, 9, WHITE) + R(386, 206, 34, 14, 4, LINE) +
        R(334, 228, 0.1, 0.1, 0, "none"), SW)
    tags = NS("".join(C(x + w / 2 + 8, sy - h / 2, 2.5, ACC) for sy, row in zip(shelves, rows) for (x, w, h, c) in row[::2]))
    tag = G(S("M560 140V176") + P("M546 176H574V214L560 226L546 214Z", ACC) + C(560, 186, 3.5, WHITE), SW)
    barc = NS(S("M552 198v14M556 198v14M559 198v14M564 198v14M568 198v14", INK, 1.6))
    scene("parts-shelf", "Склад запчастей",
          "Стеллаж с промаркированными коробками запчастей, насос на полке и янтарная бирка со штрихкодом.",
          body + tags + tag + barc + sparkle(70, 200, 9) + sparkle(590, 300, 7, BRAND), shadow=(320, 230))


def parking_facade():
    body = G(
        # здание
        R(70, 78, 500, 16, 4, LINE) + R(84, 94, 472, 306, 0, WHITE) +
        R(110, 112, 280, 52, 10, BRAND) +
        R(420, 112, 112, 80, 6, BSOFT) + S("M476 112V192") +
        # вход
        R(128, 236, 92, 164, 6, BSOFT) + S("M174 236V400") + R(162, 310, 6, 26, 3, INK) + R(180, 310, 6, 26, 3, INK) +
        P("M116 220H232L224 236H124Z", ACC) +
        # витрина
        R(256, 236, 180, 112, 6, BSOFT) + S("M346 236V348") +
        # ступенька
        R(116, 400, 116, 10, 3, LINE) +
        # знак P
        R(478, 222, 44, 44, 8, BRAND) +
        # автомобиль
        P("M402 396V372Q402 360 414 358L446 352L474 326Q480 320 490 320H556Q566 320 572 328L590 352Q608 356 610 370V396Z", BRAND) +
        P("M482 330H520V352H460Z", BSOFT) + P("M528 330H554Q560 330 564 336L574 352H528Z", BSOFT) +
        C(444, 398, 18, INK) + C(444, 398, 7, LINE) + C(566, 398, 18, INK) + C(566, 398, 7, LINE), SW)
    det = NS(S("M491 256V232H503Q511 232 511 239Q511 246 503 246H491", WHITE, 4, 'stroke-linecap="round" stroke-linejoin="round"') +
             S("M270 260l22 -16M290 282l40 -30M380 270l30 -22", WHITE, 4, 'stroke-linecap="round" opacity=".8"') +
R(0, 410, W, 70, 0, LINE, 'opacity=".55"') +
             "".join(S(f"M{x} 470L{x + 30} 414", WHITE, 4, 'stroke-linecap="round"') for x in (300, 372, 444, 516)) +
             C(608, 370, 4, ACC))
    scene("parking-facade", "Фасад и парковка",
          "Фасад сервиса с вывеской, входом под янтарным козырьком и витриной; рядом парковка со знаком и автомобилем.",
          body + G(R(40, 300, 14, 100, 4, LINE) + C(47, 262, 40, BRAND) + C(70, 290, 24, BRAND), SW) + det + logo_mark(146, 138) + sparkle(600, 170, 8), shadow=(320, 260))


def premium():
    bottles = ""
    for i, x in enumerate((432, 456, 480)):
        for j, y in enumerate((150, 220, 290)):
            bottles += P(f"M{x - 7} {y + 44}V{y + 18}Q{x - 7} {y + 10} {x - 3} {y + 6}V{y}H{x + 3}V{y + 6}Q{x + 7} {y + 10} {x + 7} {y + 18}V{y + 44}Z", BRAND, f'stroke="{BSOFT}" stroke-width="2"')
            bottles += R(x - 3, y - 4, 6, 6, 1.5, ACC, 'stroke="none"')
    body = G(
        R(90, 52, 460, 22, 4, LINE) +
        # колонна духовок
        R(100, 74, 170, 326) +
        R(114, 94, 142, 76, 8) + R(128, 116, 114, 42, 5, INK) + S("M114 108H256") +
        R(114, 182, 142, 132, 8) + S("M114 204H256") + R(132, 214, 106, 7, 3.5, LINE) + R(128, 230, 114, 72, 6, INK) +
        R(114, 326, 142, 56, 6, SOFT) + R(160, 340, 50, 7, 3.5, LINE) +
        # холодильник
        R(270, 74, 140, 326) + S("M270 196H410") + R(286, 150, 8, 40, 4, LINE) + R(286, 206, 8, 80, 4, LINE) +
        # винный шкаф
        R(410, 74, 92, 326) + R(420, 128, 72, 252, 6, INK) +
        # тумба с кофемашиной
        R(502, 240, 110, 160) + R(496, 230, 122, 12, 4, LINE) + S("M502 320H612") + R(540, 280, 34, 6, 3, LINE) + R(540, 356, 34, 6, 3, LINE) +
        R(522, 150, 70, 80, 10) + R(532, 160, 50, 14, 4, BRAND) + R(532, 182, 50, 40, 5, SOFT) + R(548, 182, 18, 10, 3, LINE), SW)
    det = NS(R(136, 124, 98, 26, 4, BRAND, 'opacity=".75"') + R(136, 238, 98, 56, 4, BRAND, 'opacity=".75"') +
             C(146, 132, 3.5, ACC) + C(146, 246, 3.5, ACC) + S("M136 276H234", BSOFT, 2.5) +
             C(240, 101, 3.5, ACC) + C(240, 193, 3.5, ACC) + R(374, 90, 22, 12, 3, BRAND) + C(568, 167, 3.5, ACC) +
             "".join(E(x, 76, 14, 3, ASOFT, 'opacity=".9"') for x in (180, 340, 456)) +
             "".join(C(x, 68, 3.5, ACC) for x in (180, 340, 456)))
    gl = '<clipPath id="premium-wine"><rect x="420" y="128" width="72" height="252" rx="6"/></clipPath>'
    scene("premium-appliances", "Премиальная встраиваемая техника",
          "Кухня с колонной духовых шкафов, встроенным холодильником, винным шкафом и кофемашиной.",
          body + det + f'<g clip-path="url(#premium-wine)">{bottles}</g>' +
          S("M420 200H492M420 270H492M420 340H492", BSOFT, 2, 'opacity=".5"') +
          sparkle(60, 200, 9) + sparkle(600, 110, 7, BRAND), shadow=(350, 280), extra_defs=gl)


# ---------- декоративные
def blob_path(cx, cy, r, amps, seed_rot=0):
    n_ = len(amps)
    pts = []
    for i, a in enumerate(amps):
        t = 2 * math.pi * i / n_ + seed_rot
        pts.append((cx + r * a * math.cos(t), cy + r * a * math.sin(t)))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n_):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n_], pts[(i + 2) % n_]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + "Z"


def deco():
    print("pattern-dots", svg_deco("pattern-dots.svg", 24, 24, C(12, 12, 1.6, BRAND, 'opacity=".22"')))
    b1 = (P(blob_path(300, 300, 250, [1, .88, .97, .84, 1.02, .9, .95, .86]), BSOFT) +
          P(blob_path(300, 300, 170, [1, .92, 1.04, .9, .98, .94], .5), BRAND, 'opacity=".07"'))
    print("blob-brand", svg_deco("blob-brand.svg", 600, 600, b1))
    b2 = (P(blob_path(300, 300, 240, [1, .9, 1.03, .86, .98, .92, 1.0], .3), ASOFT) +
          P(blob_path(300, 300, 262, [1, .9, 1.03, .86, .98, .92, 1.0], .3), "none", f'stroke="{ACC}" stroke-width="2" stroke-dasharray="3 12" stroke-linecap="round" opacity=".7"'))
    print("blob-accent", svg_deco("blob-accent.svg", 600, 600, b2))


if __name__ == "__main__":
    for f in (intake_desk, workshop, parts_shelf, parking_facade, premium, deco):
        f()
