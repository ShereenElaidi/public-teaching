# Gram–Schmidt demo · MATH 223 Set 8

Open `index.html` (works from `file://`, from any static server, or from GitHub Pages).
Nothing is fetched from the internet: KaTeX, fonts and clips are all in this folder.

## Keys

| Key | |
|---|---|
| → · PageDown · Space · click | next step |
| ← · PageUp | back (shows the step's final state) |
| R | replay the current step |
| 1–6 | jump to a scene (also the **SCENES** menu, top left) |
| C · N · F · B | captions · notes (scrolls down to the scene's notes and Try-it prompts, below the slide; N or Esc scrolls back) · fullscreen · bright board |
| V · Home / double-click · A | 3D scenes and sandbox: edge-on view of span{v₁,v₂} · back to the step's view · auto-rotate |
| S | **Settings & keys** menu (also the SETTINGS button, top left): every control above, with what it does and whether it's on; its rows are clickable, so V / A / Home work by touch too |

Drag inside the 3D pictures to rotate them (touch works too). In the sandbox (006) students type three
vectors of ℝ³ — integers, decimals or fractions like 1/3 — or pick a preset; → steps through one vector at a time (v₁, v₂, v₃, then u₁, u₂, u₃),
computed exactly. A set that isn't a basis makes some v_k = 0 and (GS) stops there, in coral.
`index.html?w=1,2,-1;1,3,1;2,5,0#006-2` opens the sandbox on that basis, at step 2.
On a phone the layout stacks and ‹ › buttons replace the keys. A URL like `index.html#004-3` opens scene 004, step 3.

## Editing

- **All words** (captions, panel lines, notes, *Try it*) and the **3D camera presets** are in
  `assets/steps.js`. Positions in the 3D scenes are computed there from the formulas.
- `assets/chalkboard.css` — colours (dark and `html.bright`), layout. `assets/chalkboard.js` — player.
- `assets/space3d.js` — 3D renderer and drawing kit (004, 005, and the 006 sandbox in `assets/sandbox.js`).

## Rebuilding the clips (002–003)

```
MANIM=/path/to/manim ./build.sh            # final: dark + bright, 1680×1344 @ 60 fps
MANIM=/path/to/manim ./build.sh draft 003  # 480p draft of one scene into clips-draft/
python3 manim/verify.py                    # sympy check of every number used anywhere
```

`manim/scenes.py` holds the pictures (no formulas or sentences — those live in the page);
`manim/chalkboard.py` is the Green Chalkboard style with the voiceover parts removed.
Fonts: JetBrains Mono (SIL OFL, `assets/fonts/JetBrainsMono-OFL.txt`); KaTeX (MIT, `assets/katex/LICENSE`).
