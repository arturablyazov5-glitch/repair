# 12 иллюстраций категорий 480×360
from lib import *

W, H = 480, 360


def bg(pid, shadow_rx=110, floor=True):
    out = [R(0, 0, W, H, 0, TINT),
           R(32, 32, 144, 96, 0, f"url(#{pid}-dots)"),
           C(240, 180, 130, BSOFT),
           C(410, 70, 26, ASOFT),
           C(70, 292, 10, ASOFT)]
    if floor:
        out += [R(0, 300, W, 60, 0, SOFT), f'<path d="M0 300H480" stroke="{LINE}" stroke-width="2"/>']
    out.append(E(240, 302, shadow_rx, 8, INK, 'opacity=".08"'))
    return "".join(out)


def card(name, title, desc, body, shadow=110, extra_defs=""):
    pid = name
    defs = dots_pattern(f"{pid}-dots") + extra_defs
    size = svg(name + ".svg", W, H, title, desc, bg(pid, shadow) + body, defs)
    print(name, size)


# ---------- стиральная
def washer():
    clip = f'<clipPath id="washer-glass"><circle cx="240" cy="212" r="40"/></clipPath>'
    body = G(
        R(160, 90, 160, 204, 14) +
        S("M160 132H320") +
        R(174, 102, 46, 18, 5, SOFT) +
        R(232, 104, 38, 14, 4, BRAND) +
        C(296, 111, 9, ACC) +
        C(240, 212, 58, SOFT) +
        C(240, 212, 42, BSOFT) +
        R(174, 294, 22, 7, 3, INK) + R(284, 294, 22, 7, 3, INK)
    )
    water = (f'<g clip-path="url(#washer-glass)" stroke="none">'
             f'<path d="M196 218q11 -8 22 0t22 0t22 0t22 0V260H196Z" fill="{BRAND}" opacity=".28"/>'
             f'{C(226, 236, 4, WHITE, "opacity=\".8\"")}{C(252, 244, 3, WHITE, "opacity=\".8\"")}</g>')
    hl = S("M214 196a32 32 0 0 1 20 -14", WHITE, 5)
    bubbles = G(C(350, 150, 9, WHITE) + C(370, 124, 5, WHITE) + C(130, 170, 7, WHITE), 2.5,
                f'stroke="{BRAND}"')
    card("washer", "Стиральная машина",
         "Плоская иллюстрация: стиральная машина с круглым люком, пузырьки и янтарный значок сервиса.",
         body + water + hl + G(C(240, 212, 42, "none")) + bubbles + badge(336, 90), 110, clip)


# ---------- посудомоечная
def dishwasher():
    body = G(
        R(96, 88, 288, 16, 4, LINE) +
        R(104, 104, 72, 192) + R(304, 104, 72, 192) +
        S("M104 168H176M104 232H176M304 168H376M304 232H376") +
        R(128, 132, 24, 6, 3, LINE) + R(128, 196, 24, 6, 3, LINE) + R(128, 260, 24, 6, 3, LINE) +
        R(328, 132, 24, 6, 3, LINE) + R(328, 196, 24, 6, 3, LINE) + R(328, 260, 24, 6, 3, LINE) +
        R(176, 104, 128, 192) +
        R(176, 104, 128, 30, 0, BSOFT) +
        C(194, 119, 5, ACC) + R(222, 113, 44, 12, 3, BRAND) + C(284, 119, 4, WHITE) +
        R(206, 148, 68, 8, 4, LINE) +
        # стопка тарелок
        R(316, 78, 52, 10, 5, WHITE) + R(312, 68, 60, 10, 5, BSOFT) + R(318, 58, 48, 10, 5, WHITE) +
        # стакан
        P("M124 50H150L146 88H128Z", WHITE)
    )
    deco = (G(C(214, 60, 9, WHITE) + C(240, 40, 6, WHITE) + C(262, 62, 4, WHITE), 2.5, f'stroke="{BRAND}"') +
            sparkle(392, 52, 9) + sparkle(110, 36, 6))
    card("dishwasher", "Посудомоечная машина",
         "Встраиваемая посудомоечная машина между кухонными шкафами, чистые тарелки на столешнице.",
         body + deco + badge(240, 214), 150)


