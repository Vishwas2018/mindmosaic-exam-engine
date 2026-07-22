import { parseInboxFileContent } from "../manual-ingestion";
import { reviewIngestionInputSchema } from "../review";
import type { GenerateCandidatesOutcome, ReviewCandidateOutcome } from "./provider";

/**
 * Every prompt pack this feature builds (`generation/prompt-builder.ts`,
 * `review/review-prompt-builder.ts`) instructs the model to "respond with
 * exactly one JSON object ... no markdown code fencing" — but a live model
 * still occasionally wraps its answer in a ```json fence anyway. Stripping
 * a fence the model was told not to add is defensive parsing, never a
 * relaxation of the instruction itself: anything else non-JSON around the
 * payload still fails the parse below exactly as it should.
 */
function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Turns one provider's raw generation response text into the same
 * `candidates` shape `questions:ingest` accepts from a hand-dropped inbox
 * file. Never validates candidate-internal fields (type/answerKey/...) —
 * that stays Mission 2B's job (`parseInboxFileContent`'s own doc comment).
 */
export function parseGeneratedCandidates(rawResponseText: string): GenerateCandidatesOutcome {
  const parsed = parseInboxFileContent(stripCodeFence(rawResponseText));
  if (!parsed.ok) {
    return { ok: false, issueCode: "malformed_provider_response", message: parsed.message };
  }
  return { ok: true, candidates: parsed.candidates };
}

/**
 * Turns one provider's raw review response text into a fully validated
 * `ReviewIngestionInput` — the exact shape `questions:review-ingest`
 * requires. Deliberately re-validates with `reviewIngestionInputSchema`
 * here (not just a JSON-object shape check) so a malformed/missing field
 * fails at the adapter boundary with a clear message, never silently
 * reaching `ingestExternalReview` as "garbage in".
 */
export function parseReviewVerdict(rawResponseText: string): ReviewCandidateOutcome {
  const text = stripCodeFence(rawResponseText);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, issueCode: "malformed_provider_response", message: `Provider review response is not valid JSON: ${message}` };
  }

  const validated = reviewIngestionInputSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      issueCode: "malformed_provider_response",
      message: `Provider review response failed schema validation: ${validated.error.issues.map((issue) => issue.message).join("; ")}`,
    };
  }
  return { ok: true, review: validated.data };
}
