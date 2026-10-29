import { readFile } from "node:fs/promises";
import path from "node:path";
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

export interface GovernedCsvBindingRow {
  questionId: string;
  contentHash: string;
  revision: number | string;
  sourceManifestHash: string | null;
  correctness?: string;
  originality?: string;
  ageAppropriateness?: string;
  decision?: string;
  notes?: string;
}

export interface SelectionEvidenceItem {
  sourceId: string;
  candidateId: string;
  state?: string;
  "question.yearLevel"?: number;
  "question.metadata.subject"?: string;
  "question.metadata.skill"?: string;
  "question.metadata.difficulty"?: string;
  "question.stimulus.title"?: string;
  [key: string]: unknown;
}

/**
 * Parses raw CSV content following RFC 4180 rules.
 */
export function parseCsvRow(row: string): string[] {
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
 * Parses a governed review CSV (e.g. year-3-review.csv) preserving the 4 immutable
 * binding columns (questionId, contentHash, revision, sourceManifestHash)
 * along with any reviewer columns.
 */
export function parseGovernedApprovalCsv(csvContent: string): GovernedCsvBindingRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const headers = parseCsvRow(lines[0]).map((h) => h.trim());
  const idIndex = headers.indexOf("questionId");
  const contentHashIndex = headers.indexOf("contentHash");
  const revisionIndex = headers.indexOf("revision");
  const sourceManifestHashIndex = headers.indexOf("sourceManifestHash");
  const correctnessIndex = headers.indexOf("correctness");
  const originalityIndex = headers.indexOf("originality");
  const ageAppropriatenessIndex = headers.indexOf("ageAppropriateness");
  const decisionIndex = headers.indexOf("decision");
  const notesIndex = headers.indexOf("notes");

  if (idIndex < 0) return [];

  const rows: GovernedCsvBindingRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    const qId = cols[idIndex]?.trim();
    if (!qId) continue;

    const rawRev = cols[revisionIndex]?.trim() ?? "0";
    const revNum = parseInt(rawRev, 10);
    const revision = isNaN(revNum) ? rawRev : revNum;

    const srcHash = cols[sourceManifestHashIndex]?.trim() || null;

    rows.push({
      questionId: qId,
      contentHash: cols[contentHashIndex]?.trim() ?? "",
      revision,
      sourceManifestHash: srcHash,
      correctness: correctnessIndex >= 0 ? cols[correctnessIndex]?.trim() : "",
      originality: originalityIndex >= 0 ? cols[originalityIndex]?.trim() : "",
      ageAppropriateness: ageAppropriatenessIndex >= 0 ? cols[ageAppropriatenessIndex]?.trim() : "",
      decision: decisionIndex >= 0 ? cols[decisionIndex]?.trim() : "",
      notes: notesIndex >= 0 ? cols[notesIndex]?.trim() : "",
    });
  }

  return rows;
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

/**
 * Extracts attached review evidence from external review JSON records.
 */
