/**
 * How much evidence a statement about a child needs before it is made.
 *
 * A parent reading "strongest in Numeracy (90%)" or "2 topics mastered" will
 * act on it, so it is only said when it rests on enough work: at least
 * MIN_PAPERS_FOR_CLAIM finished papers and MIN_MARKS_FOR_CLAIM marks
 * available in the thing being described. Below that, the real counts are
 * shown instead ("1 paper · 5 of 8 marks") and no band, ranking or
 * comparison is offered.
 *
 * 2 papers / 8 marks is the figure already used on the student screens, so
 * the same child never looks different to themselves and to their parent.
 */
export const MIN_PAPERS_FOR_CLAIM = 2;
export const MIN_MARKS_FOR_CLAIM = 8;

export interface EvidenceCounts {
  readonly papers: number;
  readonly marksEarned: number;
  readonly marksAvailable: number;
}

export function hasEnoughEvidence(counts: Pick<EvidenceCounts, "papers" | "marksAvailable">): boolean {
  return counts.papers >= MIN_PAPERS_FOR_CLAIM && counts.marksAvailable >= MIN_MARKS_FOR_CLAIM;
}

/** "1 paper · 5 of 8 marks" — the counts a withheld claim is replaced with. */
export function describeEvidence(counts: EvidenceCounts): string {
  const papers = `${counts.papers} ${counts.papers === 1 ? "paper" : "papers"}`;
  return `${papers} · ${counts.marksEarned} of ${counts.marksAvailable} marks`;
}
