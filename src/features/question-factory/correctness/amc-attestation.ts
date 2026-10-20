import { hashJson } from "../provenance/content-hash";
import { candidateQuestionSchema, type CandidateQuestion } from "../ingestion/candidate-question";
import { AMC_FIRST_PARTY_SOLVERS } from "./amc-first-party-solvers";
import { AMC_ATTESTED_CONTENT_HASHES } from "./amc-content-bindings";

export type AmcAttestationResult =
  | { readonly ok: true; readonly computedValue: number | string; readonly matchedOptionId?: string; readonly contentHash: string }
  | { readonly ok: false; readonly error: string; readonly message: string };
const fail = (error: string, message: string): AmcAttestationResult => ({ ok: false, error, message });
const text = (value: number | string): string => String(value).trim().toLowerCase();
const numeric = (value: string): number | undefined => {
  const trimmed = value.trim().replace(/^\$/, "");
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed); return Number.isFinite(parsed) ? parsed : undefined;
};

/** Recomputes independently, pinned to the reviewed question snapshot AND current provenance. Candidate logic, arbitrary code and key-based solvers are never used. */
export function verifyFirstPartyAmcAttestation(raw: CandidateQuestion, expectedContentHash: string): AmcAttestationResult {
  if (raw?.metadata?.subject !== "amc_mathematics" || raw.examStyle !== "amc_style") return fail("not_amc", "Not an AMC maths candidate.");
  if (raw.solverParams !== undefined || ["solver", "solverFn", "code", "script", "execute", "derivedAnswer"].some((field) => Object.hasOwn(raw, field))) return fail("candidate_logic_rejected", "Candidate-supplied solver logic is forbidden for AMC.");
  const parsed = candidateQuestionSchema.safeParse(raw);
  if (!parsed.success) return fail("invalid_candidate", "Invalid AMC candidate schema.");
  const question = parsed.data;
  const contentHash = hashJson(question);
  const pinned = AMC_ATTESTED_CONTENT_HASHES[question.id];
  if (!pinned || pinned !== contentHash || contentHash !== expectedContentHash) return fail("content_hash_mismatch", "AMC content differs from the independently reviewed solver snapshot or provenance.");
  const solver = AMC_FIRST_PARTY_SOLVERS[question.id];
  if (typeof solver !== "function") return fail("missing_first_party_solver", "No first-party recompute solver exists.");
  let value: number | string;
  try { value = solver(); } catch { return fail("solver_execution_failed", "The first-party solver threw; publication is refused."); }
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "number" && !Number.isFinite(value)) || (typeof value === "string" && !value.trim())) return fail("invalid_solver_result", "The solver returned a missing, non-finite or unsupported result.");
  if (question.type === "number_entry" && question.answerKey.kind === "number") {
    if (typeof value !== "number" || value !== question.answerKey.value || (question.answerKey.tolerance ?? 0) !== 0) return fail("key_mismatch", "The exact recomputed value does not match the declared integer key.");
    return { ok: true, computedValue: value, contentHash };
  }
  if (question.type !== "multiple_choice" || question.answerKey.kind !== "single_option") return fail("unsupported_question_shape", "Unsupported AMC interaction/key shape.");
  const matches = question.options.filter((option) => text(option.text) === text(value) || (typeof value === "number" && numeric(option.text) === value));
  if (matches.length !== 1) return fail(matches.length ? "option_match_ambiguous" : "key_mismatch", "The recomputed answer must match exactly one whole option.");
  if (matches[0].id !== question.answerKey.optionId) return fail("key_mismatch", "The independently recomputed option disagrees with the declared key.");
  return { ok: true, computedValue: value, matchedOptionId: matches[0].id, contentHash };
}
