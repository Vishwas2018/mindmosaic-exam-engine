import { hashJson } from "@/features/question-factory/provenance";
import type { FsFactoryRepository } from "@/features/question-factory/storage";

import { baseProvenance } from "./correctness-fixtures";

/**
 * Small, hand-written synthetic fixtures for the originality/difficulty
 * gates' test suites — mirrors `correctness-fixtures.ts`'s style, scoped
 * to Mission 3D's own two gates.
 */

export function mission3dFixtureBlueprint(difficulty: "easy" | "medium" | "challenging" = "easy"): Record<string, unknown> {
  return {
    id: "mission3d-fixture-blueprint",
    batchId: "batch-001",
    yearLevel: "year-3",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number",
    skill: "num.addition.two-digit",
    difficulty,
    questionType: "number_entry",
    targetCount: 1,
    marks: 1,
    estimatedTimeSeconds: 60,
    learningObjective: "Practise two-digit addition.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
  };
}

export async function ensureMission3dBlueprintSeeded(
  repo: FsFactoryRepository,
  blueprintId: string,
  difficulty: "easy" | "medium" | "challenging" = "easy",
): Promise<string> {
  const blueprint = { ...mission3dFixtureBlueprint(difficulty), id: blueprintId };
  if (!(await repo.exists("blueprints", blueprintId))) {
    await repo.create("blueprints", blueprintId, blueprint);
  }
  return hashJson(blueprint);
}

function words(count: number, prefix = "content"): string {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(" ");
}

/** A question with enough distinct extractable text for both gates to compute confidently, always original relative to the real production bank. */
export function mission3dQuestion(id: string, promptSuffix = ""): Record<string, unknown> {
  return {
    id,
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: `A synthetic Mission 3D fixture prompt about ${words(20, `zzqx${id}-`)}${promptSuffix}`,
    options: [],
    answerKey: { kind: "number", value: 1, tolerance: 0 },
    visuals: [],
    explanation: "A short explanation with two sentences. Never trusted for difficulty.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60 },
  };
}

/** A question with a precisely controllable word count (short, id-independent filler tokens), for difficulty-estimator band testing. */
export function mission3dDifficultyQuestion(id: string, wordCount: number, explanation = "Explanation text, never trusted for difficulty."): Record<string, unknown> {
  return {
    id,
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: words(wordCount, "word"),
    options: [],
    answerKey: { kind: "number", value: 1, tolerance: 0 },
    visuals: [],
    explanation,
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60 },
  };
}

export async function seedAtState(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  state: string,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const candidateId = question.id as string;
  const provenance = baseProvenance(question, { blueprintId: "mission3d-fixture-blueprint", ...provenanceOverrides });
  await repo.create("review-queue", candidateId, { candidateId, state, question, provenance });
  return { candidateId };
}
