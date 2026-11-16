"""Green Chalkboard house style for MATH 223 videos.

Visual identity: green board with a faint graph-paper grid, math in Computer Modern
(LaTeX's own), everything else in a mono font.

Colour jobs (one each):
    BOARD       every surface
    BOARD_DEEP  panels and boxes on the board
    CHALK       math and text; earlier steps fade to DIM opacity
    MINT        structure: curves, step numbers, labels, definition boxes
    YELLOW      the answer, at most once per frame (underline, tangent, key point)
    CORAL       mistakes and "don't"

Copied into the Gram–Schmidt demo (MATH 223 Set 8) with the voiceover parts removed:
the demo's clips are silent. Fonts come from ../assets/fonts (the same JetBrains Mono the web
page uses). Set CHALK_PALETTE=bright before rendering for the pale "bright board" palette
(must match the --b-* colours in assets/chalkboard.css).

    from chalkboard import *
"""
from __future__ import annotations

import os

from pathlib import Path

import manimpango
import numpy as np
from manim import *

# ---------------------------------------------------------------- palette
BRIGHT = os.environ.get("CHALK_PALETTE", "").lower() == "bright"
if not BRIGHT:
    BOARD = "#1E3A2D"
    BOARD_DEEP = "#172F24"
    CHALK = "#EEF3EA"
    MINT = "#A6DCA9"
    YELLOW = "#F3C64F"
    CORAL = "#F0907F"
else:  # pale-green board, "teacher's pens": dark ink, green structure, blue answers, red mistakes
    BOARD = "#E4EDDF"
    BOARD_DEEP = "#D5E3CD"
    CHALK = "#1B2F24"
    MINT = "#2E7A4E"   # green pen: structure
    YELLOW = "#1F5BC6"  # blue pen: the answer
    CORAL = "#D0342C"   # red pen: mistakes
DIM = 0.55  # opacity for past steps and secondary text

# ---------------------------------------------------------------- fonts
_FONT_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
for _f in sorted(_FONT_DIR.glob("*.[ot]tf")) if _FONT_DIR.exists() else []:
    manimpango.register_font(str(_f))

_PREFERRED_MONO = ["JetBrains Mono", "IBM Plex Mono", "Space Mono", "DM Mono", "Menlo"]
_available = set(manimpango.list_fonts())
MONO = next((f for f in _PREFERRED_MONO if f in _available), "Monospace")

# ---------------------------------------------------------------- LaTeX
# Course macros: read live from the course's shared/macros.tex when this folder sits inside the
# course workspace, so notation always matches the notes; otherwise use the snapshot next to this file.
def _find_macros() -> Path:
    for parent in Path(__file__).resolve().parents:
        cand = parent / "shared" / "macros.tex"
        if cand.exists():
            return cand
    return Path(__file__).resolve().parent / "macros.tex"


MACROS = _find_macros()


def _tex_template() -> TexTemplate:
    # Minimal preamble: Manim's default loads `physics`, which clashes with \norm, \abs, \tr.
    t = TexTemplate(preamble=r"""
\usepackage[english]{babel}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{xcolor}
""")
    if MACROS.exists():
        t.add_to_preamble(MACROS.read_text())
    return t


TEMPLATE = _tex_template()
MathTex.set_default(tex_template=TEMPLATE, color=CHALK)
Tex.set_default(tex_template=TEMPLATE, color=CHALK)
Text.set_default(font=MONO, color=CHALK)
MarkupText.set_default(font=MONO, color=CHALK)

config.background_color = BOARD


def use_vertical():
    """Switch to 9:16. Call at module level, after the import, in a shorts file."""
    if config.pixel_width > config.pixel_height:
        config.pixel_width, config.pixel_height = config.pixel_height, config.pixel_width
    config.frame_width = 8.0
    config.frame_height = 8.0 * 16 / 9


def is_vertical() -> bool:
    return config.frame_height > config.frame_width