# ---------- холодильник
def fridge():
    body = G(
        R(178, 34, 124, 262, 14) +
        S("M178 126H302") +
        R(192, 54, 8, 52, 4, LINE) + R(192, 144, 8, 76, 4, LINE) +
        R(250, 50, 38, 24, 5, BRAND) +
        P("M236 180l4 -40 40 4 -4 40z", ASOFT) +
        S("M244 154l26 3M243 164l20 2M242 174l24 2.5") +
        R(190, 296, 20, 6, 3, INK) + R(270, 296, 20, 6, 3, INK)
    )
    snow = G(S("M269 86v26M258 92l22 14M258 106l22 -14"), 3, f'stroke="{BRAND}"')
    disp = NS(R(256, 58, 14, 8, 2, BSOFT) + C(279, 62, 3.5, ACC))
    magnet = G(C(258, 142, 6, ACC))
    card("fridge", "Холодильник",
         "Двухкамерный холодильник с дисплеем, значком снежинки и запиской на магните.",
         body + snow + disp + magnet + sparkle(130, 110, 8) + sparkle(352, 210, 6, BRAND) + badge(320, 40), 90)


# ---------- духовой шкаф + варочная панель
def oven_hob():
    body = G(
        R(110, 120, 260, 16, 4, LINE) +
        P("M150 120L168 102H312L330 120Z", INK) +
        R(130, 136, 220, 164, 0, SOFT) +
        R(146, 148, 188, 140, 8) +
        S("M146 176H334") +
        C(170, 162, 7, LINE) + C(310, 162, 7, LINE) +
        R(214, 155, 40, 14, 3, BRAND) +
        R(176, 186, 128, 8, 4, LINE) +
        R(168, 204, 144, 72, 8, INK)
    )
    inner = NS(R(178, 214, 124, 52, 5, BRAND, 'opacity=".75"') + C(190, 224, 4, ACC) +
               S("M184 250H296", BSOFT, 2.5) + C(274, 162, 4, ACC))
    burners = (E(206, 111, 22, 4.5, "none", f'stroke="{ACC}" stroke-width="3"') +
               E(276, 111, 18, 3.5, "none", f'stroke="{BSOFT}" stroke-width="2.5" opacity=".6"'))
    heat = G(S("M196 92q-6 -8 0 -16t0 -16M208 92q-6 -8 0 -16t0 -16M220 92q-6 -8 0 -16t0 -16"), 3,
             f'stroke="{ACC}"')
    card("oven-hob", "Духовой шкаф и варочная панель",
         "Встраиваемый духовой шкаф в кухонном модуле и варочная панель с горящей янтарной конфоркой.",
         body + inner + burners + heat + sparkle(384, 170, 7, BRAND) + badge(354, 150), 120)


# ---------- плита
def cooker():
    body = G(
        R(168, 62, 144, 36, 6) +
        R(160, 96, 160, 10, 3, LINE) +
        R(180, 88, 40, 8, 3, INK) + R(262, 90, 32, 6, 3, INK) +
        R(160, 106, 160, 190, 10) +
        C(186, 124, 7, LINE) + C(214, 124, 7, LINE) + C(266, 124, 7, LINE) + C(294, 124, 7, LINE) +
        S("M160 142H320") +
        R(176, 152, 128, 106, 8) +
        R(190, 160, 100, 7, 3.5, LINE) +
        R(192, 176, 96, 70, 6, INK) +
        R(176, 266, 128, 22, 5, SOFT) +
        R(222, 274, 36, 6, 3, LINE)
    )
    inner = NS(R(200, 184, 80, 54, 4, BRAND, 'opacity=".75"') + C(240, 124, 4, ACC) +
               S("M206 224H274", BSOFT, 2.5))
    flames = G(P("M190 86c-6 -6 -4 -14 2 -20c0 8 6 10 6 16c0 3 -3 5 -8 4z", ACC) +
               P("M202 86c-5 -7 -2 -16 6 -22c-1 9 6 12 5 18c-1 4 -6 5 -11 4z", ACC) +
               P("M214 86c-4 -5 -3 -11 2 -15c0 6 4 8 4 12c0 3 -2 4 -6 3z", ACC), 2.5)
    card("cooker", "Плита",
         "Отдельностоящая плита с духовкой: на одной конфорке горит янтарное пламя.",
         body + inner + flames + sparkle(352, 214, 7, BRAND) + sparkle(120, 130, 7) + badge(338, 108), 100)


