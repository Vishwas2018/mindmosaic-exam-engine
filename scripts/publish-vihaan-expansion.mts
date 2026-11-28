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
import { hash, pilotSchema } from "./lib/vihaan-pilot";
import {
  expansionBatchSchema,
  expansionManifestSchema,
  validateDraftItem,
} from "./lib/vihaan-expansion";

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
  const expectedManifestHash = readArg("--manifest-hash")?.trim();
  if (!expectedManifestHash || !/^[a-f0-9]{64}$/.test(expectedManifestHash)) {
    throw new Error("A 64-char SHA-256 --manifest-hash matching bank.draft.json is required.");
  }
  const approvedAt = readArg("--approved-at")?.trim() || new Date().toISOString();
  if (Number.isNaN(Date.parse(approvedAt))) {
    throw new Error(`Invalid ISO timestamp for --approved-at: '${approvedAt}'.`);
  }

  const pilotDir = path.join(process.cwd(), "content", "vihaan-scholarship", "pilot-01");
  const expansionDir = path.join(process.cwd(), "content", "vihaan-scholarship", "expansion-500");

  const rawPilot = JSON.parse(await readFile(path.join(pilotDir, "draft.json"), "utf8"));
  const pilot = pilotSchema.parse(rawPilot);
  const pilotBatchHash = hash(pilot);

  const rawPilotPublished = JSON.parse(
    await readFile(path.join(pilotDir, "published-manifest.json"), "utf8"),
  ) as { draftBatchHash?: string; approvals?: unknown[] };
  if (rawPilotPublished.draftBatchHash !== pilotBatchHash || rawPilotPublished.approvals?.length !== 20) {
    throw new Error(
      "Existing pilot-01/published-manifest.json must remain valid for all 20 pilot items before publishing expansion-500.",
    );
  }

  const rawManifest = JSON.parse(await readFile(path.join(expansionDir, "bank.draft.json"), "utf8"));
  const manifest = expansionManifestSchema.parse(rawManifest);
  const actualManifestHash = hash(manifest);
  if (actualManifestHash !== expectedManifestHash) {
    throw new Error(
      `Expansion manifest hash mismatch: expected '${expectedManifestHash}', actual '${actualManifestHash}'.`,
    );
  }

  const coverageReport = JSON.parse(
    await readFile(path.join(expansionDir, "quality-coverage-report.json"), "utf8"),
  ) as { passed?: boolean; errors?: string[]; total?: number; sources?: { pilotHash?: string; manifestHash?: string } };
  if (
    !coverageReport.passed ||
    (coverageReport.errors?.length ?? 1) > 0 ||
    coverageReport.total !== 500 ||
    coverageReport.sources?.pilotHash !== pilotBatchHash ||
    coverageReport.sources?.manifestHash !== actualManifestHash
  ) {
    throw new Error("Consolidated quality-coverage-report.json must pass for 500 items against current pilot & manifest hashes.");
  }

  const approvals: HumanPublicationApproval[] = [];
  const adr017Evidence: Array<{
    readonly questionId: string;
    readonly batchId: string;
    readonly draftItemHash: string;
    readonly draftQuestionHash: string;
    readonly publishedQuestionHash: string;
    readonly arithmeticMethod: string | null;
    readonly arithmeticPassed: boolean | null;
    readonly editorialInterpretationVerified: true;
    readonly originalityVerified: true;
    readonly ageSuitabilityVerified: true;
  }> = [];
  const batchSummaries: Array<{
    readonly batchId: string;
    readonly file: string;
    readonly sourceHash: string;
    readonly itemCount: number;
  }> = [];

  const seenIds = new Set<string>(pilot.items.map((item) => item.question.id));

  for (const entry of manifest.batches) {
    const rawBatch = JSON.parse(await readFile(path.join(expansionDir, entry.file), "utf8"));
    const batch = expansionBatchSchema.parse(rawBatch);
    if (batch.batchId !== entry.batchId) {
      throw new Error(`Batch ID mismatch for ${entry.file}`);
    }
    const batchHash = hash(batch);
    batchSummaries.push({
      batchId: batch.batchId,
      file: entry.file,
      sourceHash: batchHash,
      itemCount: batch.items.length,
    });

    for (const item of batch.items) {
      if (seenIds.has(item.question.id)) {
        throw new Error(`Duplicate question ID in expansion batches: ${item.question.id}`);
      }
      seenIds.add(item.question.id);

      const validation = validateDraftItem(item, false);
      if (validation.automated !== "PASS" || validation.failures.length > 0) {
        throw new Error(
          `Expansion draft validation failed for ${item.question.id}: ${validation.failures.join("; ")}`,
        );
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
        batchId: batch.batchId,
        draftItemHash,
        draftQuestionHash,
        publishedQuestionHash: contentHash,
        arithmeticMethod: validation.arithmetic?.method ?? null,
        arithmeticPassed: validation.arithmetic?.passed ?? null,
        editorialInterpretationVerified: true,
        originalityVerified: true,
        ageSuitabilityVerified: true,
      });
    }
  }

  if (approvals.length !== 480 || seenIds.size !== 500) {
    throw new Error(`Expected 480 new items + 20 pilot = 500 total; got ${approvals.length} + 20 = ${seenIds.size}`);
  }

  const manifestFacts = {
    kind: "vihaan_expansion_publication_manifest" as const,
    schemaVersion: 1 as const,
    bankId: manifest.bankId,
    revision: 1,
    manifestHash: actualManifestHash,
    pilotBatchHash,
    approvedBy: reviewer,
    approvedAt,
    publishedAt: approvedAt,
    batches: batchSummaries,
    adr017Evidence,
    approvals,
  };

  const publishedManifest = {
    ...manifestFacts,
    manifestFingerprint: hashJson(manifestFacts),
  };

  const outPath = path.join(expansionDir, "published-manifest.json");
  await writeFile(outPath, `${JSON.stringify(publishedManifest, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        publishedExpansion: approvals.length,
        preservedPilot: 20,
        totalPublished: approvals.length + 20,
        bankId: manifest.bankId,
        manifestHash: actualManifestHash,
        pilotBatchHash,
        approvedBy: reviewer,
        approvedAt,
        manifestPath: "content/vihaan-scholarship/expansion-500/published-manifest.json",
        manifestFingerprint: publishedManifest.manifestFingerprint,
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
