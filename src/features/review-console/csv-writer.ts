import type { ReviewDecision, ReviewItem } from "./types";

export const APPROVAL_CSV_HEADER =
  "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes";

/**
 * Escapes a single CSV cell following RFC 4180.
 * Wraps values containing commas, double quotes, or newlines in quotes,
 * and doubles any internal double quotes.
 */
export function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface ReviewCsvRowInput {
  questionId: string;
  contentHash: string;
  revision: number | string;
  sourceManifestHash: string | null;
  decision: ReviewDecision;
  notes?: string;
  checks?: {
    correctness?: boolean;
    originality?: boolean;
    ageAppropriateness?: boolean;
  };
}

/**
 * Formats a single item's review record into the exact 9-column CSV row
 * consumed by `content:record-approvals` / `parseApprovalCsv`.
 *
 * CRITICAL GOVERNANCE RULES:
 * 1. Undecided items (`decision === ""`) export with blank checks and blank decision.
 *    A blank row is NEVER an approval and will be skipped as unreviewed by `validateApprovalBatch`.
 * 2. An item is ONLY marked with "yes" checks if its decision is explicitly "approve".
 * 3. Rejected or revision items export their explicit decision ("reject" | "revise") with any notes.
 * 4. No approval is ever inferred, defaulted or pre-filled.
 */
export function formatApprovalCsvRow(input: ReviewCsvRowInput): string {
  const { questionId, contentHash, revision, sourceManifestHash, decision, notes } = input;

  let correctnessCell = "";
  let originalityCell = "";
  let ageAppropriatenessCell = "";
  let decisionCell = "";

  if (decision === "approve") {
    // For approval to be recorded by content:record-approvals, all 3 checks must be yes.
    correctnessCell = "yes";
    originalityCell = "yes";
    ageAppropriatenessCell = "yes";
    decisionCell = "approve";
  } else if (decision === "reject") {
    decisionCell = "reject";
  } else if (decision === "revise") {
    decisionCell = "revise";
  }
  // If decision is "" (undecided), all four columns remain completely blank "".

  // Note: content:record-approvals (parseApprovalCsv) naively splits CSV by /\r?\n/.
  // To preserve batch integrity when consumed by content:record-approvals,
  // internal newlines in reviewer notes are sanitized to spaces.
  const cleanNotes = (notes ?? "").replace(/\r?\n/g, " ").trim();

  return [
    escapeCsvCell(questionId),
    escapeCsvCell(contentHash),
    escapeCsvCell(revision),
    escapeCsvCell(sourceManifestHash ?? ""),
    escapeCsvCell(correctnessCell),
    escapeCsvCell(originalityCell),
    escapeCsvCell(ageAppropriatenessCell),
    escapeCsvCell(decisionCell),
    escapeCsvCell(cleanNotes),
  ].join(",");
}

/**
 * Serializes a list of review items into a full CSV document
 * compatible with `content:record-approvals`.
 */
export function serializeReviewCsv(items: readonly ReviewItem[]): string {
  const rows: string[] = [APPROVAL_CSV_HEADER];
  for (const item of items) {
    rows.push(
      formatApprovalCsvRow({
        questionId: item.id,
        contentHash: item.contentHash,
        revision: item.revision,
        sourceManifestHash: item.sourceManifestHash,
        decision: item.decision,
        notes: item.notes,
        checks: item.checks,
      }),
    );
  }
  return rows.join("\r\n") + "\r\n";
}
