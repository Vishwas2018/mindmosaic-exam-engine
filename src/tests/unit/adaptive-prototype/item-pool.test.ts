import { describe, expect, it } from "vitest";

import { selectStageItems } from "@/features/adaptive-prototype";

import { buildBand } from "./fixtures";

const SCOPE = { examStyle: "naplan_style" as const, yearLevel: 5 as const, subject: "numeracy" as const };

describe("selectStageItems", () => {
  it("serves exactly `count` distinct items when the band has enough, and is not degraded", () => {
    const bank = buildBand("m", 10, { ...SCOPE, difficulty: "medium" });
    const pool = selectStageItems(bank, SCOPE, "medium", 6, new Set(), "seed-a");
    expect(pool.served).toHaveLength(6);
    expect(pool.degraded).toBe(false);
    expect(new Set(pool.served.map((q) => q.id)).size).toBe(6);
  });

  it("degrades gracefully — serves every available item, no padding — when the band is thinner than requested", () => {
    const bank = buildBand("c", 3, { ...SCOPE, difficulty: "challenging" });
    const pool = selectStageItems(bank, SCOPE, "challenging", 6, new Set(), "seed-b");
    expect(pool.served).toHaveLength(3);
    expect(pool.degraded).toBe(true);
    expect(pool.requested).toBe(6);
  });

  it("serves nothing, and is degraded, when the band is entirely empty", () => {
    const bank = buildBand("m", 5, { ...SCOPE, difficulty: "medium" });
    const pool = selectStageItems(bank, SCOPE, "easy", 6, new Set(), "seed-c");
    expect(pool.served).toEqual([]);
    expect(pool.degraded).toBe(true);
  });

  it("never serves an excluded id, and the exclusion itself can trigger degrade", () => {
    const bank = buildBand("m", 6, { ...SCOPE, difficulty: "medium" });
    const exclude = new Set([bank[0]!.id, bank[1]!.id]);
    const pool = selectStageItems(bank, SCOPE, "medium", 6, exclude, "seed-d");
    expect(pool.served).toHaveLength(4);
    expect(pool.degraded).toBe(true);
    for (const item of pool.served) expect(exclude.has(item.id)).toBe(false);
  });

  it("only serves items matching the requested band, ignoring other bands present in the bank", () => {
    const bank = [
      ...buildBand("e", 4, { ...SCOPE, difficulty: "easy" }),
      ...buildBand("m", 4, { ...SCOPE, difficulty: "medium" }),
    ];
    const pool = selectStageItems(bank, SCOPE, "easy", 10, new Set(), "seed-e");
    expect(pool.served.every((question) => question.metadata.difficulty === "easy")).toBe(true);
  });

  it("respects scope — a matching band at the wrong year is not eligible", () => {
    const bank = buildBand("m", 6, { examStyle: "naplan_style", yearLevel: 3, subject: "numeracy", difficulty: "medium" });
    const pool = selectStageItems(bank, SCOPE /* year 5 */, "medium", 6, new Set(), "seed-f");
    expect(pool.served).toEqual([]);
    expect(pool.degraded).toBe(true);
  });

  it("is deterministic for the same seed, and reorders for a different one", () => {
    const bank = buildBand("m", 20, { ...SCOPE, difficulty: "medium" });
    const first = selectStageItems(bank, SCOPE, "medium", 5, new Set(), "same-seed");
    const second = selectStageItems(bank, SCOPE, "medium", 5, new Set(), "same-seed");
    expect(first.served.map((q) => q.id)).toEqual(second.served.map((q) => q.id));

    const third = selectStageItems(bank, SCOPE, "medium", 5, new Set(), "different-seed");
    expect(third.served.map((q) => q.id)).not.toEqual(first.served.map((q) => q.id));
  });
});