# ---------------------------------------------------------------- the board
def board_grid(minor: float = 0.5, every: int = 5) -> VGroup:
    """Faint graph paper over the whole frame: minor lines, heavier every `every` squares."""
    w, h = config.frame_width / 2, config.frame_height / 2
    lines = VGroup()
    for axis in (0, 1):
        half = w if axis == 0 else h
        n = int(np.ceil(half / minor))
        for i in range(-n, n + 1):
            c = i * minor
            major = i % every == 0
            a, b = ([c, -h, 0], [c, h, 0]) if axis == 0 else ([-w, c, 0], [w, c, 0])
            lines.add(Line(a, b, stroke_width=1.2 if major else 0.8, color=CHALK,
                           stroke_opacity=0.10 if major else 0.05))
    return lines


def label(text: str, size: float = 18, color=CHALK, opacity: float = DIM) -> Text:
    """Small caps-style label (top bars, tabs, signatures)."""
    return Text(text.upper(), font_size=size, color=color).set_opacity(opacity)


def top_bar(left: str, right: str = "", size: float | None = None) -> VGroup:
    size = size or (22 if is_vertical() else 18)
    l = label(left, size)
    r = label(right, size)
    buff = 0.45
    l.to_corner(UL, buff=buff)
    r.to_corner(UR, buff=buff)
    r.align_to(l, UP)
    return VGroup(l, r)


def mono(text: str, size: float = 30, color=CHALK, bold: bool = False, **kw) -> Text:
    return Text(text, font_size=size, color=color, weight=BOLD if bold else NORMAL, **kw)


# ---------------------------------------------------------------- emphasis
def chalk_underline(mob: Mobject, color=YELLOW, width: float = 7, buff: float = 0.12) -> Line:
    """Yellow underline under `mob`. Animate with Create() so it sweeps left → right."""
    return Line(mob.get_corner(DL) + DOWN * buff, mob.get_corner(DR) + DOWN * buff,
                color=color, stroke_width=width).set_cap_style(CapStyleType.ROUND)


def reveal_answer(mob: Mobject, run_time: float = 0.8) -> tuple[Animation, Line]:
    """Turn `mob` yellow and sweep an underline under it. The one beat of emphasis per frame.

        anim, line = reveal_answer(eq[2]); self.play(anim)
    """
    line = chalk_underline(mob)
    return AnimationGroup(mob.animate.set_color(YELLOW), Create(line), lag_ratio=0.3, run_time=run_time), line


def strike(mob: Mobject, color=CORAL, width: float = 7) -> Line:
    """Coral strike-through for the wrong version."""
    return Line(mob.get_left() + LEFT * 0.12 + DOWN * 0.08, mob.get_right() + RIGHT * 0.12 + UP * 0.12,
                color=color, stroke_width=width).set_cap_style(CapStyleType.ROUND)


class Derivation(VGroup):
    """Lines of working, written one at a time. Earlier lines dim to 55%; nothing is erased.

        d = Derivation(r"\\ip{f}{g}", r"= \\int_0^1 1\\cdot(2x-1)\\,dx", "= 0").to_edge(LEFT)
        self.play(d.next())   # line 1
        self.play(d.next())   # line 2, line 1 dims
        anim, _ = reveal_answer(d[-1]); self.play(anim)
    Each line may be a str or a list of tex parts (for colouring parts later).
    """

    def __init__(self, *lines, font_size: float = 48, buff: float = 0.35, **kw):
        mobs = [MathTex(*(l if isinstance(l, (list, tuple)) else [l]), font_size=font_size, **kw) for l in lines]
        super().__init__(*mobs)
        self.arrange(DOWN, aligned_edge=LEFT, buff=buff)
        self.cursor = 0

    def next(self, run_time: float = 1.0) -> Animation:
        cur = self[self.cursor]
        prev = [m for m in self[: self.cursor]]
        self.cursor += 1
        anims = [Write(cur, run_time=run_time)]
        if prev:
            anims.append(AnimationGroup(*[m.animate.set_opacity(DIM) for m in prev], run_time=0.5))
        return AnimationGroup(*anims)


