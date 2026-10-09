"""Генератор вордмарка «Сервис-Люкс» в кривых из локальных Onest woff2 (fontTools).
Использование: python3 wordmark.py WGHT(100–900) TRACKING_EM [TEXT] -> JSON {d, width, cap, xh}
Координаты: em = 100 ед., базовая линия y=0 (вверх — отрицательные y), x от 0.
"""
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = '/home/user/repair/fonts/'
w = sys.argv[1] if len(sys.argv) > 1 else '700'
track = float(sys.argv[2]) if len(sys.argv) > 2 else -0.03
text = sys.argv[3] if len(sys.argv) > 3 else 'Сервис-Люкс'
# woff2 Onest — вариативные (ось wght 100–900, по умолчанию 400): берём инстанс нужной насыщенности
fonts = [instantiateVariableFont(TTFont(f'{ROOT}onest-400-{s}.woff2'), {'wght': float(w)}) for s in ('cyrillic', 'latin')]
S = 100 / 1000


def fmt(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


class Pen(SVGPathPen):
    def __init__(self, gs):
        super().__init__(gs, ntos=fmt)


x = 0.0
parts = []
for i, ch in enumerate(text):
    for f in fonts:
        g = f.getBestCmap().get(ord(ch))
        if g:
            break
    else:
        raise SystemExit(f'нет глифа {ch!r}')
    gs = f.getGlyphSet()
    pen = Pen(gs)
    gs[g].draw(TransformPen(pen, (S, 0, 0, -S, x, 0)))
    parts.append(pen.getCommands())
    adv = f['hmtx'][g][0] * S
    x += adv + (track * 100 if i < len(text) - 1 else 0)

os2 = fonts[1]['OS/2']
print(json.dumps({'d': ''.join(parts), 'width': round(x, 2),
                  'cap': os2.sCapHeight * S, 'xh': os2.sxHeight * S}, ensure_ascii=False))
