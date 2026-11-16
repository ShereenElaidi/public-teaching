// Regression checks for the 006 sandbox logic (no browser, no dependencies):
//   node --test tests/        (from math223/set08-gram-schmidt/)
// Covers entry validation, exact Gram–Schmidt, and that captions / CAUTION headlines / panel headings
// agree with where the computation actually stopped. The UI itself is checked by tests/ui.html.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const here = new URL("../assets/", import.meta.url);
const ctx = { window: {}, location: { search: "" } };
vm.createContext(ctx);
for (const f of ["steps.js", "sandbox.js"]) vm.runInContext(readFileSync(new URL(f, here), "utf8"), ctx, { filename: f });
const SB = ctx.window.GS_SANDBOX, S = ctx.window.GS_STEPS;
const sandbox = S.scenes.find((s) => s.id === "006");
const base = sandbox.steps.map((s) => s.caption);

const q = (str) => { const r = SB.checkEntry(str); assert.ok(r.q, `expected ${JSON.stringify(str)} to be valid, got ${r.err}`); return `${r.q.n}/${r.q.d}`; };
const err = (str) => { const r = SB.checkEntry(str); assert.ok(!r.q && r.err, `expected ${JSON.stringify(str)} to be rejected`); return r; };
const gs = (rows) => SB.gsExact(rows.map((r) => r.map((x) => SB.checkEntry(String(x)).q)));
const vec = (v) => v.map((x) => `${x.n}/${x.d}`).join(" ");
const tex = (s) => s;                                    // panelHTML with the TeX left as source
const texts = (G) => [0, 1, 2, 3, 4, 5, 6].map((st) => SB.stepText(G, st, base));

const EX28 = [[1, 2, -1], [1, 3, 1], [1, 1, 2]];
const W3_SUM = sandbox.sandbox.presets.find((p) => p.label.startsWith("w₃")).w;
const W2_DBL = sandbox.sandbox.presets.find((p) => p.label.startsWith("w₂")).w;
const W1_ZERO = [[0, 0, 0], [1, 2, 3], [0, 1, 1]];
const NEARLY = [["1", "0", "0"], ["1", "1/1000000", "0"], ["0", "0", "1"]];

// ------------------------------------------------------------------ entries
test("valid integers, decimals and fractions parse exactly", () => {
  assert.equal(q("3"), "3/1");
  assert.equal(q("-2"), "-2/1");
  assert.equal(q("+4"), "4/1");
  assert.equal(q("−3"), "-3/1");                       // typographic minus
  assert.equal(q("0"), "0/1");
  assert.equal(q("0.5"), "1/2");
  assert.equal(q("-.25"), "-1/4");
  assert.equal(q("1.20"), "6/5");
  assert.equal(q("1/3"), "1/3");
  assert.equal(q("-2/7"), "-2/7");
  assert.equal(q(" 4 / -6 "), "-2/3");
  assert.equal(q("1/1000000"), "1/1000000");
  assert.equal(q("99"), "99/1");
  assert.equal(q("-99"), "-99/1");
});

test("1/0 and other zero denominators are rejected with the reason", () => {
  for (const s of ["1/0", "-3/0", "0/0", "5 / 00"]) assert.match(err(s).err, /denominator is 0/);
});

test("malformed text is rejected as not a number", () => {
  for (const s of ["abc", "1e3", "1/2/3", "0x10", "1.2.3", "1/0.5", "2 3", "--1", "½"]) assert.match(err(s).err, /not a number/);
});

test("empty and partly typed entries are flagged gently", () => {
  for (const s of ["", "   "]) { const r = err(s); assert.ok(r.empty); assert.match(r.err, /empty/); }
  for (const s of ["-", "+", "1/", "-4 /", "5.", "."]) { const r = err(s); assert.ok(r.partial, s); assert.match(r.err, /unfinished/); }
});

test("entries outside ±99 are rejected", () => {
  for (const s of ["100", "-99.5", "199/2"]) assert.match(err(s).err, /too large/);
});

test("parseQ still returns null for anything checkEntry rejects", () => {
  assert.equal(SB.parseQ("1/0"), null);
  assert.equal(SB.parseQ("abc"), null);
  assert.equal(SB.parseQ(""), null);
  assert.equal(SB.parseQ("1/3").d, 3n);
});

