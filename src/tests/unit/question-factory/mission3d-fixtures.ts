import { buildCorrectnessEvidence, buildCorrectnessReportId } from "@/features/question-factory/correctness";
import {
  buildOriginalityEvidence,
  buildOriginalityReportId,
  computeCurrentOriginalityCorpusFingerprint,
  computeCurrentOriginalityCorpusIds,
} from "@/features/question-factory/originality";
import { hashJson } from "@/features/question-factory/provenance";
import type { FsFactoryRepository } from "@/features/question-factory/storage";

import { baseProvenance } from "./correctness-fixtures";

/**
 * Small, hand-written synthetic fixtures for the originality/difficulty
 * gates' test suites — mirrors `correctness-fixtures.ts`'s style, scoped
 * to Mission 3D's own two gates.
 *
 * Mission 3D audit remediation (P1-1): both gates' fresh-verification
 * paths now independently validate that a genuine, fingerprint-consistent
 * upstream evidence report exists before running (never trusting the
 * candidate's `state` field alone). Seeding a candidate directly at
 * `semantic_review_passed`/`originality_review_passed` is no longer
 * sufficient on its own; `seedAtSemanticReviewPassed`/
 * `seedAtOriginalityReviewPassed` below also plant a real, internally
 * self-consistent `cv-*`/`og-*` report — built via the real
 * `buildCorrectnessEvidence`/`buildOriginalityEvidence` functions (never
 * hand-faked fingerprints), mirroring `correctness-fixtures.ts`'s own
 * `passedStructuralEvidence` precedent (seed the exact upstream evidence
 * a gate needs via the real evidence builder, rather than re-running
 * every upstream gate for real every time).
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

/** A genuine, fingerprint-consistent `cv-*` report — built via the real `buildCorrectnessEvidence`, never a hand-faked fingerprint. */
export async function seedLegitimateCorrectnessReport(
  repo: FsFactoryRepository,
  candidateId: string,
  candidateRevision: number,
  candidateContentHash: string,
  blueprintHash: string,
): Promise<void> {
  const evidence = buildCorrectnessEvidence({
    candidateId,
    candidateRevision,
    candidateContentHash,
    blueprintHash,
    capability: "deterministically_verifiable",
    declaredAnswer: { method: "declared", representation: "1" },
    derivedAnswer: { method: "derived", representation: "1" },
    declaredScoring: { status: "correct", awardedMarks: 1, availableMarks: 1, fullMarks: true },
    derivedScoring: { status: "correct", awardedMarks: 1, availableMarks: 1, fullMarks: true },
    verifiedAt: "2026-01-01T00:00:00.000Z",
    issues: [],
    outcome: "passed",
  });
  const report = { candidateId, result: { status: "passed" as const, capability: "deterministically_verifiable" as const, evidence } };
  await repo.create("reports", buildCorrectnessReportId(candidateId), report);
}

/** A genuine, fingerprint-consistent `og-*` report — built via the real `buildOriginalityEvidence`, bound to the *live* corpus fingerprint at fixture-seed time so it is never accidentally stale. */
export async function seedLegitimateOriginalityReport(
  repo: FsFactoryRepository,
  candidateId: string,
  candidateRevision: number,
  candidateContentHash: string,
  blueprintHash: string | undefined,
): Promise<void> {
  const comparedIds = computeCurrentOriginalityCorpusIds(candidateId);
  const corpusFingerprint = computeCurrentOriginalityCorpusFingerprint(candidateId);
  const evidence = buildOriginalityEvidence({
    candidateId,
    candidateRevision,
    candidateContentHash,
    blueprintHash,
    corpusScope: { source: "production_bank", comparedIds, corpusFingerprint },
    nearestMatches: [],
    classification: "distinct",
    validatedAt: "2026-01-01T00:00:00.000Z",
    issues: [],
    outcome: "passed",
  });
  const report = { candidateId, result: { status: "passed" as const, classification: "distinct" as const, evidence } };
  await repo.create("reports", buildOriginalityReportId(candidateId), report);
}

/** Seeds a candidate at `semantic_review_passed` with a genuine, legitimate upstream `cv-*` report — satisfies originality's own upstream-evidence check (Mission 3D audit remediation P1-1). */
export async function seedAtSemanticReviewPassed(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  blueprintHash: string,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const { candidateId } = await seedAtState(repo, question, "semantic_review_passed", provenanceOverrides);
  const provenance = baseProvenance(question, { blueprintId: "mission3d-fixture-blueprint", ...provenanceOverrides });
  await seedLegitimateCorrectnessReport(repo, candidateId, provenance.revision as number, provenance.contentHash as string, blueprintHash);
  return { candidateId };
}

/** Seeds a candidate at `originality_review_passed` with genuine, legitimate upstream `cv-*` and `og-*` reports — satisfies difficulty's own upstream-evidence check (Mission 3D audit remediation P1-1). */
export async function seedAtOriginalityReviewPassed(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  blueprintHash: string,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const { candidateId } = await seedAtState(repo, question, "originality_review_passed", provenanceOverrides);
  const provenance = baseProvenance(question, { blueprintId: "mission3d-fixture-blueprint", ...provenanceOverrides });
  await seedLegitimateCorrectnessReport(repo, candidateId, provenance.revision as number, provenance.contentHash as string, blueprintHash);
  await seedLegitimateOriginalityReport(repo, candidateId, provenance.revision as number, provenance.contentHash as string, blueprintHash);
  return { candidateId };
}
