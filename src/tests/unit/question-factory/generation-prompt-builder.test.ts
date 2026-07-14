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
import { questionSchema } from "@/schemas/question.schema";

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
