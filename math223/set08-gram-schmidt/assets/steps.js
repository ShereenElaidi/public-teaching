/* ======================================================================
   Gram–Schmidt demo, MATH 223 Set 8 — ALL the words, step data and 3D camera presets.

   Edit freely. Per step:
     caption   one sentence in the lower third. Inline maths between $...$ (KaTeX).
     add       panel lines written in this step (earlier steps' lines stay, dimmed):
                 {m: "TeX"}            a maths line
                 {m: "TeX", ans: 1}    the answer: yellow + underline sweep (at most one per step)
                 {m: "TeX", small: 1}  a slightly smaller maths line (for long ones)
                 {m: "TeX", coral: 1}  a whole line in coral (mistakes, "this breaks")
                 {t: "words"}          a small mint label line in mono caps
     clear     true → wipe the panel before writing this step's lines
     caution   a one-line headline → the step is a CAUTION step: coral banner over the picture, coral
               panel and chip ($...$ allowed). A scene-level `caution` marks every step of the scene.
   Per scene: notes (2–4 sentences, $...$ allowed) and tryIt (prompts): the handout below the slide (N scrolls to it).
   Colour macros in TeX: \mint{..} projection terms, \yel{..}, \coral{..}, \strike{..}.
   Course macros (same as shared/macros.tex): \ip{a}{b} \norm{a} \proj \Span \vect{v} \zero \R \Poly{2}

   3D scenes (004, 005): every step has its own camera preset {yaw, pitch, zoom, target}, chosen for
   what that step shows (the 006 sandbox fits its camera to whatever was typed).
     frame  omitted: z up, the textbook view; yaw = azimuth from +x toward +y, pitch = height above xy
            "plane": span{v1, v2} is the floor (up = v1 × v2, the direction v3 will point),
                     yaw = azimuth from v1 toward v2, pitch = height above that floor
     zoom  page px per unit · target = the point at the picture's centre
   Positions are computed from the formulas below, never typed in.
   ====================================================================== */