# ---------- вытяжка
def hood():
    cones = NS(P("M170 190L146 284H214L196 190Z", ASOFT, 'opacity=".9"') +
               P("M284 190L266 284H334L310 190Z", ASOFT, 'opacity=".9"'))
    body = G(
        R(216, 22, 48, 96) +
        S("M228 44H252M228 54H252M228 64H252") +
        P("M182 118H298L338 172H142Z") +
        R(136, 172, 208, 18, 5, LINE) +
        C(318, 181, 4, ACC) + C(304, 181, 3, INK) +
        R(170, 190, 26, 4, 2, ACC) + R(284, 190, 26, 4, 2, ACC) +
        R(110, 284, 260, 14, 4, LINE) +
        R(190, 228, 100, 8, 4, BSOFT) + C(240, 222, 5, INK) +
        R(196, 236, 88, 48, 8, BRAND) +
        R(182, 246, 14, 9, 3, INK) + R(284, 246, 14, 9, 3, INK)
    )
    steam = G(S("M222 214q-8 -10 0 -20t0 -20M240 210q-8 -10 0 -20t0 -20M258 214q-8 -10 0 -20t0 -20"),
              3, f'stroke="{BRAND}" opacity=".55"')
    card("hood", "Кухонная вытяжка",
         "Каминная вытяжка над кастрюлей: подсветка освещает варочную зону, пар уходит вверх.",
         cones + body + steam + sparkle(100, 100, 8) + badge(336, 140), 130)


# ---------- кофемашина
def coffee():
    body = G(
        R(176, 74, 128, 214, 16) +
        R(196, 64, 56, 12, 5, LINE) +
        R(192, 92, 96, 40, 8, BRAND) +
        R(202, 102, 36, 20, 4, BSOFT) +
        C(256, 112, 5, ACC) + C(274, 112, 5, BSOFT) +
        R(192, 142, 96, 118, 8, SOFT) +
        R(220, 142, 40, 24, 6, LINE) +
        R(230, 166, 7, 8, 2, INK) + R(243, 166, 7, 8, 2, INK) +
        P("M220 208H260V234Q260 246 248 246H232Q220 246 220 234Z") +
        S("M260 214q12 0 12 10t-12 10") +
        R(196, 248, 88, 10, 3, LINE) +
        R(190, 288, 18, 6, 3, INK) + R(272, 288, 18, 6, 3, INK)
    )
    detail = NS(R(222, 216, 36, 7, 0, ACC) + S("M233.5 176V204M246.5 176V204", INK, 3, 'stroke-dasharray="5 4"') +
                S("M208 108h20M208 116h12", BRAND, 2.5))
    steam = G(S("M330 120q-8 -10 0 -20t0 -20M346 124q-8 -10 0 -20t0 -20"), 3, f'stroke="{BRAND}" opacity=".5"')
    beans = G(E(136, 210, 9, 12, ACC, 'transform="rotate(-25 136 210)"') +
              S("M131 202q6 8 1 16", INK, 2) +
              E(116, 240, 7, 10, ACC, 'transform="rotate(20 116 240)"'), 2.5)
    card("coffee-machine", "Кофемашина",
         "Автоматическая кофемашина с панелью управления, под краником чашка, рядом кофейные зёрна.",
         body + detail + steam + beans + badge(302, 76), 90)


