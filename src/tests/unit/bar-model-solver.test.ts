import { describe, expect, it } from "vitest";

import {
  formatRational,
  rational,
  rationalFromDecimal,
  solveLinearSystem,
  terminatingDecimal,
  constant,
  variable,
  equation,
} from "@/features/visuals/bar-model/rational";
import { solveBarModel } from "@/features/visuals/bar-model/validate";
import { barModelDataSchema, type BarModelData } from "@/schemas/visual.schema";

/** Parse through the real schema so defaults (braces: [] etc.) apply. */
function model(input: Record<string, unknown>): BarModelData {
  return barModelDataSchema.parse({ layout: { mode: "schematic" }, ...input });
}

const codes = (result: ReturnType<typeof solveBarModel>) => result.issues.map((entry) => entry.code);

describe("exact rational arithmetic", () => {
  it("parses decimals exactly, with no float error", () => {
    expect(formatRational(rationalFromDecimal("0.125"))).toBe("1/8");
    expect(formatRational(rationalFromDecimal(0.3))).toBe("3/10");
    expect(formatRational(rationalFromDecimal(12))).toBe("12");
  });

  it("finds a terminating decimal only when one exists", () => {
    expect(terminatingDecimal(rational(BigInt(9), BigInt(2)))).toBe("4.5");
    expect(terminatingDecimal(rational(BigInt(1), BigInt(8)))).toBe("0.125");
    expect(terminatingDecimal(rational(BigInt(7)))).toBe("7");
    expect(terminatingDecimal(rational(BigInt(1), BigInt(3)))).toBeNull();
  });

  it("solves, detects contradictions and reports undetermined variables", () => {
    const unique = solveLinearSystem(
      ["x", "y"],
      [
        equation(variable("x"), constant(rational(BigInt(3)))),
        equation(variable("y"), variable("x")),
      ],
    );
    expect(unique.consistent && formatRational(unique.determined.get("y")!)).toBe("3");

    const clash = solveLinearSystem(
      ["x"],
      [equation(variable("x"), constant(rational(BigInt(1)))), equation(variable("x"), constant(rational(BigInt(2))))],
    );
    expect(clash.consistent).toBe(false);

    const free = solveLinearSystem(["x", "y"], [equation(variable("x"), variable("y"))]);
    expect(free.consistent && [...free.undetermined].sort()).toEqual(["x", "y"]);
  });
});

