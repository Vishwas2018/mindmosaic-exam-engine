import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  approvalFingerprint,
  canonicalQuestionHash,
  validateHumanApproval,
  type HumanPublicationApproval,
} from "../src/features/content-governance/publication-integrity";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { questionSchema } from "../src/schemas/question.schema";
import { hash, pilotSchema, recompute, validatePilot } from "./lib/vihaan-pilot";

const NON_HUMAN_APPROVER =
  /\b(?:claude|anthropic|opus|sonnet|haiku|gpt|chatgpt|openai|gemini|copilot|codex|llm|bot|automated?|ai|antigravity)\b/i;

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

function assertValidReviewer(reviewer: string | undefined): string {
  const trimmed = reviewer?.trim() ?? "";
  if (trimmed.split(/\s+/).filter(Boolean).length < 2) {
    throw new Error("A human reviewer full name (--reviewer '<Full Name>') is required.");
  }
  if (NON_HUMAN_APPROVER.test(trimmed)) {
    throw new Error(`Reviewer identity '${trimmed}' is not an accountable human approver.`);
  }
  return trimmed;
}

async function main(): Promise<void> {
  const reviewer = assertValidReviewer(readArg("--reviewer"));
  const expectedBatchHash = readArg("--batch-hash")?.trim();
  if (!expectedBatchHash || !/^[a-f0-9]{64}$/.test(expectedBatchHash)) {
    throw new Error("A 64-char SHA-256 --batch-hash matching the reviewed draft batch is required.");
  }
  const approvedAt = readArg("--approved-at")?.trim() || new Date().toISOString();
  if (Number.isNaN(Date.parse(approvedAt))) {
    throw new Error(`Invalid ISO timestamp for --approved-at: '${approvedAt}'.`);
  }

  const baseDir = path.join(process.cwd(), "content", "vihaan-scholarship", "pilot-01");
  const raw = JSON.parse(await readFile(path.join(baseDir, "draft.json"), "utf8"));
  const report = validatePilot(raw);
  if (!report.schemaPassed || report.errors.length > 0 || report.counts.rejected > 0) {
    throw new Error(
      `Pilot draft validation failed: ${[...report.errors, ...report.items.flatMap((i) => i.failures)].join("; ")}`,
    );
  }

  const batch = pilotSchema.parse(raw);
  const actualBatchHash = hash(batch);
  if (actualBatchHash !== expectedBatchHash) {
    throw new Error(
      `Draft batch hash mismatch: expected '${expectedBatchHash}', actual '${actualBatchHash}'. Refusing stale approval.`,
    );
  }

  const approvals: HumanPublicationApproval[] = [];
  const adr017Evidence: Array<{
    readonly questionId: string;
    readonly draftItemHash: string;
    readonly draftQuestionHash: string;
    readonly publishedQuestionHash: string;
    readonly recomputePassed: boolean | null;
    readonly editorialInterpretationVerified: true;
    readonly originalityVerified: true;
    readonly ageSuitabilityVerified: true;
  }> = [];

  for (const item of batch.items) {
    const isNumeric = ["numeracy", "numerical_reasoning"].includes(item.question.metadata.subject);
    const recomputeResult = isNumeric ? recompute(item.question).passed : null;
    if (isNumeric && !recomputeResult) {
      throw new Error(`Numeric recomputation failed for ${item.question.id}.`);
    }

    const draftItemHash = hash(item);
    const draftQuestionHash = canonicalQuestionHash(item.question);
    const publishedQuestion = questionSchema.parse({
      ...item.question,
      status: "published",
    });
    const contentHash = canonicalQuestionHash(publishedQuestion);

    const facts: Omit<HumanPublicationApproval, "fingerprint"> = {
      kind: "human_publication_approval",
      schemaVersion: 1,
      questionId: publishedQuestion.id,
      revision: 1,
      approvedBy: reviewer,
      approvedAt,
      contentHash,
      sourceManifestHash: draftItemHash,
      checks: {
        correctness: true,
        originality: true,
        ageAppropriateness: true,
      },
      question: publishedQuestion,
    };
    const approval: HumanPublicationApproval = {
      ...facts,
      fingerprint: approvalFingerprint(facts),
    };

    const verified = validateHumanApproval(approval, publishedQuestion, 1, draftItemHash);
    if (!verified.ok) {
      throw new Error(`Approval verification failed for ${publishedQuestion.id}: ${verified.reason}`);
    }

    approvals.push(approval);
    adr017Evidence.push({
      questionId: publishedQuestion.id,
      draftItemHash,
      draftQuestionHash,
      publishedQuestionHash: contentHash,
      recomputePassed: recomputeResult,
      editorialInterpretationVerified: true,
      originalityVerified: true,
      ageSuitabilityVerified: true,
    });
  }

  const manifestFacts = {
    kind: "vihaan_pilot_publication_manifest" as const,
    schemaVersion: 1 as const,
    batchId: batch.batchId,
    revision: 1,
    draftBatchHash: actualBatchHash,
    approvedBy: reviewer,
    approvedAt,
    publishedAt: approvedAt,
    adr017Evidence,
    approvals,
  };

  const manifest = {
    ...manifestFacts,
    manifestFingerprint: hashJson(manifestFacts),
  };

  const outPath = path.join(baseDir, "published-manifest.json");
  await writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        published: approvals.length,
        batchId: batch.batchId,
        draftBatchHash: actualBatchHash,
        approvedBy: reviewer,
        approvedAt,
        manifestPath: "content/vihaan-scholarship/pilot-01/published-manifest.json",
        manifestFingerprint: manifest.manifestFingerprint,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
