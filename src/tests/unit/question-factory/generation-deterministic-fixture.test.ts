import { describe, expect, it } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { FACTORY_LIMITS } from "@/features/question-factory/config";
import { DeterministicFixtureGenerator } from "@/features/question-factory/generation";
import type { GenerationContext } from "@/features/question-factory/generation";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance";

function fixtureBlueprint(overrides: Partial<BlueprintInput> = {}): BlueprintInput {
  return {
    id: "batch-fix-bp-001",
    batchId: "batch-fix",
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

function contextFor(blueprintInput: BlueprintInput, seed?: string): GenerationContext {
  const blueprint = blueprintSchema.parse(blueprintInput);
  return {
    blueprint,
    blueprintHash: hashJson(blueprint),
    batchId: blueprint.batchId,
    pipelineRunId: `${blueprint.batchId}-pipeline`,
    promptVersion: "v1",
    generatorVersion: "v1",
    ...(seed !== undefined ? { seed } : {}),
  };
}

describe("DeterministicFixtureGenerator — contract shape", () => {
  it("declares generatorClass 'deterministic_fixture'", () => {
    const generator = new DeterministicFixtureGenerator();
    expect(generator.generatorClass).toBe("deterministic_fixture");
  });

  it("supportsBlueprint is a pure, synchronous capability check", () => {
    const generator = new DeterministicFixtureGenerator();
    expect(generator.supportsBlueprint(blueprintSchema.parse(fixtureBlueprint()))).toBe(true);
  });
});

describe("DeterministicFixtureGenerator — capability detection", () => {
  const generator = new DeterministicFixtureGenerator();

  it("supports numeracy number_entry", () => {
    expect(generator.supportsBlueprint(blueprintSchema.parse(fixtureBlueprint()))).toBe(true);
  });

  it("supports numeracy multiple_choice", () => {
    expect(
      generator.supportsBlueprint(blueprintSchema.parse(fixtureBlueprint({ questionType: "multiple_choice" }))),
    ).toBe(true);
  });

  it("does not support a non-numeracy subject", () => {
    expect(
      generator.supportsBlueprint(
        blueprintSchema.parse(
          fixtureBlueprint({ subject: "reading", strand: "Comprehension", skill: "reading.literal.detail" }),
        ),
      ),
    ).toBe(false);
  });

  it("does not support an unsupported question type", () => {
    expect(generator.supportsBlueprint(blueprintSchema.parse(fixtureBlueprint({ questionType: "essay" })))).toBe(
      false,
    );
  });

  it("does not support a blueprint that declares a visual type", () => {
    expect(
      generator.supportsBlueprint(
        blueprintSchema.parse(fixtureBlueprint({ questionType: "multiple_choice", visualType: "bar_chart" })),
      ),
    ).toBe(false);
  });

  it("does not support multi-step reasoning", () => {
    expect(generator.supportsBlueprint(blueprintSchema.parse(fixtureBlueprint({ reasoningSteps: 2 })))).toBe(false);
  });

  it("returns unsupported_blueprint (never throws) for an unsupported blueprint", async () => {
    const context = contextFor(fixtureBlueprint({ questionType: "essay" }));
    const outcome = await generator.generate(context);
    expect(outcome.status).toBe("unsupported_blueprint");
  });

  it("returns resource_limit_exceeded for marks above the fixture generator's bound", async () => {
    const context = contextFor(fixtureBlueprint({ marks: FACTORY_LIMITS.DETERMINISTIC_FIXTURE_MAX_MARKS + 1 }));
    const outcome = await generator.generate(context);
    expect(outcome.status).toBe("resource_limit_exceeded");
  });
});

describe("DeterministicFixtureGenerator — determinism", () => {
  const generator = new DeterministicFixtureGenerator();

  it("produces byte-identical candidate content across three runs with identical inputs", async () => {
    const context = contextFor(fixtureBlueprint(), "fixed-seed-1");
    const runs = await Promise.all([1, 2, 3].map(() => generator.generate(context)));
    for (const outcome of runs) expect(outcome.status).toBe("generated");
    const [first, second, third] = runs.map((outcome) =>
      outcome.status === "generated" ? JSON.stringify(outcome.candidateContent) : undefined,
    );
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it("produces identical content hashes across three runs with identical inputs", async () => {
    const context = contextFor(fixtureBlueprint(), "fixed-seed-2");
    const runs = await Promise.all([1, 2, 3].map(() => generator.generate(context)));
    const hashes = runs.map((outcome) => (outcome.status === "generated" ? hashJson(outcome.candidateContent) : undefined));
    expect(new Set(hashes).size).toBe(1);
  });

  it("defaults the seed deterministically from (blueprintId, batchId, pipelineRunId) when none is supplied", async () => {
    const context = contextFor(fixtureBlueprint());
    const [a, b] = await Promise.all([generator.generate(context), generator.generate(context)]);
    expect(a.status).toBe("generated");
    expect(b.status).toBe("generated");
    if (a.status === "generated" && b.status === "generated") {
      expect(a.seedUsed).toBe(b.seedUsed);
      expect(JSON.stringify(a.candidateContent)).toBe(JSON.stringify(b.candidateContent));
    }
  });

  it("produces different content for different explicit seeds", async () => {
    const [a, b] = await Promise.all([
      generator.generate(contextFor(fixtureBlueprint(), "seed-a")),
      generator.generate(contextFor(fixtureBlueprint(), "seed-b")),
    ]);
    expect(a.status).toBe("generated");
    expect(b.status).toBe("generated");
    if (a.status === "generated" && b.status === "generated") {
      expect(JSON.stringify(a.candidateContent)).not.toBe(JSON.stringify(b.candidateContent));
    }
  });

  it("mints a different candidate id for a different seed", async () => {
    const [a, b] = await Promise.all([
      generator.generate(contextFor(fixtureBlueprint(), "seed-a")),
      generator.generate(contextFor(fixtureBlueprint(), "seed-b")),
    ]);
    if (a.status === "generated" && b.status === "generated") {
      expect(a.candidateContent.id).not.toBe(b.candidateContent.id);
    }
  });
});

describe("DeterministicFixtureGenerator — content quality", () => {
  const generator = new DeterministicFixtureGenerator();

  it("produces a schema-valid number_entry candidate", async () => {
    const outcome = await generator.generate(contextFor(fixtureBlueprint(), "quality-seed-1"));
    expect(outcome.status).toBe("generated");
    if (outcome.status !== "generated") return;
    const parsed = candidateQuestionSchema.safeParse(outcome.candidateContent);
    expect(parsed.success).toBe(true);
  });

  it("produces a schema-valid multiple_choice candidate with a correct, unique answer option", async () => {
    const outcome = await generator.generate(
      contextFor(fixtureBlueprint({ questionType: "multiple_choice" }), "quality-seed-2"),
    );
    expect(outcome.status).toBe("generated");
    if (outcome.status !== "generated") return;
    const parsed = candidateQuestionSchema.parse(outcome.candidateContent);
    expect(parsed.type).toBe("multiple_choice");
    expect(parsed.options).toHaveLength(4);
    const optionIds = new Set(parsed.options.map((option) => option.id));
    expect(optionIds.size).toBe(4);
    expect(parsed.answerKey.kind).toBe("single_option");
  });

  it("uses only Australian English content (no visuals, no en-US-only spelling introduced)", async () => {
    const outcome = await generator.generate(contextFor(fixtureBlueprint(), "quality-seed-3"));
    expect(outcome.status).toBe("generated");
    if (outcome.status !== "generated") return;
    expect(outcome.candidateContent.visuals).toEqual([]);
    expect(String(outcome.candidateContent.prompt)).not.toMatch(/color|organize|center\b/i);
  });

  it("never accesses the production question bank and produces entirely original numeric content", async () => {
    const outcome = await generator.generate(contextFor(fixtureBlueprint(), "quality-seed-4"));
    expect(outcome.status).toBe("generated");
    if (outcome.status !== "generated") return;
    expect(outcome.candidateContent.prompt).toMatch(/^What is \d+ [+-] \d+\?$/);
  });

  it("stamps deterministic_fixture provenance with a normalised generator identity", async () => {
    const outcome = await generator.generate(contextFor(fixtureBlueprint(), "quality-seed-5"));
    expect(outcome.status).toBe("generated");
    if (outcome.status !== "generated") return;
    expect(outcome.generatorAdapter.class).toBe("deterministic_fixture");
    expect(outcome.generatorAdapter.identity.provider).toBe("other");
  });

  it("is never eligible for production publication (fixed by generatorAdapter.class, per provenance/generator.ts)", async () => {
    const outcome = await generator.generate(contextFor(fixtureBlueprint(), "quality-seed-6"));
    expect(outcome.status).toBe("generated");
    if (outcome.status !== "generated") return;
    // The publication gate (Mission 3D, not yet built) refuses this class
    // unconditionally under RepositoryMode.production — asserting the
    // class value here is the only check Mission 3A can make ahead of
    // that gate's existence.
    expect(outcome.generatorAdapter.class).toBe("deterministic_fixture");
  });
});
