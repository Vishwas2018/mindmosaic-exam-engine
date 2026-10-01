import { describe, expect, it } from "vitest";

import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { PROMPT_ISSUE_CODES } from "@/features/question-factory/config";
import {
  buildGenerationPromptPack,
  INTERACTION_REQUIRED_QUESTION_TYPES,
  STIMULUS_REQUIRED_QUESTION_TYPES,
} from "@/features/question-factory/generation";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance";
import { questionOptionSchema, questionSchema } from "@/schemas/question.schema";
import { visualSchema } from "@/schemas/visual.schema";

function omit(record: Record<string, unknown>, key: string): Record<string, unknown> {
  const clone = { ...record };
  delete clone[key];
  return clone;
}

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

  it("every rejection status is a catalogued PromptIssueCode, not an ad hoc string", () => {
    const results = [
      buildGenerationPromptPack("batch-p", [{ ...blueprint(), marks: -1 }]),
      buildGenerationPromptPack("batch-p", []),
    ];
    for (const result of results) {
      expect(PROMPT_ISSUE_CODES).toContain(result.status);
    }
  });
});

describe("buildGenerationPromptPack — response-schema description accuracy", () => {
  const result = buildGenerationPromptPack("batch-p", [blueprint()]);
  if (result.status !== "built") throw new Error("setup failed");
  const { pack } = result;

  it("documents stimulus as required only for the reading-comprehension type", () => {
    expect(pack.responseSchemaDescription).toMatch(/stimulus/i);
    for (const type of STIMULUS_REQUIRED_QUESTION_TYPES) {
      expect(pack.responseSchemaDescription).toContain(type);
    }
  });

  it("documents interaction as required only for its type-specific set", () => {
    expect(pack.responseSchemaDescription).toMatch(/interaction/i);
    for (const type of INTERACTION_REQUIRED_QUESTION_TYPES) {
      expect(pack.responseSchemaDescription).toContain(type);
    }
  });

  it("directs the model not to include an 'id' field", () => {
    expect(pack.responseSchemaDescription).toMatch(/never include an 'id' field/i);
    expect(pack.instructions.join("\n")).toMatch(/do not include an 'id' field/i);
  });

  describe("the hardcoded stimulus/interaction requirement lists match real production-schema behaviour", () => {
    it("rejects each STIMULUS_REQUIRED_QUESTION_TYPES fixture once its stimulus is removed", () => {
      for (const type of STIMULUS_REQUIRED_QUESTION_TYPES) {
        const fixture = showcaseQuestions.find((question) => question.type === type);
        expect(fixture, `missing showcase fixture for ${type}`).toBeDefined();
        expect(questionSchema.safeParse(fixture!).success, `${type} fixture itself should be valid`).toBe(true);
        const withoutStimulus = omit(fixture as Record<string, unknown>, "stimulus");
        expect(
          questionSchema.safeParse(withoutStimulus).success,
          `${type} should require stimulus`,
        ).toBe(false);
      }
    });

    it("rejects each INTERACTION_REQUIRED_QUESTION_TYPES fixture once its interaction is removed", () => {
      for (const type of INTERACTION_REQUIRED_QUESTION_TYPES) {
        const fixture = showcaseQuestions.find((question) => question.type === type);
        expect(fixture, `missing showcase fixture for ${type}`).toBeDefined();
        expect(questionSchema.safeParse(fixture!).success, `${type} fixture itself should be valid`).toBe(true);
        const withoutInteraction = omit(fixture as Record<string, unknown>, "interaction");
        expect(
          questionSchema.safeParse(withoutInteraction).success,
          `${type} should require interaction`,
        ).toBe(false);
      }
    });

    it("does not require interaction for a type outside INTERACTION_REQUIRED_QUESTION_TYPES", () => {
      const fixture = showcaseQuestions.find((question) => question.type === "multiple_choice");
      expect(fixture).toBeDefined();
      expect(INTERACTION_REQUIRED_QUESTION_TYPES).not.toContain("multiple_choice");
      const withoutInteraction = omit(fixture as Record<string, unknown>, "interaction");
      expect(questionSchema.safeParse(withoutInteraction).success).toBe(true);
    });
  });
});

/**
 * Yield-fix regression guard: a genuinely GA run rejected 5/5 numeracy
 * candidates because a geometry_shape visual's `measurements` — schema-
 * optional but load-bearing for perimeter/area verification — was never
 * populated, and (separately) `pie_chart` was entirely absent from
 * `RESPONSE_SCHEMA_DESCRIPTION`'s visual-shape text even though the schema
 * supports it. Each case below builds a minimal, schema-valid sample `data`
 * object per first-release visual type and asserts it is *actually* valid
 * against `visualSchema` (so the sample itself can never silently drift
 * from real schema behaviour), then asserts every one of that sample's own
 * field names appears in the prompt's response-schema text. A schema change
 * that adds/renames/removes a field without updating the prompt text fails
 * this test rather than surfacing later as a live-run rejection.
 */