// ------------------------------------------------------------------ exact Gram–Schmidt
test("Example 2.8: v3 = (1/6)(5,-2,1), det 5, normalized as in the notes", () => {
  const G = gs(EX28);
  assert.equal(G.zeroAt, -1);
  assert.equal(`${G.det.n}/${G.det.d}`, "5/1");
  assert.equal(vec(G.v[0]), "1/1 2/1 -1/1");
  assert.equal(vec(G.v[1]), "0/1 1/1 2/1");
  assert.equal(vec(G.v[2]), "5/6 -1/3 1/6");
  assert.equal(SB.texFactored(G.v[2]), "\\tfrac{1}{6}(5,\\,-2,\\,1)");
  assert.equal(SB.unitTex(G.v[0]), "\\tfrac{1}{\\sqrt{6}}(1,\\,2,\\,-1)");
  assert.equal(SB.unitTex(G.v[2]), "\\tfrac{1}{\\sqrt{30}}(5,\\,-2,\\,1)");
  assert.equal(SB.normTex(G.v[2]), "\\tfrac{1}{6}\\sqrt{30}");
});

test("nearly dependent basis: det 1/1000000, output is the standard basis", () => {
  const G = gs(NEARLY);
  assert.equal(G.zeroAt, -1);
  assert.equal(`${G.det.n}/${G.det.d}`, "1/1000000");
  assert.equal(vec(G.v[1]), "0/1 1/1000000 0/1");
  assert.deepEqual([...G.v.map(SB.unitTex)], ["(1,\\,0,\\,0)", "(0,\\,1,\\,0)", "(0,\\,0,\\,1)"]);
  const last = SB.panelHTML(G, 6, tex);
  assert.match(last, /u_2 = \(0,\\,1,\\,0\)/);
  assert.match(last, /\\delta_\{ij\} \\ \\checkmark/);
  assert.match(SB.panelHTML(G, 2, tex), /tiny but not 0/);
  assert.match(SB.panelHTML(G, 0, tex), /\\tfrac\{1\}\{1000000\}/);
});

// ------------------------------------------------------------------ failure states
test("first zero residual is tracked: w1 = 0, w2 = 2w1, w3 = w1 + w2", () => {
  assert.equal(gs(W1_ZERO).zeroAt, 0);
  assert.equal(gs(W2_DBL).zeroAt, 1);
  assert.equal(gs(W3_SUM).zeroAt, 2);
  for (const w of [W1_ZERO, W2_DBL, W3_SUM]) assert.equal(gs(w).det.n, 0n);
});

test("a basis keeps the base captions and no CAUTION", () => {
  const T = texts(gs(EX28));
  T.forEach((t, st) => { assert.equal(t.caption, base[st]); assert.equal(t.caution, ""); });
});

