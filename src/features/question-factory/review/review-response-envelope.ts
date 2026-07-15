import { FACTORY_LIMITS } from "../config";
import type { ReviewIngestionIssueCode } from "../config";

export type ParsedReviewResponseOutcome =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly issueCode: ReviewIngestionIssueCode; readonly message: string };

/**
 * Parses one review-response file's raw text into an untrusted JSON
 * value, enforcing the size bound *before* attempting to parse (so an
 * oversized file is refused with a bounded message rather than paying
 * for a potentially-expensive parse of untrusted content). Never
 * validates the parsed shape itself — `reviewIngestionInputSchema`
 * (`review-ingest.ts`) is the single source of truth for that, exactly
 * the way `parseInboxFileContent` (Mission 3A) leaves candidate-shape
 * validation to a separate, single-purpose step.
 */
export function parseReviewResponseText(raw: string): ParsedReviewResponseOutcome {
  const byteLength = Buffer.byteLength(raw, "utf8");
  if (byteLength > FACTORY_LIMITS.MAX_REVIEW_RESPONSE_BYTES) {
    return {
      ok: false,
      issueCode: "review_response_too_large",
      message: `Review response is ${byteLength} bytes, exceeding the ${FACTORY_LIMITS.MAX_REVIEW_RESPONSE_BYTES}-byte bound.`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, issueCode: "malformed_review_response", message: `Review response is not valid JSON: ${message}` };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, issueCode: "malformed_review_response", message: "Review response must be a single JSON object." };
  }

  return { ok: true, data: parsed };
}
