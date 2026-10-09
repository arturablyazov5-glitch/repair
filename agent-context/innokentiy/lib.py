# Общие примитивы для иллюстраций «Сервис-Люкс» (Иннокентий, TASK-010)
import math, os

BRAND = "#0d5c6b"; BSOFT = "#d9ecee"; ACC = "#f2a33a"; ASOFT = "#fdf0d9"
TINT = "#eaf3f4"; INK = "#14181f"; LINE = "#e4e1da"; SOFT = "#f3f1ec"; WHITE = "#fff"

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "media", "illustrations")


def n(v):
    if isinstance(v, float):
        s = f"{v:.1f}".rstrip("0").rstrip(".")
        return s
    return str(v)


def _a(extra):
    return (" " + extra) if extra else ""


def R(x, y, w, h, rx=0, fill=WHITE, extra=""):
    r = f' rx="{n(rx)}"' if rx else ""
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}"{r} fill="{fill}"{_a(extra)}/>'


def C(cx, cy, r, fill=WHITE, extra=""):
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{fill}"{_a(extra)}/>'


def E(cx, cy, rx, ry, fill=WHITE, extra=""):
    return f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(rx)}" ry="{n(ry)}" fill="{fill}"{_a(extra)}/>'


def P(d, fill=WHITE, extra=""):
    return f'<path d="{d}" fill="{fill}"{_a(extra)}/>'


def S(d, color=INK, w=None, extra=""):
    """stroke-only path"""
    sw = f' stroke-width="{n(w)}"' if w is not None else ""
    st = f' stroke="{color}"' if color != INK else ""
    return f'<path d="{d}" fill="none"{st}{sw}{_a(extra)}/>'


def NS(x):
    """обернуть без обводки"""
    return f'<g stroke="none">{x}</g>'


def G(content, sw=3, extra=""):
    st = "" if 'stroke="' in extra else f'stroke="{INK}" '
    return (f'<g {st}stroke-width="{sw}" stroke-linejoin="round" '
            f'stroke-linecap="round"{_a(extra)}>{content}</g>')


def tube(d, w, fill, sw=3):
    """трубка/рука с контуром: широкая тёмная линия + цветная поверх"""
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{n(w + 2 * sw)}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{n(w)}" stroke-linecap="round" stroke-linejoin="round"/>')


def dots_pattern(pid, step=16, r=1.6, op=".22"):
    return (f'<pattern id="{pid}" width="{step}" height="{step}" patternUnits="userSpaceOnUse">'
            f'<circle cx="{step/2}" cy="{step/2}" r="{r}" fill="{BRAND}" opacity="{op}"/></pattern>')


def badge(x, y, r=22, sw=3):
    """янтарный «сервисный» значок с гаечным ключом — сквозная акцентная деталь"""
    k = r / 22
    return (f'<g transform="translate({n(x)} {n(y)}) scale({n(round(k, 3))})">'
            f'<circle r="22" fill="{ACC}" stroke="{WHITE}" stroke-width="4"/>'
            f'<path d="M-8 8 L2.5 -2.5" stroke="{INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>'
            f'<circle cx="4.6" cy="-4.6" r="6.6" fill="none" stroke="{INK}" stroke-width="4"/>'
            f'<path d="M4.6 -4.6 L11 -11" stroke="{ACC}" stroke-width="5" stroke-linecap="round"/>'
            f'</g>')


def check_badge(x, y, r=18, fill=BRAND):
    k = r / 18
    return (f'<g transform="translate({n(x)} {n(y)}) scale({n(round(k, 3))})">'
            f'<circle r="18" fill="{fill}" stroke="{WHITE}" stroke-width="4"/>'
            f'<path d="M-7 0.5 L-2 5.5 L8 -5" fill="none" stroke="{WHITE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>')


def sparkle(x, y, s=8, fill=ACC):
    d = (f"M{n(x)} {n(y - s)} Q{n(x + s * .18)} {n(y - s * .18)} {n(x + s)} {n(y)} "
         f"Q{n(x + s * .18)} {n(y + s * .18)} {n(x)} {n(y + s)} Q{n(x - s * .18)} {n(y + s * .18)} {n(x - s)} {n(y)} "
         f"Q{n(x - s * .18)} {n(y - s * .18)} {n(x)} {n(y - s)}Z")
    return f'<path d="{d}" fill="{fill}" stroke="none"/>'


def gear(cx, cy, r_out, r_in, teeth, fill=BRAND, extra=""):
    pts = []
    for i in range(teeth):
        a0 = 2 * math.pi * i / teeth
        da = 2 * math.pi / teeth
        for (a, r) in ((a0 - da * .22, r_out), (a0 + da * .22, r_out), (a0 + da * .30, r_in), (a0 + da * .70, r_in)):
            pts.append(f"{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}")
    return f'<path d="M{" L".join(pts)}Z" fill="{fill}"{_a(extra)}/>'


def svg(name, w, h, title, desc, body, defs=""):
    pid = name.replace(".svg", "")
    d = f"<defs>{defs}</defs>" if defs else ""
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
         f'role="img" aria-labelledby="{pid}-t {pid}-d">'
         f'<title id="{pid}-t">{title}</title><desc id="{pid}-d">{desc}</desc>{d}{body}</svg>\n')
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(s)
    return len(s.encode())


def svg_deco(name, w, h, body, defs=""):
    d = f"<defs>{defs}</defs>" if defs else ""
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
         f'aria-hidden="true" focusable="false">{d}{body}</svg>\n')
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(s)
    return len(s.encode())
