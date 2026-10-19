import { describe, expect, it } from "vitest";
import {
  solveNumberSeries,
  solveNumberMatrix,
  solveLetterSeries,
  solveCode,
  solveSyllogism,
  solveArithmeticalReasoning,
} from "@/features/scholarship/solvers";

describe("Scholarship Solvers Library", () => {
  describe("Number Series Solver", () => {
    it("solves standard arithmetic series", () => {
      const res = solveNumberSeries({ sequence: [4, 7, 10, 13] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(16);
    });

    it("solves negative step arithmetic series", () => {
      const res = solveNumberSeries({ sequence: [25, 20, 15, 10] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(5);
    });

    it("solves geometric series", () => {
      const res = solveNumberSeries({ sequence: [3, 6, 12, 24] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(48);
    });

    it("solves two-step difference series (differences +2, +4, +6, +8)", () => {
      // 2, 4, 8, 14, 22 -> next diff is 10, so 32
      const res = solveNumberSeries({ sequence: [2, 4, 8, 14, 22] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(32);
    });

    it("solves alternating series", () => {
      // evens: 10, 12, 14 (+2)
      // odds:  30, 27, 24 (-3)
      // sequence: 10, 30, 12, 27, 14, 24 -> next term is index 6 (even), so 16
      const res = solveNumberSeries({ sequence: [10, 30, 12, 27, 14, 24] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(16);
    });

    it("solves Fibonacci-like series", () => {
      // 2, 3, 5, 8, 13, 21 -> next is 34
      const res = solveNumberSeries({ sequence: [2, 3, 5, 8, 13, 21] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(34);
    });

    it("rejects non-pattern sequence", () => {
      const res = solveNumberSeries({ sequence: [3, 9, 14, 28] });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/No supported series pattern matches/);
    });

    it("rejects sequences with fewer than 3 terms", () => {
      const res = solveNumberSeries({ sequence: [5, 10] });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/at least 3 terms/);
    });
  });

  describe("3x3 Number Matrices Solver", () => {
    it("solves row sum rule matrix", () => {
      // Rows sum to 30:
      // [ 8, 12, 10 ]
      // [ 5, 15, 10 ]
      // [ 7,  ?, 14 ] -> 30 - 21 = 9
      const grid = [
        [8, 12, 10],
        [5, 15, 10],
        [7, null, 14],
      ];
      const res = solveNumberMatrix({ grid });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(9);
    });

    it("solves column sum rule matrix", () => {
      // Columns sum to 25:
      // [ 10, 7,  9 ]
      // [  8, 11, 6 ]
      // [  7, ?, 10 ] -> col 1 sums to 7 + 11 + ? = 25 -> ? = 7
      const grid = [
        [10, 7, 9],
        [8, 11, 6],
        [7, null, 10],
      ];
      const res = solveNumberMatrix({ grid });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(7);
    });

    it("solves row linear combination matrix (c3 = 2*c1 + c2)", () => {
      // Row 0: 3, 4 -> 2*3 + 4 = 10 (sum = 17)
      // Row 1: 5, 2 -> 2*5 + 2 = 12 (sum = 19 != 17)
      // Row 2: 4, 3 -> ? = 2*4 + 3 = 11
      const grid = [
        [3, 4, 10],
        [5, 2, 12],
        [4, 3, null],
      ];
      const res = solveNumberMatrix({ grid });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(11);
    });

    it("solves row arithmetic progression matrix", () => {
      // Each row adds 4:
      // [ 2, 6, 10 ]
      // [ 5, 9, 13 ]
      // [ 1, 5, ? ] -> 9
      const grid = [
        [2, 6, 10],
        [5, 9, 13],
        [1, 5, null],
      ];
      const res = solveNumberMatrix({ grid });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe(9);
    });

    it("rejects matrix with multiple nulls", () => {
      const grid = [
        [1, null, 3],
        [4, 5, null],
        [7, 8, 9],
      ];
      const res = solveNumberMatrix({ grid });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/exactly one null/);
    });

    it("rejects matrix with no consistent rule", () => {
      const grid = [
        [2, 9, 14],
        [3, 11, 7],
        [8, 4, null],
      ];
      const res = solveNumberMatrix({ grid });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/No consistent/);
    });
  });

  describe("Letter Series Solver", () => {
    it("solves single-letter regular step series (+2)", () => {
      const res = solveLetterSeries({ sequence: ["A", "C", "E", "G"] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("I");
    });

    it("solves modular wrap-around letter series (+3)", () => {
      // U (20), X (23), A (0), D (3) -> G (6)
      const res = solveLetterSeries({ sequence: ["U", "X", "A", "D"] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("G");
    });

    it("solves multi-letter cluster series", () => {
      // First letter: B (1), D (3), F (5) -> H (7)
      // Second letter: Z (25), Y (24), X (23) -> W (22)
      const res = solveLetterSeries({ sequence: ["BZ", "DY", "FX"] });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("HW");
    });

    it("rejects letter series with invalid characters", () => {
      const res = solveLetterSeries({ sequence: ["A", "B", "3"] });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/Invalid character/);
    });

    it("rejects mismatched cluster lengths", () => {
      const res = solveLetterSeries({ sequence: ["AB", "CDE", "FG"] });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/same length/);
    });
  });

  describe("Coded Words Solver", () => {
    it("solves Caesar shift cipher encoding", () => {
      const res = solveCode({
        type: "caesar_shift",
        shift: 3,
        target: "CAT",
        operation: "encode",
      });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("FDW");
    });

    it("solves Caesar shift cipher decoding from examples", () => {
      // "COLD" -> "EQNF" (shift +2)
      // C(2)->E(4), O(14)->Q(16), L(11)->N(13), D(3)->F(5)
      const res = solveCode({
        type: "caesar_shift",
        examples: [{ plain: "COLD", coded: "EQNF" }],
        target: "VJG",
        operation: "decode",
      });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("THE");
    });

    it("solves substitution cipher derived from examples", () => {
      const res = solveCode({
        type: "substitution",
        examples: [
          { plain: "LAMP", coded: "QXBJ" },
          { plain: "POST", coded: "JWKD" },
        ],
        target: "STOP",
        operation: "encode",
      });
      expect(res.unique).toBe(true);
      // S->K, T->D, O->W, P->J
      if (res.unique) expect(res.value).toBe("KDWJ");
    });

    it("rejects contradictory substitution in examples", () => {
      const res = solveCode({
        type: "substitution",
        examples: [
          { plain: "CAT", coded: "XYZ" },
          { plain: "CAR", coded: "XAB" }, // A maps to Y and A
        ],
        target: "ACT",
      });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/Contradictory substitution/);
    });

    it("solves number substitution cipher (A=1..Z=26)", () => {
      const enc = solveCode({ type: "number_substitution", target: "BAD", operation: "encode" });
      expect(enc.unique).toBe(true);
      if (enc.unique) expect(enc.value).toBe("2-1-4");

      const dec = solveCode({ type: "number_substitution", target: "2-1-4", operation: "decode" });
      expect(dec.unique).toBe(true);
      if (dec.unique) expect(dec.value).toBe("BAD");
    });

    it("solves reverse cipher", () => {
      const res = solveCode({ type: "reverse", target: "ORANGE" });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("EGNARO");
    });
  });

  describe("Syllogism and Deduction Truth Table Solver", () => {
    it("verifies valid modus ponens syllogism", () => {
      // P: It rains, Q: Ground is wet
      // Premise 1: P -> Q
      // Premise 2: P
      // Conclusion C1: Q
      // Conclusion C2: !Q
      const res = solveSyllogism({
        variables: ["P", "Q"],
        premises: [
          { kind: "implies", antecedent: { kind: "var", name: "P" }, consequent: { kind: "var", name: "Q" } },
          { kind: "var", name: "P" },
        ],
        conclusions: [
          { id: "Q_is_true", expr: { kind: "var", name: "Q" } },
          { id: "Q_is_false", expr: { kind: "not", expr: { kind: "var", name: "Q" } } },
        ],
      });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("Q_is_true");
    });

    it("verifies transitive implication (A->B and B->C implies A->C)", () => {
      // Premise 1: A -> B
      // Premise 2: B -> C
      // Premise 3: A
      // Conclusion: C
      const res = solveSyllogism({
        variables: ["A", "B", "C"],
        premises: [
          { kind: "implies", antecedent: { kind: "var", name: "A" }, consequent: { kind: "var", name: "B" } },
          { kind: "implies", antecedent: { kind: "var", name: "B" }, consequent: { kind: "var", name: "C" } },
          { kind: "var", name: "A" },
        ],
        conclusions: [
          { id: "c_true", expr: { kind: "var", name: "C" } },
          { id: "not_c", expr: { kind: "not", expr: { kind: "var", name: "C" } } },
        ],
      });
      expect(res.unique).toBe(true);
      if (res.unique) expect(res.value).toBe("c_true");
    });

    it("rejects contradictory premises", () => {
      // P and !P
      const res = solveSyllogism({
        variables: ["P"],
        premises: [
          { kind: "var", name: "P" },
          { kind: "not", expr: { kind: "var", name: "P" } },
        ],
        conclusions: [{ id: "P", expr: { kind: "var", name: "P" } }],
      });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/contradictory/i);
    });

    it("identifies fallacious deduction (affirming the consequent)", () => {
      // Premise 1: P -> Q
      // Premise 2: Q
      // Candidate conclusion: P (fallacy, P does not necessarily follow)
      const res = solveSyllogism({
        variables: ["P", "Q"],
        premises: [
          { kind: "implies", antecedent: { kind: "var", name: "P" }, consequent: { kind: "var", name: "Q" } },
          { kind: "var", name: "Q" },
        ],
        conclusions: [
          { id: "P_must_be_true", expr: { kind: "var", name: "P" } },
        ],
      });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/None of the candidate conclusions/);
    });
  });

  describe("Arithmetical Reasoning Brute Force Solver", () => {
    it("solves multi-step word problem with unique integer solution", () => {
      // A farmer has chickens (C) and cows (K).
      // Total heads = C + K = 20
      // Total legs = 2*C + 4*K = 56
      // Find number of cows (K)
      const res = solveArithmeticalReasoning({
        variables: [
          { name: "C", min: 0, max: 20 },
          { name: "K", min: 0, max: 20 },
        ],
        constraints: [
          env => env.C + env.K === 20,
          env => 2 * env.C + 4 * env.K === 56,
        ],
        targetVariable: "K",
      });
      expect(res.unique).toBe(true);
      // 2C + 4K = 56, 2C + 2K = 40 => 2K = 16 => K = 8, C = 12
      if (res.unique) expect(res.value).toBe(8);
    });

    it("solves age difference problem", () => {
      // Sarah is 4 times as old as Liam: S = 4 * L
      // In 6 years, Sarah will be twice as old as Liam: S + 6 = 2 * (L + 6)
      // Find Liam's current age
      const res = solveArithmeticalReasoning({
        variables: [
          { name: "S", min: 1, max: 100 },
          { name: "L", min: 1, max: 50 },
        ],
        constraints: [
          env => env.S === 4 * env.L,
          env => env.S + 6 === 2 * (env.L + 6),
        ],
        targetVariable: "L",
      });
      expect(res.unique).toBe(true);
      // 4L + 6 = 2L + 12 => 2L = 6 => L = 3
      if (res.unique) expect(res.value).toBe(3);
    });

    it("rejects under-constrained problem with multiple solutions", () => {
      // A + B = 10, find A
      const res = solveArithmeticalReasoning({
        variables: [
          { name: "A", min: 0, max: 10 },
          { name: "B", min: 0, max: 10 },
        ],
        constraints: [
          env => env.A + env.B === 10,
        ],
        targetVariable: "A",
      });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/Multiple solutions found/);
    });

    it("rejects contradictory constraints", () => {
      const res = solveArithmeticalReasoning({
        variables: [
          { name: "X", min: 1, max: 10 },
        ],
        constraints: [
          env => env.X > 5,
          env => env.X < 3,
        ],
        targetVariable: "X",
      });
      expect(res.unique).toBe(false);
      if (!res.unique) expect(res.error).toMatch(/No integer solution/);
    });
  });
});
