import {
  buildCorrectnessEvidence,
  buildCorrectnessReportId,
  orchestrateCorrectnessVerification,
} from "@/features/question-factory/correctness";
import {
  buildOriginalityEvidence,
  buildOriginalityReportId,
  computeCurrentOriginalityCorpusFingerprint,
  computeCurrentOriginalityCorpusIds,
} from "@/features/question-factory/originality";
import { hashJson } from "@/features/question-factory/provenance";
import { attemptSemanticReviewTransition, ingestExternalReview } from "@/features/question-factory/review";
import type { FsFactoryRepository } from "@/features/question-factory/storage";
import { buildStructuralValidationReportId, orchestrateStructuralValidation } from "@/features/question-factory/validation";
import { buildEvidence as buildStructuralEvidence } from "@/features/question-factory/validation/evidence";

import { baseProvenance } from "./correctness-fixtures";

/**
 * Small, hand-written synthetic fixtures for the originality/difficulty
 * gates' test suites — mirrors `correctness-fixtures.ts`'s style, scoped
 * to Mission 3D's own two gates.
 *
 * Mission 3D audit remediation (P1-1): both gates' fresh-verification
 * paths independently validate that a genuine, fingerprint-consistent
 * upstream evidence report exists before running (never trusting the
 * candidate's `state` field alone). Seeding a candidate directly at
 * `semantic_review_passed`/`originality_review_passed` is not sufficient
 * on its own.
 *
 * Mission 3D second remediation: the upstream evidence originality reads
 * must now also authenticate the *referenced* structural-validation report
 * (never trust a copied-in fingerprint) and prove an unconditional
 * blueprint-hash binding. `seedAtSemanticReviewPassed` below therefore
 * drives a candidate through the *real* `orchestrateStructuralValidation`
 * and `orchestrateCorrectnessVerification` orchestrators, then the real
 * `attemptSemanticReviewTransition` — never a hand-fabricated report pair
 * — so every genuinely-seeded fixture candidate rests on an authentic
 * upstream chain exactly as production would produce it. `mission3dQuestion`
 * is written to be genuinely, deterministically arithmetic (a real
 * "what is X + Y?" expression) specifically so this real chain succeeds.
 *
 * Mission 3D third remediation: for content whose comparable text is
 * copied verbatim from real production-bank content (duplicate-detection
 * tests), independent arithmetic derivability cannot be guaranteed, so a
 * `number_entry`/deterministic-classification real correctness run cannot
 * reliably be driven end to end. `seedAtSemanticReviewPassedViaIndependentReview`
 * covers that case *without any fabrication at all*: it drives the
 * candidate through the real structural, correctness, and (via a real
 * `ingestExternalReview` call) semantic-review orchestrators exactly like
 * `seedAtSemanticReviewPassed`, but for content shaped as `short_answer`/
 * `text`-answer-key — correctness's `requires_independent_semantic_review`
 * capability only requires the *declared* answer to score full marks
 * through the real scoring engine, never independent derivation, so
 * copied/arbitrary prompt text passes a real correctness run
 * legitimately, and a real independent reviewer identity supplies the
 * genuine semantic-completion evidence.
 *
 * `seedAtSemanticReviewPassedWithFabricatedCorrectness` still exists below
 * but is retained *only* for explicitly-named rejection/adversarial tests
 * that specifically need a candidate resting on a fabricated `cv-*` report
 * with no governed correctness-pass attestation behind it (the third
 * remediation's own required adversarial scenarios) — never for a fixture
 * that stands in for a legitimately-passing candidate.
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

/**
 * Strips every character outside `[a-zA-Z0-9]` from a test-supplied
 * candidate id before it is embedded in filler prompt text — specifically
 * the hyphen, which `correctness/arithmetic-expression.ts`'s extractor
 * treats as a subtraction operator. An id like `"stale-content-001"`
 * embedded verbatim produces filler tokens like `"...-001-0"`,
 * `"...-001-1"`, ... — each a self-contained, operator-bearing
 * `digit-hyphen-digit` substring the extractor recognises, and since they
 * differ per filler word, `ambiguous_prompt` (multiple distinct
 * expressions) rather than the intended single "What is 7 + 5?" match.
 * Sanitising removes every operator character from the filler, leaving
 * the appended arithmetic clause as the prompt's only extractable
 * expression.
 */
