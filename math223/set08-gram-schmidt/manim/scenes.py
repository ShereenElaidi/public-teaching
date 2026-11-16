"""Gram–Schmidt demo, MATH 223 Set 8: the Manim pictures for scenes 002–003.

Each scene is cut into one silent clip per step with `--save_sections`; every section starts on
the previous section's last frame, so the web player can chain them without a seam.
The clips hold the PICTURE only (vectors, curves, labels, at most a 2–3-word tag). All formulas
and sentences live in ../assets/steps.js and are typeset in the page.

Frame: 10 × 8 Manim units, rendered at 1680 × 1344 (final) or 560 × 448 (draft). The page shows
it in a 1120 × 896 px box, so 1 unit = 112 page px and the board grid (0.5 u = 56 px) lines up
with the CSS grid around it.

Style contract (copied by assets/space3d.js and assets/sandbox.js — keep them in step):
    arrows      shaft stroke 6, round cap; filled triangular tip, length 0.26 u, half-width 0.12 u
    labels      MathTex, font_size 40 (italic serif, subscripts)
    tags        JetBrains Mono caps, font_size 20, bold, MINT (or CHALK at DIM)
    drop-lines  MINT dashed, stroke 3, dash 0.1 u
    span lines  CHALK dotted, stroke 2.5, opacity 0.45
    right angle MINT, side 0.24 u, stroke 3
    axes        CHALK, stroke 2.5, opacity 0.4

Every coordinate below is computed from the formulas (checked in verify.py), never placed by hand.
Render with ../build.sh.
"""
from __future__ import annotations

from fractions import Fraction as Fr

from chalkboard import *

config.frame_width = 10
config.frame_height = 8

ARROW_SW = 6
TIP_LEN = 0.26
TIP_HALF = 0.12
LABEL_FS = 40
TAG_FS = 20
AXIS_OPACITY = 0.4


# ---------------------------------------------------------------- primitives
def vec(start, end, color=CHALK, sw: float = ARROW_SW) -> VGroup:
    """Arrow with the house tip. Degenerate (zero) vectors become an empty group."""
    start, end = np.array(start, dtype=float), np.array(end, dtype=float)
    d = end - start
    n = np.linalg.norm(d)
    if n < 1e-6:
        return VGroup(Line(start, start + RIGHT * 1e-4, stroke_width=0), Dot(start, radius=0, fill_opacity=0))
    u = d / n
    perp = np.array([-u[1], u[0], 0])
    tl = min(TIP_LEN, 0.45 * n)
    th = TIP_HALF * tl / TIP_LEN
    base = end - u * tl
    shaft = Line(start, end - u * tl * 0.85, color=color, stroke_width=sw).set_cap_style(CapStyleType.ROUND)
    tip = Polygon(end, base + perp * th, base - perp * th, color=color, fill_color=color,
                  fill_opacity=1, stroke_width=0)
    return VGroup(shaft, tip)


def grow(mob: VGroup, start, end, color=CHALK, run_time: float = 0.9, **kw) -> Animation:
    start, end = np.array(start, dtype=float), np.array(end, dtype=float)

    def upd(m, a):
        m.become(vec(start, start + (end - start) * max(a, 0.002), color))

    return UpdateFromAlphaFunc(mob, upd, run_time=run_time, rate_func=kw.get("rate_func", smooth))


def retarget(mob: VGroup, start0, end0, start1, end1, color, run_time: float = 1.0) -> Animation:
    """Move an arrow from (start0, end0) to (start1, end1), redrawing the tip every frame."""
    s0, e0, s1, e1 = (np.array(p, dtype=float) for p in (start0, end0, start1, end1))
    op = mob[0].get_stroke_opacity()

    def upd(m, a):
        m.become(vec(s0 + (s1 - s0) * a, e0 + (e1 - e0) * a, color).set_opacity(op))

    return UpdateFromAlphaFunc(mob, upd, run_time=run_time, rate_func=smooth)


def lab(tex: str, at, color=CHALK, fs: float = LABEL_FS) -> MathTex:
    return MathTex(tex, font_size=fs, color=color).move_to(at)


def tag(text: str, at, color=MINT, opacity: float = 1.0) -> Text:
    return Text(text.upper(), font_size=TAG_FS, color=color, weight=BOLD).set_opacity(opacity).move_to(at)


def right_angle(o, d1, d2, s: float = 0.24, color=MINT) -> VMobject:
    o = np.array(o, dtype=float)
    a = np.array([*d1, 0.0][:3], dtype=float); a = a / np.linalg.norm(a)
    b = np.array([*d2, 0.0][:3], dtype=float); b = b / np.linalg.norm(b)
    return VMobject(color=color, stroke_width=3).set_points_as_corners(
        [o + s * a, o + s * a + s * b, o + s * b]).set_joint_type(LineJointType.MITER)