describe("solveBarModel: model types", () => {
  it("part-whole: total minus a given part", () => {
    const result = solveBarModel(
      model({
        bars: [
          {
            id: "bar",
            label: "Bar",
            segments: [
              { id: "a", value: 18, display: "value" },
              { id: "b", unknown: "p", display: "unknown", target: true },
            ],
          },
        ],
        braces: [{ id: "all", kind: "total", value: 45, display: "value", spans: ["a", "b"] }],
      }),
    );
    expect(result).toMatchObject({ ok: true, target: { numerator: "27", denominator: "1" }, isWhole: true });
  });

  it("comparison: difference = longer - shorter", () => {
    const result = solveBarModel(
      model({
        groups: [{ id: "g", barIds: ["long", "short"] }],
        bars: [
          { id: "long", label: "Long", segments: [{ id: "l", value: 34, display: "value" }] },
          { id: "short", label: "Short", segments: [{ id: "s", value: 21, display: "value" }] },
        ],
        braces: [
          { id: "gap", kind: "difference", unknown: "d", display: "unknown", target: true, longerBarId: "long", shorterBarId: "short" },
        ],
      }),
    );
    expect(result.target).toEqual({ numerator: "13", denominator: "1" });
  });

  it("times-as-many: a given unit value scales every unit segment", () => {
    const result = solveBarModel(
      model({
        units: [{ id: "u", value: 6 }],
        bars: [{ id: "bar", label: "Mia", segments: [{ id: "s", units: 3, unitId: "u", display: "blank" }] }],
        braces: [{ id: "t", kind: "total", unknown: "m", display: "unknown", target: true, spans: ["s"] }],
      }),
    );
    expect(result.target).toEqual({ numerator: "18", denominator: "1" });
  });

  it("equal units with an unknown unit and a multi-bar total", () => {
    const result = solveBarModel(
      model({
        units: [{ id: "bag" }],
        groups: [{ id: "g", barIds: ["a", "b"] }],
        bars: [
          { id: "a", label: "A", segments: [{ id: "a1", units: 2, unitId: "bag", display: "blank" }] },
          { id: "b", label: "B", segments: [{ id: "b1", units: 5, unitId: "bag", display: "blank" }] },
        ],
        braces: [
          { id: "both", kind: "total", value: 56, display: "value", barIds: ["a", "b"] },
          { id: "bt", kind: "total", unknown: "t", display: "unknown", target: true, spans: ["b1"] },
        ],
      }),
    );
    expect(result.target).toEqual({ numerator: "40", denominator: "1" });
  });

  it("add: after = before + quantity", () => {
    const result = solveBarModel(
      model({
        groups: [{ id: "g", barIds: ["b", "a"] }],
        quantities: [{ id: "q", value: 15, display: "value" }],
        bars: [
          { id: "b", label: "B", stage: "before", segments: [{ id: "x", value: 20, display: "value" }] },
          { id: "a", label: "A", stage: "after", segments: [{ id: "y", unknown: "n", display: "unknown", target: true }] },
        ],
        relationships: [{ kind: "add", fromStage: "b", toStage: "a", quantityId: "q" }],
      }),
    );
    expect(result.target).toEqual({ numerator: "35", denominator: "1" });
  });

  it("remove: works backwards from the after bar", () => {
    const result = solveBarModel(
      model({
        groups: [{ id: "g", barIds: ["b", "a"] }],
        quantities: [{ id: "q", value: 15, display: "value" }],
        bars: [
          { id: "b", label: "B", stage: "before", segments: [{ id: "x", unknown: "s", display: "unknown", target: true }] },
          { id: "a", label: "A", stage: "after", segments: [{ id: "y", value: 32, display: "value" }] },
        ],
        relationships: [{ kind: "remove", fromStage: "b", toStage: "a", quantityId: "q" }],
      }),
    );
    expect(result.target).toEqual({ numerator: "47", denominator: "1" });
  });

  const transferModel = (afterCal: number) =>
    model({
      groups: [{ id: "g", barIds: ["a1", "b1", "c1", "a2", "b2", "c2"] }],
      quantities: [{ id: "gift", unknown: "g", display: "unknown", target: true }],
      bars: [
        { id: "a1", label: "A", stage: "before", segments: [{ id: "a1s", value: 70, display: "value" }] },
        { id: "b1", label: "B", stage: "before", segments: [{ id: "b1s", value: 38, display: "value" }] },
        { id: "c1", label: "C", stage: "before", segments: [{ id: "c1s", value: 10, display: "value" }] },
        { id: "a2", label: "A", stage: "after", segments: [{ id: "a2s", value: 50, display: "value" }] },
        { id: "b2", label: "B", stage: "after", segments: [{ id: "b2s", value: 58, display: "value" }] },
        { id: "c2", label: "C", stage: "after", segments: [{ id: "c2s", value: afterCal, display: "value" }] },
      ],
      relationships: [
        { kind: "transfer", fromBar: "a1", toBar: "b1", quantityId: "gift", beforeBars: ["a1", "b1", "c1"], afterBars: ["a2", "b2", "c2"] },
      ],
    });

  it("transfer: the giver drops, the receiver gains, and conservation is checked", () => {
    const ok = solveBarModel(transferModel(10));
    expect(ok).toMatchObject({ ok: true, target: { numerator: "20", denominator: "1" }, conservationChecks: 1 });

    const broken = solveBarModel(transferModel(15));
    expect(broken.ok).toBe(false);
    expect(codes(broken)).toEqual(["transfer_breaks_conservation"]);
  });

  it("equal: bars share one total", () => {
    const result = solveBarModel(
      model({
        bars: [
          { id: "a", label: "A", segments: [{ id: "a1", value: 30, display: "value" }] },
          { id: "b", label: "B", segments: [{ id: "b1", unknown: "q", display: "unknown", target: true }] },
        ],
        relationships: [{ kind: "equal", barIds: ["a", "b"] }],
      }),
    );
    expect(result.target).toEqual({ numerator: "30", denominator: "1" });
  });
});