(function () {
  "use strict";

  // ------------------------------------------------------------- tiny vector kit
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const mul = (k, a) => a.map((x) => k * x);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = (a) => Math.sqrt(dot(a, a));
  const unit = (a) => mul(1 / norm(a), a);
  const proj = (w, v) => mul(dot(w, v) / dot(v, v), v);          // shadow of w on v: <w,v>/|v|^2 v

  // ------------------------------------------------------------- 004 numbers
  const w1 = [1, 2, -1], w2 = [1, 3, 1], w3 = [1, 1, 2];
  const v1 = w1;
  const sh2 = proj(w2, v1);                       // = 1·v1
  const v2 = sub(w2, sh2);                        // (0,1,2)
  const sh3a = proj(w3, v1);                      // (1/6)v1: the shadow on v1
  const sh3b = proj(w3, v2);                      // 1·v2:     the shadow on v2
  const sh3 = add(sh3a, sh3b);                    // (1/6)v1 + 1·v2: the shadow on span{v1, v2}
  const v3 = sub(w3, sh3);                        // (1/6)(5,-2,1): same v3, so the same ONB as Example 2.8
  const u1 = unit(v1), u2 = unit(v2), u3 = unit(v3);

  // ------------------------------------------------------------- 005 numbers
  const x3 = add(w1, w2);                         // (2,5,0) = w1 + w2
  const shx = add(proj(x3, v1), proj(x3, v2));    // 2v1 + v2 = x3 itself
  const z3 = sub(x3, shx);                        // the zero vector

  // shared look for both 3D scenes
  const plane = { a: v1, b: v2, label: "span" };   // the sheet span{v1, v2}

  const S = {
    title: "MATH 223 · GRAM–SCHMIDT ALGO (GS)",
    brightClips: true,   // false → the bright board frames the dark clips instead of swapping them
    // the clickable key buttons in the lower third: [label, action, hover label]; "|" = a small gap.
    // keys3D are added in the 3D pictures (004, 005, 006).
    keys: [["←", "prev", "back"], ["→", "next", "next"], "|", ["C", "captions", "captions"],
      ["N", "notes", "notes"], ["B", "bright", "bright mode"], "|", ["S", "settings", "settings"]],
    keys3D: [["V", "edge", "edge-on view"], ["A", "auto", "auto-rotate"], ["HOME", "home", "preset view"]],
    // the SETTINGS menu (S): one row per control. act = what clicking the row does; rows without
    // act just explain. only3d rows are greyed out outside the 3D pictures (004, 005, 006).
    settings: [
      { group: "Display" },
      { key: "C", name: "Captions", act: "captions", text: "Show or hide the one-sentence caption along the bottom." },
      { key: "N", name: "Notes", act: "notes", text: "Scroll down to this scene's notes and Try-it prompts, below the slide (N again, or Esc, to come back)." },
      { key: "B", name: "Bright board", act: "bright", text: "Pale board with dark ink, for washed-out projectors." },
      { key: "F", name: "Fullscreen", act: "fullscreen", text: "Fill the screen; F or Esc to leave." },
      { group: "3D pictures · scenes 004, 005, 006", only3d: true },
      { key: "drag", name: "Turn the picture", only3d: true, text: "Drag inside the picture (touch works too). Clicks inside it never change the step." },
      { key: "V", name: "Edge-on view", act: "edge", only3d: true, text: "Look along the plane $\\Span\\{v_1, v_2\\}$: it becomes a line and $v_3$ stands straight up. V again to go back." },
      { key: "A", name: "Auto-rotate", act: "auto", only3d: true, text: "Turn the picture slowly by itself; dragging stops it." },
      { key: "Home", name: "Preset view", act: "home", only3d: true, text: "Back to the view chosen for this step (also: double-click the picture)." },
      { group: "Moving around" },
      { key: "→ · Space", name: "Next step", text: "Also PageDown, or click anywhere outside the pictures." },
      { key: "←", name: "Back", text: "Also PageUp. Shows the previous step's final state." },
      { key: "R", name: "Replay", text: "Play the current step again." },
      { key: "1–6", name: "Jump to a scene", text: "Or pick one from the SCENES menu." },
      { key: "S", name: "This menu", text: "Open or close settings; Esc closes." },
    ],
    macros: {
      "\\ip": "\\left\\langle #1,\\, #2 \\right\\rangle",
      "\\norm": "\\left\\lVert #1 \\right\\rVert",
      "\\proj": "\\operatorname{proj}",
      "\\Span": "\\operatorname{span}",
      "\\vect": "\\mathbf{#1}",
      "\\zero": "\\mathbf{0}",
      "\\R": "\\mathbb{R}",
      "\\Poly": "P_{#1}",
      "\\mint": "\\htmlClass{k-mint}{#1}",
      "\\yel": "\\htmlClass{k-yel}{#1}",
      "\\coral": "\\htmlClass{k-coral}{#1}",
      "\\strike": "\\htmlClass{k-strike}{#1}",
      "\\dimm": "\\htmlClass{k-dim}{#1}",
    },
    scenes: [],
  };

  // ===================================================================== 001
  S.scenes.push({
    id: "001", name: "001: Main Theorem", chip: "001 · Main theorem", kind: "html",
    steps: [
      {
        caption: "Gram–Schmidt Algo (GS) takes any basis and builds an orthogonal one, one vector at a time: each new $v_k$ is $w_k$ minus its shadows on the $v$'s already built.",
        add: [
          { t: "in" },
          { m: "\\{w_1, w_2, \\dots, w_n\\}\\ \\ \\text{any basis of } V" },
          { t: "out" },
          { m: "\\{v_1, v_2, \\dots, v_n\\}\\ \\ \\text{an (OB) of } V" },
        ],
      },
      {
        caption: "Any basis in, an orthogonal basis out. Normalize to make an orthonormal basis (ONB) by dividing the norm $\\norm{v_k}$.",
        add: [
          { t: "written out" },
          { m: "v_1 = w_1" },
          { m: "v_2 = w_2 - \\mint{\\frac{\\ip{w_2}{v_1}}{\\norm{v_1}^2}\\,v_1}" },
          { m: "\\begin{aligned} v_3 = w_3 - \\Big[\\,&\\mint{\\frac{\\ip{w_3}{v_1}}{\\norm{v_1}^2}\\,v_1} \\\\[2pt] +\\,&\\mint{\\frac{\\ip{w_3}{v_2}}{\\norm{v_2}^2}\\,v_2}\\,\\Big] \\end{aligned}" },
        ],
      },
    ],
    theorem: {
      tab: "Theorem 3.1 · Gram–Schmidt (GS)",
      lead: "Let $V$ be a finite-dimensional inner product space and $\\{w_1, \\dots, w_n\\}$ a basis of $V$. Then $\\{v_1, \\dots, v_n\\}$, where",
      display: "v_k \\;=\\; w_k \\;-\\; \\sum_{j=1}^{k-1} \\mint{\\left(\\frac{\\ip{w_k}{v_j}}{\\norm{v_j}^2}\\right) v_j}, \\qquad k = 1, \\dots, n,",
      tail: "form an orthogonal basis (OB) of $V$.",
      braceNote: "the shadow of $w_k$ on $\\Span\\{v_1, \\dots, v_{k-1}\\}$",
    },
    notes: [
      "Gram–Schmidt (GS) (Theorem 3.1) turns any basis $w_1, \\dots, w_n$ of an inner product space into an orthogonal basis $v_1, \\dots, v_n$.",
      "Each $v_k$ is $w_k$ minus its shadows on the earlier $v_j$. The shadow of $w_k$ on each vector $v_j$ is the vector itself $v_j$ scaled by the scalar $\\ip{w_k}{v_j} / \\norm{v_j}^2$.",
      "On the right-hand side it is the new vectors $v_j$ that appear, not the old $w_j$: you need the ones you have already made orthogonal.",
    ],
    tryIt: [
      "Write out $v_4$ for a basis of four vectors. How many shadows does it subtract?",
      "Why does the formula use $v_j$ and not $w_j$ inside the sum?",
    ],
  });

  // ===================================================================== 002
  S.scenes.push({
    id: "002", name: "002: Ex in ℝ²", chip: "002 · Ex in ℝ²", kind: "clip",
    steps: [
      {
        caption: "The first vector is free: $v_1 = w_1$, since there is nothing yet to be orthogonal to.",
        add: [{ m: "w_1 = (3,1), \\quad w_2 = (2,2)" }, { m: "v_1 = w_1 = (3,1)", ans: 1 }],
      },
      {
        caption: "The shadow of $w_2$ on $v_1$ is $\\tfrac{8}{10} v_1$ ",
        add: [
          { m: "\\ip{w_2}{v_1} = 2\\cdot 3 + 2\\cdot 1 = 8" },
          { m: "\\norm{v_1}^2 = 3^2 + 1^2 = 10" },
          { m: "\\mint{\\tfrac{8}{10}\\,v_1 = \\big(\\tfrac{12}{5}, \\tfrac{4}{5}\\big)}" },
        ],
      },
      {
        caption: "Subtract the shadow, and what is left over meets $v_1$ at a right angle — that leftover vector is exactly the orthogonal one we want.",
        add: [{ m: "w_2 - \\mint{\\tfrac{8}{10}\\,v_1} = (2,2) - \\mint{\\big(\\tfrac{12}{5}, \\tfrac{4}{5}\\big)} = \\big(-\\tfrac{2}{5}, \\tfrac{6}{5}\\big)", small: 1, ans: 1 }],
      },
      {
        caption: "Slide the leftover to the origin and you have $v_2$; rescaling never breaks orthogonality, so $(-1,3)$ would do just as well.",
        add: [{ m: "v_2 = \\big(-\\tfrac{2}{5}, \\tfrac{6}{5}\\big) = \\tfrac{2}{5}(-1, 3)", ans: 1 }],
      },
      {
        caption: "Verify it is indeed orthogonal: $\\ip{v_1}{v_2} = 0$, so $\\{(3,1), (-1,3)\\}$ is an orthogonal basis of $\\R^2$.",
        add: [{ m: "\\ip{v_1}{v_2} = \\tfrac{2}{5}\\big(3\\cdot(-1) + 1\\cdot 3\\big) = 0 \\ \\checkmark", ans: 1 }],
      },
    ],
    notes: [
      "With only two vectors, Gram–Schmidt is one subtraction: $v_2 = w_2 - \\frac{\\ip{w_2}{v_1}}{\\norm{v_1}^2}v_1$.",
      "The mint shadow is the orthogonal projection of $w_2$ onto the line through $v_1$; what is left over is perpendicular to that line by construction.",
      "Any non-zero multiple of $v_2$ works too, which is why we can also write $v_2$ as $(-1,3)$.",
    ],
    tryIt: [
      "Run (GS) on $w_1 = (2,2)$, $w_2 = (3,1)$ — the same vectors in the other order. Do you get the same basis?",
      "Divide by $\\norm{v_1} = \\sqrt{10}$ instead of $10$ and compute $\\ip{v_1}{v_2}$. What goes wrong?",
    ],
  });

  // ===================================================================== 003
  S.scenes.push({
    id: "003", name: "003: (OB) → (ONB)", chip: "003 · (OB) → (ONB)", kind: "clip",
    steps: [
      {
        caption: "For an orthonormal basis, divide each $v_i$ by its length (Lemma 2.5). (Dotted circle is the unit circle, all vectors in the plane with length 1).",
        add: [
          { m: "u_i = \\frac{v_i}{\\norm{v_i}}" },
          { m: "v_1 = (3,1), \\quad v_2 = \\tfrac25(-1,3)" },
        ],
      },
      {
        caption: "First $v_1$: $\\norm{v_1} = \\sqrt{10}$, so $u_1$ points the same way and lands on the unit circle.",
        add: [{ m: "\\norm{v_1} = \\sqrt{10} \\ \\Rightarrow\\ u_1 = \\tfrac{1}{\\sqrt{10}}(3,1)", ans: 1 }],
      },
      {
        caption: "Then $v_2$: $\\norm{v_2} = \\tfrac25\\sqrt{10}$ — directions don't change, so the right angle survives.",
        add: [{ m: "\\norm{v_2} = \\tfrac25\\sqrt{10} \\ \\Rightarrow\\ u_2 = \\tfrac{1}{\\sqrt{10}}(-1,3)", ans: 1 }],
      },
      {
        caution: "The shadow divides by $\\norm{v_j}^2$ — not by $\\norm{v_j}$",
        caption: "Inside (GS) the shadow divides by $\\norm{v_j}^2$: $\\tfrac{8}{10}v_1$ lands exactly at the foot of the right angle — divide by $\\norm{v_1}$ instead and it overshoots to $\\tfrac{8}{\\sqrt{10}}v_1$.",
        clear: true,
        add: [
          { t: "inside (GS) · the shadow" },
          { m: "\\frac{\\ip{w_k}{v_j}}{\\norm{v_j}^{\\mint{2}}}\\,v_j \\qquad \\coral{\\text{not}\\ \\frac{\\ip{w_k}{v_j}}{\\norm{v_j}}\\,v_j}" },
          { m: "\\frac{\\ip{w_2}{v_1}}{\\norm{v_1}^2}\\,v_1 = \\tfrac{8}{10}\\,v_1 \\qquad \\coral{\\text{not}\\ \\tfrac{8}{\\sqrt{10}}\\,v_1}", ans: 1, small: 1 },
        ],
      },
      {
        caution: "Normalizing divides by $\\norm{v_i}$ — not by $\\norm{v_i}^2$",
        caption: "To normalize you divide by $\\norm{v_i}$ itself: $v_1/\\norm{v_1}$ lands on the unit circle, while $v_1/\\norm{v_1}^2$ falls short.",
        clear: true,
        add: [
          { t: "to normalize · the length" },
          { m: "\\frac{v_i}{\\norm{v_i}} \\qquad \\coral{\\text{not}\\ \\frac{v_i}{\\norm{v_i}^2}}" },
          { m: "\\frac{v_1}{\\norm{v_1}} = \\tfrac{1}{\\sqrt{10}}(3,1) \\qquad \\coral{\\text{not}\\ \\tfrac{1}{10}(3,1)}", small: 1 },
          { m: "\\ip{u_i}{u_j} = \\delta_{ij} = \\begin{cases} 1 & i = j \\\\ 0 & i \\ne j \\end{cases}", ans: 1, small: 1 },
        ],
      },
    ],
    notes: [
      "Lemma 2.5: if $v_1, \\dots, v_n$ is an orthogonal basis, then $u_i = v_i / \\norm{v_i}$ is an orthonormal basis. Scaling a vector never changes which vectors it is orthogonal to.",
      "Orthonormal can be checked with inner products alone: $\\ip{u_i}{u_j} = \\delta_{ij}$, i.e. 1 on the diagonal and 0 off it.",
      "Keep the two divisions apart: a shadow uses $\\norm{v_j}^2$ (no square roots appear), normalizing uses $\\norm{v_i}$ (that's where the square roots come from).",
    ],
    tryIt: [
      "Check that $u_1 = \\tfrac{1}{\\sqrt{10}}(3,1)$ has length 1, and that $\\tfrac{1}{10}(3,1)$ (dividing by $\\norm{v_1}^2$) does not.",
      "Would normalizing each $v_j$ during (GS) (instead of at the end) change the directions you get?",
    ],
  });

  // ===================================================================== 004
  S.scenes.push({
    id: "004", name: "004: Ex in ℝ³", chip: "004 · Ex in ℝ³", kind: "space3d",
    space: {
      axes: 3.2,
      plane: { a: plane.a, b: plane.b, s: [-0.06, 1.15], t: [-0.06, 1.15], label: [1.15, 1.15] },
    },
    steps: [
      {
        caption: "Three vectors in $\\R^3$: First $w_1 = (1,2,-1)$.",
        cam: { yaw: -20, pitch: 24, zoom: 230, target: [0.43, 1.52, 0.26] },
        add: [{ m: "w_1 = (1,2,-1)" }],
        els: { w1: { kind: "vec", to: w1, label: "w_1" } },
      },
      {
        caption: "Then $w_2 = (1,3,1)$ — not orthogonal to $w_1$: $\\ip{w_1}{w_2} = 6$.",
        cam: { yaw: -20, pitch: 24, zoom: 230, target: [0.43, 1.52, 0.26] },
        add: [{ m: "w_2 = (1,3,1)" }],
        els: {
          w1: { kind: "vec", to: w1, label: "w_1" },
          w2: { kind: "vec", to: w2, label: "w_2" },
        },
      },
      {
        caption: "And $w_3 = (1,1,2)$: a basis (the determinant is 5). But it's totally not orthogonal.",
        cam: { yaw: -20, pitch: 24, zoom: 230, target: [0.43, 1.52, 0.26] },
        add: [{ m: "w_3 = (1,1,2)" }, { m: "\\det[\\,w_1\\ w_2\\ w_3\\,] = 5 \\ne 0", small: 1 }],
        els: {
          w1: { kind: "vec", to: w1, label: "w_1" },
          w2: { kind: "vec", to: w2, label: "w_2" },
          w3: { kind: "vec", to: w3, label: "w_3" },
        },
      },
      {
        caption: "As always the first one is free: $v_1 = w_1$, since there is nothing yet to be orthogonal to.",
        cam: { yaw: -20, pitch: 24, zoom: 230, target: [0.43, 1.52, 0.26] },
        clear: true,
        add: [{ m: "w_1 = (1,2,-1), \\ w_2 = (1,3,1), \\ w_3 = (1,1,2)", small: 1 }, { m: "v_1 = w_1 = (1,2,-1)", ans: 1 }],
        els: {
          v1: { kind: "vec", to: v1, c: "yellow", label: "v_1 = w_1" },
          w2: { kind: "vec", to: w2, label: "w_2" },
          w3: { kind: "vec", to: w3, label: "w_3" },
        },
      },
      {
        caption: "Here $\\ip{w_2}{v_1} = \\norm{v_1}^2$, so the shadow is exactly $1\\cdot v_1$ — it sits right on top of $v_1$ — and $v_2 = w_2 - v_1$.",
        cam: { yaw: -34, pitch: 24, zoom: 230, target: [0.64, 1.41, 0.57] },
        add: [
          { m: "\\ip{w_2}{v_1} = 1 + 6 - 1 = 6 = \\norm{v_1}^2" },
          { m: "v_2 = w_2 - \\mint{1\\cdot v_1} = (0,1,2)", ans: 1 },
        ],
        els: {
          sh2: { kind: "halo", to: sh2, c: "mint", tag: "shadow" },
          v1: { kind: "vec", to: v1, label: "v_1" },
          w2: { kind: "vec", to: w2, label: "w_2", op: 0.55 },
          d2: { kind: "drop", from: w2, to: sh2 },
          r2: { kind: "right", at: sh2, a: sub(w2, sh2), b: mul(-1, v1) },
          v2: { kind: "vec", to: v2, c: "yellow", label: "v_2", delay: 0.35 },
          w3: { kind: "vec", to: w3, label: "w_3" },
        },
      },
      {
        caption: "The shadow of $w_3$ on the plane $\\Span\\{v_1, v_2\\}$ is the sum of its shadows on $v_1$ and on $v_2$ — two terms now, each divided by its own $\\norm{v_j}^2$.",
        cam: { frame: "plane", yaw: 138, pitch: 38, zoom: 255, target: [0.35, 0.84, 0.34] },
        add: [
          { m: "\\ip{w_3}{v_1} = 1 + 2 - 2 = 1, \\quad \\norm{v_1}^2 = 6", small: 1 },
          { m: "\\ip{w_3}{v_2} = 0 + 1 + 4 = 5, \\quad \\norm{v_2}^2 = 5", small: 1 },
          { m: "\\text{shadow: } \\mint{\\tfrac16\\,v_1 + \\tfrac55\\,v_2}" },
        ],
        els: {
          plane: { kind: "plane" },
          v1: { kind: "vec", to: v1, label: "v_1" },
          v2: { kind: "vec", to: v2, label: "v_2" },
          w3: { kind: "vec", to: w3, label: "w_3" },
          s3a: { kind: "halo", to: sh3a, c: "mint", delay: 0.2 },                     // shadow on v1: (1/6) v1
          s3b: { kind: "halo", to: sh3b, c: "mint", delay: 0.2 },                     // shadow on v2: 1·v2
          p3a: { kind: "drop", from: sh3a, to: sh3, delay: 0.4 },                     // parallelogram:
          p3b: { kind: "drop", from: sh3b, to: sh3, delay: 0.4 },                     //   the two add up
          sh3: { kind: "vec", to: sh3, c: "mint", tag: "shadow", delay: 0.6 },        // = the shadow
          d3: { kind: "drop", from: w3, to: sh3, delay: 0.6 },
          r3: { kind: "right", at: sh3, a: sub(w3, sh3), b: mul(-1, sh3), delay: 0.8 },
        },
      },
      {
        caption: "What is left, $v_3 = \\tfrac16(5,-2,1)$, sticks straight out of the plane — press V to look along the plane and watch it stand upright.",
        cam: { frame: "plane", yaw: 138, pitch: 38, zoom: 255, target: [0.35, 0.84, 0.34] },
        add: [
          { m: "v_3 = (1,1,2) - \\mint{\\tfrac16(1,2,-1)} - \\mint{(0,1,2)}", small: 1 },
          { m: "\\phantom{v_3} = \\tfrac16(5,-2,1)", ans: 1 },
        ],
        els: {
          plane: { kind: "plane" },
          v1: { kind: "vec", to: v1, label: "v_1" },
          v2: { kind: "vec", to: v2, label: "v_2" },
          w3: { kind: "vec", to: w3, op: 0.55 },
          sh3: { kind: "vec", to: sh3, c: "mint", op: 0.55 },
          d3: { kind: "drop", from: w3, to: sh3, op: 0.55 },
          v3: { kind: "vec", to: v3, c: "yellow", label: "v_3" },
          r31: { kind: "right", at: [0, 0, 0], a: v3, b: v1, delay: 0.5 },
          r32: { kind: "right", at: [0, 0, 0], a: v3, b: v2, delay: 0.6 },
        },
      },
      // normalization: one vector per step (Lemma 2.5), each u_i the answer of its own slide
      {
        caption: "Now normalize, one vector at a time: $u_1 = v_1 / \\norm{v_1}$ points the same way as $v_1$ but has length 1.",
        cam: { frame: "plane", yaw: 45, pitch: 25, zoom: 255, target: [-0.07, -0.17, 0.4] },
        clear: true,
        add: [
          { t: "the orthogonal basis" },
          { m: "v_1 = (1,2,-1), \\ v_2 = (0,1,2), \\ v_3 = \\tfrac16(5,-2,1)", small: 1 },
          { t: "normalize" },
          { m: "\\norm{v_1} = \\sqrt{6} \\ \\Rightarrow\\ u_1 = \\tfrac{1}{\\sqrt6}(1,2,-1)", ans: 1 },
        ],
        els: {
          plane: { kind: "plane", op: 0.5 },
          v1: { kind: "vec", to: u1, c: "yellow", label: "u_1" },
          v2: { kind: "vec", to: v2, label: "v_2" },
          v3: { kind: "vec", to: v3, label: "v_3" },
          r12: { kind: "right", at: [0, 0, 0], a: v1, b: v2, s: 0.16 },
          r31: { kind: "right", at: [0, 0, 0], a: v3, b: v1, s: 0.16 },
          r32: { kind: "right", at: [0, 0, 0], a: v3, b: v2, s: 0.16 },
        },
      },
      {
        caption: "Same for $v_2$: divide by $\\norm{v_2} = \\sqrt5$ — by the norm itself this time, not its square.",
        cam: { frame: "plane", yaw: 45, pitch: 25, zoom: 255, target: [-0.07, -0.17, 0.4] },
        add: [{ m: "\\norm{v_2} = \\sqrt{5} \\ \\Rightarrow\\ u_2 = \\tfrac{1}{\\sqrt5}(0,1,2)", ans: 1 }],
        els: {
          plane: { kind: "plane", op: 0.5 },
          v1: { kind: "vec", to: u1, label: "u_1" },
          v2: { kind: "vec", to: u2, c: "yellow", label: "u_2" },
          v3: { kind: "vec", to: v3, label: "v_3" },
          r12: { kind: "right", at: [0, 0, 0], a: v1, b: v2, s: 0.16 },
          r31: { kind: "right", at: [0, 0, 0], a: v3, b: v1, s: 0.16 },
          r32: { kind: "right", at: [0, 0, 0], a: v3, b: v2, s: 0.16 },
        },
      },
      {
        caption: "And $v_3$, which is shorter than 1, gets stretched: the result is the orthonormal basis of Example 2.8 — now you know where it came from.",
        cam: { frame: "plane", yaw: 45, pitch: 25, zoom: 300, target: [0.21, -0.22, 0.01] },
        add: [
          { m: "\\norm{v_3} = \\tfrac{\\sqrt{30}}{6} \\ \\Rightarrow\\ u_3 = \\tfrac{1}{\\sqrt{30}}(5,-2,1)", ans: 1 },
          { m: "\\ip{u_i}{u_j} = \\delta_{ij} \\ \\checkmark", small: 1 },
        ],
        els: {
          v1: { kind: "vec", to: u1, label: "u_1" },
          v2: { kind: "vec", to: u2, label: "u_2" },
          v3: { kind: "vec", to: u3, c: "yellow", label: "u_3" },
          r12: { kind: "right", at: [0, 0, 0], a: u1, b: u2, s: 0.12 },
          r31: { kind: "right", at: [0, 0, 0], a: u3, b: u1, s: 0.12 },
          r32: { kind: "right", at: [0, 0, 0], a: u3, b: u2, s: 0.12 },
        },
      },
    ],
    notes: [
      "In $\\R^3$ the third vector casts its shadow on a whole plane, $\\Span\\{v_1, v_2\\}$, and that shadow is the sum of its shadows on $v_1$ and on $v_2$ — this only works because $v_1 \\perp v_2$.",
      "Drag to turn the picture, press V to look edge-on along the plane, Home (or double-click) to come back, A to let it spin.",
      "The result, normalized, is exactly the orthonormal basis $u_1, u_2, u_3$ of Example 2.8.",
    ],
    tryIt: [
      "Replace $w_3$ by $(1,0,0)$. Which of the two shadows vanishes, and why? Do you still get the same $v_3$?",
      "Run (GS) on the same three vectors in the order $w_3, w_1, w_2$. Is the plane in the picture the same?",
      "Use Theorem 2.7 to find the coordinates of $v = (1,1,1)$ in this ONB: $c_i = \\ip{v}{u_i}$. Check that $c_1^2 + c_2^2 + c_3^2 = \\norm{v}^2$.",
    ],
  });

  // ===================================================================== 005
  S.scenes.push({
    id: "005", name: "005: Breaking (GS)", chip: "005 · Breaking (GS)", kind: "space3d",
    caution: "(GS) needs a basis: dependent vectors give some $v_k = \\zero$",
    space: {
      axes: 3.2,
      plane: { a: plane.a, b: plane.b, s: [-0.06, 2.2], t: [-0.06, 1.2], label: [2.2, 1.2] },
    },
    steps: [
      {
        caption: "Notice $\\det[\\,w_1\\ w_2\\ w_3\\,] = 0$, so something is about to go wrong — watch Gram–Schmidt find it.",
        cam: { yaw: 30, pitch: 24, zoom: 170, target: [0.06, 2.45, -0.42] },
        add: [
          { m: "w_1 = (1,2,-1), \\ w_2 = (1,3,1), \\ w_3 = (2,5,0)", small: 1 },
          { m: "\\det[\\,w_1\\ w_2\\ w_3\\,] = 0", ans: 1 },
        ],
        els: {
          w1: { kind: "vec", to: w1, label: "w_1" },
          w2: { kind: "vec", to: w2, label: "w_2", delay: 0.12 },
          w3: { kind: "vec", to: x3, label: "w_3", delay: 0.24 },
        },
      },
      {
        caption: "The shadow of $w_3$ is $2v_1 + v_2 = w_3$ itself: $w_3$ already lies in the plane, so its drop-line has length zero.",
        cam: { frame: "plane", yaw: 45, pitch: 40, zoom: 185, target: [-0.6, 1.1, -0.04] },
        add: [
          { m: "v_1 = (1,2,-1), \\quad v_2 = (0,1,2)" },
          { m: "\\frac{\\ip{w_3}{v_1}}{\\norm{v_1}^2} = \\frac{12}{6} = 2, \\quad \\frac{\\ip{w_3}{v_2}}{\\norm{v_2}^2} = \\frac{5}{5} = 1", small: 1 },
          { m: "\\text{shadow: } \\mint{2v_1 + v_2} = (2,5,0) = w_3" },
        ],
        els: {
          plane: { kind: "plane" },
          w1: { kind: "vec", to: v1, label: "v_1" },
          v2: { kind: "vec", to: v2, label: "v_2" },
          w2: { kind: "vec", to: w2, label: "w_2", op: 0.3 },
          sh: { kind: "halo", to: shx, c: "mint", tag: "shadow", delay: 0.3 },
          w3: { kind: "vec", to: x3, label: "w_3" },
        },
      },
      {
        caption: "$v_3 = \\zero$ can't be normalized and can't belong to an orthogonal set (Def 2.1): (GS) needs a basis — and it flags dependence for free.",
        cam: { frame: "plane", yaw: 45, pitch: 40, zoom: 185, target: [-0.6, 1.1, -0.04] },
        clear: true,
        add: [
          { m: "\\text{shadow: } \\mint{2v_1 + v_2} = w_3" },
          { m: "v_3 = (2,5,0) - 2(1,2,-1) - (0,1,2) = \\zero", coral: 1, small: 1 },
          { m: "u_3 = \\frac{v_3}{\\norm{v_3}}: \\quad \\strike{\\div \\norm{v_3} = \\div 0}" },
          { t: "Def 2.1: an orthogonal set excludes 0" },
        ],
        els: {
          plane: { kind: "plane" },
          w1: { kind: "vec", to: v1, label: "v_1" },
          v2: { kind: "vec", to: v2, label: "v_2" },
          sh: { kind: "halo", to: shx, c: "mint", op: 0.55 },
          w3: { kind: "vec", to: x3, label: "w_3", op: 0.55 },
          z: { kind: "dot", at: z3, c: "coral", label: "v_3 = \\zero" },
        },
      },
    ],
    notes: [
      "Here $w_3 = w_1 + w_2$, so the three vectors only span a plane. Gram–Schmidt doesn't need to be told: the shadow of $w_3$ on $\\Span\\{v_1, v_2\\}$ is $w_3$ itself, and $v_3 = \\zero$.",
      "A zero vector can't be normalized ($\\div\\, 0$) and is excluded from orthogonal sets by Definition 2.1, so the output is not a basis — because the input wasn't.",
      "Getting $v_k = \\zero$ partway through (GS) always means $w_k$ is a combination of $w_1, \\dots, w_{k-1}$.",
    ],
    tryIt: [
      "Replace $w_3$ by $(2,5,1)$. Is $\\det[\\,w_1\\ w_2\\ w_3\\,]$ still 0? Run (GS) and find $v_3$.",
      "If $w_2 = 3w_1$, which $v_k$ is the first to be $\\zero$?",
    ],
  });

  // ===================================================================== 006
  // Sandbox: students type (or pick) three vectors of R^3; Gram–Schmidt with the dot product runs
  // exactly (fractions, as by hand). Steps: your vectors → the (OB) → the (ONB). The camera is fitted
  // automatically to whatever was typed (sandbox.js), so no presets are stored here.
  S.scenes.push({
    id: "006", name: "006: Sandbox", chip: "006 · Sandbox", kind: "sandbox",
    sandbox: {
      start: [[1, 1, 0], [1, 0, 1], [0, 1, 1]],
      presets: [
        { label: "Ex 2.8", w: [[1, 2, -1], [1, 3, 1], [1, 1, 2]] },
        { label: "e₁ e₂ e₃", w: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
        { label: "w₃ = w₁ + w₂", w: [[1, 2, -1], [1, 3, 1], [2, 5, 0]] },
        { label: "w₂ = 2w₁", w: [[1, 1, 0], [2, 2, 0], [0, 1, 3]] },
        { label: "random", random: [-3, 3] },
      ],
    },
    steps: [
      { caption: "Type three vectors of $\\R^3$, or pick a preset — and make sure you have a basis: if $\\det[\\,w_1\\ w_2\\ w_3\\,] = 0$, they are not a basis!" },
      { caption: "$v_1 = w_1$: the first one is free (unless $w_1 = \\zero$, and then there is nothing to start from)." },
      { caption: "$v_2$ is $w_2$ minus its shadow on $v_1$; if that leaves $\\zero$, $w_2$ was a multiple of $w_1$ and (GS) stops here." },
      { caption: "$v_3$ is $w_3$ minus its shadow on the plane $\\Span\\{v_1, v_2\\}$; $v_3 = \\zero$ means $w_3$ was already lying in that plane." },
      { caption: "Normalize one vector at a time: $u_1 = v_1 / \\norm{v_1}$ — same direction, length 1." },
      { caption: "$u_2 = v_2 / \\norm{v_2}$ — the norm itself, not its square; the right angles survive." },
      { caption: "$u_3 = v_3 / \\norm{v_3}$, and check $\\ip{u_i}{u_j} = \\delta_{ij}$ — if (GS) stopped, there is nothing to normalize." },
    ],
    notes: [
      "Type any three vectors: integers, decimals like 0.5, or fractions like 1/3. Gram–Schmidt runs exactly here, with the dot product, so you see the same fractions you would get by hand.",
      "→ walks through it one vector at a time: your vectors, then $v_1, v_2, v_3$, then $u_1, u_2, u_3$. Drag to turn the picture, V to look edge-on at $\\Span\\{v_1, v_2\\}$, Home to come back.",
      "If the vectors are not a basis, some $v_k$ comes out $\\zero$ and (GS) stops, since the next step would divide by $\\norm{v_k}^2 = 0$. That happens exactly when $w_k \\in \\Span\\{w_1, \\dots, w_{k-1}\\}$.",
    ],
    tryIt: [
      "Pick $w_3 = w_1 + w_2$. Which $v_k$ is $\\zero$, and why that one?",
      "Enter the same three vectors in a different order. Same orthonormal basis? Same $\\Span\\{u_1, u_2\\}$?",
      "Enter an orthogonal basis that isn't orthonormal, e.g. $(2,0,0), (0,3,0), (0,0,1)$. What does (GS) change?",
      "Make $w_1 = \\zero$. Why can't Gram–Schmidt even start?",
    ],
  });

  window.GS_STEPS = S;
  window.GS_VEC = { add, sub, mul, dot, norm, unit, proj };
})();
