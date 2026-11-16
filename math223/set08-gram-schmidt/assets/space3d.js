/* Live SVG scenes for 005 and 006 (orthographic 3D), plus GS_DRAW: the drawing kit shared with
   sandbox.js so the JS pictures match the Manim clips.

   Style contract (same numbers as manim/scenes.py; 1 Manim unit = 112 px, stroke w → 1.12·w px):
     arrows      shaft 6 (6.72 px) round cap; filled tip 0.26 u long (29.1 px), half-width 0.12 u (13.4 px)
     labels      MathTex size 40 → 46.5 px KaTeX_Math italic, subscripts 70 % in KaTeX_Main
     tags        JetBrains Mono bold caps, Text size 20 → 31 px
     drop-lines  MINT dashed, stroke 3 · span lines CHALK dotted 2.5 @ 45 % · right angle MINT 0.24 u, stroke 3
     axes        CHALK, stroke 2.5 @ 40 %
   Camera: z up, right-handed; yaw = azimuth of the camera from +x toward +y, pitch = elevation. */
(function () {
  "use strict";
  const W = 1120, H = 896, U = 112;
  const SW = (w) => 1.12 * w;
  const TIP_LEN = 0.26 * U, TIP_HALF = 0.12 * U;
  const LABEL_PX = 46.5, TAG_PX = 31;
  const DIM = 0.55;

  // ------------------------------------------------------------------ colours (read from CSS so B restyles)
  let PAL = {};
  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ["board", "board-deep", "chalk", "mint", "yellow", "coral"]) PAL[k] = hex(cs.getPropertyValue(`--${k}`).trim() || "#ffffff");
  }
  function hex(s) { const m = /^#?([0-9a-f]{6})$/i.exec(s); const n = m ? parseInt(m[1], 16) : 0xffffff; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb(c) { return `rgb(${c.map((x) => Math.round(x)).join(",")})`; }
  function mix(a, b, t) { return a.map((x, i) => x + (b[i] - x) * t); }
  const col = (role) => PAL[role] || PAL.chalk;

  // ------------------------------------------------------------------ SVG helpers
  const f = (x) => (Math.round(x * 100) / 100).toString();
  function arrowSVG(x0, y0, x1, y1, color, op, sw = 6, tipScale = 1) {
    const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy);
    if (n < 0.5 || op <= 0.002) return "";
    const ux = dx / n, uy = dy / n, px = -uy, py = ux;
    const tl = Math.min(TIP_LEN * tipScale, 0.45 * n), th = TIP_HALF * tipScale * tl / (TIP_LEN * tipScale);
    const bx = x1 - ux * tl, by = y1 - uy * tl;
    const sx = x1 - ux * tl * 0.85, sy = y1 - uy * tl * 0.85;
    const c = rgb(color);
    return `<g opacity="${f(op)}"><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(sx)}" y2="${f(sy)}" stroke="${c}" stroke-width="${f(SW(sw))}" stroke-linecap="round"/>` +
      `<polygon points="${f(x1)},${f(y1)} ${f(bx + px * th)},${f(by + py * th)} ${f(bx - px * th)},${f(by - py * th)}" fill="${c}"/></g>`;
  }
  function lineSVG(x0, y0, x1, y1, color, op, sw, dash) {
    if (op <= 0.002) return "";
    return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${rgb(color)}" stroke-width="${f(SW(sw))}" stroke-opacity="${f(op)}"` +
      (dash ? ` stroke-dasharray="${dash}"` : "") + ` stroke-linecap="${dash ? "butt" : "round"}"/>`;
  }
  const DASH_DROP = `${f(0.1 * U * 0.55)} ${f(0.1 * U * 0.45)}`;     // Manim DashedLine(dash_length=.1, ratio=.55)
  const DASH_SPAN = `${f(0.05 * U * 0.4)} ${f(0.05 * U * 0.6)}`;
  function polySVG(pts, color, op, sw, fillOp = 0, closed = false) {
    if (op <= 0.002) return "";
    const d = pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])},${f(p[1])}`).join("") + (closed ? "Z" : "");
    return `<path d="${d}" stroke="${rgb(color)}" stroke-width="${f(SW(sw))}" stroke-opacity="${f(op)}" stroke-linejoin="miter" ` +
      `fill="${fillOp ? rgb(color) : "none"}" fill-opacity="${f(fillOp)}"/>`;
  }

  /** "v_1 = w_1", "\\Span\\{v_1, v_2\\}", "u_3" → SVG text with italic letters and roman subscripts. */
  function parseLabel(s) {
    const toks = [];
    let i = 0;
    while (i < s.length) {
      if (s.startsWith("\\Span", i)) { toks.push({ t: "span", rm: 1 }); i += 5; continue; }
      if (s.startsWith("\\{", i) || s.startsWith("\\}", i)) { toks.push({ t: s[i + 1], rm: 1 }); i += 2; continue; }
      if (s.startsWith("\\zero", i)) { toks.push({ t: "0", rm: 1, bold: 1 }); i += 5; continue; }
      const ch = s[i];
      if (ch === "_") {
        let sub = s[i + 1]; i += 2;
        if (sub === "{") { const j = s.indexOf("}", i); sub = s.slice(i, j); i = j + 1; }
        toks.push({ t: sub, sub: 1 }); continue;
      }
      if (ch === " ") { i++; continue; }
      if (ch === "=") { toks.push({ t: " = ", rm: 1 }); i++; continue; }
      if (ch === ",") { toks.push({ t: ", ", rm: 1 }); i++; continue; }
      toks.push({ t: ch, rm: /[0-9()]/.test(ch) ? 1 : 0 }); i++;
    }
    return toks;
  }
  function labelWidth(s, px) {
    return parseLabel(s).reduce((w, k) => w + (k.sub ? 0.4 * k.t.length : k.t === " = " ? 1.25 : k.t === ", " ? 0.55 : k.t === "span" ? 1.95 : 0.52 * k.t.length) * px, 0);
  }
  function labelSVG(s, x, y, color, op, px = LABEL_PX) {
    // (x, y) = centre of the label box
    const w = labelWidth(s, px);
    let out = `<text x="${f(x - w / 2)}" y="${f(y + px * 0.25)}" font-size="${f(px)}" fill="${rgb(color)}" fill-opacity="${f(op)}">`;
    let shifted = false;
    for (const k of parseLabel(s)) {
      const t = k.t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      if (k.sub) { out += `<tspan class="rm" font-size="${f(px * 0.7)}" dy="${f(px * 0.17)}">${t}</tspan>`; shifted = true; continue; }
      const dy = shifted ? ` dy="${f(-px * 0.17)}"` : ""; shifted = false;
      out += `<tspan${k.rm ? ' class="rm"' : ""}${k.bold ? ' font-weight="bold"' : ""}${dy}>${t.replace(/ /g, " ")}</tspan>`;
    }
    return out + "</text>";
  }
  function tagSVG(s, x, y, color, op) {
    return `<text class="tag" x="${f(x)}" y="${f(y + TAG_PX * 0.36)}" text-anchor="middle" font-size="${TAG_PX}" fill="${rgb(color)}" fill-opacity="${f(op)}">${s.toUpperCase()}</text>`;
  }
  const tagWidth = (s) => s.length * 0.6 * TAG_PX;

  /** Greedy label placement around an anchor, avoiding earlier boxes, segments and the frame. */
  function placer() {
    const boxes = [], segs = [];
    const hits = (b, s) => {
      for (let i = 0; i <= 14; i++) {
        const t = i / 14, x = s[0] + (s[2] - s[0]) * t, y = s[1] + (s[3] - s[1]) * t;
        if (x > b.x0 - 5 && x < b.x1 + 5 && y > b.y0 - 5 && y < b.y1 + 5) return true;
      }
      return false;
    };
    const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    return {
      seg(x0, y0, x1, y1) { segs.push([x0, y0, x1, y1]); },
      box(x0, y0, x1, y1) { boxes.push({ x0, y0, x1, y1 }); },
      /** dir: preferred unit direction (screen); dist: gap from anchor; returns centre and chosen index */
      place(ax, ay, w, h, dir, dist, prevIdx) {
        const base = Math.atan2(dir[1], dir[0]);
        const offs = [0, 0.6, -0.6, 1.15, -1.15, 1.7, -1.7, Math.PI];
        let best = null;
        const cands = [];
        for (const ring of [0, 1]) offs.forEach((o, i) => cands.push([o, ring, i + ring * offs.length]));
        cands.forEach(([o, ring, idx]) => {
          const a = base + o, cx = Math.cos(a), cy = Math.sin(a);
          // push the box out until its edge (not its centre) is `dist` from the anchor (second ring: farther)
          const r = dist + ring * 46 + Math.abs(cx) * w / 2 + Math.abs(cy) * h / 2;
          const x = ax + cx * r, y = ay + cy * r;
          const b = { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
          let score = Math.abs(o) * 4 + ring * 30 + (idx === prevIdx ? -6 : 0);
          for (const q of boxes) score += overlap(b, q) * 0.5;
          for (const s of segs) if (hits(b, s)) score += 120;
          if (b.x0 < 14 || b.y0 < 14 || b.x1 > W - 14 || b.y1 > H - 14) score += 400;
          if (!best || score < best.score) best = { x, y, b, score, idx };
        });
        boxes.push(best.b);
        return best;
      },
    };
  }

  window.GS_DRAW = { W, H, U, SW, TIP_LEN, TIP_HALF, LABEL_PX, TAG_PX, DIM, readPalette, col, rgb, mix, arrowSVG, lineSVG, polySVG,
    labelSVG, labelWidth, tagSVG, tagWidth, placer, DASH_DROP, DASH_SPAN, f };

  // ================================================================== 3D
  const V = window.GS_VEC;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpV = (a, b, t) => a.map((x, i) => lerp(x, b[i], t));
  const easeOut = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const D2R = Math.PI / 180;

  // camera = {up, ref, yaw, pitch, zoom, target}; frame() → right r, up u, toward-viewer d
  function frame(c) {
    const e3 = c.up, e1 = c.ref, e2 = cross(e3, e1);
    const y = c.yaw * D2R, p = c.pitch * D2R;
    const d = V.add(V.add(V.mul(Math.cos(p) * Math.cos(y), e1), V.mul(Math.cos(p) * Math.sin(y), e2)), V.mul(Math.sin(p), e3));
    const r = V.add(V.mul(-Math.sin(y), e1), V.mul(Math.cos(y), e2));
    return { r, u: cross(d, r), d };
  }
  /** A preset is {yaw, pitch, zoom, target} plus its frame:
        (default)        z up, yaw measured from +x toward +y — the textbook view
        frame: "plane"   the plane span{a, b} of the scene is the floor: up = its normal a×b,
                         yaw measured from a toward b — the textbook picture of a projection
        up, ref          any explicit frame (the sandbox fits its own) */
  function presetCam(p, plane) {
    let up = [0, 0, 1], ref = [1, 0, 0];
    if (p.up) { up = V.unit(p.up); ref = V.unit(p.ref); }
    else if (p.frame === "plane" && plane) { up = V.unit(cross(plane.a, plane.b)); ref = V.unit(plane.a); }
    return { up, ref, yaw: p.yaw, pitch: p.pitch, zoom: p.zoom, target: p.target.slice(), plain: !p.up && p.frame !== "plane" };
  }
  // rotation matrix rows (r,u,d) <-> quaternion, for smooth slerped camera moves
  function m2q(r, u, d) {
    const m = [r, u, d], tr = m[0][0] + m[1][1] + m[2][2];
    let q;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [0.25 * s, (m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s]; }
    else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [(m[2][1] - m[1][2]) / s, 0.25 * s, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s]; }
    else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[0][2] - m[2][0]) / s, (m[0][1] + m[1][0]) / s, 0.25 * s, (m[1][2] + m[2][1]) / s]; }
    else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[1][0] - m[0][1]) / s, (m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, 0.25 * s]; }
    return q;
  }
  function q2m(q) {
    const [w, x, y, z] = q;
    return {
      r: [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
      u: [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
      d: [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    };
  }
  function slerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map((x) => -x); d = -d; }
    if (d > 0.9995) { const q = a.map((x, i) => x + (b[i] - x) * t); const n = Math.hypot(...q); return q.map((x) => x / n); }
    const th = Math.acos(d), s = Math.sin(th);
    return a.map((x, i) => (Math.sin((1 - t) * th) * x + Math.sin(t * th) * b[i]) / s);
  }

  function create(container, sc, api) {
    readPalette();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "scene");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    container.appendChild(svg);

    const space = sc.space;
    // plane and axis length are read live: the sandbox changes them as students type
    const planeNow = () => sc.space.plane;
    const nrmNow = () => { const P = planeNow(); return P ? V.unit(cross(P.a, P.b)) : null; };
    let step = 0;
    const preset = (k) => presetCam(sc.steps[k].cam, sc.space.plane);
    let cam = preset(0);
    // world axes: shown in the textbook (z-up) frame, faded out when span{v1, v2} is the floor
    let axesNow = cam.plain ? 1 : 0;
    const axesWant = () => (cam.plain ? 1 : 0);
    let camAnim = null;          // {q0,q1,z0,z1,t0_,t1_,start,dur,end}
    let edge = false, auto = false, drag = null;
    let state = {}, prevState = {}, trans = null; // trans = {start, dur}
    let raf = 0;
    const labelMemory = {};

    // ---------- element state per step
    function resolve(k) {
      const out = {};
      if (k < 0) return out;
      const els = sc.steps[k].els || {};
      for (const id in els) {
        const e = els[id];
        out[id] = Object.assign({ c: e.kind === "drop" || e.kind === "right" || e.kind === "plane" ? "mint" : "chalk", op: 1, from: [0, 0, 0], delay: 0, s: 0.2 }, e);
      }
      return out;
    }

    // ---------- camera
    function camFrame() {
      if (camAnim) {
        const t = easeInOut(Math.min(1, (performance.now() - camAnim.start) / camAnim.dur));
        const m = q2m(slerp(camAnim.q0, camAnim.q1, t));
        return { r: m.r, u: m.u, d: m.d, zoom: lerp(camAnim.z0, camAnim.z1, t), target: lerpV(camAnim.t0, camAnim.t1, t) };
      }
      const fr = frame(cam);
      return Object.assign(fr, { zoom: cam.zoom, target: cam.target });
    }
    function easeCam(next, dur = 800) {
      const a = camFrame(), b = frame(next);
      camAnim = { q0: m2q(a.r, a.u, a.d), q1: m2q(b.r, b.u, b.d), z0: a.zoom, z1: next.zoom, t0: a.target, t1: next.target, start: performance.now(), dur, a0: axesNow };
      cam = next;
      kick();
    }
    function edgeCam() {
      const p = preset(step);
      if (!p.plain && Math.abs(V.dot(p.up, nrmNow())) > 0.999) return Object.assign({}, p, { pitch: 0 });   // floor view → look along the floor
      const P = planeNow(), nrm = nrmNow();
      const ra = V.unit(V.sub(V.unit(P.a), V.unit(P.b)));     // v1 to the right, v2 to the left: both readable
      return { up: nrm, ref: V.unit(cross(ra, nrm)), yaw: 0, pitch: 0, zoom: p.zoom, target: p.target.slice() };
    }

    // ---------- drawing
    function proj(fr, p) {
      const q = V.sub(p, fr.target);
      return [W / 2 + fr.zoom * V.dot(q, fr.r), H / 2 - fr.zoom * V.dot(q, fr.u), V.dot(q, fr.d)];
    }
    let R = sc.space.axes;
    /** shorten o→p so it ends at least m px inside the picture (axes stay readable at any view) */
    function clipIn(o, p, m) {
      let t = 1;
      for (const [k, lo, hi] of [[0, m, W - m], [1, m, H - m]]) {
        const d = p[k] - o[k];
        if (p[k] > hi && d > 0) t = Math.min(t, (hi - o[k]) / d);
        if (p[k] < lo && d < 0) t = Math.min(t, (lo - o[k]) / d);
      }
      t = Math.max(0, t);
      return [o[0] + (p[0] - o[0]) * t, o[1] + (p[1] - o[1]) * t, o[2] + (p[2] - o[2]) * t];
    }
    const depthOp = (z) => 0.6 + 0.4 * Math.max(0, Math.min(1, (z + R) / (2 * R)));   // far → dimmer

    function render() {
      R = sc.space.axes;
      const P = planeNow();
      const fr = camFrame();
      // the axes fade on the camera move's clock (not per frame), so slow machines don't lag
      axesNow = camAnim ? lerp(camAnim.a0, axesWant(), Math.min(1, (performance.now() - camAnim.start) / camAnim.dur)) : axesWant();
      const now = performance.now();
      const T = trans ? (now - trans.start) / 1000 : 99;
      const items = [];          // {z, svg}
      const under = [];          // plane + axes + halos
      const pl = placer();
      // a CAUTION banner (top) or a prediction card (bottom) may sit over the picture on the stage:
      // keep labels out from under them (in the flow layout both sit outside the picture)
      const rootCl = document.documentElement.classList;
      if (!rootCl.contains("flow")) {
        const cz = document.getElementById("caution");
        if (cz && rootCl.contains("caution")) pl.box(0, 0, cz.offsetLeft + cz.offsetWidth + 10, cz.offsetTop - 72 + cz.offsetHeight + 10);
        const pr = document.getElementById("predict");
        if (pr && !pr.hidden && pr.offsetWidth) pl.box(pr.offsetLeft - 10, pr.offsetTop - 72 - 10, pr.offsetLeft + pr.offsetWidth + 10, H);
      }
      const labels = [];         // {id, text, color, op, anchor, dir, kind}

      // axes
      const axes = [[1, 0, 0, "x"], [0, 1, 0, "y"], [0, 0, 1, "z"]];
      for (const [x, y, z, name] of axesNow > 0.01 ? axes : []) {
        const a = clipIn(proj(fr, [0, 0, 0]), proj(fr, [-x * R * 0.35, -y * R * 0.35, -z * R * 0.35]), 30);
        const b = clipIn(proj(fr, [0, 0, 0]), proj(fr, [x * R, y * R, z * R]), 60);
        under.push(lineSVG(a[0], a[1], b[0], b[1], col("chalk"), 0.45 * axesNow * depthOp((a[2] + b[2]) / 2), 2.5));
        const dir = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(...dir) || 1;
        labels.push({ text: name, color: col("chalk"), op: 0.8 * axesNow, ax: b[0], ay: b[1], dir: [dir[0] / n, dir[1] / n], px: 40, id: "axis" + name });
        pl.seg(a[0], a[1], b[0], b[1]);
      }

      const ids = new Set([...Object.keys(prevState), ...Object.keys(state)]);
      const order = [...ids];
      for (const id of order) {
        const A = prevState[id], B = state[id];
        const e = B || A;
        const local = trans ? easeOut((T - (B ? B.delay : 0)) / 0.9) : 1;
        let g = 1, op, c, geo;
        if (A && B) {               // morph
          op = lerp(A.op, B.op, local); c = mix(col(A.c), col(B.c), local);
          geo = (k) => (Array.isArray(B[k]) ? lerpV(A[k] || B[k], B[k], local) : B[k]);
        } else if (B) {             // appear
          g = local; op = B.op; c = col(B.c); geo = (k) => B[k];
        } else {                    // disappear
          op = A.op * (1 - local); c = col(A.c); geo = (k) => A[k];
          if (op <= 0.01) continue;
        }
        const kind = e.kind;
        if (kind === "plane") {
          if (!P) continue;
          const pa = (s, t) => proj(fr, V.add(V.mul(s, P.a), V.mul(t, P.b)));
          const [s0, s1] = P.s, [t0, t1] = P.t;
          const fo = op * g;
          const corners = [pa(s0, t0), pa(s1, t0), pa(s1, t1), pa(s0, t1)];
          under.unshift(polySVG(corners, col("mint"), 0.45 * fo, 2, 0.13 * fo, true));
          for (let s = Math.ceil(s0 * 2) / 2; s <= s1 + 1e-9; s += 0.5) {
            const a = pa(s, t0), b = pa(s, t1); under.splice(1, 0, lineSVG(a[0], a[1], b[0], b[1], col("mint"), 0.2 * fo, 1.4));
          }
          for (let t = Math.ceil(t0 * 2) / 2; t <= t1 + 1e-9; t += 0.5) {
            const a = pa(s0, t), b = pa(s1, t); under.splice(1, 0, lineSVG(a[0], a[1], b[0], b[1], col("mint"), 0.2 * fo, 1.4));
          }
          // label at the preferred corner, or the first sheet corner that is actually on screen
          const inside = (q) => q[0] > 90 && q[0] < W - 230 && q[1] > 60 && q[1] < H - 50;
          const lp = [pa(P.label[0], P.label[1]), pa(s1, t1), pa(s1, t0), pa(s0, t1), pa((s0 + s1) / 2, t1), pa(s1, (t0 + t1) / 2)]
            .find(inside) || pa(P.label[0], P.label[1]);
          labels.push({ text: "\\Span\\{v_1, v_2\\}", color: col("mint"), op: fo, ax: lp[0], ay: lp[1], dir: [1, -0.3], px: 38, id: "plane", dist: 4 });
          continue;
        }
        if (kind === "vec" || kind === "halo") {
          const to = geo("to"), from = geo("from") || [0, 0, 0];
          const tip = V.add(from, V.mul(g, V.sub(to, from)));
          const a = proj(fr, from), b = proj(fr, tip);
          const zc = (a[2] + b[2]) / 2;
          const o = op * depthOp(b[2]);
          if (kind === "halo") under.push(arrowSVG(a[0], a[1], b[0], b[1], c, o * 0.6, 17, 1.55));
          else items.push({ z: zc, svg: arrowSVG(a[0], a[1], b[0], b[1], c, o) });
          pl.seg(a[0], a[1], b[0], b[1]);
          const dir = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(...dir);
          if (e.label && n > 4) labels.push({ text: e.label, color: c, op: o * Math.min(1, g * 1.4), ax: b[0], ay: b[1], dir: [dir[0] / n, dir[1] / n], id });
          if (e.tag && n > 4) {
            const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            labels.push({ tag: e.tag, color: c, op: o * g, ax: m[0], ay: m[1], dir: [-dir[1] / n, dir[0] / n], id: id + "tag", dist: kind === "halo" ? 22 : 12 });
          }
          continue;
        }
        if (kind === "drop") {
          const from = geo("from"), to = geo("to");
          const a = proj(fr, from), b = proj(fr, V.add(from, V.mul(g, V.sub(to, from))));
          items.push({ z: (a[2] + b[2]) / 2 - 0.01, svg: lineSVG(a[0], a[1], b[0], b[1], c, op * depthOp((a[2] + b[2]) / 2), 3, DASH_DROP) });
          continue;
        }
        if (kind === "right") {
          const at = geo("at"), ua = V.unit(geo("a")), ub = V.unit(geo("b")), s = e.s * Math.min(1, g * 1.3);
          if (s <= 0.001) continue;
          const pts = [V.add(at, V.mul(s, ua)), V.add(at, V.add(V.mul(s, ua), V.mul(s, ub))), V.add(at, V.mul(s, ub))].map((p) => proj(fr, p));
          items.push({ z: pts[1][2] + 0.02, svg: polySVG(pts, c, op * depthOp(pts[1][2]) * Math.min(1, g * 2), 3) });
          continue;
        }
        if (kind === "dot") {
          const p = proj(fr, geo("at"));
          const rr = 11 * g;
          items.push({ z: 99, svg: `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(rr)}" fill="${rgb(c)}" fill-opacity="${f(op)}" stroke="${rgb(col("board"))}" stroke-width="5"/>` });
          if (e.label) labels.push({ text: e.label, color: c, op: op * g, ax: p[0], ay: p[1], dir: [-0.7, 0.7], id, dist: 18 });
          if (e.tag) labels.push({ tag: e.tag, color: c, op: op * g, ax: p[0], ay: p[1], dir: [0.8, 0.6], id: id + "tag", dist: 22 });
        }
      }
      items.sort((p, q) => p.z - q.z);

      // labels last, greedy and in order of importance (vectors before axes and plane)
      labels.sort((p, q) => (p.id.startsWith("axis") || p.id === "plane") - (q.id.startsWith("axis") || q.id === "plane"));
      let lab = "";
      for (const L of labels) {
        if (L.op <= 0.01) continue;
        const px = L.px || LABEL_PX;
        const w = L.tag ? tagWidth(L.tag) : labelWidth(L.text, px), h = L.tag ? TAG_PX * 0.8 : px * 0.9;
        const pos = pl.place(L.ax, L.ay, w, h, L.dir, L.dist != null ? L.dist : 10, labelMemory[L.id]);
        labelMemory[L.id] = pos.idx;
        lab += L.tag ? tagSVG(L.tag, pos.x, pos.y, L.color, L.op) : labelSVG(L.text, pos.x, pos.y, L.color, L.op, px);
      }
      svg.innerHTML = under.join("") + items.map((i) => i.svg).join("") + lab;
    }

    // ---------- loop
    function active() {
      const now = performance.now();
      if (camAnim && now - camAnim.start > camAnim.dur) camAnim = null;
      if (trans && (now - trans.start) / 1000 > trans.len) { trans = null; prevState = {}; }
      return camAnim || trans || auto || drag;
    }
    function loop(now) {
      raf = 0;
      if (auto && !drag && !camAnim) {
        const dt = Math.min(0.05, (now - (loop.last || now)) / 1000);
        cam.yaw += 9 * dt;
      }
      loop.last = now;
      render();
      if (active()) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) { loop.last = performance.now(); raf = requestAnimationFrame(loop); } }

    // ---------- pointer
    svg.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
      if (camAnim) { const fr = camFrame(); camAnim = null; cam = reframe(fr); }
      if (auto) { auto = false; api.toast("auto-rotate off"); if (api.refreshKeys) api.refreshKeys(); }
      drag = { x: e.clientX, y: e.clientY };
      svg.classList.add("dragging");
      kick();
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;      // screen px: same feel on a phone and a projector
      drag.x = e.clientX; drag.y = e.clientY;
      cam.yaw -= dx * 0.4;
      cam.pitch = Math.max(-85, Math.min(85, cam.pitch + dy * 0.4));
      kick();
    });
    const end = () => { drag = null; svg.classList.remove("dragging"); };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("dblclick", (e) => { e.preventDefault(); home(); });
    svg.addEventListener("click", (e) => e.stopPropagation());

    /** after interrupting a camera move: keep the in-between view, expressed in the current up/ref frame */
    function reframe(fr) {
      const e3 = cam.up, e1 = cam.ref, e2 = cross(e3, e1);
      const d = fr.d;
      const pitch = Math.asin(Math.max(-1, Math.min(1, V.dot(d, e3)))) / D2R;
      const yaw = Math.atan2(V.dot(d, e2), V.dot(d, e1)) / D2R;
      return Object.assign({}, cam, { yaw, pitch, zoom: fr.zoom, target: fr.target });
    }
    function home() { edge = false; easeCam(preset(step)); }

    // ---------- public
    return {
      setStep(k, animate, mode) {
        const first = mode === "enter";
        step = k;
        prevState = animate ? (first ? {} : resolve(k - 1)) : {};
        state = resolve(k);
        trans = animate ? { start: performance.now(), len: 0.9 + Math.max(0, ...Object.values(state).map((e) => e.delay)) } : null;
        edge = false;
        const p = preset(k);
        if (first || mode === "replay") { cam = p; camAnim = null; if (mode === "replay") cam = p; }
        else easeCam(p);
        kick();
      },
      edge() {
        if (!planeNow()) { api.toast("no plane: v₁ or v₂ is 0"); return; }
        edge = !edge; easeCam(edge ? edgeCam() : preset(step), 900);
        api.toast(edge ? "edge-on: span{v₁, v₂}" : "default view");
      },
      auto() { auto = !auto; api.toast(auto ? "auto-rotate on" : "auto-rotate off"); kick(); },
      home() { home(); api.toast("default view"); },
      status: () => ({ edge, auto, plane: !!planeNow() }),
      key(e) {
        const k = e.key;
        if (k === "v" || k === "V") { this.edge(); return true; }
        if (k === "d" || k === "D") { this.home(); return true; }
        if (k === "a" || k === "A") { this.auto(); return true; }
        return false;
      },
      restyle() { readPalette(); kick(); },
      /** live edit (sandbox): morph from what is on screen to the step's new els, and ease to its new preset */
      morph() {
        prevState = state; state = resolve(step);
        trans = { start: performance.now(), len: 0.9 };
        edge = false;
        easeCam(preset(step), 700);
      },
      destroy() { cancelAnimationFrame(raf); raf = 0; svg.remove(); },
      // for checking presets from the console: GS_SPACE3D.audit()
      audit() { return audit(sc); },
    };
  }

  /** Foreshortening of every visible vector (projected length / true length) and how open the plane looks. */
  function audit(sc) {
    return sc.steps.map((st, i) => {
      const fr = frame(presetCam(st.cam, sc.space.plane));
      const n = V.unit(cross(sc.space.plane.a, sc.space.plane.b));
      const vecs = {};
      for (const [id, e] of Object.entries(st.els || {})) {
        if (e.kind !== "vec") continue;
        const d = V.sub(e.to, e.from || [0, 0, 0]);
        vecs[id] = +(Math.sqrt(1 - Math.pow(V.dot(V.unit(d), fr.d), 2))).toFixed(2);
      }
      return { step: i + 1, vecs, planeOpen: +Math.abs(V.dot(n, fr.d)).toFixed(2) };
    });
  }

  window.GS_SPACE3D = { create, audit, frame, presetCam };
})();
