import { describe, expect, it } from "vitest";

import { skillLabel } from "@/features/parent-dashboard/skill-label";

describe("skillLabel", () => {
  it.each([
    ["num.prod.measurement.perimeter", "Measurement: perimeter"],
    ["Num.prod.statistics.reading-a-bar-chart", "Statistics: reading a bar chart"],
    ["num.number.odd-even", "Number: odd even"],
    ["num.addition.two-digit", "Addition: two digit"],
    ["num.data.read-table", "Data: read table"],
    ["Adding money amounts", "Adding money amounts"],
    ["numeracy", "Numeracy"],
    ["language_conventions", "Language conventions"],
    ["", "Other"],
  ])("%s → %s", (key, label) => {
    expect(skillLabel(key)).toBe(label);
  });

  it("never returns a dotted id", () => {
    expect(skillLabel("num.prod.number.multiplication-equal-groups")).not.toMatch(/\./);
  });
});