describe("buildGenerationPromptPack — visual-shape description tracks the real Zod schema (no drift)", () => {
  const result = buildGenerationPromptPack("batch-visuals", [blueprint()]);
  if (result.status !== "built") throw new Error("setup failed");
  const description = result.pack.responseSchemaDescription;

  const FIRST_RELEASE_VISUAL_SAMPLES: Readonly<
    Record<"bar_chart" | "line_graph" | "pie_chart" | "table" | "number_line" | "geometry_shape", Record<string, unknown>>
  > = {
    bar_chart: { labels: ["A", "B"], values: [1, 2], xAxisLabel: "Category", yAxisLabel: "Count", maxValue: 5, colour: "#4B2E83" },
    line_graph: { points: [{ x: 0, y: 1, label: "start" }, { x: 1, y: 2 }], xAxisLabel: "Day", yAxisLabel: "Value", colour: "#4B2E83" },
    pie_chart: { segments: [{ label: "A", value: 1, colour: "#4B2E83" }, { label: "B", value: 2 }] },
    table: { headers: ["Item", "Count"], rows: [["Apples", 3]], rowHeaders: false },
    number_line: { min: 0, max: 10, step: 1, highlightedValues: [2, 4] },
    geometry_shape: { shape: "rectangle", measurements: [{ label: "length", value: 6, unit: "cm" }, { label: "width", value: 3, unit: "cm" }] },
  };

  it.each(Object.entries(FIRST_RELEASE_VISUAL_SAMPLES))("every field the sample for '%s' declares is a genuinely valid field (locks the sample to real schema behaviour)", (type, data) => {
    const parsed = visualSchema.safeParse({ id: "v1", type, altText: "A description of the visual, long enough to pass validation.", data });
    expect(parsed.success, parsed.success ? undefined : JSON.stringify((parsed as { error: unknown }).error)).toBe(true);
  });

  it.each(Object.keys(FIRST_RELEASE_VISUAL_SAMPLES))("the prompt's response-schema text names visual type '%s' at all", (type) => {
    expect(description).toContain(type);
  });

  it.each(Object.entries(FIRST_RELEASE_VISUAL_SAMPLES))("the prompt's response-schema text mentions every field '%s' declares", (_type, data) => {
    for (const field of Object.keys(data)) {
      expect(description).toContain(field);
    }
  });

  it("explicitly tells the model geometry_shape's measurements are required in practice for perimeter/area/side-length content, not just schema-optional", () => {
    expect(description).toMatch(/measurements.*REQUIRED IN PRACTICE/);
  });
});

describe("buildGenerationPromptPack — options-shape description tracks the real Zod schema and warns against embedded quote characters", () => {
  const result = buildGenerationPromptPack("batch-options", [blueprint()]);
  if (result.status !== "built") throw new Error("setup failed");
  const description = result.pack.responseSchemaDescription;

  it("every field questionOptionSchema declares is mentioned in the prompt's options description", () => {
    const sample = { id: "opt-1", text: "twelve", visualId: undefined, accessibleLabel: undefined };
    const parsed = questionOptionSchema.safeParse({ id: sample.id, text: sample.text });
    expect(parsed.success).toBe(true);
    for (const field of ["id", "text", "visualId", "accessibleLabel"]) {
      expect(description).toContain(field);
    }
  });

  it("warns against embedded escaped-quote characters inside option text, with a concrete wrong/right example", () => {
    expect(description).toMatch(/escaped speech-mark characters/i);
    expect(description).toMatch(/WRONG:.*RIGHT:/);
  });
});

describe("buildGenerationPromptPack — example identity policy", () => {
  const result = buildGenerationPromptPack("batch-p", [blueprint()]);
  if (result.status !== "built") throw new Error("setup failed");
  const { pack } = result;

  it("the bundled example has no 'id' field of its own", () => {
    expect(pack.example).not.toHaveProperty("id");
  });

  it("the example becomes a valid candidateQuestionSchema object once ingestion's deterministic id is added", () => {
    const withSyntheticId = { ...(pack.example as Record<string, unknown>), id: "gen-synthetic-test-id" };
    const parsed = candidateQuestionSchema.safeParse(withSyntheticId);
    expect(parsed.success).toBe(true);
  });

  it("the example is never itself schema-valid to persist directly (no id present)", () => {
    const parsed = candidateQuestionSchema.safeParse(pack.example);
    expect(parsed.success).toBe(false);
  });

  it("states the identity policy: id is minted deterministically during ingestion, never generator-declared", () => {
    const allText = pack.instructions.join("\n");
    expect(allText).toMatch(/assigned deterministically during ingestion/i);
    expect(allText).toMatch(/discarded, never trusted/i);
  });
});

describe("buildGenerationPromptPack — governance/blueprint precedence and fencing", () => {
  const result = buildGenerationPromptPack("batch-p", [blueprint()]);
  if (result.status !== "built") throw new Error("setup failed");
  const { pack } = result;

  it("states an explicit three-tier precedence, governance highest and blueprint data lowest", () => {
    const precedence = pack.instructions[0];
    expect(precedence).toMatch(/precedence/i);
    expect(precedence).toMatch(/instructions/i);
    expect(precedence).toMatch(/response schema/i);
    expect(precedence).toMatch(/blueprints/i);
    expect(precedence).toMatch(/never a source of instructions/i);
  });

  it("names the specific blueprint free-text fields as untrusted content, not instructions", () => {
    const precedence = pack.instructions[0];
    for (const field of [
      "learningObjective",
      "misconceptionTargets",
      "vocabularyConstraints",
      "accessibilityConstraints",
      "originalityConstraints",
      "generationConstraints",
    ]) {
      expect(precedence).toContain(field);
    }
  });

  it("carries a dedicated blueprintDataNotice fence field labelling the blueprints array as untrusted", () => {
    expect(pack.blueprintDataNotice).toMatch(/untrusted candidate data/i);
    expect(pack.blueprintDataNotice.length).toBeGreaterThan(0);
  });

  it("is deterministic: the notice and precedence text never vary across builds", () => {
    const second = buildGenerationPromptPack("batch-p", [blueprint()]);
    expect(second.status).toBe("built");
    if (second.status !== "built") return;
    expect(second.pack.blueprintDataNotice).toBe(pack.blueprintDataNotice);
    expect(second.pack.instructions[0]).toBe(pack.instructions[0]);
  });
});
