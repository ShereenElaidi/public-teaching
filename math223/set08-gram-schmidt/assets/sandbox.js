/* 006 Sandbox: Gram–Schmidt in R³ with the dot product, on a basis the students type.
   Seven steps (→), one vector each: your vectors w → v₁, v₂, v₃ → u₁, u₂, u₃.
   Arithmetic is exact (BigInt fractions), so the panel shows the numbers you'd get by hand:
   v₃ = ⅙(5,−2,1), u₃ = (5,−2,1)/√30. If some v_k = 0 (the w's are not a basis) GS stops there,
   because the next shadow would divide by ‖v_k‖² = 0 — shown in coral.
   The picture is the 3D renderer of space3d.js; its camera is fitted to whatever was typed. */
(function () {
  "use strict";

  // ------------------------------------------------------------------ exact rationals
  const babs = (a) => (a < 0n ? -a : a);
  const gcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  function Q(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }
  const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qsub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const qdiv = (a, b) => Q(a.n * b.d, a.d * b.n);
  const qnum = (a) => Number(a.n) / Number(a.d);
  const isZero = (a) => a.n === 0n;
  const vdot = (a, b) => a.reduce((s, x, i) => qadd(s, qmul(x, b[i])), Q(0));
  const vscale = (c, a) => a.map((x) => qmul(c, x));
  const vsub = (a, b) => a.map((x, i) => qsub(x, b[i]));
  const vzero = (a) => a.every(isZero);

  /** "3", "-2", "0.5", "1/3", "-2/7" → rational, or null if it isn't a number we accept */
  function parseQ(str) {
    const s = String(str).trim().replace(/−/g, "-");
    let m;
    if ((m = /^([+-]?)(\d+)$/.exec(s))) return Q(BigInt(m[1] + m[2]));
    if ((m = /^([+-]?)(\d*)\.(\d+)$/.exec(s))) return Q(BigInt(m[1] + (m[2] || "0") + m[3]), 10n ** BigInt(m[3].length));
    if ((m = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(s)) && BigInt(m[2]) !== 0n) return Q(BigInt(m[1]), BigInt(m[2]));
    return null;
  }

  /** Gram–Schmidt, exactly. Stops at the first v_k = 0 (the next shadow would divide by 0). */
  function gsExact(ws) {
    const v = [], coef = [];
    let zeroAt = -1;
    for (let k = 0; k < ws.length; k++) {
      let x = ws[k];
      const c = [];
      for (let j = 0; j < k; j++) {
        const cj = qdiv(vdot(ws[k], v[j]), vdot(v[j], v[j]));    // <w_k, v_j> / |v_j|^2
        c.push(cj);
        x = vsub(x, vscale(cj, v[j]));
      }
      v.push(x); coef.push(c);
      if (vzero(x)) { zeroAt = k; break; }
    }
    const [a, b, c] = ws;                                       // det of the rows = det[w1 w2 w3]
    const m2 = (i, j) => qsub(qmul(b[i], c[j]), qmul(b[j], c[i]));
    const det = qadd(qsub(qmul(a[0], m2(1, 2)), qmul(a[1], m2(0, 2))), qmul(a[2], m2(0, 1)));
    return { v, coef, zeroAt, det };
  }

  // ------------------------------------------------------------------ exact display
  const texQ = (q) => (q.d === 1n ? `${q.n}` : `${q.n < 0n ? "-" : ""}\\tfrac{${babs(q.n)}}{${q.d}}`);
  const texVec = (a) => `(${a.map((x) => (typeof x === "object" ? texQ(x) : `${x}`)).join(",\\,")})`;
  /** v = (g/l)·p with p a primitive integer vector */
  function factor(v) {
    const l = v.reduce((L, x) => L / gcd(L, x.d) * x.d, 1n);
    const ints = v.map((x) => x.n * (l / x.d));
    const g = ints.reduce((G, x) => gcd(G, x), 0n) || 1n;
    return { scalar: Q(g, l), p: ints.map((x) => x / g) };
  }
  function texFactored(v) {
    const { scalar, p } = factor(v);
    if (scalar.d === 1n) return texVec(v);              // integer entries: write them out
    return `${texQ(scalar)}${texVec(p)}`;
  }
  /** √N = s√m with m square-free */
  function sqrtSplit(N) {
    let s = 1n, m = N;
    for (let f = 2n; f * f <= m; f++) while (m % (f * f) === 0n) { m /= f * f; s *= f; }
    return { s, m };
  }
  function texSqrtTimes(r, m) {                          // r·√m, r rational > 0
    if (m === 1n) return texQ(r);
    return `${r.n === 1n && r.d === 1n ? "" : texQ(r)}\\sqrt{${m}}`;
  }
  function normTex(v) {                                  // ‖v‖ exactly
    const { scalar, p } = factor(v);
    const { s, m } = sqrtSplit(p.reduce((t, x) => t + x * x, 0n));
    return texSqrtTimes(qmul(scalar, Q(s)), m);
  }
  function unitTex(v) {                                  // v/‖v‖ = p/‖p‖
    const { p } = factor(v);
    const { s, m } = sqrtSplit(p.reduce((t, x) => t + x * x, 0n));
    const den = m === 1n ? `${s}` : `${s === 1n ? "" : s}\\sqrt{${m}}`;
    if (m === 1n && s === 1n) return texVec(p);
    return `\\tfrac{1}{${den}}${texVec(p)}`;
  }

  // ------------------------------------------------------------------ automatic camera
  const VV = () => window.GS_VEC;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /** Camera for one step. Without a floor: the textbook frame (z up), near yaw 30°, pitch 24°.
      With a floor {n, a}: span{v1, v2} is the floor (up = n), seen from the front between v1 and v2
      (yaw near 45°), so v3 stands upright. Either way: no vector shorter than ~60 % on screen,
      directions spread apart; then zoom and centre are fitted to the vectors. */
  function fitCam(vecs, floor, maxZoom, pitchRange) {
    const V = VV();
    const up = floor ? floor.n : [0, 0, 1], ref = floor ? V.unit(floor.a) : [1, 0, 0];
    const e2 = cross(up, ref);
    const frame = (yaw, pitch) => {
      const y = yaw * Math.PI / 180, p = pitch * Math.PI / 180;
      const d = V.add(V.add(V.mul(Math.cos(p) * Math.cos(y), ref), V.mul(Math.cos(p) * Math.sin(y), e2)), V.mul(Math.sin(p), up));
      const r = V.add(V.mul(-Math.sin(y), ref), V.mul(Math.cos(y), e2));
      return { d, r, u: cross(d, r) };
    };
    const [yaw0, pitch0] = floor ? [45, 25] : [30, 24];
    const [plo, phi] = pitchRange || (floor ? [20, 34] : [12, 42]);
    const vs = vecs.filter((v) => V.norm(v) > 1e-9);
    let best = { yaw: yaw0, pitch: pitch0, s: -1e9 };
    for (let yaw = -180; yaw < 180; yaw += 3) for (let pitch = plo; pitch <= phi; pitch += 2) {
      const F = frame(yaw, pitch);
      const fs = vs.map((v) => Math.sqrt(Math.max(0, 1 - Math.pow(V.dot(V.unit(v), F.d), 2))));
      const mf = fs.length ? Math.min(...fs) : 1;
      let ma = Math.PI;
      const ang = vs.map((v) => Math.atan2(V.dot(v, F.u), V.dot(v, F.r)));
      for (let i = 0; i < ang.length; i++) for (let j = i + 1; j < ang.length; j++) {
        if (Math.abs(V.dot(V.unit(vs[i]), V.unit(vs[j]))) > 0.98) continue;      // parallel: can't separate
        let d = Math.abs(ang[i] - ang[j]); d = Math.min(d, 2 * Math.PI - d); ma = Math.min(ma, d);
      }
      const dy = Math.abs(((yaw - yaw0 + 540) % 360) - 180);
      let sc = -dy / (floor ? 30 : 60) - Math.abs(pitch - pitch0) / 30 + Math.min(mf, 0.9) * 3 + Math.min(ma, 0.6) * 4;
      if (mf < 0.6) sc -= 20;
      if (sc > best.s) best = { yaw, pitch, s: sc };
    }
    const F = frame(best.yaw, best.pitch);
    const pts = [[0, 0, 0], ...vs];
    const xs = pts.map((p) => V.dot(p, F.r)), ys = pts.map((p) => V.dot(p, F.u));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const zoom = Math.min(maxZoom, (1120 - 2 * 130) / Math.max(x1 - x0, 1e-6), (896 - 2 * 110) / Math.max(y1 - y0, 1e-6));
    const target = V.add(V.mul((x0 + x1) / 2, F.r), V.mul((y0 + y1) / 2, F.u));
    return Object.assign({ yaw: best.yaw, pitch: best.pitch, zoom, target }, floor ? { up, ref } : {});
  }

  // ------------------------------------------------------------------ the scene
  function create(container, sc, api) {
    const cfg = sc.sandbox;
    sc.space = sc.space || { axes: 3, plane: null };
    const sub = ["₁", "₂", "₃"];
    let texts = cfg.start.map((w) => w.map(String));
    // ?w=1,2,-1;1,3,1;2,5,0 in the URL preloads a basis (handy for sharing a specific example)
    const q = /[?&]w=([^&#]+)/.exec(location.search);
    if (q) {
      const rows = decodeURIComponent(q[1]).split(";").map((r) => r.split(",").map((x) => x.trim()));
      if (rows.length === 3 && rows.every((r) => r.length === 3 && r.every((x) => parseQ(x) !== null))) texts = rows;
    }
    let ws = texts.map((row) => row.map(parseQ));
    let G = gsExact(ws);
    let step = 0, space = null, timer = 0;

    // ---------- panel: inputs and presets are built once (typing keeps focus); results re-render
    const lines = api.linesEl;
    lines.innerHTML = `<div class="sb-panel">
      <div class="ln t">your vectors · type, or pick</div>
      <div class="sb-presets">${cfg.presets.map((p, i) => `<button type="button" data-i="${i}">${p.label}</button>`).join("")}</div>
      ${[0, 1, 2].map((k) => `<div class="sb-row"><span class="sb-lab">${api.tex(`w_${k + 1} =`)}</span><span class="sb-par">(</span>` +
        [0, 1, 2].map((i) => `<input class="sb-in" inputmode="text" autocomplete="off" spellcheck="false" data-k="${k}" data-i="${i}" aria-label="w${sub[k]} entry ${i + 1}">`).join('<span class="sb-par">,</span>') +
        `<span class="sb-par">)</span></div>`).join("")}
      <div id="sb-out"></div></div>`;
    const inputs = [...lines.querySelectorAll(".sb-in")];
    const out = lines.querySelector("#sb-out");
    const fillInputs = () => inputs.forEach((el) => { el.value = texts[+el.dataset.k][+el.dataset.i]; el.classList.remove("bad"); });
    fillInputs();

    inputs.forEach((el) => {
      el.addEventListener("input", () => {
        texts[+el.dataset.k][+el.dataset.i] = el.value;
        el.classList.toggle("bad", parseQ(el.value) === null);
        clearTimeout(timer); timer = setTimeout(commit, 350);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { clearTimeout(timer); commit(); el.blur(); }
        if (e.key === "Escape") el.blur();
      });
      el.addEventListener("focus", () => el.select());
    });
    lines.querySelectorAll(".sb-presets button").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = cfg.presets[+b.dataset.i];
      if (p.random) {
        const [lo, hi] = p.random, r = () => lo + Math.floor(Math.random() * (hi - lo + 1));
        texts = [0, 1, 2].map(() => { let w; do { w = [r(), r(), r()]; } while (w.every((x) => x === 0)); return w.map(String); });
      } else texts = p.w.map((w) => w.map(String));
      fillInputs(); commit();
    }));

    function commit() {
      const parsed = texts.map((row) => row.map(parseQ));
      if (parsed.some((row) => row.some((x) => x === null))) return;       // keep the last good input
      if (parsed.some((row) => row.some((x) => Math.abs(qnum(x)) > 99))) { api.toast("keep entries between −99 and 99"); return; }
      ws = parsed; G = gsExact(ws);
      build();
      if (space) space.morph();
      if (api.setCaution) api.setCaution(sc.steps[step].caution);
      renderPanel();
    }

    // ---------- the steps: 0 = your vectors · 1–3 = v1, v2, v3 · 4–6 = u1, u2, u3 (one vector per step)
    const kindOf = (st) => (st === 0 ? { type: "w" } : st <= 3 ? { type: "v", k: st - 1 } : { type: "u", k: st - 4 });

    // ---------- picture. Ids: w_j "w"+j, v_j/u_j "a"+j (so v_j morphs into u_j), markers "r"+i+j
    function build() {
      const Vk = VV();
      const num = (v) => v.map(qnum);
      const W = ws.map(num), Vn = G.v.map(num);
      const stop = G.zeroAt, ok = stop === -1;
      const live = (j) => j < Vn.length && j !== stop;                 // v_j exists and is not 0
      const U = Vn.map((v, j) => (live(j) ? Vk.unit(v) : null));
      const hasPlane = live(0) && live(1);
      let sheet = null, floor = null;
      if (hasPlane) {
        // the sheet covers v1, v2 and, when GS fails at k = 3, the culprit w3 lying in it
        const co = (w) => [Vk.dot(w, Vn[0]) / Vk.dot(Vn[0], Vn[0]), Vk.dot(w, Vn[1]) / Vk.dot(Vn[1], Vn[1])];
        const cs = [[1, 1], co(W[2])];
        const lo = (i) => Math.min(-0.06, ...cs.map((c) => c[i] - 0.15)), hi = (i) => Math.max(1.15, ...cs.map((c) => c[i] + 0.15));
        sheet = { a: Vn[0], b: Vn[1], s: [lo(0), hi(0)], t: [lo(1), hi(1)], label: [hi(0), hi(1)] };
        // the floor: up = its normal, turned toward v3 if there is one (else upward in z)
        let n = Vk.unit(cross(Vn[0], Vn[1]));
        const side = live(2) ? Vk.dot(n, Vn[2]) : (n[2] !== 0 ? n[2] : 1);
        if (side < 0) n = Vk.mul(-1, n);
        floor = { n, a: Vn[0] };
      }
      sc.space.plane = sheet;
      const right = (els, list, delay = 0.5) => {                       // list: [[j, vector], ...] pairwise ⟂
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          const [a, va] = list[i], [b, vb] = list[j];
          const s = 0.16 * Math.min(Vk.norm(va), Vk.norm(vb));
          els[`r${a}${b}`] = { kind: "right", at: [0, 0, 0], a: va, b: vb, s, delay };
        }
      };
      const zeroDot = (j) => ({ kind: "dot", at: [0, 0, 0], c: "coral", label: `v_${j + 1} = \\zero` });

      for (let st = 0; st < 7; st++) {
        const K = kindOf(st), els = {};
        let camVecs = [], useFloor = false, high = false;
        if (K.type === "w") {
          W.forEach((w, j) => {
            if (Vk.norm(w) < 1e-12) els["w" + j] = { kind: "dot", at: [0, 0, 0], c: "coral", label: `w_${j + 1} = \\zero` };
            else els["w" + j] = { kind: "vec", to: w, label: `w_${j + 1}`, delay: 0.1 * j };
          });
          camVecs = W;
        } else if (K.type === "v") {
          const k = ok ? K.k : Math.min(K.k, stop);                     // after a failure, keep showing it
          for (let j = 0; j < k; j++) els["a" + j] = { kind: "vec", to: Vn[j], label: `v_${j + 1}` };
          for (let j = k + 1; j < 3; j++) if (Vk.norm(W[j]) > 1e-12) els["w" + j] = { kind: "vec", to: W[j], op: 0.25 };
          const wk = W[k], vk = Vn[k], sh = Vk.sub(wk, vk);             // w_k = shadow + v_k
          if (Vk.norm(wk) > 1e-12 && k > 0) els["w" + k] = { kind: "vec", to: wk, label: `w_${k + 1}` };
          if (k > 0 && Vk.norm(sh) > 1e-9) {
            els.sh = { kind: "vec", to: sh, c: "mint", tag: "shadow", delay: 0.2 };
            if (Vk.norm(vk) > 1e-9) {
              els.dr = { kind: "drop", from: wk, to: sh, delay: 0.2 };
              els.rs = { kind: "right", at: sh, a: vk, b: Vk.mul(-1, sh), s: 0.16 * Math.min(Vk.norm(vk), Vk.norm(sh)), delay: 0.5 };
            }
          }
          if (k === stop) els["a" + k] = zeroDot(k);
          else els["a" + k] = { kind: "vec", to: vk, c: "yellow", label: k === 0 ? "v_1 = w_1" : `v_${k + 1}`, delay: k ? 0.5 : 0 };
          right(els, Array.from({ length: k + 1 }, (_, j) => j).filter(live).map((j) => [j, Vn[j]]), 0.7);
          if (k === 2 && hasPlane) { els.plane = { kind: "plane" }; useFloor = true; high = !ok; }
          camVecs = [...Vn.slice(0, k + 1).filter((v, j) => live(j)), ...(Vk.norm(wk) > 1e-12 ? [wk] : [])];
        } else {
          const lastLive = ok ? 2 : stop - 1;
          const k = Math.min(K.k, ok ? 2 : stop);
          const list = [];
          for (let j = 0; j < Vn.length; j++) {
            if (j === stop) { els["a" + j] = zeroDot(j); continue; }
            const isU = j <= k;
            const to = isU ? U[j] : Vn[j];
            els["a" + j] = { kind: "vec", to, c: isU && j === k && ok ? "yellow" : isU && j === k && j <= lastLive ? "yellow" : "chalk",
              label: isU ? `u_${j + 1}` : `v_${j + 1}` };
            list.push([j, to]);
          }
          right(els, list, 0.3);
          if (hasPlane && k < 2) els.plane = { kind: "plane", op: 0.5 };
          useFloor = hasPlane; high = !ok;
          camVecs = list.map((l) => l[1]);
        }
        sc.steps[st].els = els;
        sc.steps[st].caution = cautionFor(K);
        sc.steps[st].cam = fitCam(camVecs.length ? camVecs : [[1, 0, 0]], useFloor ? floor : null,
          K.type === "u" && K.k === 2 ? 300 : 330, useFloor && high ? [34, 48] : null);
      }
      const all = [...W, ...Vn].map((v) => Math.max(...v.map(Math.abs)));
      sc.space.axes = Math.max(1.6, 1.15 * Math.max(...all));
    }

    // ---------- not a basis → every step is a CAUTION step (as in 005), headline tracking where (GS) breaks
    function cautionFor(K) {
      const stop = G.zeroAt;
      if (stop < 0) return "";
      const m = stop + 1, sub = (i) => `${i}`;
      const span = Array.from({ length: stop }, (_, j) => `w_${j + 1}`).join(", ");
      const breaks = m === 1 ? "$w_1 = \\zero$: (GS) can't even start"
        : `$v_${sub(m)} = \\zero$: $w_${sub(m)}$ lies in $\\Span\\{${span}\\}$ — (GS) stops here`;
      if (K.type === "w") return "Not a basis: $\\det[\\,w_1\\ w_2\\ w_3\\,] = 0$ — watch where (GS) breaks";
      if (K.type === "v") {
        if (K.k < stop) return `Not a basis — (GS) will break at $v_${sub(m)}$`;
        if (K.k === stop) return breaks;
        return `(GS) stopped at $v_${sub(m)}$: there is no $v_${sub(K.k + 1)}$`;
      }
      if (K.k < stop) return `Normalizing $v_${sub(K.k + 1)}$ works — but $v_${sub(m)} = \\zero$ is coming`;
      return `$v_${sub(m)} = \\zero$ can't be normalized ($\\div 0$): not a basis in, no orthonormal basis out`;
    }

    // ---------- panel results
    function renderPanel() {
      const t = (s) => `<div class="ln t">${s}</div>`;
      const m = (s, cls = "") => `<div class="ln small static ${cls}"><span class="body">${api.tex("\\displaystyle " + s)}</span></div>`;
      const K = kindOf(step), stop = G.zeroAt, ok = stop === -1;
      const dz = isZero(G.det);
      let h = m(`\\det[\\,w_1\\ w_2\\ w_3\\,] = ${texQ(G.det)}` + (dz ? "\\quad \\coral{\\text{not a basis}}" : ""), K.type === "w" ? (dz ? "coral" : "ans") : "past");
      const vLine = (k) => {
        let lhs = `v_${k + 1} = w_${k + 1}`;
        G.coef[k].forEach((c, j) => {
          const neg = c.n < 0n, a = neg ? Q(-c.n, c.d) : c;
          lhs += ` ${neg ? "+" : "-"} \\mint{${texQ(a)}\\,v_${j + 1}}`;
        });
        return k === stop ? `${lhs} = \\zero` : `${lhs} = ${texFactored(G.v[k])}`;
      };
      const why = () => {
        const k = stop + 1;
        let r = m(k === 1 ? `\\coral{w_1 = \\zero:\\ \\text{nothing to start from}}`
          : `\\coral{w_${k} \\in \\Span\\{${Array.from({ length: k - 1 }, (_, j) => `w_${j + 1}`).join(", ")}\\}}`);
        if (k < 3) r += m(`\\coral{\\text{stop: next shadow} \\div \\norm{v_${k}}^2 = \\div 0}`);
        return r;
      };
      if (K.type === "v") {
        h += t("gram–schmidt · dot product");
        const last = ok ? K.k : Math.min(K.k, stop);
        for (let k = 0; k <= last; k++) h += m(vLine(k), k === stop ? "coral" : k === K.k ? "ans" : "past");
        if (!ok && K.k >= stop) h += why();
        if (!ok && K.k > stop) h += t(`(gs) stopped at v${"₁₂₃"[stop]} — there is no v${"₁₂₃"[K.k]}`);
      }
      if (K.type === "u") {
        h += t("the orthogonal basis");
        h += m(G.v.map((v, j) => (j === stop ? `v_${j + 1} = \\zero` : `v_${j + 1} = ${texFactored(v)}`)).join(", \\ "), "past");
        h += t("normalize · u = v / ‖v‖");
        const last = ok ? K.k : Math.min(K.k, stop);
        for (let k = 0; k <= last; k++) {
          if (k === stop) {
            h += m(`u_${k + 1} = \\frac{v_${k + 1}}{\\norm{v_${k + 1}}}: \\quad \\strike{\\div\\, 0}`);
            h += t("not a basis in → no orthonormal basis out");
          } else h += m(`\\norm{v_${k + 1}} = ${normTex(G.v[k])} \\ \\Rightarrow\\ u_${k + 1} = ${unitTex(G.v[k])}`, k === K.k ? "ans" : "past");
        }
        if (ok && K.k === 2) {
          // exact check: the primitive integer vectors are pairwise orthogonal, so <u_i,u_j> = δ_ij
          const ps = G.v.map((v) => factor(v).p);
          const orth = ps.every((p, i) => ps.every((q, j) => i === j || p.reduce((s, x, n) => s + x * q[n], 0n) === 0n));
          h += m(orth ? "\\ip{u_i}{u_j} = \\delta_{ij} \\ \\checkmark" : "\\coral{\\text{check failed}}", orth ? "" : "coral");
        }
      }
      out.innerHTML = h;
      for (const el of out.querySelectorAll(".ln")) {
        el.style.fontSize = "";
        const w = el.scrollWidth, avail = lines.clientWidth;
        if (w > avail) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * avail / w * 0.98).toFixed(1)}px`;
      }
    }

    build();
    space = window.GS_SPACE3D.create(container, sc, api);
    renderPanel();

    return {
      setStep(k, animate, mode) {
        step = k;
        build();
        space.setStep(k, animate, mode);
        renderPanel();
      },
      key: (e) => space.key(e),
      edge: () => space.edge(), auto: () => space.auto(), home: () => space.home(), status: () => space.status(),
      restyle() { space.restyle(); },
      destroy() { clearTimeout(timer); space.destroy(); },
    };
  }

  window.GS_SANDBOX = { create, gsExact, parseQ, texFactored, unitTex, normTex };
})();