def drop(p, q, color=MINT) -> DashedLine:
    return DashedLine(p, q, color=color, stroke_width=3, dash_length=0.1, dashed_ratio=0.55)


def span_line(p, q) -> DashedLine:
    return DashedLine(p, q, color=CHALK, stroke_width=2.5, dash_length=0.05, dashed_ratio=0.4).set_opacity(0.45)


class Plane2D:
    """Coordinates → screen: origin `o` (screen point), scale `s` units per coordinate."""

    def __init__(self, o, s: float, sy: float | None = None):
        self.o, self.sx, self.sy = np.array([*o, 0.0][:3], dtype=float), s, sy if sy is not None else s

    def p(self, x, y=None) -> np.ndarray:
        if y is None:
            x, y = x
        return self.o + np.array([float(x) * self.sx, float(y) * self.sy, 0.0])

    def axes(self, xr, yr, ticks_x=(), ticks_y=()) -> VGroup:
        g = VGroup(Line(self.p(xr[0], 0), self.p(xr[1], 0)), Line(self.p(0, yr[0]), self.p(0, yr[1])))
        for t in ticks_x:
            g.add(Line(self.p(t, 0) + DOWN * 0.07, self.p(t, 0) + UP * 0.07))
        for t in ticks_y:
            g.add(Line(self.p(0, t) + LEFT * 0.07, self.p(0, t) + RIGHT * 0.07))
        return g.set_stroke(CHALK, 2.5, opacity=AXIS_OPACITY)


def fr(q) -> float:
    return float(Fr(q))


# ---------------------------------------------------------------- 002: Ex in R^2
class Scene002(BoardScene):
    """w1 = (3,1), w2 = (2,2)."""

    def construct(self):
        P = Plane2D((-2.5, -2.0), 1.8)
        w1, w2 = np.array([3, 1]), np.array([2, 2])
        c = Fr(8, 10)                                       # <w2,v1>/|v1|^2
        foot = np.array([fr(c * 3), fr(c * 1)])             # (12/5, 4/5)
        v2 = w2 - foot                                      # (-2/5, 6/5)
        O = P.p(0, 0)

        self.add(P.axes((-1.25, 4.0), (-0.9, 3.2), ticks_x=(1, 2, 3), ticks_y=(1, 2, 3)))

        # 1 — both vectors; v1 = w1 is free
        self.next_section("002_1")
        a1, a2 = VGroup(), VGroup()
        l1 = lab("w_1", P.p(*w1) + RIGHT * 0.42)
        l2 = lab("w_2", P.p(*w2) + UR * 0.3)
        self.add(a1, a2)
        self.play(grow(a1, O, P.p(*w1)), FadeIn(l1, shift=RIGHT * 0.1, run_time=0.9))
        self.play(grow(a2, O, P.p(*w2)), FadeIn(l2, shift=UR * 0.1, run_time=0.9))
        self.wait(0.3)
        l1v = lab("v_1 = w_1", P.p(*w1) + RIGHT * 0.95 + DOWN * 0.02, YELLOW)
        self.play(a1.animate.set_color(YELLOW), ReplacementTransform(l1, l1v), run_time=0.8)
        self.wait(0.5)

        # 2 — the shadow of w2 on v1
        self.next_section("002_2")
        sp = span_line(P.p(*(-0.45 * w1)), P.p(*(1.45 * w1)))
        l1n = lab("v_1", P.p(*w1) + RIGHT * 0.42)
        self.play(a1.animate.set_color(CHALK), ReplacementTransform(l1v, l1n), run_time=0.6)
        self.play(Create(sp), run_time=0.8)
        self.bring_to_front(a1)
        dl = drop(P.p(*w2), P.p(*foot))
        self.play(Create(dl), run_time=0.8)
        sh = VGroup()
        self.add(sh)
        t_sh = tag("shadow", P.p(*foot) + np.array([0.45, -0.55, 0]))
        self.play(grow(sh, O, P.p(*foot), MINT), FadeIn(t_sh), run_time=1.0)
        self.wait(0.6)

        # 3 — subtract: the leftover is perpendicular
        self.next_section("002_3")
        left = VGroup()
        self.add(left)
        ra = right_angle(P.p(*foot), w2 - foot, w1)
        self.play(grow(left, P.p(*foot), P.p(*w2), YELLOW), FadeOut(dl), run_time=1.0)
        self.play(Create(ra), run_time=0.45)
        self.wait(0.6)

        # 4 — v2 moves to the origin; w2 dims
        self.next_section("002_4")
        sp2 = span_line(P.p(*(-1.15 * v2)), P.p(*(2.35 * v2)))
        l_v2 = lab("v_2", P.p(*v2) + LEFT * 0.42 + UP * 0.12, YELLOW)
        ra0 = right_angle(O, w1, v2)
        self.play(
            retarget(left, P.p(*foot), P.p(*w2), O, P.p(*v2), YELLOW),
            Transform(ra, ra0),
            a2.animate.set_opacity(DIM), l2.animate.set_opacity(DIM),
            sh.animate.set_opacity(DIM), t_sh.animate.set_opacity(0),
            run_time=1.2,
        )
        self.play(FadeIn(l_v2, shift=LEFT * 0.1), Create(sp2), run_time=0.7)
        self.bring_to_front(left, a1)
        self.wait(0.6)

        # 5 — the check
        self.next_section("002_5")
        t_ok = tag("orthogonal ✓", O + np.array([0.15, -0.5, 0]))
        self.play(left.animate.set_color(CHALK), l_v2.animate.set_color(CHALK), run_time=0.5)
        self.play(Indicate(ra, color=MINT, scale_factor=1.6), FadeIn(t_ok), run_time=1.0)
        self.wait(0.6)