# ---------- сушильная
def dryer():
    body = G(
        R(160, 100, 160, 194, 14) +
        S("M160 140H320") +
        R(174, 110, 56, 18, 4, BRAND) +
        C(292, 120, 12, ACC) + S("M292 120l6 -6") +
        C(250, 120, 4, LINE) +
        C(240, 218, 54, SOFT) +
        C(240, 218, 40, BSOFT) +
        R(186, 276, 28, 8, 3, LINE) +
        R(174, 294, 22, 7, 3, INK) + R(284, 294, 22, 7, 3, INK) +
        # полотенца сверху
        R(178, 86, 124, 14, 5, WHITE) + R(186, 72, 108, 14, 5, ASOFT) + R(196, 58, 88, 14, 5, BSOFT)
    )
    swirl = G(S("M222 206a20 20 0 0 1 30 -6M258 226a20 20 0 0 1 -30 8") +
              S("M250 194l3 6 -6 2M230 238l-3 -6 6 -2"), 3, f'stroke="{BRAND}"')
    disp = NS(R(180, 116, 22, 6, 2, BSOFT))
    heat = G(S("M350 210q-6 -8 0 -16t0 -16M364 214q-6 -8 0 -16t0 -16"), 3, f'stroke="{ACC}"')
    card("dryer", "Сушильная машина",
         "Сушильная машина с круглым люком и стрелками потока воздуха, сверху сложенные полотенца.",
         body + disp + swirl + S("M214 198a32 32 0 0 1 20 -14", WHITE, 5) + heat + sparkle(116, 150, 7) + badge(338, 100), 110)


# ---------- измельчитель
def disposer():
    cab = G(R(130, 96, 220, 204, 0, SOFT))
    body = G(
        R(100, 80, 280, 16, 4, LINE) +
        P("M168 96H312V126Q312 140 298 140H182Q168 140 168 126Z", WHITE) +
        R(228, 140, 24, 10, 2, LINE) +
        R(204, 150, 72, 112, 18, BRAND) +
        R(204, 176, 72, 10, 0, BSOFT) +
        R(216, 262, 48, 14, 5, INK) +
        C(240, 236, 6, ACC)
    )
    pipe = tube("M276 200H318Q330 200 330 212V240Q330 252 342 252H350", 10, LINE)
    faucet = tube("M300 80V52Q300 40 288 40H262V52", 7, LINE)
    rot = S("M226 214a16 16 0 0 1 26 -10M254 220a16 16 0 0 1 -6 10", WHITE, 3, 'stroke-linecap="round"')
    bits = NS(C(226, 122, 5, ACC) + C(246, 128, 4, BRAND) + C(260, 118, 4, ACC))
    drops = G(P("M262 66q4 8 0 12q-4 -4 0 -12z", BSOFT), 2)
    card("disposer", "Измельчитель пищевых отходов",
         "Мойка на кухне и измельчитель под ней, подключённый к сливу.",
         cab + pipe + body + faucet + rot + bits + drops + sparkle(390, 150, 7, BRAND) + badge(278, 152), 120)


# ---------- телевизор
def tv():
    clip = '<clipPath id="tv-scr"><rect x="104" y="64" width="272" height="148" rx="6"/></clipPath>'
    body = G(
        P("M222 224L212 254H268L258 224Z", LINE) +
        R(92, 52, 296, 172, 12, INK) +
        R(120, 254, 240, 44, 8) +
        S("M200 254V298M280 254V298") +
        R(150, 272, 24, 5, 2.5, LINE) + R(306, 272, 24, 5, 2.5, LINE) +
        R(132, 298, 14, 6, 2, INK) + R(334, 298, 14, 6, 2, INK)
    )
    scr = (f'<g clip-path="url(#tv-scr)" stroke="none">' + R(104, 64, 272, 148, 0, BRAND) +
           C(306, 108, 18, ACC) +
           P("M104 184Q170 132 236 170T376 150V212H104Z", BSOFT, 'opacity=".45"') +
           P("M104 200Q190 168 270 192T376 186V212H104Z", BSOFT, 'opacity=".8"') + '</g>')
    led = NS(C(240, 218, 2.5, ACC))
    card("tv", "Телевизор",
         "Телевизор на тумбе, на экране условный пейзаж с янтарным солнцем.",
         body + scr + led + sparkle(420, 150, 8) + badge(386, 54), 140, clip)