function sanitiseForFiller(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * A question with enough distinct extractable text for both gates to
 * compute confidently, always original relative to the real production
 * bank — and, since the Mission 3D second remediation, genuinely,
 * independently arithmetically derivable ("What is 7 + 5?", answer 12),
 * so a real `orchestrateCorrectnessVerification` call against it
 * deterministically passes.
 */
export function mission3dQuestion(id: string, promptSuffix = ""): Record<string, unknown> {
  return {
    id,
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: `A synthetic Mission 3D fixture prompt about ${words(20, `zzqx${sanitiseForFiller(id)}_`)}. What is 7 + 5?${promptSuffix}`,
    options: [],
    answerKey: { kind: "number", value: 12, tolerance: 0 },
    visuals: [],
    explanation: "A short explanation with two sentences. It equals 12.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
  };
}

/** A question with a precisely controllable word count (short, id-independent filler tokens), for difficulty-estimator band testing. Deliberately not arithmetically derivable — only ever seeded via `seedAtOriginalityReviewPassed`, whose downstream (`difficulty`) gate never re-authenticates the upstream correctness/structural chain (see `originality/validate-cached-replay.ts`, which checks the `og-*` report's own binding only). */
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
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
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

/**
 * Seeds a candidate directly into the `generated` compartment (distinct
 * from every other lifecycle state, which all physically live in
 * `review-queue` — see `state-compartment-mapping.ts`), ready for a real
 * `orchestrateStructuralValidation` call to pick it up. Exported so callers
 * needing to stop mid-chain (e.g. to inspect/tamper with evidence right
 * after `correctness_check_passed`, before semantic review runs) can drive
 * the individual real orchestrators themselves rather than only ever
 * reaching the full pre-built chains below.
 */
export async function seedGenerated(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const candidateId = question.id as string;
  const provenance = baseProvenance(question, { blueprintId: "mission3d-fixture-blueprint", ...provenanceOverrides });
  await repo.create("generated", candidateId, { candidateId, state: "generated", question, provenance });
  return { candidateId };
}

/**
 * A genuine, fingerprint-consistent `cv-*` report — built via the real
 * `buildCorrectnessEvidence`, never a hand-faked fingerprint. Retained for
 * the "successful retry after valid evidence restoration" regression
 * scenario, which specifically needs to plant a report *without* also
 * re-running structural validation (the candidate was already seeded with
 * a real `sv-*` report by an earlier `seedAtSemanticReviewPassed`/
 * `seedAtState` call in the same test). Returns the report's own
 * `verificationFingerprint` so a caller can bind a matching
 * `seedLegitimateCorrectnessAttestation` call to it.
 */
export async function seedLegitimateCorrectnessReport(
  repo: FsFactoryRepository,
  candidateId: string,
  candidateRevision: number,
  candidateContentHash: string,
  blueprintHash: string,
  structuralEvidenceFingerprint?: string,
): Promise<string> {
  const evidence = buildCorrectnessEvidence({
    candidateId,
    candidateRevision,
    candidateContentHash,
    blueprintHash,
    ...(structuralEvidenceFingerprint !== undefined ? { structuralEvidenceFingerprint } : {}),
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
  return evidence.verificationFingerprint;
}

/**
 * Mission 3D governed-authority remediation: there is deliberately no
 * `seedLegitimateCorrectnessAttestation`/`seedLegitimateSemanticCompletionEvidence`
 * fixture helper here (or anywhere else in this codebase) — `cva-*` and
 * `sr-*` are reserved trusted report families that only
 * `orchestrateCorrectnessVerification`/`attemptSemanticReviewTransition`
 * themselves can mint (see `storage/trusted-reports.ts`,
 * `storage/governed-write-capability.ts`). Generic `repository.create()`
 * refuses both families outright, so no fixture — however carefully it
 * reuses the real builder functions — can construct one out of band any
 * more. Any test scenario that previously relied on "restore a genuine
 * attestation/evidence record by hand" must instead drive the real
 * orchestrator end to end (`seedAtSemanticReviewPassed`/
 * `seedAtSemanticReviewPassedViaIndependentReview` below), or explicitly
 * demonstrate the refusal (see `mission3d-governed-authority.test.ts`).
 */

/**
 * A genuine, fingerprint-consistent `sv-*` report — built via the real
 * `buildEvidence` (validation's own evidence builder), never a hand-faked
 * fingerprint. For fixture scenarios that seed a candidate directly at a
 * downstream state (bypassing `orchestrateStructuralValidation`'s own
 * `generated` precondition) and so need to plant a genuine structural
 * report out of band, mirroring `seedLegitimateCorrectnessReport`.
 */
export async function seedLegitimateStructuralReport(
  repo: FsFactoryRepository,
  candidateId: string,
  candidateRevision: number,
  candidateContentHash: string,
  blueprintHash: string,
): Promise<string> {
  const evidence = buildStructuralEvidence({
    candidateId,
    candidateRevision,
    candidateContentHash,
    blueprintHash,
    validatedAt: "2026-01-01T00:00:00.000Z",
    issues: [],
  });
  const report = { candidateId, result: { status: "passed" as const, evidence } };
  await repo.create("reports", buildStructuralValidationReportId(candidateId), report);
  return evidence.validationFingerprint;
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

/**
 * Seeds a candidate at `semantic_review_passed` by driving it through the
 * *real* `orchestrateStructuralValidation` and
 * `orchestrateCorrectnessVerification` orchestrators, then the real
 * `attemptSemanticReviewTransition` — never a hand-fabricated report pair
 * (Mission 3D second remediation). `question` must be genuinely,
 * independently deterministically derivable (see `mission3dQuestion`) for
 * this to reach `semantic_review_passed` at all; content that cannot be
 * (duplicate-of-real-content fixtures) must use
 * `seedAtSemanticReviewPassedWithFabricatedCorrectness` instead.
 */
export async function seedAtSemanticReviewPassed(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  blueprintHash: string,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const { candidateId } = await seedGenerated(repo, question, provenanceOverrides);

  const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-01-01T00:00:00.000Z" });
  if (structural.outcome !== "passed") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' failed real structural validation: ${JSON.stringify(structural)}`);
  }

  const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-01-01T00:00:01.000Z" });
  if (correctness.outcome !== "passed") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' did not deterministically pass real correctness verification: ${JSON.stringify(correctness)}`);
  }
  if (correctness.evidence.blueprintHash !== blueprintHash) {
    throw new Error(
      `mission3d-fixtures: candidate '${candidateId}' resolved blueprint hash '${correctness.evidence.blueprintHash}' does not match the caller-supplied '${blueprintHash}'.`,
    );
  }

  const semantic = await attemptSemanticReviewTransition(candidateId, repo);
  if (semantic.outcome !== "passed") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' failed the real semantic-review transition: ${JSON.stringify(semantic)}`);
  }

  return { candidateId };
}

/**
 * Seeds a candidate at `semantic_review_passed` for content that cannot
 * reliably pass a real *arithmetic* correctness run (duplicate-of-
 * production-bank-content fixtures) — without any fabrication at all
 * (Mission 3D third remediation). `question` must classify as
 * `semantic_objective`/`manual_review_writing` (e.g. `type: "short_answer"`,
 * `answerKey: { kind: "text", acceptableAnswers: [...] }` — the caller's
 * responsibility, the exact same shape as any other `text`-answer-key
 * candidate): the
 * correctness gate's `requires_independent_semantic_review` capability
 * only requires the *declared* answer to score full marks through the
 * real scoring engine, never independent derivation, so arbitrary/copied
 * prompt text passes a real correctness run legitimately. A real
 * independent reviewer (`"human"`, independent of the fixture generator
 * identity's `"chatgpt"` per `identitiesAreIndependent`) then supplies
 * genuine semantic-completion evidence via the real `ingestExternalReview`,
 * which itself calls the real `attemptSemanticReviewTransition` — so both
 * the governed correctness-pass attestation and the semantic-completion
 * evidence the third remediation introduced are genuinely minted.
 */
export async function seedAtSemanticReviewPassedViaIndependentReview(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  blueprintHash: string,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const { candidateId } = await seedGenerated(repo, question, provenanceOverrides);

  const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-01-01T00:00:00.000Z" });
  if (structural.outcome !== "passed") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' failed real structural validation: ${JSON.stringify(structural)}`);
  }

  const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-01-01T00:00:01.000Z" });
  if (correctness.outcome !== "passed_pending_semantic_review") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' did not reach 'passed_pending_semantic_review' via real correctness verification: ${JSON.stringify(correctness)}`);
  }
  if (correctness.evidence.blueprintHash !== blueprintHash) {
    throw new Error(
      `mission3d-fixtures: candidate '${candidateId}' resolved blueprint hash '${correctness.evidence.blueprintHash}' does not match the caller-supplied '${blueprintHash}'.`,
    );
  }

  const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
  const provenance = stored.provenance as Record<string, unknown>;

  const reviewOutcome = await ingestExternalReview(
    {
      reviewId: `${candidateId}-review-1`,
      candidateId,
      candidateRevision: provenance.revision as number,
      candidateContentHash: provenance.contentHash as string,
      blueprintHash,
      reviewerModel: "human",
      reviewerVersion: "fixture-v1",
      result: "passed",
      confidence: 0.95,
      findings: ["Fixture-genuine independent review."],
      evidenceReferences: ["fixture-evidence-reference"],
      ambiguityStatus: "none",
      reviewedAt: "2026-01-01T00:00:02.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "fixture-review-prompt-hash",
    },
    repo,
  );
  if (reviewOutcome.status !== "accepted" || reviewOutcome.gateOutcome.outcome !== "passed") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' failed real independent-review ingestion: ${JSON.stringify(reviewOutcome)}`);
  }

  return { candidateId };
}

