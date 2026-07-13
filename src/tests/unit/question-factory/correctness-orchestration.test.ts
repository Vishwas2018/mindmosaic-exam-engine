import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildCorrectnessEvidence } from "@/features/question-factory/correctness/evidence";
import {
  buildCorrectnessReportId,
  orchestrateCorrectnessVerification,
} from "@/features/question-factory/correctness/orchestrate-correctness-verification";
import type { CorrectnessVerificationResult } from "@/features/question-factory/correctness/types";
import type { FactoryCompartment, FactoryRepository, MoveResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { buildStructuralValidationReportId } from "@/features/question-factory/validation";

import {
  additionQuestion,
  ambiguousChartTieQuestion,
  baseProvenance,
  passedStructuralEvidence,
  readingComprehensionQuestion,
  wrongDeclaredAnswerQuestion,
} from "./correctness-fixtures";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "correctness-orchestration-test-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

interface StoredStructuralReport {
  readonly candidateId: string;
  readonly result: { readonly status: "passed"; readonly evidence: ReturnType<typeof passedStructuralEvidence> };
}

async function seedReviewQueue(
  question: Record<string, unknown>,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<{ readonly candidateId: string; readonly question: Record<string, unknown> }> {
  const candidateId = question.id as string;
  const provenance = baseProvenance(question, provenanceOverrides);
  const structuralEvidence = passedStructuralEvidence(question, provenance);

  await repo.create("review-queue", candidateId, {
    candidateId,
    state: "structural_validation_passed",
    question,
    provenance,
  });

  const structuralReport: StoredStructuralReport = {
    candidateId,
    result: { status: "passed", evidence: structuralEvidence },
  };
  await repo.create("reports", buildStructuralValidationReportId(candidateId), structuralReport);

  return { candidateId, question };
}

describe("orchestrateCorrectnessVerification — passing candidates", () => {
  it("writes a report and leaves the candidate physically in review-queue on pass", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
    expect((await repo.list("reports")).length).toBe(2); // structural + correctness
  });

  it("is idempotent and replay-safe on a second call", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });

    expect(first.outcome).toBe("passed");
    expect(second.outcome).toBe("passed");
    if (first.outcome === "passed" && second.outcome === "passed") {
      expect(second.replayed).toBe(true);
      expect(second.evidence.verificationFingerprint).toBe(first.evidence.verificationFingerprint);
    }
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
  });

  it("does not duplicate the stored correctness report on replay", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-02T00:00:00.000Z" });
    const reports = await repo.list("reports");
    expect(reports.filter((id) => id.startsWith("cv-")).length).toBe(1);
  });
});

describe("orchestrateCorrectnessVerification — deterministic failure", () => {
  it("moves review-queue -> rejected/correctness on a demonstrably wrong declared answer, never review-queue or quarantined", async () => {
    const { candidateId } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("rejected");
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(true);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
    expect(await repo.exists("staged", candidateId)).toBe(false);
  });
});

