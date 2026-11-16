/* Gram–Schmidt demo player: KaTeX setup, stage scaling, panel / captions / notes, clip playback,
   keyboard + click navigation. Content lives in steps.js; the live scenes in space3d.js and
   sandbox.js. No network access at runtime: KaTeX and fonts are local. */
(function () {
  "use strict";
  const S = window.GS_STEPS;
  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;

  // ------------------------------------------------------------------ KaTeX
  const KOPTS = {
    macros: S.macros, throwOnError: false, strict: "ignore", output: "html",
    trust: (ctx) => ctx.command === "\\htmlClass",
  };
  function tex(src, display) {
    try { return katex.renderToString(src, Object.assign({ displayMode: !!display }, KOPTS)); }
    catch (e) { return `<span style="color:var(--coral)">${src}</span>`; }
  }
  /** Prose with inline $...$ maths. */
  function rich(s) {
    // maths followed by punctuation stays on one line with it ("… of ℝ²." never wraps before the ".")
    return String(s).split(/(\$[^$]+\$[.,;:!?)]*)/g).map((part) => {
      const m = /^\$([^$]+)\$([.,;:!?)]*)$/.exec(part);
      if (!m) return escapeHTML(part);
      return m[2] ? `<span style="white-space:nowrap">${tex(m[1])}${escapeHTML(m[2])}</span>` : tex(m[1]);
    }).join("");
  }
  function escapeHTML(s) { return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

  // ------------------------------------------------------------------ stage scaling
  const stage = $("#stage");
  function fit() {
    const fr = document.getElementById("frame");
    const W = fr.clientWidth || window.innerWidth, H = fr.clientHeight || window.innerHeight;
    const portrait = H > W * 1.15 && W < 900;
    root.classList.toggle("portrait", portrait);
    const sw = portrait ? 1120 : 1920, sh = portrait ? 2000 : 1080;
    const k = Math.min(W / sw, H / sh);
    stage.style.transform = `translate(${(W - sw * k) / 2}px, ${(H - sh * k) / 2}px) scale(${k})`;
    $("#slide").style.height = `${H}px`;
    $("#handout").style.minHeight = `${H}px`;       // N brings the handout fully into view
    api.scale = k;
  }

  // ------------------------------------------------------------------ DOM
  $("#title-text").textContent = S.title;
  const segs = $("#segments");
  S.scenes.forEach(() => segs.appendChild(document.createElement("i")));
  const menu = $("#menu");
  S.scenes.forEach((sc, i) => {
    const b = document.createElement("button");
    b.innerHTML = `<kbd>${i + 1}</kbd>${escapeHTML(sc.name)}`;
    b.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.remove("open"); go(i, 0, "enter"); });
    menu.appendChild(b);
  });
  $("#menu-btn").addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("open"); $("#settings").classList.remove("open"); });
  $("#prev-btn").addEventListener("click", (e) => { e.stopPropagation(); prev(); });
  $("#next-btn").addEventListener("click", (e) => { e.stopPropagation(); next(); });

  const picture = $("#picture");
  const linesEl = $("#panel-lines");
  const toastEl = $("#toast");
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1300);
  }

  // shared api handed to the live scenes
  const api = { tex, rich, toast, scale: 1, linesEl, palette: () => (root.classList.contains("bright") ? "bright" : "dark") };

  // ------------------------------------------------------------------ state
  let si = 0, ki = 0;          // scene index, step index
  let live = null;             // live picture module (space3d / sandbox / theorem)
  let mountedScene = -1;

  // ------------------------------------------------------------------ panel
  function renderPanel(sc, k, animate) {
    if (sc.kind === "sandbox") { $("#panel-step").textContent = stepLabel(sc, k); return; } // sandbox draws its own panel
    let start = 0;
    for (let j = 0; j <= k; j++) if (sc.steps[j].clear) start = j;
    const html = [];
    for (let j = start; j <= k; j++) {
      for (const L of sc.steps[j].add || []) {
        const cls = ["ln"];
        if (L.t) cls.push("t");
        if (L.small) cls.push("small");
        if (L.coral) cls.push("coral");
        if (L.ans) cls.push("ans");
        if (j < k) cls.push("past");
        if (j === k && animate) cls.push("enter", "sweep"); else cls.push("static");
        const body = L.t ? escapeHTML(L.t) : tex("\\displaystyle " + L.m);
        const delay = j === k && animate ? ` style="animation-delay:${(0.12 * html.filter((h) => h.cur).length).toFixed(2)}s"` : "";
        html.push({ cur: j === k, s: `<div class="${cls.join(" ")}"${delay}><span class="body">${body}</span></div>` });
      }
    }
    linesEl.innerHTML = html.map((h) => h.s).join("");
    // shrink any line that would overflow the panel width
    for (const el of linesEl.querySelectorAll(".ln")) {
      const w = el.scrollWidth, avail = linesEl.clientWidth;
      if (w > avail) el.style.fontSize = `${(parseFloat(getComputedStyle(el).fontSize) * avail / w * 0.98).toFixed(1)}px`;
    }
    $("#panel-step").textContent = stepLabel(sc, k);
  }
  function stepLabel(sc, k) { return sc.steps.length > 1 ? `STEP ${k + 1} / ${sc.steps.length}` : ""; }

  // ------------------------------------------------------------------ chrome
  function renderChrome(sc, k) {
    [...segs.children].forEach((el, i) => { el.className = i < si ? "done" : i === si ? "cur" : ""; });
    $("#count").textContent = `${sc.id} / ${S.scenes[S.scenes.length - 1].id}`;
    $("#panel-chip").innerHTML = rich(sc.chip);
    [...menu.children].forEach((b, i) => b.classList.toggle("cur", i === si));
    $("#caption").innerHTML = rich(sc.steps[k].caption || "");
    // caution steps (a step's own `caution`, or the scene's): coral banner, panel and chip
    setCaution(sc.steps[k].caution || sc.caution || "");
    renderKeys(sc);
    $("#ho-body").innerHTML =
      (sc.notes || []).map((p) => `<p>${rich(p)}</p>`).join("") +
      (sc.tryIt && sc.tryIt.length ? `<div class="try"><span class="chip-inline">TRY IT</span><ul>${sc.tryIt.map((t) => `<li>${rich(t)}</li>`).join("")}</ul></div>` : "");
    $("#ho-chip").innerHTML = rich(`Notes · ${sc.name}`);
    try { history.replaceState(null, "", `#${sc.id}-${k + 1}`); } catch (e) { /* file:// in some browsers */ }
  }

  /** CAUTION look on/off; the sandbox also calls this live (api.setCaution) as students type. */
  function setCaution(text) {
    root.classList.toggle("caution", !!text);
    if (text) $("#caution .cz-text").innerHTML = rich(text);
    $("#note-chip").textContent = text ? "CAUTION" : "REMARK";
  }
  api.setCaution = setCaution;

  // ------------------------------------------------------------------ clips
  const clip = {
    layer: null, still: null, vids: [], front: -1, token: 0,
    build() {
      const layer = document.createElement("div");
      layer.className = "clip-layer";
      layer.innerHTML = `<img alt=""><video muted playsinline preload="auto"></video><video muted playsinline preload="auto"></video>`;
      this.layer = layer; this.still = layer.querySelector("img"); this.vids = [...layer.querySelectorAll("video")];
      this.vids.forEach((v) => { v.muted = true; v.disablePictureInPicture = true; });
      this.front = -1;
      return layer;
    },
    pal() { return root.classList.contains("bright") && S.brightClips ? "bright" : "dark"; },
    url(sc, n, ext) { return `clips/${this.pal()}/${sc.id}_${n}.${ext}`; },
    framed() { this.layer.classList.toggle("framed", root.classList.contains("bright") && !S.brightClips); },
    preloadStills(sc) { for (let n = 0; n <= sc.steps.length; n++) { const im = new Image(); im.src = this.url(sc, n, "jpg"); } },
    showEnd(sc, k) {                       // final frame of step k, instantly
      this.token++;
      this.framed();
      this.still.src = this.url(sc, k + 1, "jpg");
      this.still.classList.remove("hide");
      this.vids.forEach((v) => { v.classList.remove("on"); v.pause(); });
      this.front = -1;
      this.preload(sc, k + 1);
    },
    play(sc, k) {                          // play step k from its first frame (= the previous step's last)
      const tok = ++this.token;
      this.framed();
      const back = this.front === 0 ? 1 : 0;
      const v = this.vids[back], other = this.vids[1 - back];
      const src = this.url(sc, k + 1, "mp4");
      if (this.front === -1) { this.still.src = this.url(sc, k, "jpg"); this.still.classList.remove("hide"); }
      if (v.dataset.src !== src) { v.dataset.src = src; v.src = src; v.load(); }
      else if (v.currentTime !== 0) { try { v.currentTime = 0; } catch (e) { /* not ready */ } }
      const reveal = () => {
        if (tok !== this.token) return;
        v.classList.add("on"); other.classList.remove("on"); other.pause();
        // the clip's edges are feathered: nothing may sit underneath except the board itself
        this.still.classList.add("hide");
        this.front = back;
      };
      v.onended = () => { if (tok === this.token) this.preload(sc, k + 1); };
      const start = () => {
        if (tok !== this.token) return;
        const p = v.play();
        // reveal on the first presented frame; timeupdate / a short timeout as fallbacks (rVFC can stall
        // when the page isn't being composited)
        const onFrame = () => {
          if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => reveal());
          v.addEventListener("timeupdate", function tu() { if (v.currentTime > 0) { v.removeEventListener("timeupdate", tu); reveal(); } });
          setTimeout(reveal, 250);
        };
        if (p && p.then) p.then(onFrame).catch(() => { this.showEnd(sc, k); }); else onFrame();
      };
      // a seek (replay, or a preloaded clip) drops readyState until "seeked", so listen for all three
      let begun = false;
      const go1 = () => { if (!begun && v.readyState >= 2 && !v.seeking) { begun = true; start(); } };
      go1();
      if (!begun) for (const ev of ["loadeddata", "canplay", "seeked"]) v.addEventListener(ev, go1, { once: true });
    },
    preload(sc, k) {                       // warm the idle <video> with step k's clip
      if (k >= sc.steps.length) return;
      const idle = this.vids[this.front === 0 ? 1 : 0];
      const src = this.url(sc, k + 1, "mp4");
      if (idle.dataset.src !== src) { idle.dataset.src = src; idle.src = src; idle.load(); }
    },
  };

  // ------------------------------------------------------------------ 001 (HTML only)
  function theoremModule(sc) {
    const T = sc.theorem;
    const wrap = document.createElement("div");
    wrap.className = "thm-wrap";
    wrap.innerHTML = `<div class="thm"><div class="chip">${rich(T.tab)}</div>
      <div>${rich(T.lead)}</div>
      <div class="display">${tex(T.display, true)}</div>
      <div class="brace-note"><span class="arrow">↑</span>${rich(T.braceNote)}</div>
      <div>${rich(T.tail)}</div></div>`;
    picture.appendChild(wrap);
    const note = wrap.querySelector(".brace-note");
    return {
      setStep(k) { note.classList.toggle("show", k >= 1); },
      destroy() { wrap.remove(); },
    };
  }

  // ------------------------------------------------------------------ navigation
  function mount(sc) {
    if (live && live.destroy) live.destroy();
    live = null;
    picture.innerHTML = "";
    linesEl.innerHTML = "";
    if (sc.kind === "clip") { picture.appendChild(clip.build()); clip.preloadStills(sc); }
    else if (sc.kind === "html") live = theoremModule(sc);
    else if (sc.kind === "space3d") live = window.GS_SPACE3D.create(picture, sc, api);
    else if (sc.kind === "sandbox") live = window.GS_SANDBOX.create(picture, sc, api);
    mountedScene = si;
  }

  /** mode: "enter" (scene start, animate), "forward", "replay", "back" (no animation, final state). */
  function go(s, k, mode) {
    s = Math.max(0, Math.min(S.scenes.length - 1, s));
    const sc = S.scenes[s];
    k = Math.max(0, Math.min(sc.steps.length - 1, k));
    si = s; ki = k;
    if (mountedScene !== s) mount(sc);
    const animate = mode !== "back";
    renderChrome(sc, k);
    renderPanel(sc, k, animate);
    if (sc.kind === "clip") { if (animate) clip.play(sc, k); else clip.showEnd(sc, k); }
    else if (live) live.setStep(k, animate, mode);
    renderSettings(); renderKeys(sc);
  }
  function next() {
    const sc = S.scenes[si];
    if (ki < sc.steps.length - 1) go(si, ki + 1, "forward");
    else if (si < S.scenes.length - 1) go(si + 1, 0, "enter");
  }
  function prev() {
    if (ki > 0) go(si, ki - 1, "back");
    else if (si > 0) go(si - 1, S.scenes[si - 1].steps.length - 1, "back");
  }

  function toggle(cls, on) { root.classList.toggle(cls, on); }

  // ------------------------------------------------------------------ actions (keys and the settings menu)
  const is3D = () => !!(live && live.edge);
  const actions = {
    captions: () => toggle("captions-off"),
    notes: () => showHandout(!handoutInView()),
    bright: () => {
      toggle("bright");
      const sc = S.scenes[si];
      if (sc.kind === "clip") clip.showEnd(sc, ki);
      if (live && live.restyle) live.restyle();
    },
    fullscreen: () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    },
    next: () => next(),
    prev: () => prev(),
    settings: () => toggleSettings(),
    edge: () => { if (is3D()) live.edge(); },
    auto: () => { if (is3D()) live.auto(); },
    home: () => { if (is3D()) live.home(); },
  };
  const stateOf = {
    captions: () => !root.classList.contains("captions-off"),
    notes: () => handoutInView(),
    bright: () => root.classList.contains("bright"),
    fullscreen: () => !!document.fullscreenElement,
    edge: () => is3D() && live.status().edge,
    auto: () => is3D() && live.status().auto,
  };
  function act(name) { actions[name](); renderSettings(); renderKeys(); }

  // ------------------------------------------------------------------ handout (the notes below the slide)
  const frameEl = $("#frame"), handout = $("#handout");
  const handoutInView = () => frameEl.scrollTop > handout.offsetTop / 2;
  function showHandout(on) { frameEl.scrollTo({ top: on ? handout.offsetTop - 16 : 0, behavior: "smooth" }); }
  $("#ho-up").addEventListener("click", () => showHandout(false));
  let scrollRaf = 0, wasDown = false;
  frameEl.addEventListener("scroll", () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      const down = handoutInView();
      if (down !== wasDown) { wasDown = down; renderKeys(); renderSettings(); }
    });
  });

  // ------------------------------------------------------------------ the key buttons (lower third)
  const keysEl = $("#keys");
  function renderKeys(sc) {
    sc = sc || S.scenes[si];
    const list = S.keys.slice();
    if (sc.kind === "space3d" || sc.kind === "sandbox") list.splice(list.lastIndexOf("|"), 0, "|", ...S.keys3D);
    stateOf.settings = () => settings.classList.contains("open");
    keysEl.innerHTML = list.map((k) => (k === "|" ? '<span class="kgap"></span>'
      : `<button type="button" class="kbtn${k[1] in stateOf && stateOf[k[1]]() ? " on" : ""}" data-act="${k[1]}" data-tip="${escapeHTML(k[2])}" aria-label="${escapeHTML(k[2])}">${escapeHTML(k[0])}</button>`)).join("");
  }
  api.refreshKeys = () => { renderKeys(); renderSettings(); };
  keysEl.addEventListener("click", (e) => {
    const b = e.target.closest("button.kbtn");
    if (!b) return;
    e.stopPropagation();
    act(b.dataset.act);
  });

  // ------------------------------------------------------------------ settings menu (S)
  const settings = $("#settings");
  function renderSettings() {
    if (!settings.classList.contains("open")) return;
    const rows = S.settings.map((r) => {
      if (r.group) return `<div class="st-group">${escapeHTML(r.group)}</div>`;
      const off = r.only3d && !is3D();
      const st = !r.act ? "" : r.act in stateOf
        ? (stateOf[r.act]() ? '<span class="st-state on">ON</span>' : '<span class="st-state off">OFF</span>')
        : '<span class="st-state go">GO</span>';
      const tag = r.act ? "button" : "div";
      return `<${tag} class="st-row${off ? " disabled" : ""}"${r.act ? ` type="button" data-act="${r.act}"` : ""}>` +
        `<kbd>${escapeHTML(r.key)}</kbd><span class="st-name">${escapeHTML(r.name)}</span><span class="st-text">${rich(r.text)}</span>${st || "<span></span>"}</${tag}>`;
    }).join("");
    settings.innerHTML = `<div class="st-head"><span class="st-title">Settings &amp; keys</span>` +
      `<button class="st-close" type="button">CLOSE ✕</button></div>${rows}`;
  }
  function toggleSettings(open) {
    const on = open != null ? open : !settings.classList.contains("open");
    settings.classList.toggle("open", on);
    $("#settings-btn").classList.toggle("on", on);
    if (on) { menu.classList.remove("open"); renderSettings(); }
    renderKeys();
  }
  $("#settings-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleSettings(); });
  settings.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target.closest(".st-close")) { toggleSettings(false); return; }
    const row = e.target.closest("button.st-row");
    if (row) act(row.dataset.act);
  });
  document.addEventListener("fullscreenchange", renderSettings);

  // ------------------------------------------------------------------ input
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;  // typing in the sandbox
    const k = e.key, K = k.length === 1 ? k.toLowerCase() : k;
    const keyAct = { c: "captions", n: "notes", b: "bright", f: "fullscreen", v: "edge", a: "auto", Home: "home" }[K];
    if (keyAct && (["edge", "auto", "home"].indexOf(keyAct) < 0 || is3D())) act(keyAct);
    else if (k === "ArrowRight" || k === "PageDown" || k === " ") next();
    else if (k === "ArrowLeft" || k === "PageUp") prev();
    else if (K === "r") go(si, ki, "replay");
    else if (K === "s") toggleSettings();
    else if (/^[1-9]$/.test(k) && +k <= S.scenes.length) go(+k - 1, 0, "enter");
    else if (k === "Escape") { menu.classList.remove("open"); toggleSettings(false); showHandout(false); }
    else return;
    e.preventDefault();
  });
  stage.addEventListener("click", (e) => {
    if (menu.classList.contains("open")) { menu.classList.remove("open"); return; }
    if (settings.classList.contains("open")) { toggleSettings(false); return; }
    if (e.target.closest("svg.scene, #menu, #settings, button, input, .sb-panel, a")) return;
    next();
  });
  window.addEventListener("resize", fit);

  // ------------------------------------------------------------------ boot
  fit();
  const m = /^#(\d{3})-(\d+)$/.exec(location.hash);
  const start = m ? S.scenes.findIndex((s) => s.id === m[1]) : 0;
  const startStep = m ? +m[2] - 1 : 0;
  // fonts first, so KaTeX and the SVG labels measure correctly
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() =>
    go(Math.max(0, start), startStep, startStep > 0 ? "back" : "enter"));
  window.GS_PLAYER = { go, next, prev, state: () => ({ scene: S.scenes[si].id, step: ki + 1 }) };
})();
