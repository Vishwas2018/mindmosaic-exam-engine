import {
  orchestrateCorrectnessVerification,
  verifyCandidateCorrectness,
  type QuestionFactoryCandidate as CorrectnessCandidate,
} from "../correctness";
import { hashJson } from "../provenance";
import { attemptSemanticReviewTransition, hasIndependentReviewerRecordAtThreshold } from "../review";
import type { FactoryRepository } from "../storage";
import {
  buildStructuralValidationReportId,
  checkAgainstProductionSchema,
  orchestrateStructuralValidation,
  parseCandidateProvenance,
  parseCandidateQuestion,
  validateCandidateStructure,
  type QuestionFactoryCandidate as StructuralCandidate,
  type StoredStructuralValidationReport,
} from "../validation";
import { canAdvanceToSemanticReviewPassed, classifySemanticCategory, type CandidateState } from "../workflow";
import type { GateResult } from "./pipeline-types";

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

async function readBlueprintHash(repository: FactoryRepository, blueprintId: string | undefined): Promise<string | undefined> {
  if (blueprintId === undefined) return undefined;
  const blueprintRecord = await repository.read("blueprints", blueprintId);
  return blueprintRecord !== undefined ? hashJson(blueprintRecord) : undefined;
}

type StageOutcome = GateResult & { readonly endState: CandidateState };

/**
 * A registered pipeline stage. `run` performs the real, mutating gate
 * orchestration (report write + lifecycle transition); `preview` computes
 * the same pure decision with **zero repository writes**, for `dryRun`
 * (Mission 3C plan §7b: "compute the stage's pure decision only, do not
 * call `repository.update`/`move`" — never a fabricated `"passed"`
 * placeholder). Both reuse the exact same pure functions
 * (`validateCandidateStructure`, `verifyCandidateCorrectness`,
 * `hasIndependentReviewerRecordAtThreshold`) the real gate orchestrators
 * call internally, so a dry-run preview and a real run can never
 * structurally disagree about what the gate itself would decide.
 */
export interface PipelineStage {
  readonly name: "structural" | "correctness" | "semantic";
  readonly acceptsState: CandidateState;
  readonly run: (candidateId: string, repository: FactoryRepository) => Promise<StageOutcome>;
  readonly preview: (candidateId: string, repository: FactoryRepository) => Promise<StageOutcome>;
}

// --- Structural validation ------------------------------------------------

async function runStructuralStage(candidateId: string, repository: FactoryRepository): Promise<StageOutcome> {
  const outcome = await orchestrateStructuralValidation(candidateId, repository, { validatedAt: new Date().toISOString() });
  if (outcome.outcome === "passed") {
    return {
      gate: "structural",
      outcome: "passed",
      evidenceFingerprint: outcome.evidence.validationFingerprint,
      endState: "structural_validation_passed",
    };
  }
  if (outcome.outcome === "rejected") {
    return { gate: "structural", outcome: "failed", evidenceFingerprint: outcome.evidence.validationFingerprint, endState: "rejected" };
  }
  throw new Error(`Structural-validation stage could not run for '${candidateId}': outcome '${outcome.outcome}'.`);
}

