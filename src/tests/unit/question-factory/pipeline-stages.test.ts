import { describe, expect, it } from "vitest";

import { PIPELINE_STAGES } from "@/features/question-factory/pipeline";

describe("PIPELINE_STAGES — Mission 3C stage registry", () => {
  it("contains exactly three entries, in deterministic structural -> correctness -> semantic order", () => {
    expect(PIPELINE_STAGES.map((stage) => stage.name)).toEqual(["structural", "correctness", "semantic"]);
  });

  it("does not register an originality, difficulty, staging, or publication stage", () => {
    const names = PIPELINE_STAGES.map((stage) => stage.name);
    expect(names).not.toContain("originality");
    expect(names).not.toContain("difficulty");
    expect(names).not.toContain("staging");
    expect(names).not.toContain("publication");
  });

  it("each stage's acceptsState matches the real gate's own entry precondition", () => {
    const byName = new Map(PIPELINE_STAGES.map((stage) => [stage.name, stage.acceptsState]));
    expect(byName.get("structural")).toBe("generated");
    expect(byName.get("correctness")).toBe("structural_validation_passed");
    expect(byName.get("semantic")).toBe("correctness_check_passed");
  });

  it("every stage exposes both a mutating run() and a non-mutating preview()", () => {
    for (const stage of PIPELINE_STAGES) {
      expect(typeof stage.run).toBe("function");
      expect(typeof stage.preview).toBe("function");
    }
  });
});
