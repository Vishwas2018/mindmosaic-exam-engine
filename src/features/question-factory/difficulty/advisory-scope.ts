/**
 * PROPOSAL (not active until the repository owner decides): which candidates get an ADVISORY
 * text-proxy difficulty check instead of a blocking one.
 *
 * The estimator reads word count, reading load, vocabulary and a reasoning-step proxy. For items
 * whose difficulty is abstract reasoning rather than reading load (AMC; scholarship numerical
 * reasoning and mathematics) it measures the wrong thing. For those, a mismatch is recorded as a
 * fingerprinted `review_required` warning and the human reviewer decides the label.
 *
 * Deliberately narrow. Advisory ONLY changes the difficulty gate's verdict on a deviation or low
 * confidence. Structural, correctness (first-party recompute), semantic, originality, provenance
 * and human-approval gates, and malformed-input checks, are untouched. Verbal reasoning and
 * reading are NOT in scope: their difficulty is not an arithmetic-reasoning property.
 */
export interface AdvisoryQuestionShape {
  readonly examStyle: string;
  readonly metadata: { readonly subject: string };
}

const SCHOLARSHIP_ADVISORY_SUBJECTS: ReadonlySet<string> = new Set(["numerical_reasoning", "numeracy"]);

export function isDifficultyAdvisory(question: AdvisoryQuestionShape): boolean {
  if (question.metadata.subject === "amc_mathematics") return true;
  return question.examStyle === "scholarship_style" && SCHOLARSHIP_ADVISORY_SUBJECTS.has(question.metadata.subject);
}
