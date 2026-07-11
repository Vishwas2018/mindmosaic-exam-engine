import * as path from "node:path";

import { GENERATED_QUESTIONS_RELATIVE_PATH, PRODUCTION_QUESTIONS_RELATIVE_PATH } from "./paths";

/**
 * The single central definition of every file publication (Mission 3)
 * may create, modify, or delete. Rollback captures a byte-level snapshot
 * of exactly this set before publishing and restores exactly this set on
 * failure - nothing outside this registry is a publication side effect,
 * and nothing in this registry is ever touched by any other code path.
 */
export const PUBLICATION_CONTROLLED_FILES = Object.freeze({
  /** One JSON file per published batch: `batch-<batchId>.json`. */
  generatedBatchFileDir: GENERATED_QUESTIONS_RELATIVE_PATH,
  generatedBatchFilePattern: path.join(GENERATED_QUESTIONS_RELATIVE_PATH, "batch-{batchId}.json"),
  /** Static loader/index for the generated batches - imports and validates JSON only. */
  generatedBankIndex: path.join(GENERATED_QUESTIONS_RELATIVE_PATH, "index.ts"),
  /** Consumed by scripts/validate-question-bank.mts; never edited by that script. */
  bankContract: path.join(PRODUCTION_QUESTIONS_RELATIVE_PATH, "question-bank-contract.generated.json"),
  questionBankSummary: path.join(PRODUCTION_QUESTIONS_RELATIVE_PATH, "question-bank-summary.ts"),
  /** One manifest per publication, under the factory workspace (tracked, never gitignored). */
  publicationManifestDir: path.join("content", "question-factory", "published-manifests"),
});

export type PublicationControlledFileKey = keyof typeof PUBLICATION_CONTROLLED_FILES;
