import { describe, expect, it } from "vitest";

import { skillDisplayLabel } from "@/features/exam-engine/skill-label";

describe("skillDisplayLabel", () => {
  it("turns a dotted taxonomy code into a readable sentence", () => {
    expect(skillDisplayLabel("num.prod.number.skip-counting")).toBe("Skip counting");
    expect(skillDisplayLabel("num.prod.measurement.perimeter")).toBe("Perimeter");
    expect(skillDisplayLabel("num.prod.statistics.reading-a-pie-chart")).toBe("Reading a pie chart");
  });

  it("leaves readable labels exactly as they are", () => {
    expect(skillDisplayLabel("Add two three-digit numbers involving regrouping")).toBe(
      "Add two three-digit numbers involving regrouping",
    );
    expect(skillDisplayLabel("Interpreting bar charts")).toBe("Interpreting bar charts");
    expect(skillDisplayLabel("Compare numbers e.g. 3.5 and 3.45")).toBe("Compare numbers e.g. 3.5 and 3.45");
  });

  it("is safe on empty input", () => {
    expect(skillDisplayLabel(undefined)).toBe("");
    expect(skillDisplayLabel("")).toBe("");
  });
});