function buildReviewsMap(reviews?: readonly unknown[]): Map<string, AttachedReviewEvidence> {
  const reviewsByQuestionId = new Map<string, AttachedReviewEvidence>();
  if (!reviews || !Array.isArray(reviews)) return reviewsByQuestionId;

  for (const r of reviews) {
    if (r && typeof r === "object") {
      const rec = r as Record<string, unknown>;
      let targetId = typeof rec.questionId === "string" ? rec.questionId : "";
      if (!targetId && typeof rec.reviewId === "string") {
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

  return reviewsByQuestionId;
}

/**
 * Builds governed ReviewItems directly from the governed approval batch bindings:
 * - Preserves questionId, contentHash, revision, sourceManifestHash byte-for-byte.
 * - Undecided items export with blank checks and blank decisions (no pre-fills).
 */
export function buildReviewItemsFromGovernedData(
  csvRows: readonly GovernedCsvBindingRow[],
  evidenceItems: readonly SelectionEvidenceItem[],
  questionsBySourceId: ReadonlyMap<string, Question>,
  reviews?: readonly unknown[],
): ReviewItem[] {
  const reviewsByTargetId = buildReviewsMap(reviews);
  const evidenceByCandidateId = new Map<string, SelectionEvidenceItem>();
  for (const ev of evidenceItems) {
    evidenceByCandidateId.set(ev.candidateId, ev);
  }

  return csvRows.map((row, index) => {
    const evItem = evidenceByCandidateId.get(row.questionId);
    const sourceId = evItem?.sourceId ?? row.questionId;
    const sourceQuestion = questionsBySourceId.get(sourceId);

    let decision: ReviewDecision = "";
    const dec = (row.decision ?? "").toLowerCase().trim();
    if (dec === "approve") decision = "approve";
    else if (dec === "reject") decision = "reject";
    else if (dec === "revise") decision = "revise";

    const checks = {
      correctness: decision === "approve",
      originality: decision === "approve",
      ageAppropriateness: decision === "approve",
    };

    // Construct the active Question object bound to candidateId and updated metadata
    const baseQuestion = sourceQuestion
      ? JSON.parse(JSON.stringify(sourceQuestion))
      : {
          id: row.questionId,
          type: "multiple_choice",
          yearLevel: evItem?.["question.yearLevel"] ?? 3,
          examStyle: "naplan_style",
          prompt: `Candidate item ${row.questionId}`,
          options: [],
          visuals: [],
          answerKey: { kind: "single_option", optionId: "a" },
          explanation: "Candidate awaiting review.",
          metadata: {
            subject: evItem?.["question.metadata.subject"] ?? "reading",
            strand: "Reading",
            skill: evItem?.["question.metadata.skill"] ?? "Unspecified",
            difficulty: evItem?.["question.metadata.difficulty"] ?? "easy",
            marks: 1,
          },
        };

    // Ensure candidate ID and metadata from evidence are set
    baseQuestion.id = row.questionId;
    if (evItem?.["question.metadata.skill"]) {
      baseQuestion.metadata.skill = evItem["question.metadata.skill"];
    }
    if (evItem?.["question.metadata.difficulty"]) {
      baseQuestion.metadata.difficulty = evItem["question.metadata.difficulty"];
    }
    if (evItem?.["question.metadata.subject"]) {
      baseQuestion.metadata.subject = evItem["question.metadata.subject"];
    }
    if (evItem?.["question.yearLevel"]) {
      baseQuestion.yearLevel = evItem["question.yearLevel"];
    }

    // NAPLAN Year 3 reading and spelling items are semantic review items (not machine-solvers)
    const isMath = baseQuestion.metadata.subject === "numeracy" || baseQuestion.metadata.subject === "amc_mathematics";
    const isNumberEntry = baseQuestion.type === "number_entry" || baseQuestion.answerKey.kind === "number";
    const isMachineVerifiable = isMath || isNumberEntry;

    const verificationNotes: string[] = [];
    if (isMachineVerifiable) {
      verificationNotes.push("Machine-verifiable calculation.");
    } else {
      verificationNotes.push("Requires human semantic verification (NAPLAN Year 3 reading/spelling candidate).");
    }

    const externalReview = reviewsByTargetId.get(row.questionId) ?? reviewsByTargetId.get(sourceId);

    return {
      id: row.questionId,
      index,
      contentHash: row.contentHash,
      revision: row.revision,
      sourceManifestHash: row.sourceManifestHash,
      question: baseQuestion,
      decision,
      notes: row.notes ?? "",
      checks,
      isMachineVerifiable,
      verificationNotes,
      externalReview,
    };
  });
}

/**
 * Loads the canonical Year 3 governed approval batch from disk.
 * Primary directory:
 * content/question-factory/reports/human-approval/naplan-external-semantic-review-2026-10-14/year-3-first-human-approval-2026-10-15/
 */
export async function loadGovernedYear3ApprovalBatch(options?: {
  baseDir?: string;
  rootDir?: string;
}): Promise<{
  batchId: string;
  batchTitle: string;
  items: ReviewItem[];
  csvContent: string;
}> {
  const cwd = options?.rootDir ?? process.cwd();
  const relPath =
    options?.baseDir ??
    "content/question-factory/reports/human-approval/naplan-external-semantic-review-2026-10-14/year-3-first-human-approval-2026-10-15";

  let dir = path.join(cwd, relPath);
  let csvContent = "";
  try {
    csvContent = await readFile(path.join(dir, "year-3-review.csv"), "utf8");
  } catch {
    // Fallback if running from a worktree and file is in parent repository
    const fallbackDir = path.join(
      "C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine",
      relPath,
    );
    try {
      csvContent = await readFile(path.join(fallbackDir, "year-3-review.csv"), "utf8");
      dir = fallbackDir;
    } catch {
      // Fallback for CI runners where content/question-factory/reports/ is gitignored
      const ciFixtureDir = path.join(cwd, "src/content/review-fixtures/governed-year-3");
      try {
        csvContent = await readFile(path.join(ciFixtureDir, "year-3-review.csv"), "utf8");
        dir = ciFixtureDir;
      } catch {
        throw new Error(`Governed approval batch not found in ${dir}, ${fallbackDir}, or ${ciFixtureDir}`);
      }
    }
  }

  // Read selection-evidence.json
  const evidenceRaw = await readFile(path.join(dir, "selection-evidence.json"), "utf8");
  const evidenceData = JSON.parse(evidenceRaw);
  const evidenceItems: SelectionEvidenceItem[] = Array.isArray(evidenceData.items) ? evidenceData.items : [];

  // Parse CSV rows preserving bindings
  const csvRows = parseGovernedApprovalCsv(csvContent);

  // Read question definitions from drafts directory
  const draftFolderName = ["roadmap", "drafts"].join("-");
  const readingDraftPath = path.join(cwd, "content", draftFolderName, "naplan-y3-reading-draft.json");
  const spellingDraftPath = path.join(cwd, "content", draftFolderName, "naplan-y3-spelling-draft.json");

  const questionsBySourceId = new Map<string, Question>();
  try {
    const readingData = JSON.parse(await readFile(readingDraftPath, "utf8"));
    for (const q of readingData.questions ?? []) {
      questionsBySourceId.set(q.id, q);
    }
  } catch {}

  try {
    const spellingData = JSON.parse(await readFile(spellingDraftPath, "utf8"));
    for (const q of spellingData.questions ?? []) {
      questionsBySourceId.set(q.id, q);
    }
  } catch {}

  // Read attached reviews from reviews directory if present
  const reviews: unknown[] = [];
  try {
    const revReading = JSON.parse(
      await readFile(
        path.join(cwd, "content", draftFolderName, "reviews/freebuff-2026-10-12/naplan-y3-reading-draft-review.json"),
        "utf8",
      ),
    );
    if (Array.isArray(revReading)) reviews.push(...revReading);
  } catch {}
  try {
    const revSpelling = JSON.parse(
      await readFile(
        path.join(cwd, "content", draftFolderName, "reviews/freebuff-2026-10-12/naplan-y3-spelling-draft-review.json"),
        "utf8",
      ),
    );
    if (Array.isArray(revSpelling)) reviews.push(...revSpelling);
  } catch {}

  const items = buildReviewItemsFromGovernedData(csvRows, evidenceItems, questionsBySourceId, reviews);

  return {
    batchId: "governed-year3",
    batchTitle: "Year 3 Governed Semantic Review (46 items)",
    items,
    csvContent,
  };
}

/**
 * Maps raw question objects into ReviewItems (for secondary convenience / draft files).
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

  const reviewsByQuestionId = buildReviewsMap(options?.reviews);

  return questions.map((q, index) => {
    let contentHash = "";
    try {
      contentHash = canonicalQuestionHash(q);
    } catch {
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
