import type { FactoryRepository } from "../storage";

export type RequeueOutcome =
  | { readonly outcome: "requeued"; readonly candidateId: string }
  | { readonly outcome: "refused"; readonly candidateId: string; readonly reason: string };

/**
 * A judgement-based candidate that reached the semantic gate with no independent review is quarantined with its
 * lifecycle state still `correctness_check_passed`. External review ingestion reads only the `review-queue`
 * compartment, so the candidate has to go back there before a different-provider review can be recorded.
 *
 * This moves a candidate and nothing else. It records no review, mints no evidence, and changes no lifecycle state;
 * the semantic gate still decides, from the review chain, whether the candidate may advance. It refuses anything
 * that is not exactly "quarantined at correctness_check_passed", so it can never resurrect a rejected, revised or
 * already-advanced candidate.
 */
export async function requeueQuarantinedForExternalReview(
  candidateId: string,
  repository: FactoryRepository,
): Promise<RequeueOutcome> {
  const raw = await repository.read("quarantined", candidateId);
  if (typeof raw !== "object" || raw === null) {
    return { outcome: "refused", candidateId, reason: "not in the quarantined compartment" };
  }
  const state = (raw as Record<string, unknown>).state;
  if (state !== "correctness_check_passed") {
    return { outcome: "refused", candidateId, reason: `lifecycle state is '${String(state)}', not 'correctness_check_passed'` };
  }
  const moved = await repository.move(candidateId, "quarantined", "review-queue");
  return moved.ok
    ? { outcome: "requeued", candidateId }
    : { outcome: "refused", candidateId, reason: moved.message };
}