/**
 * Narrow, documented exception, retained *only* for explicitly-named
 * rejection/adversarial tests (Mission 3D third remediation's required
 * scenarios: "authentic structural evidence plus directly fabricated
 * correctness report", "copied authentic correctness fields without
 * attestation") — never for a fixture that stands in for a legitimately-
 * passing candidate; use `seedAtSemanticReviewPassedViaIndependentReview`
 * for that. Still runs the *real* `orchestrateStructuralValidation`
 * orchestrator — structural validity never depends on arithmetic
 * derivability — and binds a correctness report built via the real
 * `buildCorrectnessEvidence` against that authentic structural report's
 * real, recomputed fingerprint (never a hand-faked one), so the
 * structural-authentication chain is satisfied by a genuine upstream
 * report; only the correctness/semantic gates themselves — and, since the
 * third remediation, the governed correctness-pass attestation — are
 * bypassed. Deliberately produces **no** `cva-*` attestation, which is
 * exactly the gap this fixture now exists to exercise.
 */
export async function seedAtSemanticReviewPassedWithFabricatedCorrectness(
  repo: FsFactoryRepository,
  question: Record<string, unknown>,
  blueprintHash: string,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string }> {
  const { candidateId } = await seedGenerated(repo, question, provenanceOverrides);

  const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-01-01T00:00:00.000Z" });
  if (structural.outcome !== "passed") {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' failed real structural validation: ${JSON.stringify(structural)}`);
  }

  const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
  const provenance = stored.provenance as Record<string, unknown>;
  await seedLegitimateCorrectnessReport(
    repo,
    candidateId,
    provenance.revision as number,
    provenance.contentHash as string,
    blueprintHash,
    structural.evidence.validationFingerprint,
  );

  const updateResult = await repo.update("review-queue", candidateId, { ...stored, state: "semantic_review_passed" }, { expectedContentHash: hashJson(stored) });
  if (!updateResult.ok) {
    throw new Error(`mission3d-fixtures: candidate '${candidateId}' could not be transitioned to 'semantic_review_passed': ${updateResult.message}`);
  }

  return { candidateId };
}

/** Seeds a candidate at `originality_review_passed` with genuine, legitimate upstream `cv-*` and `og-*` reports — satisfies difficulty's own upstream-evidence check (Mission 3D audit remediation P1-1), which validates only the `og-*` report's own binding, never the correctness/structural chain beneath it. */
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
