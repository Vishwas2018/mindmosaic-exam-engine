/**
 * Bounded input sizes enforced before expensive parsing/normalisation
 * work, so a pathological or hostile donor payload cannot force this
 * adapter into unbounded memory/CPU use. These are cheap, up-front checks
 * (string length, array length) — not a recursive object-depth analyser.
 * Once a payload passes these gates and the shape-dispatch Zod schemas
 * (`legacy-shapes.ts`), the per-field `.max()`/`.optional()` bounds already
 * declared on those schemas (and on the trusted `answerKeySchema`/
 * `visualSchema`/`interactionSchema` reused by `candidateQuestionSchema`)
 * remain the structural defence against deeply nested or over-long
 * payloads. A dedicated recursive depth walker is not implemented here —
 * it is not justified while every donor shape is already a shallow,
 * Zod-bounded object graph.
 */
export const INGESTION_LIMITS = Object.freeze({
  /** Raw JSON string payload for a single source file (legacy_question_json / review_queue_wrapper / compiled_question_array). */
  MAX_RAW_INPUT_LENGTH: 1_000_000,
  /** Element count for a `compiled_question_array` source. */
  MAX_COMPILED_ARRAY_RECORDS: 500,
  /** `content_data_json` cell length for a `csv_row` source. */
  MAX_CSV_EMBEDDED_JSON_LENGTH: 200_000,
  /** `validationErrors`/`riskFlags` array length on a `review_queue_wrapper`. */
  MAX_REVIEW_METADATA_ARRAY_LENGTH: 100,
});