describe("orchestrateCorrectnessVerification — review-required and unsupported outcomes route to quarantined", () => {
  it("quarantines a structurally_scoreable_only candidate (ambiguous chart tie), never rejects or passes it", async () => {
    const { candidateId } = await seedReviewQueue(ambiguousChartTieQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("quarantined");
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(true);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
  });

  it("quarantines a requires_independent_semantic_review candidate (reading comprehension), never rejects or passes it", async () => {
    const { candidateId } = await seedReviewQueue(readingComprehensionQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("quarantined");
    expect(await repo.exists("quarantined", candidateId)).toBe(true);
  });

  it("never reaches semantic, originality, difficulty, staging or publication compartments directly", async () => {
    const { candidateId } = await seedReviewQueue(readingComprehensionQuestion());
    await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(await repo.exists("staged", candidateId)).toBe(false);
    expect(await repo.exists("published-manifests", candidateId)).toBe(false);
  });
});

describe("orchestrateCorrectnessVerification — not-found handling", () => {
  it("reports not_found for an unknown candidate id", async () => {
    const outcome = await orchestrateCorrectnessVerification("does-not-exist", repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("not_found");
  });

  it("routes a candidate with no structural evidence report to quarantined rather than fabricating a pass", async () => {
    const question = additionQuestion();
    const candidateId = question.id as string;
    const provenance = baseProvenance(question);
    await repo.create("review-queue", candidateId, {
      candidateId,
      state: "structural_validation_passed",
      question,
      provenance,
    });
    // Deliberately no structural-validation report seeded.
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("quarantined");
    if (outcome.outcome === "quarantined") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("missing_structural_evidence");
    }
  });
});

/** Wraps a real repository so `move()` fails exactly once, then delegates to the real implementation. */
function buildFailOnceMoveRepo(realRepo: FactoryRepository): FactoryRepository {
  let moveAttempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: async (candidateId: string, from: FactoryCompartment, to: FactoryCompartment): Promise<MoveResult> => {
      moveAttempts += 1;
      if (moveAttempts === 1) {
        return { ok: false, candidateId, from, to, reason: "destination_exists", message: "simulated transient repository failure" };
      }
      return realRepo.move(candidateId, from, to);
    },
  };
}

describe("orchestrateCorrectnessVerification — partial-failure recovery", () => {
  it("recovers when the report write succeeds but the move fails: retry with a different verifiedAt reuses the report and completes the move", async () => {
    const { candidateId } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const flakyRepo = buildFailOnceMoveRepo(repo);

    const first = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);

    const second = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-06-15T12:00:00.000Z" });
    expect(second.outcome).toBe("rejected");
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(true);
  });

  it("leaves no partial state when the repository move fails outright", async () => {
    const { candidateId } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const brokenRepo: FactoryRepository = {
      ...repo,
      create: repo.create.bind(repo),
      read: repo.read.bind(repo),
      exists: repo.exists.bind(repo),
      remove: repo.remove.bind(repo),
      list: repo.list.bind(repo),
      reconcile: repo.reconcile.bind(repo),
      move: async (candidateId2: string, from: FactoryCompartment, to: FactoryCompartment): Promise<MoveResult> => ({
        ok: false,
        candidateId: candidateId2,
        from,
        to,
        reason: "destination_exists",
        message: "forced failure for test",
      }),
    };

    const outcome = await orchestrateCorrectnessVerification(candidateId, brokenRepo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("repository_error");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
  });
});

describe("orchestrateCorrectnessVerification — conflict detection across retries", () => {
  it("rejects a retry when the candidate content genuinely changed after the report was written", async () => {
    const { candidateId, question } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const flakyRepo = buildFailOnceMoveRepo(repo);

    const first = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");

    // Simulate the review-queue record being edited out-of-band between attempts.
    await repo.remove("review-queue", candidateId);
    const changedQuestion = { ...question, prompt: "What is 99 + 1?" };
    const changedProvenance = baseProvenance(changedQuestion);
    await repo.create("review-queue", candidateId, {
      candidateId,
      state: "structural_validation_passed",
      question: changedQuestion,
      provenance: changedProvenance,
    });

    const retry = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:05:00.000Z" });
    expect(retry.outcome).toBe("repository_error");
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
  });

  it("rejects a retry when a differently-fingerprinted correctness report already exists for the same candidate", async () => {
    const { candidateId, question } = await seedReviewQueue(additionQuestion());
    const provenance = baseProvenance(question);
    const structuralEvidence = passedStructuralEvidence(question, provenance);

    const divergentEvidence = buildCorrectnessEvidence({
      candidateId,
      candidateRevision: provenance.revision as number,
      candidateContentHash: provenance.contentHash as string,
      structuralEvidenceFingerprint: structuralEvidence.validationFingerprint,
      capability: "deterministically_verifiable",
      verifiedAt: "2026-02-01T00:00:00.000Z",
      issues: [{ code: "declared_answer_mismatch", path: "answerKey", message: "simulated divergent prior report", severity: "error" }],
      outcome: "failed",
    });
    const divergentResult: CorrectnessVerificationResult = {
      status: "failed",
      capability: "deterministically_verifiable",
      issues: [{ code: "declared_answer_mismatch", path: "answerKey", message: "simulated divergent prior report", severity: "error" }],
      evidence: divergentEvidence,
    };
    await repo.create("reports", buildCorrectnessReportId(candidateId), { candidateId, result: divergentResult });

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:10:00.000Z" });
    expect(outcome.outcome).toBe("repository_error");
    if (outcome.outcome === "repository_error") {
      expect(outcome.message).toMatch(/verification fingerprint/i);
    }
  });
});

describe("orchestrateCorrectnessVerification — replay safety for terminal outcomes", () => {
  it("replays an already-rejected outcome without a second report or move", async () => {
    const { candidateId } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("rejected");

    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(second.outcome).toBe("rejected");
    if (first.outcome === "rejected" && second.outcome === "rejected") {
      expect(second.replayed).toBe(true);
      expect(second.evidence.verificationFingerprint).toBe(first.evidence.verificationFingerprint);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(true);
  });

  it("replays an already-quarantined (review-required) outcome without a second report or move", async () => {
    const { candidateId } = await seedReviewQueue(ambiguousChartTieQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("quarantined");

    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(second.outcome).toBe("quarantined");
    if (first.outcome === "quarantined" && second.outcome === "quarantined") {
      expect(second.replayed).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
    expect(await repo.exists("quarantined", candidateId)).toBe(true);
  });
});
