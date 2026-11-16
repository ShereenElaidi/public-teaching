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
| P | predict prompts on/off. A few steps (004: the shadow of w₂, normalizing v₃; 005: will v₃ be 0?; 006: will v₃ be 0?) first ask the class; → or Enter reveals the step and the answer with its reason, ← or Esc closes the question |
| V · D / double-click · A | 3D scenes and sandbox: edge-on view of span{v₁,v₂} · back to the default view for the step · auto-rotate |
| S | **Settings & keys** menu (also the SETTINGS button, top left): every control above, with what it does and whether it's on; its rows are clickable, so V / A / D work by touch too |

Drag inside the 3D pictures to rotate them (touch works too). In the sandbox (006) students type three
vectors of ℝ³ — integers, decimals or fractions like 1/3 — or pick a preset; → steps through one vector at a time (v₁, v₂, v₃, then u₁, u₂, u₃),
computed exactly. A set that isn't a basis makes some v_k = 0 and (GS) stops there, in coral; captions, the banner
and the panel then describe only what was actually computed. Every entry is checked: an empty field, `1/0`, or text
that isn't a number is marked with the reason under its row (and `aria-invalid`), nothing is computed from it, and
→ / clicks won't move on until all nine entries are numbers. Keys typed in a field never trigger shortcuts.
`index.html?w=1,2,-1;1,3,1;2,5,0#006-2` opens the sandbox on that basis, at step 2.
On phones, small tablets and small windows the page switches from the scaled slide to a **flow layout** (`html.flow`):
the parts reflow at readable sizes, the page scrolls, the picture is scaled to the width (beside the panel in
landscape), and ‹ › stay at the bottom of the screen; every button and field is at least 44×44 px. Dragging the 3D
picture turns it; touching anywhere else scrolls. A URL like `index.html#004-3` opens scene 004, step 3.

## Editing

- **All words** (captions, panel lines, notes, *Try it*) and the **3D camera presets** are in
  `assets/steps.js`. Positions in the 3D scenes are computed there from the formulas.
- `assets/chalkboard.css` — colours (dark and `html.bright`), stage layout, and the flow layout (`html.flow`).
  `assets/chalkboard.js` — player (stage vs flow, navigation, predict prompts).
- Sandbox wording that depends on where (GS) stopped (captions, CAUTION headlines, panel) is in `stepText` /
  `panelHTML` in `assets/sandbox.js`; the captions in `steps.js` are the ones for a run that succeeds.
- `assets/space3d.js` — 3D renderer and drawing kit (004, 005, and the 006 sandbox in `assets/sandbox.js`).

## Checks

```
node --test tests/          # entry validation, exact GS, failure-state wording, predictions (no browser)
node tests/run-ui.mjs       # the real page in headless Chrome: input errors, blocking, failure states,
                            # worked examples, keys, 3D controls, layouts at phone / tablet / desktop sizes
python3 manim/verify.py     # sympy check of every number in the worked examples
```
`tests/ui.html` can also be opened directly from any local server (it must stay on screen while it runs).

## Rebuilding the clips (002–003)

```
MANIM=/path/to/manim ./build.sh            # final: dark + bright, 1680×1344 @ 60 fps
MANIM=/path/to/manim ./build.sh draft 003  # 480p draft of one scene into clips-draft/
python3 manim/verify.py                    # sympy check of every number used anywhere
```

`manim/scenes.py` holds the pictures (no formulas or sentences — those live in the page);
`manim/chalkboard.py` is the Green Chalkboard style with the voiceover parts removed.
Fonts: JetBrains Mono (SIL OFL, `assets/fonts/JetBrainsMono-OFL.txt`); KaTeX (MIT, `assets/katex/LICENSE`).
