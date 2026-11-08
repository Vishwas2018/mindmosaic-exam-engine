import type { ReactNode } from "react";

export const MIN_CLAIM_PAPERS = 2;
export const MIN_CLAIM_MARKS = 8;

export const INSUFFICIENT_EVIDENCE_COPY =
  "Not enough yet to say anything about a single strand. It needs 2 finished papers and 8 marks.";

export interface ClaimWithEvidenceProps {
  /**
   * The evaluative headline shown only when the evidence threshold is met.
   * E.g. "Going well: Number and algebra" or "To practise: Geometry & measurement".
   */
  headline: string;
  papersCount: number;
  marksCount: number;
  /**
   * Optional custom floor thresholds (default to standard 2 papers, 8 marks).
   */
  minPapers?: number;
  minMarks?: number;
  className?: string;
}

/**
 * ClaimWithEvidence component (§4.2 of Parent Journey specification):
 *
 * "The single most important component here. A statement about a child is never
 * shown without the work it rests on.
 *
 * Going well: Number and algebra
 * 3 papers · 26 marks counted
 *
 * To practise: Not enough yet to say anything about a single strand. It needs 2 finished papers and 8 marks.
 *
 * Below 2 papers and 8 marks the claim is withheld and the real counts are stated
 * instead. The threshold is one shared constant across the student screens, the
 * parent screens and this canvas."
 */
export function ClaimWithEvidence({
  headline,
  papersCount,
  marksCount,
  minPapers = MIN_CLAIM_PAPERS,
  minMarks = MIN_CLAIM_MARKS,
  className = "",
}: ClaimWithEvidenceProps): ReactNode {
  const safePapers = Math.max(0, papersCount);
  const safeMarks = Math.max(0, marksCount);
  const meetsFloor = safePapers >= minPapers && safeMarks >= minMarks;

  if (!meetsFloor) {
    return (
      <div
        className={`rounded-2xl border border-royal/10 bg-white p-4 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            To practise
          </span>
          <span className="text-xs font-semibold text-muted/75">
            {safePapers} {safePapers === 1 ? "paper" : "papers"} · {safeMarks}{" "}
            {safeMarks === 1 ? "mark" : "marks"}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-muted">
          {INSUFFICIENT_EVIDENCE_COPY}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-royal/10 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="text-sm font-extrabold text-ink">{headline}</div>
      <p className="mt-1 text-xs font-medium text-muted">
        {safePapers} {safePapers === 1 ? "paper" : "papers"} · {safeMarks} marks
        counted
      </p>
    </div>
  );
}