test("w1 = 0: nothing describes v2, v3 or a unit vector as produced", () => {
  const T = texts(gs(W1_ZERO));
  assert.match(T[1].caption, /no direction to start from/);
  assert.match(T[2].caption, /\$v_2\$ is never computed/);
  assert.match(T[3].caption, /\$v_3\$ is never computed/);
  assert.match(T[4].caption, /Nothing to normalize/);
  assert.match(T[4].caution, /can't be normalized/);
  assert.match(T[5].caption, /No \$u_2\$/);
  assert.match(T[6].caption, /No \$u_3\$/);
  for (const st of [1, 2, 3, 4, 5, 6]) {
    assert.notEqual(T[st].caption, base[st], `step ${st} still uses the success caption`);
    assert.doesNotMatch(T[st].caption, /length 1|same direction|minus its shadow/);
  }
});

test("w2 = 2w1: stops at v2; v3 and u2, u3 are not described as computed", () => {
  const T = texts(gs(W2_DBL));
  assert.equal(T[1].caption, base[1]);                  // v1 is fine
  assert.match(T[2].caption, /\$v_2 = \\zero\$: \$w_2\$ is a multiple of \$w_1\$/);
  assert.match(T[3].caption, /\$v_3\$ is never computed/);
  assert.doesNotMatch(T[3].caption, /minus its shadow on the plane/);
  assert.match(T[3].caution, /there is no \$v_3\$/);
  assert.match(T[4].caption, /still works/);
  assert.match(T[5].caption, /there is no \$u_2\$/);
  assert.match(T[6].caption, /No \$u_3\$/);
  assert.match(T[6].caution, /there is no \$u_3\$/);
});

test("w3 = w1 + w2: stops at v3 and explains why", () => {
  const T = texts(gs(W3_SUM));
  assert.equal(T[2].caption, base[2]);
  assert.match(T[3].caption, /already lies in the plane/);
  assert.match(T[6].caption, /there is no \$u_3\$/);
  assert.match(T[6].caption, /span only a plane/);
});

test("panel headings: 'the orthogonal basis' only for a complete run", () => {
  const ok = gs(EX28);
  for (const st of [4, 5, 6]) assert.match(SB.panelHTML(ok, st, tex), /the orthogonal basis/);
  for (const w of [W1_ZERO, W2_DBL, W3_SUM]) {
    const G = gs(w);
    for (const st of [4, 5, 6]) {
      const h = SB.panelHTML(G, st, tex);
      assert.doesNotMatch(h, /the orthogonal basis/, `stop ${G.zeroAt}, step ${st}`);
      assert.match(h, /computed orthogonal vectors/);
      assert.match(h, /\(gs\) stopped/);
      assert.doesNotMatch(h, /checkmark/);
    }
  }
  assert.match(SB.panelHTML(gs(W1_ZERO), 4, tex), /computed orthogonal vectors · none/);
});

test("panel says why it cannot continue, and never lists an uncomputed v_k", () => {
  const G = gs(W2_DBL);
  const h3 = SB.panelHTML(G, 3, tex);
  assert.match(h3, /can't continue: the next shadow divides by/);
  assert.match(h3, /v₃ is never computed/);
  assert.doesNotMatch(h3, /v_3 = w_3/);
  const g3 = SB.panelHTML(gs(W3_SUM), 3, tex);
  assert.match(g3, /only two independent directions/);
  const h6 = SB.panelHTML(G, 6, tex);
  assert.match(h6, /no u₃/);
  assert.doesNotMatch(h6, /u_3 =/);
});

test("every caption and headline has balanced $…$ maths", () => {
  for (const w of [EX28, W1_ZERO, W2_DBL, W3_SUM, NEARLY]) {
    for (const t of texts(gs(w))) for (const s of [t.caption, t.caution]) assert.equal((s.match(/\$/g) || []).length % 2, 0, s);
  }
});

// ------------------------------------------------------------------ predictions
test("sandbox prediction (will v3 be 0?) matches the computation", () => {
  assert.equal(SB.predictFor(gs(EX28), 3).answer, 1);
  assert.equal(SB.predictFor(gs(W3_SUM), 3).answer, 0);
  assert.equal(SB.predictFor(gs(W2_DBL), 3), null);       // v2 = 0: there is no v3 to ask about
  assert.equal(SB.predictFor(gs(W1_ZERO), 3), null);
  assert.equal(SB.predictFor(gs(EX28), 2), null);
});

test("the authored predictions in 004 and 005 are right", () => {
  const G = gs(EX28);
  const sq = (v) => v.reduce((s, x) => s + Number(x.n) / Number(x.d) * Number(x.n) / Number(x.d), 0);
  const ex = S.scenes.find((s) => s.id === "004"), br = S.scenes.find((s) => s.id === "005");
  const p1 = ex.steps[4].predict, p2 = ex.steps[9].predict, p3 = br.steps[1].predict;
  // <w2, v1> / |v1|^2 = 6/6 = 1 → "exactly v1"
  assert.equal(G.coef[1][0].n, 1n); assert.equal(G.coef[1][0].d, 1n);
  assert.equal(p1.options[p1.answer], "exactly $v_1$");
  // |v3|^2 = 30/36 < 1 → normalizing makes it longer
  assert.ok(Math.abs(sq(G.v[2]) - 30 / 36) < 1e-12);
  assert.equal(p2.options[p2.answer], "longer");
  // 005: w3 = w1 + w2 → v3 = 0
  assert.equal(gs([[1, 2, -1], [1, 3, 1], [2, 5, 0]]).zeroAt, 2);
  assert.match(p3.options[p3.answer], /v_3 = \\zero/);
  // only a few steps pause for a prediction
  const n = S.scenes.reduce((c, s) => c + s.steps.filter((st) => st.predict).length, 0);
  assert.ok(n <= 4, `${n} authored predictions`);
});