# ---------- робот-пылесос + вертикальный
def robot():
    trail = S("M40 290Q90 262 130 276", BRAND, 3, 'stroke-dasharray="2 9" opacity=".6"')
    body = G(
        P("M100 228V246A110 32 0 0 0 320 246V228Z", INK) +
        E(210, 228, 110, 32) +
        E(210, 226, 74, 19, SOFT) +
        P("M188 222V208H232V222Z", WHITE) +
        E(210, 208, 22, 6, BSOFT) +
        E(262, 236, 9, 4, ACC)
    )
    stick = (tube("M398 62L386 276", 8, LINE) +
             G(R(384, 46, 20, 30, 8, INK) +
               P("M372 96Q370 90 376 88L404 86Q410 86 410 92L412 150Q412 158 404 158H380Q372 158 372 150Z", BRAND) +
               R(378, 112, 28, 34, 6, BSOFT) +
               C(392, 100, 4, ACC) +
               P("M352 272H412Q420 272 420 280V292H352Q346 292 346 286V278Q346 272 352 272Z", BRAND)))
    dust = NS(C(330, 292, 2.5, INK, 'opacity=".35"') + C(342, 286, 2, INK, 'opacity=".35"') +
              C(320, 286, 1.8, INK, 'opacity=".35"'))
    card("robot-vacuum", "Робот-пылесос и пылесос",
         "Робот-пылесос с лидаром едет по полу, рядом вертикальный пылесос.",
         trail + f'<g transform="translate(0 20)">' + body + "</g>" + stick + dust + sparkle(120, 140, 8) + badge(306, 214), 150)


# ---------- мелкая техника
def small():
    clip = '<clipPath id="small-jar"><path d="M144 98H206L198 232H152Z"/></clipPath>'
    jarfill = (f'<g clip-path="url(#small-jar)" stroke="none">' +
               R(130, 170, 90, 70, 0, ACC, 'opacity=".55"') +
               P("M130 172q12 -6 24 0t24 0t24 0t24 0V180H130Z", ACC, 'opacity=".55"') + '</g>')
    blender = G(P("M144 98H206L198 232H152Z", WHITE, 'fill-opacity=".7"') +
                S("M206 116H226V196H200") +
                R(136, 84, 78, 14, 5, INK) +
                S("M160 222L190 216M162 214l26 10", INK, 2.5) +
                P("M146 232H204Q212 232 212 240V288Q212 296 204 296H146Q138 296 138 288V240Q138 232 146 232Z", BRAND) +
                C(175, 264, 8, ACC))
    hl = S("M154 110L159 200", WHITE, 4)
    mincer = G(
        R(372, 200, 56, 34, 6, LINE) +
        R(426, 192, 10, 50, 3, INK) +
        P("M302 200L292 168H356L346 200Z", LINE) +
        R(284, 158, 80, 10, 4) +
        R(272, 196, 104, 100, 18) +
        C(324, 252, 9, ACC) +
        S("M292 222H308M292 232H308M292 242H308"))
    card("small-appliances", "Мелкая бытовая техника",
         "Блендер с янтарным смузи и электрическая мясорубка.",
         jarfill + blender + hl + mincer + sparkle(100, 150, 8, BRAND) + sparkle(400, 130, 7) + badge(240, 70), 170, clip)


if __name__ == "__main__":
    for f in (washer, dishwasher, fridge, oven_hob, cooker, hood, coffee, dryer, disposer, tv, robot, small):
        f()