async function previewStructuralStage(candidateId: string, repository: FactoryRepository): Promise<StageOutcome> {
  const raw = await repository.read("generated", candidateId);
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Cannot preview structural stage for '${candidateId}': no 'generated' record found.`);
  }
  const record = raw as Record<string, unknown>;
  const provenanceRaw = record.provenance;
  const blueprintId =
    typeof provenanceRaw === "object" && provenanceRaw !== null
      ? readStringField(provenanceRaw as Record<string, unknown>, "blueprintId")
      : undefined;
  const blueprintHash = await readBlueprintHash(repository, blueprintId);

  const candidate: StructuralCandidate = {
    candidateId,
    state: readStringField(record, "state") ?? "",
    question: record.question,
    provenance: record.provenance,
  };
  const result = validateCandidateStructure(candidate, {
    validatedAt: new Date().toISOString(),
    ...(blueprintHash !== undefined ? { blueprintHash } : {}),
  });
  return result.status === "passed"
    ? { gate: "structural", outcome: "passed", evidenceFingerprint: result.evidence.validationFingerprint, endState: "structural_validation_passed" }
    : { gate: "structural", outcome: "failed", evidenceFingerprint: result.evidence.validationFingerprint, endState: "rejected" };
}

// --- Correctness verification ---------------------------------------------

async function runCorrectnessStage(candidateId: string, repository: FactoryRepository): Promise<StageOutcome> {
  const outcome = await orchestrateCorrectnessVerification(candidateId, repository, { verifiedAt: new Date().toISOString() });
  if (outcome.outcome === "passed" || outcome.outcome === "passed_pending_semantic_review") {
    return {
      gate: "correctness",
      outcome: "passed",
      evidenceFingerprint: outcome.evidence.verificationFingerprint,
      endState: "correctness_check_passed",
    };
  }
  if (outcome.outcome === "rejected") {
    return { gate: "correctness", outcome: "failed", evidenceFingerprint: outcome.evidence.verificationFingerprint, endState: "rejected" };
  }
  if (outcome.outcome === "quarantined") {
    return { gate: "correctness", outcome: "quarantined", evidenceFingerprint: outcome.evidence.verificationFingerprint, endState: "quarantined" };
  }
  throw new Error(`Correctness-verification stage could not run for '${candidateId}': outcome '${outcome.outcome}'.`);
}

async function previewCorrectnessStage(candidateId: string, repository: FactoryRepository): Promise<StageOutcome> {
  const raw = await repository.read("review-queue", candidateId);
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Cannot preview correctness stage for '${candidateId}': no 'review-queue' record found.`);
  }
  const record = raw as Record<string, unknown>;
  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  if (!provenanceOutcome.ok) {
    throw new Error(`Cannot preview correctness stage for '${candidateId}': provenance does not parse.`);
  }
  const blueprintHash = await readBlueprintHash(repository, provenanceOutcome.data.blueprintId);
  const structuralReport = (await repository.read("reports", buildStructuralValidationReportId(candidateId))) as
    | StoredStructuralValidationReport
    | undefined;

  const candidate: CorrectnessCandidate = {
    candidateId,
    state: readStringField(record, "state") ?? "",
    question: record.question,
    provenance: record.provenance,
  };
  const result = verifyCandidateCorrectness(candidate, {
    verifiedAt: new Date().toISOString(),
    ...(structuralReport !== undefined ? { structuralEvidence: structuralReport.result.evidence } : {}),
    ...(blueprintHash !== undefined ? { blueprintHash } : {}),
  });

  if (result.status === "passed") {
    return { gate: "correctness", outcome: "passed", evidenceFingerprint: result.evidence.verificationFingerprint, endState: "correctness_check_passed" };
  }
  if (result.status === "review_required" && result.capability === "requires_independent_semantic_review") {
    return { gate: "correctness", outcome: "passed", evidenceFingerprint: result.evidence.verificationFingerprint, endState: "correctness_check_passed" };
  }
  const isUncertain = result.status === "review_required" || result.capability === "unsupported";
  return isUncertain
    ? { gate: "correctness", outcome: "quarantined", evidenceFingerprint: result.evidence.verificationFingerprint, endState: "quarantined" }
    : { gate: "correctness", outcome: "failed", evidenceFingerprint: result.evidence.verificationFingerprint, endState: "rejected" };
}

// --- Semantic review -------------------------------------------------------

async function runSemanticStage(candidateId: string, repository: FactoryRepository): Promise<StageOutcome> {
  const outcome = await attemptSemanticReviewTransition(candidateId, repository);
  if (outcome.outcome === "passed") {
    return { gate: "semantic", outcome: "passed", endState: "semantic_review_passed" };
  }
  if (outcome.outcome === "quarantined") {
    return { gate: "semantic", outcome: "quarantined", endState: "quarantined" };
  }
  if (outcome.outcome === "needs_revision") {
    return { gate: "semantic", outcome: "failed", endState: "needs_revision" };
  }
  if (outcome.outcome === "rejected") {
    return { gate: "semantic", outcome: "failed", endState: "rejected" };
  }
  throw new Error(`Semantic-review stage could not run for '${candidateId}': outcome '${outcome.outcome}'.`);
}

async function previewSemanticStage(candidateId: string, repository: FactoryRepository): Promise<StageOutcome> {
  const raw = await repository.read("review-queue", candidateId);
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Cannot preview semantic stage for '${candidateId}': no 'review-queue' record found.`);
  }
  const record = raw as Record<string, unknown>;
  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    throw new Error(`Cannot preview semantic stage for '${candidateId}': provenance/question does not parse.`);
  }
  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    throw new Error(`Cannot preview semantic stage for '${candidateId}': question no longer satisfies the production schema.`);
  }
  const provenance = provenanceOutcome.data;
  const blueprintHash = (await readBlueprintHash(repository, provenance.blueprintId)) ?? "";

  const semanticClassification = classifySemanticCategory(productionSchemaOutcome.question);
  const evidenceAvailable = hasIndependentReviewerRecordAtThreshold(provenance.generatorAdapter.identity, provenance.reviewRecords, {
    candidateId,
    contentHash: provenance.contentHash,
    blueprintHash,
    revision: provenance.revision,
  });
  const canAdvance = canAdvanceToSemanticReviewPassed({
    semanticClassification,
    hasIndependentReviewerRecordAtThreshold: evidenceAvailable,
  });

  return canAdvance
    ? { gate: "semantic", outcome: "passed", endState: "semantic_review_passed" }
    : { gate: "semantic", outcome: "quarantined", endState: "quarantined" };
}

/**
 * The deterministic, three-stage registry — the concrete mechanism that
 * keeps the pipeline runner stopping at `semantic_review_passed` (Mission
 * 3C plan §2c). Mission 3D adds two more entries to this exact array
 * (`originality`, `difficulty`) once those gate modules exist; the
 * runner's control-flow loop (`pipeline-runner.ts`) is entirely data-driven
 * off this array and requires zero changes to accommodate them.
 */
export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { name: "structural", acceptsState: "generated", run: runStructuralStage, preview: previewStructuralStage },
  { name: "correctness", acceptsState: "structural_validation_passed", run: runCorrectnessStage, preview: previewCorrectnessStage },
  { name: "semantic", acceptsState: "correctness_check_passed", run: runSemanticStage, preview: previewSemanticStage },
];
