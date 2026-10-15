import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import type { Question } from "@/schemas/question.schema";
import type { AttachedReviewEvidence, ReviewDecision, ReviewItem } from "./types";

export interface RawCsvRow {
  questionId: string;
  decision?: string;
  notes?: string;
  correctness?: string;
  originality?: string;
  ageAppropriateness?: string;
}

/**
 * Parses raw CSV content if a batch already has a companion `review.csv`.
 */
export function parseExistingCsv(csvContent: string): Map<string, RawCsvRow> {
  const map = new Map<string, RawCsvRow>();
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return map;

  const headers = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = headers.findIndex((h) => h === "questionId" || h === "id");
  const decisionIndex = headers.indexOf("decision");
  const notesIndex = headers.indexOf("notes");
  const correctnessIndex = headers.indexOf("correctness");
  const originalityIndex = headers.indexOf("originality");
  const ageAppropriatenessIndex = headers.indexOf("ageAppropriateness");

  if (idIndex < 0) return map;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    const qId = cols[idIndex]?.trim();
    if (!qId) continue;

    map.set(qId, {
      questionId: qId,
      decision: decisionIndex >= 0 ? cols[decisionIndex]?.trim() : "",
      notes: notesIndex >= 0 ? cols[notesIndex]?.trim() : "",
      correctness: correctnessIndex >= 0 ? cols[correctnessIndex]?.trim() : "",
      originality: originalityIndex >= 0 ? cols[originalityIndex]?.trim() : "",
      ageAppropriateness: ageAppropriatenessIndex >= 0 ? cols[ageAppropriatenessIndex]?.trim() : "",
    });
  }

  return map;
}

function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (insideQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Maps raw question objects into governed ReviewItems.
 */
export function buildReviewItemsFromQuestions(
  questions: readonly Question[],
  options?: {
    existingCsvContent?: string;
    reviews?: readonly unknown[];
    revision?: number;
    sourceManifestHash?: string | null;
  },
): ReviewItem[] {
  const existingMap = options?.existingCsvContent
    ? parseExistingCsv(options.existingCsvContent)
    : new Map<string, RawCsvRow>();

  // Optional attached reviews (e.g. from responses-batch-*.json)
  const reviewsByQuestionId = new Map<string, AttachedReviewEvidence>();
  if (options?.reviews && Array.isArray(options.reviews)) {
    for (const r of options.reviews) {
      if (r && typeof r === "object") {
        const rec = r as Record<string, unknown>;
        // Try questionId or candidateId or extract from reviewId
        let targetId = typeof rec.questionId === "string" ? rec.questionId : "";
        if (!targetId && typeof rec.reviewId === "string") {
          // e.g. cowork-opus5-roadmap-naplan-y3-reading-01-q1-r0 -> roadmap-naplan-y3-reading-01-q1
          const match = rec.reviewId.match(/(roadmap-[a-z0-9-]+-q\d+|roadmap-[a-z0-9-]+-\d+)/);
          if (match) targetId = match[1];
        }
        if (targetId) {
          reviewsByQuestionId.set(targetId, {
            reviewerModel: typeof rec.reviewerModel === "string" ? rec.reviewerModel : undefined,
            reviewerVersion: typeof rec.reviewerVersion === "string" ? rec.reviewerVersion : undefined,
            result: typeof rec.result === "string" ? rec.result : typeof rec.decision === "string" ? rec.decision : undefined,
            confidence: typeof rec.confidence === "number" ? rec.confidence : undefined,
            findings: Array.isArray(rec.findings) ? rec.findings.map(String) : Array.isArray(rec.notes) ? rec.notes.map(String) : undefined,
            recommendedCorrections: Array.isArray(rec.recommendedCorrections) ? rec.recommendedCorrections.map(String) : Array.isArray(rec.requiredFixes) ? rec.requiredFixes.map(String) : undefined,
            evidenceReferences: Array.isArray(rec.evidenceReferences) ? rec.evidenceReferences.map(String) : undefined,
            ambiguityStatus: typeof rec.ambiguityStatus === "string" ? rec.ambiguityStatus : undefined,
            reviewedAt: typeof rec.reviewedAt === "string" ? rec.reviewedAt : undefined,
          });
        }
      }
    }
  }

  return questions.map((q, index) => {
    let contentHash = "";
    try {
      contentHash = canonicalQuestionHash(q);
    } catch {
      // Fallback if schema differs slightly in draft stage
      contentHash = "";
    }

    const existingRow = existingMap.get(q.id);
    let decision: ReviewDecision = "";
    let notes = "";

    if (existingRow) {
      const dec = existingRow.decision?.toLowerCase();
      if (dec === "approve") decision = "approve";
      else if (dec === "reject") decision = "reject";
      else if (dec === "revise") decision = "revise";
      notes = existingRow.notes ?? "";
    }

    const checks = {
      correctness: decision === "approve",
      originality: decision === "approve",
      ageAppropriateness: decision === "approve",
    };

    // Automated solver check heuristics:
    // Pure mathematical questions, number entries, or explicitly flagged verifiable items
    const isMath = q.metadata.subject === "numeracy" || q.metadata.subject === "amc_mathematics";
    const isNumberEntry = q.type === "number_entry" || q.answerKey.kind === "number";
    const isMachineVerifiable = isMath || isNumberEntry;

    const verificationNotes: string[] = [];
    if (isMachineVerifiable) {
      verificationNotes.push("Machine-verifiable calculation.");
    } else {
      verificationNotes.push("Requires human semantic verification (reading passage interpretation).");
    }

    const externalReview = reviewsByQuestionId.get(q.id);

    return {
      id: q.id,
      index,
      contentHash,
      revision: options?.revision ?? 1,
      sourceManifestHash: options?.sourceManifestHash ?? null,
      question: q,
      decision,
      notes,
      checks,
      isMachineVerifiable,
      verificationNotes,
      externalReview,
    };
  });
}