# ---------------------------------------------------------------- frame components
def definition_box(tab: str, body: Mobject, note: str | None = None, width: float | None = None) -> VGroup:
    """Mint-framed box with a tab label: Definition, Theorem, Lemma, Recap."""
    content = VGroup(body)
    if note:
        content.add(mono(note, 24).set_opacity(DIM))
        content.arrange(DOWN, buff=0.4)
    w = width or max(content.width + 1.4, 6)
    box = RoundedRectangle(corner_radius=0.15, width=w, height=content.height + 1.2,
                           stroke_color=MINT, stroke_width=3, fill_color=BOARD_DEEP, fill_opacity=0.85)
    content.move_to(box).shift(DOWN * 0.08)
    t = Text(tab.upper(), font_size=18, color=BOARD, weight=BOLD)
    chip = RoundedRectangle(corner_radius=0.06, width=t.width + 0.36, height=t.height + 0.22,
                            fill_color=MINT, fill_opacity=1, stroke_width=0)
    t.move_to(chip)
    tabg = VGroup(chip, t).move_to(box.get_corner(UL) + RIGHT * (chip.width / 2 + 0.4))
    g = VGroup(box, content, tabg)
    g.box, g.body, g.tab = box, body, tabg
    return g


def lower_third(text: str, tag: str = "NOTE") -> VGroup:
    """Caption band along the bottom for the spoken idea."""
    W = config.frame_width
    band = Rectangle(width=W + 0.1, height=1.0, fill_color=BOARD_DEEP, fill_opacity=0.92, stroke_width=0)
    band.to_edge(DOWN, buff=0)
    t = Text(tag, font_size=18, color=BOARD, weight=BOLD)
    chip = RoundedRectangle(corner_radius=0.05, width=t.width + 0.3, height=t.height + 0.2,
                            fill_color=MINT, fill_opacity=1, stroke_width=0)
    t.move_to(chip)
    cap = mono(text, 26)
    row = VGroup(VGroup(chip, t), cap).arrange(RIGHT, buff=0.3)
    row.move_to(band).align_to(band, LEFT).shift(RIGHT * 0.6)
    g = VGroup(band, row)
    g.caption = cap
    return g


def step_badge(n: int, radius: float = 0.38) -> VGroup:
    ring = Circle(radius=radius, color=MINT, stroke_width=5)
    num = MathTex(rf"\mathbf{{{n}}}", color=MINT, font_size=radius * 120).move_to(ring)
    return VGroup(ring, num)


def progress(i: int, total: int, seg: float = 0.55) -> VGroup:
    """Chapter progress bar: done = mint, current = chalk, todo = faint."""
    bars = VGroup(*[
        RoundedRectangle(corner_radius=0.03, width=seg, height=0.08, stroke_width=0,
                         fill_color=MINT if k < i - 1 else CHALK,
                         fill_opacity=1 if k <= i - 1 else 0.15)
        for k in range(total)
    ]).arrange(RIGHT, buff=0.15)
    txt = label(f"{i} / {total}", 18)
    return VGroup(bars, txt).arrange(RIGHT, buff=0.3)


def caption_bar(text: str, size: float = 28, width: float | None = None) -> VGroup:
    """Caption with a yellow bar on its left (shorts)."""
    width = width or config.frame_width - 1.6
    t = Paragraph(*_wrap(text, size, width - 0.5), font=MONO, font_size=size, color=CHALK, line_spacing=0.9)
    bar = Rectangle(width=0.1, height=t.height + 0.2, fill_color=YELLOW, fill_opacity=1, stroke_width=0)
    return VGroup(bar, t).arrange(RIGHT, buff=0.3, aligned_edge=UP)


def _wrap(text: str, size: float, width: float) -> list[str]:
    """Greedy word wrap using measured mono widths."""
    char_w = Text("M", font=MONO, font_size=size).width
    per_line = max(8, int(width / char_w))
    lines, cur = [], ""
    for word in text.split():
        if len(cur) + len(word) + (1 if cur else 0) > per_line:
            lines.append(cur)
            cur = word
        else:
            cur = f"{cur} {word}".strip()
    if cur:
        lines.append(cur)
    return lines


