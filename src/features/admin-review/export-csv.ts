import type { ReviewEntry } from "./contracts";
import {
  getKnownDefectiveRevision,
  validateHumanReviewerName,
} from "./pool-classification";

const REVIEW_SHEET_HEADER =
  "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes";

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface ExportSheetResult {
  readonly csv: string;
  readonly rowCount: number;
  readonly skippedMockCount: number;
  readonly skippedUnapprovedCount: number;
  readonly reviewerName: string | null;
}

/**
 * Builds a publish-compatible CSV review sheet for either MCQ/Reading items
 * (`questions:publish` / `content:record-approvals`) or Written Expression
 * items (`content:record-approvals` → `content/publication-approvals/writing-prompts/`).
 *
 * Enforces strict separation between practice pools and unseen mock reserves:
 * passing `poolFilter: "practice"` NEVER includes `unseen_mock` or designated
 * mock-reserve items; passing `poolFilter: "mock"` ONLY includes designated
 * mock-reserve items.
 */
export function buildGovernedExportCsv(
  entries: readonly ReviewEntry[],
  options: {
    readonly itemKind: "question" | "writing_prompt";
    readonly poolFilter: "practice" | "mock";
    readonly includeDecisions?: "approved_only" | "all_reviewed";
  },
): ExportSheetResult {
  const includeMode = options.includeDecisions ?? "approved_only";
  const rows: string[] = [REVIEW_SHEET_HEADER];
  let rowCount = 0;
  let skippedMockCount = 0;
  let skippedUnapprovedCount = 0;
  const reviewerNames = new Set<string>();

  for (const entry of entries) {
    if (entry.itemKind !== options.itemKind) continue;

    const isMockSlot =
      entry.pool === "unseen_mock" ||
      entry.designatedForMock ||
      entry.mockPaper !== null;
    if (options.poolFilter === "practice" && isMockSlot) {
      skippedMockCount += 1;
      continue;
    }
    if (options.poolFilter === "mock" && !isMockSlot) {
      continue;
    }

    const decision = entry.latestDecision;
    if (!decision || !decision.matchesCurrentRevision) {
      skippedUnapprovedCount += 1;
      continue;
    }
    if (includeMode === "approved_only" && decision.decision !== "approve") {
      skippedUnapprovedCount += 1;
      continue;
    }

    if (decision.decision === "approve") {
      if (getKnownDefectiveRevision(entry.question.id, entry.contentHash)) {
        skippedUnapprovedCount += 1;
        continue;
      }
      const checkedName = validateHumanReviewerName(decision.reviewerName);
      if (!checkedName.ok) {
        skippedUnapprovedCount += 1;
        continue;
      }
      reviewerNames.add(checkedName.normalized);
    }

    const approved = decision.decision === "approve";
    const poolTag = isMockSlot
      ? `[mock:${entry.mockPaper ?? "reserved"}]`
      : "[practice]";
    const reviewerTag = `[reviewer:${decision.reviewerName}|${decision.reviewerEmail}|${decision.approvedBy}]`;
    const noteText = [poolTag, reviewerTag, decision.notes.trim()]
      .filter(Boolean)
      .join(" ");

    rows.push(
      [
        escapeCsvCell(entry.question.id),
        escapeCsvCell(entry.publishedContentHash),
        escapeCsvCell(entry.revisionNumber),
        "",
        approved && decision.checks.correctness ? "yes" : "",
        approved && decision.checks.originality ? "yes" : "",
        approved && decision.checks.ageAppropriateness ? "yes" : "",
        escapeCsvCell(decision.decision),
        escapeCsvCell(noteText),
      ].join(","),
    );
    rowCount += 1;
  }

  return {
    csv: `${rows.join("\n")}\n`,
    rowCount,
    skippedMockCount,
    skippedUnapprovedCount,
    reviewerName: reviewerNames.size === 1 ? [...reviewerNames][0]! : null,
  };
}
