import { FACTORY_LIMITS, type IngestionIssueCode } from "../config";

export type ParsedInboxFileOutcome =
  | { readonly ok: true; readonly candidates: readonly Record<string, unknown>[] }
  | { readonly ok: false; readonly issueCode: IngestionIssueCode; readonly message: string };

/**
 * Parses one inbox file's raw text into an ordered list of candidate
 * content objects. Supported top-level shapes only (contract §6): a
 * single JSON object (one candidate), or a JSON array of objects (an
 * ordered batch from one source file). Nothing else — a JSON string,
 * number, `null`, or an array containing a non-object element is
 * `unsupported_candidate_shape`, not silently coerced into something
 * processable.
 *
 * Deliberately does **not** validate the candidate's internal shape
 * (`type`, `answerKey`, ...): a candidate that parses as a plain object but
 * is missing required fields is accepted here and left for the structural
 * validation gate (Mission 2B) to reject with a precise, type-specific
 * issue code — duplicating that logic here would let the two disagree
 * (contract §6, "valid parse but structurally invalid candidate").
 */
export function parseInboxFileContent(raw: string): ParsedInboxFileOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, issueCode: "malformed_candidate_json", message: `Inbox file is not valid JSON: ${message}` };
  }

  const candidateList = Array.isArray(parsed) ? parsed : [parsed];
  if (candidateList.length === 0) {
    return { ok: false, issueCode: "unsupported_candidate_shape", message: "Inbox file's JSON array contains no candidates." };
  }
  if (candidateList.length > FACTORY_LIMITS.MAX_CANDIDATES_PER_INBOX_FILE) {
    return {
      ok: false,
      issueCode: "ingestion_batch_limit_exceeded",
      message: `Inbox file declares ${candidateList.length} candidates, exceeding the ${FACTORY_LIMITS.MAX_CANDIDATES_PER_INBOX_FILE}-per-file bound.`,
    };
  }

  const candidates: Record<string, unknown>[] = [];
  for (const [index, entry] of candidateList.entries()) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return {
        ok: false,
        issueCode: "unsupported_candidate_shape",
        message: `Candidate at index ${index} is not a JSON object.`,
      };
    }
    candidates.push(entry as Record<string, unknown>);
  }

  return { ok: true, candidates };
}
