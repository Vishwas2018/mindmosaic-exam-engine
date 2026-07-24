/**
 * Operational script for the Grade 3 starter bank (night-g3-bank).
 *
 * Reading and Language Conventions candidates are authored as
 * `reading_comprehension` / `fill_blank` / `dropdown` / `short_answer`
 * content. `correctness/verify-candidate-correctness.ts` classifies this
 * content as needing independent semantic review, and that classification
 * advances directly to lifecycle state `correctness_check_passed` (see
 * `orchestrate-correctness-verification.ts`'s `decideTransitionTarget`).
 *
 * This script calls the structural-validation and correctness-verification
 * orchestrators directly for each candidate, one gate at a time, so every
 * candidate ends at `correctness_check_passed` in `review-queue` — the
 * lifecycle stage this project's editorial process treats as ready for
 * human review. It also runs the project's duplicate-prompt checker
 * (`verifyCandidateOriginality`) against the live production question bank
 * for every candidate, recording a distinct/near-duplicate classification
 * for each one.
 *
 * Not a vitest spec (vitest only picks up `*.test.ts`) — run directly:
 *   npx tsx src/tests/unit/question-factory/g3-bank-reading-conventions-advance.ts
 */
import { questionBank } from "@/content/questions/question-bank";

import { getWorkspaceRoot } from "../../../features/question-factory/config";
import {
  extractComparableText,
  verifyCandidateOriginality,
  type OriginalityVerificationContext,
  type QuestionFactoryCandidate as OriginalityCandidate,
} from "../../../features/question-factory/originality";
import { FsFactoryRepository } from "../../../features/question-factory/storage";
import { orchestrateCorrectnessVerification } from "../../../features/question-factory/correctness";
import { orchestrateStructuralValidation } from "../../../features/question-factory/validation";

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function buildCorpus(excludeCandidateId: string): readonly { readonly id: string; readonly comparableText: string }[] {
  return questionBank
    .filter((question) => question.id !== excludeCandidateId)
    .map((question) => ({ id: question.id, comparableText: extractComparableText(question) }));
}

async function main(): Promise<void> {
  const repository = new FsFactoryRepository(getWorkspaceRoot());
  const candidateIds = await repository.list("generated");

  if (candidateIds.length === 0) {
    console.log("No candidates in 'generated'.");
    return;
  }

  console.log(`Processing ${candidateIds.length} candidate(s).`);

  const summary = { structuralPassed: 0, correctnessPassed: 0, originalityDistinct: 0, issues: [] as string[] };

  for (const candidateId of candidateIds) {
    const structuralOutcome = await orchestrateStructuralValidation(candidateId, repository, {
      validatedAt: new Date().toISOString(),
    });
    if (structuralOutcome.outcome !== "passed") {
      summary.issues.push(`${candidateId}: structural -> ${structuralOutcome.outcome}`);
      continue;
    }
    summary.structuralPassed += 1;

    const correctnessOutcome = await orchestrateCorrectnessVerification(candidateId, repository, {
      verifiedAt: new Date().toISOString(),
    });
    if (correctnessOutcome.outcome !== "passed" && correctnessOutcome.outcome !== "passed_pending_semantic_review") {
      summary.issues.push(`${candidateId}: correctness -> ${correctnessOutcome.outcome}`);
      continue;
    }
    summary.correctnessPassed += 1;

    const record = (await repository.read("review-queue", candidateId)) as Record<string, unknown> | undefined;
    if (record === undefined) {
      summary.issues.push(`${candidateId}: not found in review-queue after correctness verification`);
      continue;
    }
    const candidate: OriginalityCandidate = {
      candidateId,
      state: readStringField(record, "state") ?? "",
      question: record.question,
      provenance: record.provenance,
    };
    const context: OriginalityVerificationContext = {
      validatedAt: new Date().toISOString(),
      corpus: buildCorpus(candidateId),
    };
    const originalityResult = verifyCandidateOriginality(candidate, context);
    if (originalityResult.status !== "passed" || originalityResult.classification !== "distinct") {
      const classificationNote = "classification" in originalityResult ? ` (${originalityResult.classification})` : "";
      summary.issues.push(`${candidateId}: duplicate-prompt check -> ${originalityResult.status}${classificationNote}`);
      continue;
    }
    summary.originalityDistinct += 1;
  }

  console.log(JSON.stringify(summary, null, 2));
  if (summary.issues.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
