import { describe, expect, it } from "vitest";

import { freeSampleKey, selectFreeSample, FREE_SAMPLE_PER_PROGRAMME } from "@/lib/billing/free-sample";

type Q = Parameters<typeof freeSampleKey>[0];

function q(id: string, examStyle: Q["examStyle"], yearLevel: Q["yearLevel"], subject: string): Q {
  return { id, examStyle, yearLevel, metadata: { subject } } as unknown as Q;
}

function many(prefix: string, n: number, examStyle: Q["examStyle"], yearLevel: Q["yearLevel"], subject: string) {
  return Array.from({ length: n }, (_, i) => q(`${prefix}-${String(i).padStart(2, "0")}`, examStyle, yearLevel, subject));
}

describe("selectFreeSample", () => {
  it("keeps 5 per programme, where a programme is style x year x subject", () => {
    const bank = [
      ...many("a", 12, "naplan_style", 5, "numeracy"),
      ...many("b", 3, "naplan_style", 5, "reading"),
      ...many("c", 9, "icas_style", 5, "numeracy"),
    ];
    const sample = selectFreeSample(bank);
    const counts = new Map<string, number>();
    for (const item of sample) counts.set(freeSampleKey(item), (counts.get(freeSampleKey(item)) ?? 0) + 1);

    expect(FREE_SAMPLE_PER_PROGRAMME).toBe(5);
    expect([...counts.values()].sort()).toEqual([3, 5, 5]);
    expect(sample).toHaveLength(13);
  });

  it("is stable: the same five questions regardless of input order", () => {
    const bank = many("a", 10, "naplan_style", 3, "numeracy");
    const forward = selectFreeSample(bank).map((x) => x.id).sort();
    const reversed = selectFreeSample([...bank].reverse()).map((x) => x.id).sort();
    expect(reversed).toEqual(forward);
    expect(forward).toEqual(["a-00", "a-01", "a-02", "a-03", "a-04"]);
  });

  it("never returns a question outside the input", () => {
    const bank = many("a", 7, "amc_style", 5, "numeracy");
    const ids = new Set(bank.map((x) => x.id));
    expect(selectFreeSample(bank).every((x) => ids.has(x.id))).toBe(true);
  });
});
