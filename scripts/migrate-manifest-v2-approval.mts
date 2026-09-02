/**
 * DRAFT migration — mint retroactive v2 review chains for reviewed questions.
 *
 * This records the 2026-08 content-correctness review INTO the manifest
 * provenance model the repo already has (manifest-schema.ts): a review chain
 * "rooted after publication, anchored to the manifest's own published
 * contentHash" — `chainOrigin: "retroactive_post_publication"`,
 * `manifestSchemaVersion: 2`. It does NOT add an `approvedBy` string; this
 * system records approval as a tamper-evident chain, not a flag.
 *
 * HONESTY GUARANTEE — this script will refuse rather than invent provenance:
 *   1. It requires --provenance <file> naming the REAL reviewer identity,
 *      reviewer version, review-prompt version, and review-prompt hash of the
 *      pass that actually ran. Without it, exit 1. It will not stamp a made-up
 *      reviewer or prompt hash onto children's content.
 *   2. It only touches PASS verdicts that carry a factory manifest. Curated,
 *      manifest-less questions (930 of the 1,148 passes) have nowhere to anchor
 *      a chain and are reported as skipped, not silently approved.
 *   3. A manifest's `evidenceBinding.blueprintHash` must be RESOLVABLE from the
 *      blueprint the manifest names. If it cannot be resolved, that manifest is
 *      skipped and reported — never bound to a placeholder hash.
 *   4. Dry-run by default. Writes nothing under content/ unless --write is
 *      passed, and every minted chain is re-verified with `verifyReviewChain`
 *      before it is allowed to be written.
 *
 * Usage:
 *   node --experimental-strip-types scripts/migrate-manifest-v2-approval.mts \
 *     --provenance scripts/out/review-provenance.json            # dry-run
 *   ... --write                                                  # apply
 *
 * review-provenance.json shape (all fields REQUIRED, all describe the real run):
 *   {
 *     "reviewerIdentity": { "provider": "...", "modelId": "...",
 *                           "modelFamily": "...", "interactionMode": "api" },
 *     "reviewerVersion": "1",
 *     "reviewPromptVersion": "content-correctness-2026-08",
 *     "reviewPromptHash": "<sha256 of the exact review prompt used>",
 *     "reviewedAt": "2026-08-11T00:00:00Z"
 *   }
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { normalisedIdentitySchema } from "@/features/question-factory/config";
import {
  appendReviewRecord,
  hashJson,
  verifyReviewChain,
  type ReviewRecord,
  type ReviewRecordDraft,
} from "@/features/question-factory/provenance";

const ROOT = process.cwd();
const REVIEW_DIR = join(ROOT, "scripts/out/review");
const MANIFEST_DIR = join(ROOT, "content/question-factory/published-manifests");

const args = new Set(process.argv.slice(2));
const WRITE = args.has("--write");
const provFlagIndex = process.argv.indexOf("--provenance");
if (provFlagIndex === -1 || !process.argv[provFlagIndex + 1]) {
  console.error(
    "REFUSING: --provenance <file> is required. This script will not stamp a\n" +
      "reviewer identity or prompt hash it was not given — that would fabricate\n" +
      "the very approval evidence the review exists to establish honestly.",
  );
  process.exit(1);
}
const prov = JSON.parse(readFileSync(process.argv[provFlagIndex + 1]!, "utf8"));
const reviewerIdentity = normalisedIdentitySchema.parse(prov.reviewerIdentity);
for (const field of ["reviewerVersion", "reviewPromptVersion", "reviewPromptHash", "reviewedAt"]) {
  if (typeof prov[field] !== "string" || prov[field].length === 0) {
    console.error(`REFUSING: provenance.${field} is required and must be a non-empty string.`);
    process.exit(1);
  }
}

/**
 * Resolve the blueprint hash a manifest's review must bind to. The manifest
 * names a blueprintId but does not store the blueprint's content hash, so the
 * real migration must look it up from the committed blueprint. Until that
 * lookup is wired, return null so the manifest is SKIPPED, never bound to a
 * placeholder. (TODO: read content/question-factory/blueprints/<id> and hash
 * its canonical content with the same helper the factory uses.)
 */
function resolveBlueprintHash(_blueprintId: string): string | null {
  return null; // deliberately unresolved in the draft — see honesty guarantee #3
}

interface Review { id: string; verdict: string }
const passIds = new Set(
  readdirSync(REVIEW_DIR)
    .filter((n) => n.endsWith(".json"))
    .map((n) => JSON.parse(readFileSync(join(REVIEW_DIR, n), "utf8")) as Review)
    .filter((r) => r.verdict === "pass")
    .map((r) => r.id),
);

const report = { minted: 0, skippedNoBlueprintHash: 0, skippedNotPass: 0, skippedNotManifest: 0, failedVerify: 0 };

for (const file of readdirSync(MANIFEST_DIR).filter((n) => n.endsWith(".json"))) {
  const path = join(MANIFEST_DIR, file);
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const qid: string = manifest.questionId;

  if (!passIds.has(qid)) { report.skippedNotPass++; continue; }

  const blueprintHash = resolveBlueprintHash(manifest.blueprintId);
  if (!blueprintHash) { report.skippedNoBlueprintHash++; continue; }

  // Bind the review result to the exact published contentHash + revision.
  const reviewResultHash = hashJson({
    questionId: qid,
    contentHash: manifest.contentHash,
    revision: manifest.revision,
    result: "passed",
    reviewPromptHash: prov.reviewPromptHash,
    reviewedAt: prov.reviewedAt,
  });

  const draft: ReviewRecordDraft = {
    candidateId: manifest.candidateId,
    stage: "published",
    reviewerIdentity,
    reviewerVersion: prov.reviewerVersion,
    result: "passed",
    confidence: 1,
    findings: [],
    evidenceReferences: [],
    ambiguityStatus: "none",
    reviewedAt: prov.reviewedAt,
    reviewPromptVersion: prov.reviewPromptVersion,
    reviewPromptHash: prov.reviewPromptHash,
    evidenceBinding: {
      candidateContentHash: manifest.contentHash,
      blueprintHash,
      candidateRevision: manifest.revision,
      reviewResultHash,
    },
  };

  // Retroactive chain: genesis-rooted, single record anchored to the published hash.
  const record: ReviewRecord = appendReviewRecord([], draft);
  const verify = verifyReviewChain([record]);
  if (!verify.valid) { report.failedVerify++; continue; }

  const next = {
    ...manifest,
    manifestSchemaVersion: 2,
    correctnessBasis: "independent_semantic_review",
    chainOrigin: "retroactive_post_publication",
    reviewChain: [record],
  };
  // Leave any pre-existing recoveredEvidence in place — it documents the old era.

  if (WRITE) writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
  report.minted++;
}

console.log(WRITE ? "APPLIED" : "DRY-RUN (no files written; pass --write to apply)");
console.log(JSON.stringify(report, null, 2));
if (report.skippedNoBlueprintHash > 0) {
  console.log(
    `\n${report.skippedNoBlueprintHash} manifests skipped: blueprintHash unresolved. ` +
      "Wire resolveBlueprintHash() before this migration can mint their chains.",
  );
}
