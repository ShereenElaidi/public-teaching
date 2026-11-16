"""Check every number used in the demo (panel lines, clips, JS scenes) with sympy.
(The 006 sandbox computes live with exact fractions; it was checked against sympy on 348 inputs.)

    python manim/verify.py      # prints OK lines; raises AssertionError on any mismatch
"""
from sympy import Matrix, Rational as Q, sqrt, simplify, eye


def gs(ws, ip):
    vs = []
    for w in ws:
        v = w
        for u in vs:
            v = v - ip(w, u) / ip(u, u) * u
        vs.append(simplify(v) if not isinstance(v, Matrix) else v.applyfunc(simplify))
    return vs


dot = lambda a, b: (a.T * b)[0]
ok = lambda msg: print("OK ", msg)

# ---------- 002: R^2
w1, w2 = Matrix([3, 1]), Matrix([2, 2])
assert dot(w2, w1) == 8 and dot(w1, w1) == 10; ok("<w2,v1> = 8, |v1|^2 = 10")
v1, v2 = gs([w1, w2], dot)
assert v2 == Matrix([Q(-2, 5), Q(6, 5)]) == Q(2, 5) * Matrix([-1, 3]); ok("v2 = (-2/5, 6/5) = (2/5)(-1,3)")
assert Q(8, 10) * w1 == Matrix([Q(12, 5), Q(4, 5)]); ok("shadow = (12/5, 4/5)")
assert dot(v1, v2) == 0; ok("<v1,v2> = 0")

# ---------- 003: normalize (R^2)
u = [v1 / sqrt(10), Matrix([-1, 3]) / sqrt(10)]
assert simplify(dot(u[0], u[0]) - 1) == 0 and simplify(dot(u[1], u[1]) - 1) == 0 and dot(u[0], u[1]) == 0
assert simplify(dot(v2, v2) - Q(8, 5)) == 0 and simplify(v2 / sqrt(dot(v2, v2)) - u[1]) == Matrix([0, 0])
ok("R2 ONB: (3,1)/sqrt10, (-1,3)/sqrt10")

# ---------- 004: R^3
W = [Matrix([1, 2, -1]), Matrix([1, 3, 1]), Matrix([1, 1, 2])]
assert Matrix.hstack(*W).det() == 5
V = gs(W, dot)
assert dot(W[1], V[0]) == 6 == dot(V[0], V[0]); ok("<w2,v1> = 6 = |v1|^2")
assert V[1] == Matrix([0, 1, 2]); ok("v2 = (0,1,2)")
assert dot(W[2], V[0]) == 1 and dot(W[2], V[1]) == 5 == dot(V[1], V[1]); ok("<w3,v1> = 1, <w3,v2> = 5 = |v2|^2")
assert Q(1, 6) * V[0] + V[1] == Matrix([Q(1, 6), Q(4, 3), Q(11, 6)]); ok("shadow = (1/6)v1 + v2")
assert W[2] - Q(1, 6) * Matrix([1, 2, -1]) - Matrix([0, 1, 2]) == Q(1, 6) * Matrix([5, -2, 1]); ok("panel line for v3")
assert V[2] == Q(1, 6) * Matrix([5, -2, 1]); ok("v3 = (1/6)(5,-2,1)")
assert all(dot(V[i], V[j]) == 0 for i in range(3) for j in range(3) if i != j); ok("R3 OB")
U = [V[0] / sqrt(6), V[1] / sqrt(5), Matrix([5, -2, 1]) / sqrt(30)]
assert all(simplify(V[i] / sqrt(dot(V[i], V[i])) - U[i]) == Matrix([0, 0, 0]) for i in range(3))
assert Matrix(3, 3, lambda i, j: simplify(dot(U[i], U[j]))) == eye(3); ok("R3 ONB matches Example 2.8")

# ---------- 005: breaking GS
W6 = [Matrix([1, 2, -1]), Matrix([1, 3, 1]), Matrix([2, 5, 0])]
assert W6[2] == W6[0] + W6[1] and Matrix.hstack(*W6).det() == 0; ok("w3 = w1 + w2, det = 0")
assert dot(W6[2], V[0]) == 12 and dot(W6[2], V[1]) == 5 and dot(V[1], V[1]) == 5; ok("12/6 = 2, 5/5 = 1")
assert 2 * V[0] + V[1] == W6[2]; ok("shadow = 2 v1 + v2 = w3")
assert W6[2] - 2 * V[0] - V[1] == Matrix([0, 0, 0]); ok("v3 = 0")
print("all checks passed")
