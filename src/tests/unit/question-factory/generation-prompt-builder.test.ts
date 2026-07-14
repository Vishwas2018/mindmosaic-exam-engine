import { describe, expect, it } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { buildGenerationPromptPack } from "@/features/question-factory/generation";
import { hashJson } from "@/features/question-factory/provenance";

function blueprint(overrides: Partial<BlueprintInput> = {}): BlueprintInput {
  return {
    id: "batch-p-bp-001",
    batchId: "batch-p",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number and Algebra",
    skill: "numeracy.addition.two-digit",
    difficulty: "easy",
    questionType: "number_entry",
    targetCount: 5,
    marks: 1,
    estimatedTimeSeconds: 45,
    learningObjective: "Add two whole numbers.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
    ...overrides,
  };
}

describe("buildGenerationPromptPack — determinism", () => {
  it("produces byte-identical pack text and identical hash across repeated calls", () => {
    const first = buildGenerationPromptPack("batch-p", [blueprint()]);
    const second = buildGenerationPromptPack("batch-p", [blueprint()]);
    expect(first.status).toBe("built");
    expect(second.status).toBe("built");
    if (first.status !== "built" || second.status !== "built") return;
    expect(JSON.stringify(first.pack)).toBe(JSON.stringify(second.pack));
    expect(first.promptHash).toBe(second.promptHash);
  });

  it("orders blueprints canonically by id regardless of input order", () => {
    const bpA = blueprint({ id: "batch-p-bp-aaa" });
    const bpB = blueprint({ id: "batch-p-bp-bbb" });
    const forward = buildGenerationPromptPack("batch-p", [bpA, bpB]);
    const reversed = buildGenerationPromptPack("batch-p", [bpB, bpA]);
    expect(forward.status).toBe("built");
    expect(reversed.status).toBe("built");
    if (forward.status !== "built" || reversed.status !== "built") return;
    expect(forward.pack.blueprints.map((entry) => entry.blueprint.id)).toEqual(["batch-p-bp-aaa", "batch-p-bp-bbb"]);
    expect(forward.promptHash).toBe(reversed.promptHash);
  });

  it("binds each blueprint entry's hash to hashJson(blueprint)", () => {
    const result = buildGenerationPromptPack("batch-p", [blueprint()]);
    expect(result.status).toBe("built");
    if (result.status !== "built") return;
    const entry = result.pack.blueprints[0];
    expect(entry.blueprintHash).toBe(hashJson(entry.blueprint));
  });

  it("binds promptVersion/schemaVersion/taxonomyVersion to the current FACTORY_VERSIONS", () => {
    const result = buildGenerationPromptPack("batch-p", [blueprint()]);
    expect(result.status).toBe("built");
    if (result.status !== "built") return;
    expect(result.pack.promptVersion.length).toBeGreaterThan(0);
    expect(result.pack.schemaVersion.length).toBeGreaterThan(0);
    expect(result.pack.taxonomyVersion.length).toBeGreaterThan(0);
  });
});

describe("buildGenerationPromptPack — required content", () => {
  const result = buildGenerationPromptPack("batch-p", [blueprint()]);
  if (result.status !== "built") throw new Error("setup failed");
  const { pack } = result;
  const allText = pack.instructions.join("\n");

  it("requires Australian English", () => {
    expect(allText).toMatch(/Australian English/i);
  });

  it("requires an answer key", () => {
    expect(allText).toMatch(/answer key/i);
  });

  it("requires an explanation", () => {
    expect(allText).toMatch(/explanation/i);
  });

  it("requires alt text and prohibits answer leakage through it", () => {
    expect(allText).toMatch(/alt text/i);
  });

  it("prohibits answer leakage generally", () => {
    expect(allText).toMatch(/never leak the correct answer/i);
  });

  it("states structured-visual-JSON constraints (never inline SVG/HTML/markup)", () => {
    expect(allText).toMatch(/never inline SVG, HTML/i);
  });

  it("states originality requirements", () => {
    expect(allText).toMatch(/entirely original/i);
  });

  it("states a forbidden-source statement naming NAPLAN/ICAS/commercial sources", () => {
    expect(allText).toMatch(/NAPLAN\/ICAS papers, commercial test-prep books/i);
  });

  it("requires strict JSON-only responses", () => {
    expect(allText).toMatch(/exactly one JSON object or array/i);
  });

  it("prohibits chain-of-thought / hidden reasoning requests", () => {
    expect(allText).toMatch(/chain-of-thought/i);
  });

  it("states a maximum candidate-response size", () => {
    expect(pack.maxCandidateResponseBytes).toBeGreaterThan(0);
  });

  it("carries supported question and visual types sourced from the live registries", () => {
    expect(pack.supportedQuestionTypes.length).toBeGreaterThan(0);
    expect(pack.supportedVisualTypes.length).toBeGreaterThan(0);
  });

  it("includes a small original JSON example", () => {
    expect(pack.example).toBeDefined();
    expect(JSON.stringify(pack.example).length).toBeLessThan(2000);
  });
});

describe("buildGenerationPromptPack — rejection", () => {
  it("rejects an invalid blueprint before producing a pack", () => {
    const invalid = { ...blueprint(), marks: -1 };
    const result = buildGenerationPromptPack("batch-p", [invalid]);
    expect(result.status).toBe("prompt_blueprint_invalid");
  });

  it("rejects a blueprint declaring a questionType outside the live renderer registry", () => {
    const invalid = blueprint({ questionType: "not_a_real_type" });
    const result = buildGenerationPromptPack("batch-p", [invalid]);
    expect(result.status).toBe("prompt_blueprint_invalid");
  });

  it("rejects a blueprint declaring a visualType outside the live visual registry", () => {
    const invalid = blueprint({ questionType: "multiple_choice", visualType: "not_a_real_visual" });
    const result = buildGenerationPromptPack("batch-p", [invalid]);
    expect(result.status).toBe("prompt_blueprint_invalid");
  });

  it("rejects an empty blueprint list", () => {
    const result = buildGenerationPromptPack("batch-p", []);
    expect(result.status).toBe("prompt_blueprint_invalid");
  });

  it("rejects a pack that would exceed the configured byte bound", () => {
    const manyBlueprints = Array.from({ length: 400 }, (_, index) =>
      blueprint({
        id: `batch-p-bp-${String(index).padStart(4, "0")}`,
        learningObjective: `Practise addition and subtraction of whole numbers within one hundred, item ${index}. `.repeat(3),
      }),
    );
    const result = buildGenerationPromptPack("batch-p", manyBlueprints);
    expect(result.status).toBe("prompt_pack_limit_exceeded");
  });
});
