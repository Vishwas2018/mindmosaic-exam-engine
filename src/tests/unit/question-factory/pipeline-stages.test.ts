import { describe, expect, it } from "vitest";

import { PIPELINE_STAGES } from "@/features/question-factory/pipeline";

describe("PIPELINE_STAGES — Mission 3D five-stage registry", () => {
  it("contains exactly five entries, in deterministic structural -> correctness -> semantic -> originality -> difficulty order", () => {
    expect(PIPELINE_STAGES.map((stage) => stage.name)).toEqual([
      "structural",
      "correctness",
      "semantic",
      "originality",
      "difficulty",
    ]);
  });

  it("does not register a staging or publication stage — difficulty is the last entry", () => {
    const names = PIPELINE_STAGES.map((stage) => stage.name);
    expect(names).not.toContain("staging");
    expect(names).not.toContain("publication");
    expect(names.at(-1)).toBe("difficulty");
  });

  it("each stage's acceptsState matches the real gate's own entry precondition", () => {
    const byName = new Map(PIPELINE_STAGES.map((stage) => [stage.name, stage.acceptsState]));
    expect(byName.get("structural")).toBe("generated");
    expect(byName.get("correctness")).toBe("structural_validation_passed");
    expect(byName.get("semantic")).toBe("correctness_check_passed");
    expect(byName.get("originality")).toBe("semantic_review_passed");
    expect(byName.get("difficulty")).toBe("originality_review_passed");
  });

  it("every acceptsState is unique — at most one stage ever matches a given lifecycle state", () => {
    const acceptsStates = PIPELINE_STAGES.map((stage) => stage.acceptsState);
    expect(new Set(acceptsStates).size).toBe(acceptsStates.length);
  });

  it("every stage exposes both a mutating run() and a non-mutating preview()", () => {
    for (const stage of PIPELINE_STAGES) {
      expect(typeof stage.run).toBe("function");
      expect(typeof stage.preview).toBe("function");
    }
  });
});