# ---------------------------------------------------------------- 003: (OB) -> (ONB)
class Scene003(BoardScene):
    def construct(self):
        # 1 — R^2: the orthogonal basis from 002, and the unit circle
        self.next_section("003_1")
        P = Plane2D((-2.5, -2.0), 1.8)
        O = P.p(0, 0)
        v1, v2 = np.array([3.0, 1.0]), np.array([-0.4, 1.2])
        u1, u2 = v1 / np.sqrt(10), np.array([-1.0, 3.0]) / np.sqrt(10)
        axes = P.axes((-1.25, 4.0), (-0.9, 3.2))
        a1, a2 = VGroup(), VGroup()
        L1 = lab("v_1", P.p(*v1) + RIGHT * 0.42)
        L2 = lab("v_2", P.p(*v2) + LEFT * 0.42 + UP * 0.12)
        ra = right_angle(O, v1, v2)
        self.add(axes, a1, a2)
        self.play(grow(a1, O, P.p(*v1)), grow(a2, O, P.p(*v2)), FadeIn(L1), FadeIn(L2), Create(ra), run_time=1.0)
        circ = DashedVMobject(Circle(radius=P.sx, color=MINT, stroke_width=3).move_to(O), num_dashes=48)
        self.play(Create(circ), run_time=0.9)
        self.wait(0.5)

        # 2 — u1 = v1 / |v1|
        self.next_section("003_2")
        M1 = lab("u_1", P.p(*u1) + DR * 0.3, YELLOW)
        self.play(retarget(a1, O, P.p(*v1), O, P.p(*u1), YELLOW), ReplacementTransform(L1, M1), run_time=1.4)
        self.wait(0.6)

        # 3 — u2 = v2 / |v2|, then zoom so the unit circle fills the picture
        self.next_section("003_3")
        M2 = lab("u_2", P.p(*u2) + UL * 0.3, YELLOW)
        self.play(a1.animate.set_color(CHALK), M1.animate.set_color(CHALK),
                  retarget(a2, O, P.p(*v2), O, P.p(*u2), YELLOW), ReplacementTransform(L2, M2), run_time=1.4)
        Z = Plane2D((-0.3, -0.6), 3.0)
        world = VGroup(axes, circ, ra)
        k = Z.sx / P.sx
        self.play(
            world.animate.scale(k, about_point=O).shift(Z.p(0, 0) - O),
            retarget(a1, O, P.p(*u1), Z.p(0, 0), Z.p(*u1), CHALK),
            retarget(a2, O, P.p(*u2), Z.p(0, 0), Z.p(*u2), YELLOW),
            M1.animate.move_to(Z.p(*u1) + DR * 0.32), M2.animate.move_to(Z.p(*u2) + UL * 0.32),
            run_time=1.3,
        )
        ra.set_stroke(width=3)
        t1 = tag("length 1", Z.p(1.2, -0.85))
        self.play(FadeIn(t1), run_time=0.5)
        self.wait(0.6)

        # 4 — inside GS the shadow divides by |v|^2 (dividing by |v| overshoots)
        self.next_section("003_4")
        self.play(*[FadeOut(m) for m in (world, a1, a2, M1, M2, t1)], run_time=0.6)
        R = Plane2D((-4.25, -1.55), 1.12)
        O = R.p(0, 0)
        w2 = np.array([2.0, 2.0])
        good = (8 / 10) * v1                         # <w2,v1>/|v1|^2 v1 = (12/5, 4/5)
        bad = (8 / np.sqrt(10)) * v1                 # <w2,v1>/|v1|  v1 ≈ (7.59, 2.53): overshoots
        ax3 = R.axes((-0.6, 8.0), (-0.9, 4.6))
        sp = span_line(R.p(*(-0.25 * v1)), R.p(*(2.75 * v1)))
        b1, b2 = VGroup(), VGroup()
        self.add(ax3, sp, b1, b2)
        self.play(FadeIn(ax3), Create(sp), grow(b1, O, R.p(*v1)), grow(b2, O, R.p(*w2)), run_time=0.9)
        Lw = lab("w_2", R.p(*w2) + UL * 0.3).set_opacity(DIM)
        Lv = lab("v_1", R.p(*v1) + DOWN * 0.42 + RIGHT * 0.1).set_opacity(DIM)
        self.play(b1.animate.set_opacity(DIM), b2.animate.set_opacity(DIM), FadeIn(Lw), FadeIn(Lv), run_time=0.4)
        g, b = VGroup(), VGroup()
        self.add(b, g)          # the correct (mint) shadow stays on top of the coral overshoot
        dg = drop(R.p(*w2), R.p(*good))
        rg = right_angle(R.p(*good), w2 - good, v1, s=0.2)
        # labels name the actual vectors: <w2,v1>/|v1|^2 v1 = (8/10) v1  vs  <w2,v1>/|v1| v1 = (8/sqrt10) v1
        lg = lab(r"\tfrac{8}{10}\,v_1", R.p(*good) + DOWN * 0.6 + RIGHT * 0.35, MINT, fs=34)
        self.play(grow(g, O, R.p(*good), MINT), FadeIn(lg), run_time=0.9)
        self.play(Create(dg), run_time=0.5)          # the drop-line only once its foot exists
        self.play(Create(rg), run_time=0.35)
        db = drop(R.p(*w2), R.p(*bad), CORAL)
        lb = lab(r"\tfrac{8}{\sqrt{10}}\,v_1", R.p(*bad) + DOWN * 0.62 + LEFT * 0.3, CORAL, fs=34)
        tb = tag("overshoots", R.p(*bad) + UP * 0.45 + LEFT * 0.6, CORAL)
        self.play(grow(b, O, R.p(*bad), CORAL), FadeIn(lb), FadeIn(tb), run_time=1.1)
        self.play(Create(db), run_time=0.6)
        self.wait(1.4)
        # 5 — normalizing: the other division, on its own click
        self.next_section("003_5")
        Z = Plane2D((-0.6, -1.2), 3.6)
        self.play(*[FadeOut(m) for m in (ax3, sp, b1, b2, Lw, Lv, g, b, dg, rg, lg, db, lb, tb)], run_time=0.6)
        O = Z.p(0, 0)
        circ = DashedVMobject(Circle(radius=Z.sx, color=MINT, stroke_width=3).move_to(O), num_dashes=56)
        axz = Z.axes((-0.7, 1.35), (-0.25, 1.15))
        n1, n2, nb = VGroup(), VGroup(), VGroup()
        short = v1 / 10                              # v1/|v1|^2: too short
        self.add(axz, n1, n2, nb)
        self.play(FadeIn(axz), Create(circ), run_time=0.7)
        Lu1 = VGroup(lab("u_1", Z.p(*u1) + RIGHT * 0.42 + UP * 0.1),
                     lab(r"\frac{v_1}{\norm{v_1}}", Z.p(*(0.62 * u1)) + UP * 0.62 + LEFT * 0.2, MINT, fs=34))
        Lu2 = lab("u_2", Z.p(*u2) + UL * 0.3)
        self.play(grow(n1, O, Z.p(*u1)), grow(n2, O, Z.p(*u2)), FadeIn(Lu1), FadeIn(Lu2),
                  Create(right_angle(O, u1, u2)), run_time=1.0)
        Lb = lab(r"\frac{v_1}{\norm{v_1}^2}", Z.p(*short) + DOWN * 0.7 + RIGHT * 0.8, CORAL, fs=34)
        tb2 = tag("too short", Z.p(*short) + DOWN * 1.4 + RIGHT * 0.8, CORAL)
        self.play(grow(nb, O, Z.p(*short), CORAL), FadeIn(Lb), FadeIn(tb2), run_time=1.0)
        self.wait(0.8)
