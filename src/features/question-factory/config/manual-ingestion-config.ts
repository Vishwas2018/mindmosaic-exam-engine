import { z } from "zod";

/**
 * Closed set of `--source` values `questions:ingest` accepts (Mission 3A).
 * Each maps onto an `IDENTITY_ALIAS_TABLE` entry in
 * `identity-normalisation.ts` except `"other"`, which requires an explicit
 * `--model` declaration resolved through the same table — there is no
 * fourth, unlisted source that silently falls back to `"other"`.
 */
export const MANUAL_INGESTION_SOURCES = ["chatgpt", "qwen", "claude", "other"] as const;
export const manualIngestionSourceSchema = z.enum(MANUAL_INGESTION_SOURCES);
export type ManualIngestionSource = z.infer<typeof manualIngestionSourceSchema>;