describe("solveBarModel: rejection and warnings", () => {
  const wholeBar = (extra: Record<string, unknown>) =>
    model({
      bars: [
        {
          id: "bar",
          label: "Bar",
          segments: [
            { id: "a", value: 18, display: "value" },
            { id: "b", unknown: "p", display: "unknown", target: true },
            ...(extra.segments as unknown[] ?? []),
          ],
        },
      ],
      braces: extra.braces ?? [{ id: "all", kind: "total", value: 45, display: "value", spans: ["a", "b"] }],
    });

  it("reports contradictory givens", () => {
    const result = solveBarModel(
      wholeBar({
        braces: [
          { id: "all", kind: "total", value: 45, display: "value", spans: ["a", "b"] },
          { id: "again", kind: "total", value: 50, display: "value", spans: ["a", "b"] },
        ],
      }),
    );
    expect(codes(result)).toContain("contradictory_givens");
    expect(result.target).toBeNull();
  });

  it("rejects a target that no equation pins down", () => {
    const result = solveBarModel(wholeBar({ braces: [] }));
    expect(codes(result)).toContain("target_not_unique");
  });

  it("allows undetermined intermediates when the target is unique", () => {
    const result = solveBarModel(
      model({
        bars: [
          {
            id: "bar",
            label: "Bar",
            segments: [
              { id: "a", value: 18, display: "value" },
              { id: "b", unknown: "p", display: "unknown", target: true },
            ],
          },
          { id: "other", label: "Other", segments: [{ id: "free", unknown: "f", display: "blank" }] },
        ],
        braces: [{ id: "all", kind: "total", value: 45, display: "value", spans: ["a", "b"] }],
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.target?.numerator).toBe("27");
  });

  it("a target tied to an undetermined intermediate is not unique", () => {
    const result = solveBarModel(
      model({
        bars: [
          {
            id: "bar",
            label: "Bar",
            segments: [
              { id: "a", unknown: "f", display: "blank" },
              { id: "b", unknown: "p", display: "unknown", target: true },
            ],
          },
        ],
        braces: [{ id: "all", kind: "total", value: 45, display: "value", spans: ["a", "b"] }],
      }),
    );
    expect(codes(result)).toContain("target_not_unique");
  });

  it("rejects a model that needs a negative quantity", () => {
    const result = solveBarModel(
      model({
        groups: [{ id: "g", barIds: ["b", "a"] }],
        quantities: [{ id: "q", value: 15, display: "value" }],
        bars: [
          { id: "b", label: "B", stage: "before", segments: [{ id: "x", unknown: "s", display: "unknown", target: true }] },
          { id: "a", label: "A", stage: "after", segments: [{ id: "y", value: 10, display: "value" }] },
        ],
        relationships: [{ kind: "add", fromStage: "b", toStage: "a", quantityId: "q" }],
      }),
    );
    expect(codes(result)).toContain("infeasible_negative");
  });

  it("serialises exact fractions as numerator/denominator strings and warns", () => {
    const result = solveBarModel(
      model({
        units: [{ id: "u" }],
        bars: [
          {
            id: "bar",
            label: "Bar",
            segments: [
              { id: "a", units: 1, unitId: "u", display: "blank" },
              { id: "b", units: 1, unitId: "u", display: "blank" },
            ],
          },
        ],
        braces: [
          { id: "all", kind: "total", value: 9, display: "value", spans: ["a", "b"] },
          { id: "one", kind: "part", unknown: "n", display: "unknown", target: true, spans: ["a"] },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.target).toEqual({ numerator: "9", denominator: "2" });
    expect(result.isWhole).toBe(false);
    expect(codes(result)).toEqual(["fractional_target"]);
    expect(result.issues[0].severity).toBe("warning");
    expect(typeof result.target?.numerator).toBe("string");
  });

  it("keeps decimals exact (0.1 + 0.2 is 3/10)", () => {
    const result = solveBarModel(
      model({
        bars: [
          {
            id: "bar",
            label: "Bar",
            segments: [
              { id: "a", value: 0.1, display: "value" },
              { id: "b", unknown: "p", display: "unknown", target: true },
            ],
          },
        ],
        braces: [{ id: "all", kind: "total", value: 0.3, display: "value", spans: ["a", "b"] }],
      }),
    );
    expect(result.target).toEqual({ numerator: "1", denominator: "5" });
  });
});

describe("solveBarModel: answer disclosure", () => {
  const base = () =>
    model({
      bars: [
        {
          id: "bar",
          label: "Bar",
          segments: [
            { id: "a", value: 18, display: "value" },
            { id: "b", unknown: "p", display: "unknown", target: true },
          ],
        },
      ],
      braces: [{ id: "all", kind: "total", value: 45, display: "value", spans: ["a", "b"] }],
    });

  it("flags the answer as a number token in alt text, title and caption", () => {
    for (const field of ["altText", "title", "caption"] as const) {
      const result = solveBarModel(base(), { [field]: "The missing part is 27 in all." });
      expect(codes(result), field).toContain("answer_leak");
    }
  });

  it("flags the answer inside an identifier, but not a longer number or a letter-digit ID", () => {
    expect(codes(solveBarModel(model({ ...base(), bars: [{ ...base().bars[0], id: "answer-27" }] })))).toContain(
      "answer_leak",
    );
    expect(codes(solveBarModel(base(), { altText: "There are 270 or 2.7 in total." }))).not.toContain("answer_leak");
    expect(codes(solveBarModel(model({ ...base(), bars: [{ ...base().bars[0], id: "s27" }] })))).not.toContain(
      "answer_leak",
    );
  });

  it("downgrades to a warning when the answer equals a displayed given", () => {
    const coincidence = model({
      bars: [
        {
          id: "bar",
          label: "Bar",
          segments: [
            { id: "a", value: 18, display: "value" },
            { id: "b", unknown: "p", display: "unknown", target: true },
          ],
        },
      ],
      braces: [{ id: "all", kind: "total", value: 36, display: "value", spans: ["a", "b"] }],
    });
    const result = solveBarModel(coincidence, { altText: "One part is 18 and the whole is 36." });
    expect(result.ok).toBe(true);
    expect(codes(result)).toEqual(["answer_equals_given"]);
    expect(codes(result)).not.toContain("answer_leak");
  });
});
