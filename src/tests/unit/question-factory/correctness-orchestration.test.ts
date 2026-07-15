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
  manualAnswerKeyQuestion,
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

  it("persists correctness_check_passed on the stored candidate record itself, not just the report", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidateId)) as { state: string } | undefined;
    expect(stored).toBeDefined();
    expect(stored!.state).toBe("correctness_check_passed");
  });

  it("re-reading the repository after a pass returns the updated state on every subsequent read", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });

    const first = (await repo.read("review-queue", candidateId)) as { state: string };
    const second = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(first.state).toBe("correctness_check_passed");
    expect(second.state).toBe("correctness_check_passed");
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

describe("orchestrateCorrectnessVerification — structurally_scoreable_only still quarantines (genuinely undecidable)", () => {
  it("quarantines a structurally_scoreable_only candidate (ambiguous chart tie), never rejects or passes it", async () => {
    const { candidateId } = await seedReviewQueue(ambiguousChartTieQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("quarantined");
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(true);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
  });
});

/**
 * Post-Mission-3B-audit remediation (P1-1): `requires_independent_semantic_review`
 * is a legitimate, expected classification for `semantic_objective`/
 * `manual_review_writing` content, not a "the gate cannot decide" case —
 * conflating the two made these candidates unreachable through the real
 * pipeline (they were quarantined one gate before Mission 3B's semantic
 * gate could ever see them). See `orchestrate-correctness-verification.ts`'s
 * `CorrectnessOrchestrationOutcome["passed_pending_semantic_review"]` doc
 * comment for the full corrected semantics.
 */
describe("orchestrateCorrectnessVerification — requires_independent_semantic_review advances to correctness_check_passed, pending semantic review", () => {
  it("advances a reading-comprehension candidate to correctness_check_passed with outcome passed_pending_semantic_review, never quarantined or rejected", async () => {
    const { candidateId } = await seedReviewQueue(readingComprehensionQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed_pending_semantic_review");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);

    const stored = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(stored.state).toBe("correctness_check_passed");
  });

  it("advances a manual-answer-key candidate to correctness_check_passed with outcome passed_pending_semantic_review", async () => {
    const { candidateId } = await seedReviewQueue(manualAnswerKeyQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed_pending_semantic_review");
    const stored = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(stored.state).toBe("correctness_check_passed");
  });

  it("stores the correctness evidence outcome as review_required, never passed — no answer-correctness claim is made", async () => {
    const { candidateId } = await seedReviewQueue(readingComprehensionQuestion());
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed_pending_semantic_review");
    if (outcome.outcome === "passed_pending_semantic_review") {
      expect(outcome.evidence.outcome).toBe("review_required");
      expect(outcome.evidence.capability).toBe("requires_independent_semantic_review");
      expect(outcome.issues.map((issue) => issue.code)).toContain("semantic_review_required");
    }
  });

  it("is idempotent and replay-safe on a second call", async () => {
    const { candidateId } = await seedReviewQueue(readingComprehensionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed_pending_semantic_review");
    expect(second.outcome).toBe("passed_pending_semantic_review");
    if (first.outcome === "passed_pending_semantic_review" && second.outcome === "passed_pending_semantic_review") {
      expect(second.replayed).toBe(true);
      expect(second.evidence.verificationFingerprint).toBe(first.evidence.verificationFingerprint);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
  });

  it("never reaches semantic, originality, difficulty, staging or publication compartments directly (only the correctness gate ran)", async () => {
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

describe("orchestrateCorrectnessVerification — lifecycle-state enforcement", () => {
  /** Seeds a candidate physically in review-queue with an arbitrary (possibly invalid) stored `state`, without going through the normal structural-validation flow. */
  async function seedReviewQueueWithState(
    question: Record<string, unknown>,
    state: string,
  ): Promise<string> {
    const candidateId = question.id as string;
    const provenance = baseProvenance(question);
    await repo.create("review-queue", candidateId, { candidateId, state, question, provenance });
    return candidateId;
  }

  it.each(["generated", "quarantined", "rejected/structural", "rejected/correctness"])(
    "refuses to process a candidate whose stored state is '%s', with no derivation, report, or move",
    async (bogusState) => {
      const question = additionQuestion();
      const candidateId = await seedReviewQueueWithState(question, bogusState);

      const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
      expect(outcome.outcome).toBe("invalid_lifecycle_state");
      if (outcome.outcome === "invalid_lifecycle_state") {
        expect(outcome.actualState).toBe(bogusState);
      }

      // No report was written, and the candidate never moved.
      expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(0);
      expect(await repo.exists("review-queue", candidateId)).toBe(true);
      const stored = (await repo.read("review-queue", candidateId)) as { state: string };
      expect(stored.state).toBe(bogusState);
    },
  );

  it("reports invalid_lifecycle_state for a completely unknown stored state string", async () => {
    const question = additionQuestion();
    const candidateId = await seedReviewQueueWithState(question, "some_future_gate_state");
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("invalid_lifecycle_state");
    if (outcome.outcome === "invalid_lifecycle_state") {
      expect(outcome.actualState).toBe("some_future_gate_state");
    }
  });

  it("replays a correctness_check_passed candidate safely by returning the cached report, without re-deriving or writing a duplicate", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");

    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-06-01T00:00:00.000Z" });
    expect(second.outcome).toBe("passed");
    if (first.outcome === "passed" && second.outcome === "passed") {
      expect(second.replayed).toBe(true);
      expect(second.evidence.verificationFingerprint).toBe(first.evidence.verificationFingerprint);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
  });

  it("reports replay_integrity_failure for a candidate stored as correctness_check_passed with no matching report (internal inconsistency, never silently re-derived)", async () => {
    const question = additionQuestion();
    const candidateId = await seedReviewQueueWithState(question, "correctness_check_passed");
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("cached_replay_integrity_failure");
    }
  });
});

describe("orchestrateCorrectnessVerification — cached-replay evidence binding (end-to-end)", () => {
  it("performs no repository writes at all during a valid cached replay", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");

    const candidateBefore = await repo.read("review-queue", candidateId);
    const reportsBefore = await repo.list("reports");

    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(second.outcome).toBe("passed");

    const candidateAfter = await repo.read("review-queue", candidateId);
    const reportsAfter = await repo.list("reports");
    expect(candidateAfter).toEqual(candidateBefore);
    expect(reportsAfter).toEqual(reportsBefore);
  });

  it("rejects a cached replay whose stored correctness report was tampered with (mismatched blueprint hash), performing no writes and no move", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");
    if (first.outcome !== "passed") return;

    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: CorrectnessVerificationResult };
    if (stored.result.status !== "passed") throw new Error("expected a passed stored report");
    const tampered = {
      candidateId: stored.candidateId,
      result: { ...stored.result, evidence: { ...stored.result.evidence, blueprintHash: "tampered-blueprint-hash" } },
    };
    await repo.update("reports", reportId, tampered);

    const candidateBefore = await repo.read("review-queue", candidateId);
    const reportsBefore = await repo.list("reports");

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.blueprintHash");
    }

    // No writes and no move happened while establishing the failure.
    expect(await repo.read("review-queue", candidateId)).toEqual(candidateBefore);
    expect(await repo.list("reports")).toEqual(reportsBefore);
    expect(await repo.exists("rejected/correctness", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
  });

  it("rejects a cached replay whose stored correctness report's fingerprint was tampered with directly", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");

    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: CorrectnessVerificationResult };
    if (stored.result.status !== "passed") throw new Error("expected a passed stored report");
    const tampered = {
      candidateId: stored.candidateId,
      result: {
        ...stored.result,
        evidence: { ...stored.result.evidence, verificationFingerprint: "fabricated-fingerprint-value" },
      },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.verificationFingerprint");
    }
  });

  it("rejects a cached replay when the stored structural report was tampered with after the pass", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");

    const structuralReportId = buildStructuralValidationReportId(candidateId);
    const storedStructural = (await repo.read("reports", structuralReportId)) as StoredStructuralReport;
    const tamperedStructural = {
      candidateId: storedStructural.candidateId,
      result: { status: "passed" as const, evidence: { ...storedStructural.result.evidence, candidateRevision: 999 } },
    };
    await repo.update("reports", structuralReportId, tamperedStructural);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths.some((p) => p.startsWith("structuralReport."))).toBe(true);
    }
  });

  it("rejects a cached replay when the candidate record itself was edited out-of-band after the pass", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = stored.provenance as Record<string, unknown>;
    const mutated = { ...stored, provenance: { ...provenance, revision: (provenance.revision as number) + 5 } };
    await repo.update("review-queue", candidateId, mutated);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
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
    update: realRepo.update.bind(realRepo),
    move: async (candidateId: string, from: FactoryCompartment, to: FactoryCompartment): Promise<MoveResult> => {
      moveAttempts += 1;
      if (moveAttempts === 1) {
        return { ok: false, candidateId, from, to, reason: "destination_exists", message: "simulated transient repository failure" };
      }
      return realRepo.move(candidateId, from, to);
    },
  };
}

/** Wraps a real repository so `update()` fails exactly once, then delegates to the real implementation. */
function buildFailOnceUpdateRepo(realRepo: FactoryRepository): FactoryRepository {
  let updateAttempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: async (
      compartment: FactoryCompartment,
      candidateId: string,
      data: unknown,
      options?: { readonly expectedContentHash?: string },
    ) => {
      updateAttempts += 1;
      if (updateAttempts === 1) {
        return {
          ok: false as const,
          candidateId,
          compartment,
          reason: "state_mismatch" as const,
          message: "simulated transient repository failure",
        };
      }
      return realRepo.update(compartment, candidateId, data, options);
    },
  };
}

describe("orchestrateCorrectnessVerification — same-compartment update partial-failure recovery", () => {
  it("recovers when the report write succeeds but the same-compartment update fails: retry reuses the report and completes the state transition", async () => {
    const { candidateId } = await seedReviewQueue(additionQuestion());
    const flakyRepo = buildFailOnceUpdateRepo(repo);

    const first = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");
    // Candidate must still be exactly where (and as) it started - state not flipped.
    const midway = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(midway.state).toBe("structural_validation_passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);

    const second = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-06-15T12:00:00.000Z" });
    expect(second.outcome).toBe("passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("cv-")).length).toBe(1);
    const finalRecord = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(finalRecord.state).toBe("correctness_check_passed");
  });
});

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
      update: repo.update.bind(repo),
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

/**
 * Mission 2C stabilisation: once a candidate has physically left
 * `review-queue` (a terminal `rejected`/`quarantined` outcome), this module
 * has no current candidate content left to re-verify against, so it trusts
 * the stored `cv-` report directly (see the class doc on
 * `orchestrateCorrectnessVerification`). Previously that trust was
 * unconditional — the stored report's own `verificationFingerprint` was
 * never recomputed, so a report hand-edited directly on disk (its visible
 * fields changed without a matching fingerprint update) would still be
 * replayed as-is. These tests exercise the fix.
 */
describe("orchestrateCorrectnessVerification — terminal-report fingerprint integrity (not-found reuse path)", () => {
  it("replays a terminal rejected report whose fingerprint is genuinely valid (no tamper)", async () => {
    const { candidateId } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("rejected");

    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(second.outcome).toBe("rejected");
    if (second.outcome === "rejected") expect(second.replayed).toBe(true);
  });

  it("refuses to replay a terminal rejected report whose fingerprint was hand-edited directly, performing no writes and no move", async () => {
    const { candidateId } = await seedReviewQueue(wrongDeclaredAnswerQuestion());
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    expect(first.outcome).toBe("rejected");

    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: CorrectnessVerificationResult };
    const tampered = {
      candidateId: stored.candidateId,
      result: { ...stored.result, evidence: { ...stored.result.evidence, verificationFingerprint: "fabricated-terminal-fingerprint" } },
    };
    await repo.update("reports", reportId, tampered);

    const reportsBefore = await repo.list("reports");
    const rejectedFilesBefore = await repo.list("rejected/correctness");

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("cached_replay_integrity_failure");
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.verificationFingerprint");
    }

    // No derivation, no report rewrite, no move: the tampered report is refused, not silently replayed or re-derived.
    expect(await repo.list("reports")).toEqual(reportsBefore);
    expect(await repo.list("rejected/correctness")).toEqual(rejectedFilesBefore);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
  });
});

/**
 * Closure fix for the final Codex P1: terminal-report replay recomputed the
 * report's own internal fingerprint but never bound the report to the
 * *requested* candidate id — the deterministic report key
 * (`cv-<hash(candidateId)>`) was implicitly trusted as ownership proof, so a
 * genuinely valid, internally-consistent report for candidate B stored
 * under candidate A's key would still replay as A's result. These tests
 * exercise `validateTerminalReportBinding`'s explicit candidateId/
 * evidence-coherence/version checks end-to-end through the orchestrator.
 */
describe("orchestrateCorrectnessVerification — terminal-report candidate-id binding", () => {
  type StoredReport = { readonly candidateId: string; readonly result: CorrectnessVerificationResult };

  /** Seeds and drives a genuinely-rejected candidate through the gate, returning its real stored terminal report. */
  async function seedRejectedReport(idSuffix: string): Promise<{ readonly candidateId: string; readonly report: StoredReport }> {
    const question = { ...wrongDeclaredAnswerQuestion(), id: `wrong-declared-answer-${idSuffix}` };
    const { candidateId } = await seedReviewQueue(question);
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-02-01T00:00:00.000Z" });
    if (outcome.outcome !== "rejected") throw new Error(`fixture candidate '${candidateId}' must reject`);
    const reportId = buildCorrectnessReportId(candidateId);
    const report = (await repo.read("reports", reportId)) as StoredReport;
    return { candidateId, report };
  }

  it("1. replays a genuinely valid terminal report for candidate A successfully", async () => {
    const { candidateId } = await seedRejectedReport("a");
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("rejected");
    if (outcome.outcome === "rejected") expect(outcome.replayed).toBe(true);
  });

  it("2. rejects a genuinely valid candidate-B report copied under candidate A's report key", async () => {
    const a = await seedRejectedReport("a2");
    const b = await seedRejectedReport("b2");

    // Copy B's fully valid, internally-fingerprint-consistent report under A's report key.
    const aReportId = buildCorrectnessReportId(a.candidateId);
    await repo.update("reports", aReportId, b.report);

    const outcome = await orchestrateCorrectnessVerification(a.candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("cached_replay_integrity_failure");
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("correctnessReport.candidateId");
      expect(paths).toContain("correctnessReport.evidence.candidateId");
    }
  });

  it("3. rejects when report.candidateId matches the request but evidence.candidateId belongs to a different candidate", async () => {
    const a = await seedRejectedReport("a3");
    const b = await seedRejectedReport("b3");
    const reportId = buildCorrectnessReportId(a.candidateId);

    const tampered: StoredReport = {
      candidateId: a.candidateId,
      result: { ...b.report.result, evidence: { ...b.report.result.evidence, candidateId: b.candidateId } },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(a.candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("correctnessReport.evidence.candidateId");
    }
  });

  it("4. rejects when evidence.candidateId matches the request but report.candidateId belongs to a different candidate", async () => {
    const a = await seedRejectedReport("a4");
    const b = await seedRejectedReport("b4");
    const reportId = buildCorrectnessReportId(a.candidateId);

    const tampered: StoredReport = { candidateId: b.candidateId, result: a.report.result };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(a.candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("correctnessReport.candidateId");
    }
  });

  it("5. rejects a revision mismatch between terminal correctness evidence and the requested candidate's structural evidence", async () => {
    const { candidateId, report } = await seedRejectedReport("rev5");
    const reportId = buildCorrectnessReportId(candidateId);
    const tampered: StoredReport = {
      candidateId,
      result: { ...report.result, evidence: { ...report.result.evidence, candidateRevision: 999 } },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("cached_replay_integrity_failure");
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.candidateRevision");
    }
  });

  it("6. rejects a content-hash mismatch between terminal correctness evidence and the requested candidate's structural evidence", async () => {
    const { candidateId, report } = await seedRejectedReport("hash6");
    const reportId = buildCorrectnessReportId(candidateId);
    const tampered: StoredReport = {
      candidateId,
      result: { ...report.result, evidence: { ...report.result.evidence, candidateContentHash: "tampered-content-hash" } },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.candidateContentHash");
    }
  });

  it("7. rejects a blueprint-hash mismatch between terminal correctness evidence and the requested candidate's structural evidence", async () => {
    const { candidateId, report } = await seedRejectedReport("bp7");
    const reportId = buildCorrectnessReportId(candidateId);
    const tampered: StoredReport = {
      candidateId,
      result: { ...report.result, evidence: { ...report.result.evidence, blueprintHash: "tampered-blueprint-hash" } },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.blueprintHash");
    }
  });

  it("8. rejects an invalid terminal outcome (a 'passed' report reaching the not-in-review-queue reuse path)", async () => {
    const { candidateId, report } = await seedRejectedReport("outcome8");
    const reportId = buildCorrectnessReportId(candidateId);
    const tampered: StoredReport = {
      candidateId,
      result: {
        status: "passed",
        capability: "deterministically_verifiable",
        evidence: { ...report.result.evidence, outcome: "passed" },
      },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("cached_replay_integrity_failure");
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.result.status");
    }
  });

  it("9. rejects a stale verifier version on a terminal report", async () => {
    const { candidateId, report } = await seedRejectedReport("ver9");
    const reportId = buildCorrectnessReportId(candidateId);
    const tampered: StoredReport = {
      candidateId,
      result: { ...report.result, evidence: { ...report.result.evidence, verifierVersion: "0" } },
    };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.verifierVersion");
    }
  });

  it("10. rejects a fingerprint-valid but candidate-mismatched report (B's report, recomputed fingerprint still matches, but wrong candidate)", async () => {
    const a = await seedRejectedReport("a10");
    const b = await seedRejectedReport("b10");
    const reportId = buildCorrectnessReportId(a.candidateId);

    // B's report is copied verbatim: its own internal fingerprint is still perfectly valid for B's content.
    await repo.update("reports", reportId, b.report);

    const outcome = await orchestrateCorrectnessVerification(a.candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      // Confirm the fingerprint itself was NOT what caught this - it is candidateId binding.
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("correctnessReport.candidateId");
      expect(paths).not.toContain("correctnessReport.evidence.verificationFingerprint");
    }
  });

  it("11. performs no repository update, move, report write, derivation, or scoring on a candidate-binding failure", async () => {
    const a = await seedRejectedReport("a11");
    const b = await seedRejectedReport("b11");
    const reportId = buildCorrectnessReportId(a.candidateId);
    await repo.update("reports", reportId, b.report);

    const reportsBefore = await repo.list("reports");
    const rejectedBefore = await repo.list("rejected/correctness");
    const quarantinedBefore = await repo.list("quarantined");
    const reviewQueueBefore = await repo.list("review-queue");

    const outcome = await orchestrateCorrectnessVerification(a.candidateId, repo, { verifiedAt: "2027-01-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("replay_integrity_failure");

    expect(await repo.list("reports")).toEqual(reportsBefore);
    expect(await repo.list("rejected/correctness")).toEqual(rejectedBefore);
    expect(await repo.list("quarantined")).toEqual(quarantinedBefore);
    expect(await repo.list("review-queue")).toEqual(reviewQueueBefore);
    // The tampered report at A's key is untouched (never rewritten, not even to "repair" it).
    const stillTampered = (await repo.read("reports", reportId)) as StoredReport;
    expect(stillTampered.candidateId).toBe(b.candidateId);
  });
});