def sticker(text: str, size: float = 40, angle: float = -2 * DEGREES) -> VGroup:
    """Chalk-white label with board-coloured text, slightly tilted (thumbnails)."""
    t = Text(text, font_size=size, color=BOARD, weight=BOLD)
    bg = RoundedRectangle(corner_radius=0.06, width=t.width + 0.5, height=t.height + 0.3,
                          fill_color=CHALK, fill_opacity=1, stroke_width=0)
    t.move_to(bg)
    return VGroup(bg, t).rotate(angle)


def slot(top: Mobject, caption: str, highlight: bool = False, width: float = 5.2) -> VGroup:
    """End-screen video slot (16:9). The next episode gets highlight=True (solid yellow)."""
    h = width * 9 / 16
    if highlight:
        frame = RoundedRectangle(corner_radius=0.12, width=width, height=h, stroke_color=YELLOW, stroke_width=4)
    else:
        frame = DashedVMobject(RoundedRectangle(corner_radius=0.12, width=width, height=h,
                                                stroke_color=CHALK, stroke_width=3), num_dashes=60)
        frame.set_stroke(opacity=DIM)
    cap = label(caption, 18)
    inner = VGroup(top, cap).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
    inner.move_to(frame).align_to(frame, DL).shift(UP * 0.3 + RIGHT * 0.35)
    return VGroup(frame, inner)


# ---------------------------------------------------------------- graphs
def board_axes(x_range=(-3, 3, 1), y_range=(-2, 2, 1), x_length=6, y_length=4, numbers: bool = False, **kw) -> Axes:
    """Chalk axes at 50%, no arrowheads. Plot functions on them with plot_fn()."""
    ax = Axes(x_range=list(x_range), y_range=list(y_range), x_length=x_length, y_length=y_length,
              axis_config={"color": CHALK, "stroke_opacity": 0.5, "stroke_width": 2.5, "include_tip": False,
                           "include_ticks": numbers, "font_size": 26},
              **kw)
    if numbers:
        ax.add_coordinates()
        for n in ax.coordinate_labels:
            n.set_opacity(DIM)
    return ax


def plot_fn(ax: Axes, f, color=MINT, width: float = 5, **kw) -> ParametricFunction:
    """The function: mint, thick, round caps. A second function uses CHALK."""
    return ax.plot(f, color=color, stroke_width=width, **kw).set_cap_style(CapStyleType.ROUND)


def tangent(ax: Axes, f, x0: float, span: float = 1.0, dx: float = 1e-4) -> DashedLine:
    """The thing we're solving for: yellow dash."""
    m = (f(x0 + dx) - f(x0 - dx)) / (2 * dx)
    a, b = x0 - span, x0 + span
    return DashedLine(ax.c2p(a, f(x0) + m * (a - x0)), ax.c2p(b, f(x0) + m * (b - x0)),
                      color=YELLOW, stroke_width=4, dash_length=0.16)


def secant(ax: Axes, f, x0: float, x1: float, extend: float = 0.6) -> DashedLine:
    """Approximations: chalk dots."""
    m = (f(x1) - f(x0)) / (x1 - x0)
    a, b = min(x0, x1) - extend, max(x0, x1) + extend
    return DashedLine(ax.c2p(a, f(x0) + m * (a - x0)), ax.c2p(b, f(x0) + m * (b - x0)),
                      color=CHALK, stroke_width=3, dash_length=0.05, dashed_ratio=0.4).set_opacity(0.8)


def key_point(point, color=YELLOW, radius: float = 0.1) -> Dot:
    """Key point: filled dot with a board-coloured ring so it sits on top of lines."""
    return Dot(point, radius=radius, color=color).set_stroke(BOARD, width=6)


def area(ax: Axes, graph, x_range, color=MINT, opacity: float = 0.35):
    return ax.get_area(graph, x_range=x_range, color=color, opacity=opacity)


# ---------------------------------------------------------------- scene base
class BoardScene(Scene):
    """Every scene: board background + grid."""

    grid = True

    def setup(self):
        super().setup()
        if self.grid:
            self.add(board_grid())

    def clear_board(self, run_time: float = 0.6):
        """Fade everything except the grid."""
        keep = self.mobjects[:1] if self.grid else []
        rest = [m for m in self.mobjects if m not in keep]
        if rest:
            self.play(*[FadeOut(m) for m in rest], run_time=run_time)
