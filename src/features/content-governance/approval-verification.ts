import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import type { Question } from "@/schemas/question.schema";
import {
  approvalFingerprint,
  canonicalQuestionHash,
  humanPublicationApprovalSchema,
  validateHumanApproval,
  validatePublicationSource,
  type HumanPublicationApproval,
} from "./publication-integrity";

export type ApprovalDecision = "approve" | "reject" | "revise" | "";

export interface ApprovalInputRow {
  readonly questionId: string;
  readonly contentHash?: string;
  readonly revision?: number;
  readonly sourceManifestHash?: string | null;
  readonly correctness?: string | boolean;
  readonly originality?: string | boolean;
  readonly ageAppropriateness?: string | boolean;
  readonly decision?: string;
  readonly notes?: string;
}

export interface ValidatedApprovalTarget {
  readonly question: Question;
  readonly revision: number;
  readonly contentHash: string;
  readonly sourceManifestHash: string | null;
}

export type ApprovalRowClassification =
  | { readonly kind: "already-recorded"; readonly questionId: string; readonly approval: HumanPublicationApproval }
  | { readonly kind: "new-approval"; readonly questionId: string; readonly approval: HumanPublicationApproval }
  | { readonly kind: "reject"; readonly questionId: string; readonly notes?: string }
  | { readonly kind: "revise"; readonly questionId: string; readonly notes?: string }
  | { readonly kind: "unreviewed"; readonly questionId: string };

export interface BatchValidationResult {
  readonly ok: boolean;
  readonly fatalErrors: readonly string[];
  readonly rows: readonly ApprovalRowClassification[];
  readonly newApprovals: readonly HumanPublicationApproval[];
  readonly alreadyRecorded: readonly HumanPublicationApproval[];
  readonly rejectedCount: number;
  readonly revisedCount: number;
  readonly unreviewedCount: number;
}

let cachedSourceRecords: unknown[] | undefined;
const factoryIds = new Set(factoryPublishedQuestions.map((question) => question.id));

export async function getSourceManifestForQuestion(
  question: Question,
  manifestsDirectory = "content/question-factory/published-manifests",
): Promise<{ revision: number; sourceManifestHash: string | null }> {
  if (!cachedSourceRecords) {
    cachedSourceRecords = [];
    try {
      const files = (await readdir(manifestsDirectory)).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const raw = JSON.parse(await readFile(path.join(manifestsDirectory, file), "utf8"));
        cachedSourceRecords.push(raw);
      }
    } catch (error) {
      cachedSourceRecords = undefined;
      throw new Error(`Could not read publication manifests: ${String(error)}`);
    }
  }

  const matches = cachedSourceRecords.filter(
    (raw) => raw && typeof raw === "object" && (raw as Record<string, unknown>).questionId === question.id,
  );
  if (matches.length === 0) {
    if (factoryIds.has(question.id)) throw new Error(`Missing factory source manifest for ${question.id}.`);
    return { revision: 1, sourceManifestHash: null };
  }
  if (!factoryIds.has(question.id)) throw new Error(`Unexpected source manifest for curated item ${question.id}.`);
  if (matches.length > 1) {
    throw new Error(`Expected at most one source manifest for question ${question.id}, found ${matches.length}.`);
  }

  const source = validatePublicationSource(matches[0], question);
  if (!source.ok) {
    throw new Error(`${question.id}: ${source.reason}`);
  }
  return { revision: source.revision, sourceManifestHash: source.sourceManifestHash };
}

export function resetSourceManifestCache(): void {
  cachedSourceRecords = undefined;
}

export async function loadExistingApprovalsMap(
  approvalsDirectory = "content/publication-approvals",
): Promise<Map<string, HumanPublicationApproval>> {
  const map = new Map<string, HumanPublicationApproval>();
  try {
    const files = (await readdir(approvalsDirectory)).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const raw = JSON.parse(await readFile(path.join(approvalsDirectory, file), "utf8"));
        const parsed = humanPublicationApprovalSchema.safeParse(raw);
        if (!parsed.success) throw new Error(`Invalid approval evidence in ${file}.`);
        if (map.has(parsed.data.questionId)) throw new Error(`Duplicate approval evidence for ${parsed.data.questionId}.`);
        map.set(parsed.data.questionId, parsed.data);
      } catch (error) {
        throw new Error(`Could not load approval evidence ${file}: ${String(error)}`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return map;
}

function parseCheck(val: string | boolean | undefined): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    return lower === "yes" || lower === "true" || lower === "1";
  }
  return false;
}

function normalizeDecision(decision: string | undefined): ApprovalDecision {
  if (!decision) return "";
  const lower = decision.trim().toLowerCase();
  if (lower === "approve") return "approve";
  if (lower === "reject") return "reject";
  if (lower === "revise") return "revise";
  return "";
}

/** The single review-evidence check shared by migration and new publication. */
export function validateReviewedApprovalRow(
  row: ApprovalInputRow,
  reviewer: string,
  target: { questionId: string; contentHash: string; revision: number; sourceManifestHash?: string | null },
): readonly string[] {
  const errors: string[] = [];
  if (reviewer.trim().split(/\s+/).length < 2) errors.push("Reviewer full name must be explicitly supplied.");
  if (normalizeDecision(row.decision) !== "approve") errors.push("Approval decision must be 'approve'.");
  for (const key of ["correctness", "originality", "ageAppropriateness"] as const) {
    if (!parseCheck(row[key])) errors.push(`Approved row '${target.questionId}' must have all three checks marked yes (${key} missing).`);
  }
  if (row.questionId !== target.questionId) errors.push(`Question ID mismatch for '${target.questionId}'.`);
  if (row.contentHash !== target.contentHash) errors.push(`Stale or mismatched content hash for '${target.questionId}'.`);
  if (row.revision !== target.revision) errors.push(`Stale or missing revision for '${target.questionId}'.`);
  if (target.sourceManifestHash !== undefined && row.sourceManifestHash !== target.sourceManifestHash) {
    errors.push(`Stale or missing source manifest hash for '${target.questionId}'.`);
  }
  return errors;
}

/**
 * Validates an entire batch of approval rows atomically before any write.
 * Implements the unified approval verification requirements from Sections 5, 6, 7, 11.
 */
export async function validateApprovalBatch(options: {
  readonly rows: readonly ApprovalInputRow[];
  readonly reviewerFullName: string;
  readonly questionBank: readonly Question[];
  readonly approvedAt?: string;
  readonly existingApprovals?: ReadonlyMap<string, HumanPublicationApproval>;
}): Promise<BatchValidationResult> {
  const fatalErrors: string[] = [];
  const reviewer = options.reviewerFullName?.trim();

  if (!reviewer || reviewer.split(/\s+/).length < 2) {
    fatalErrors.push("Reviewer full name must be explicitly supplied.");
  }

  const questionMap = new Map<string, Question>(options.questionBank.map((q) => [q.id, q]));
  const existingMap = options.existingApprovals ?? (await loadExistingApprovalsMap());
  const now = options.approvedAt ?? new Date().toISOString();

  // Rule: Check for duplicate approval targets WITHIN THE SAME INPUT
  const seenTargets = new Set<string>();
  for (const row of options.rows) {
    const qId = row.questionId?.trim();
    if (!qId) {
      fatalErrors.push("Encountered row with missing questionId.");
      continue;
    }
    const targetKey = `${qId}:${row.revision ?? "current"}`;
    if (seenTargets.has(targetKey)) {
      fatalErrors.push(`Duplicate approval target for '${qId}' within the same input.`);
    }
    seenTargets.add(targetKey);
  }

  if (fatalErrors.length > 0) {
    return {
      ok: false,
      fatalErrors,
      rows: [],
      newApprovals: [],
      alreadyRecorded: [],
      rejectedCount: 0,
      revisedCount: 0,
      unreviewedCount: 0,
    };
  }

  const classifiedRows: ApprovalRowClassification[] = [];
  const newApprovals: HumanPublicationApproval[] = [];
  const alreadyRecorded: HumanPublicationApproval[] = [];
  let rejectedCount = 0;
  let revisedCount = 0;
  let unreviewedCount = 0;

  for (const row of options.rows) {
    const qId = row.questionId.trim();
    const question = questionMap.get(qId);
    if (!question) {
      fatalErrors.push(`Row references unknown or unauthored question: '${qId}'.`);
      continue;
    }

    const decision = normalizeDecision(row.decision);
    if (row.decision?.trim() && decision === "") {
      fatalErrors.push(`Invalid decision for '${qId}': use approve, reject or revise.`);
      continue;
    }
    if (decision === "") {
      unreviewedCount++;
      classifiedRows.push({ kind: "unreviewed", questionId: qId });
      continue;
    }

    if (decision === "reject") {
      rejectedCount++;
      classifiedRows.push({ kind: "reject", questionId: qId, notes: row.notes });
      continue;
    }

    if (decision === "revise") {
      revisedCount++;
      classifiedRows.push({ kind: "revise", questionId: qId, notes: row.notes });
      continue;
    }

    // decision === "approve": all fields must bind the review to this exact revision.

    let source: { revision: number; sourceManifestHash: string | null };
    try {
      source = await getSourceManifestForQuestion(question);
    } catch (err) {
      fatalErrors.push(`Failed to verify source for '${qId}': ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const canonicalHash = canonicalQuestionHash(question);
    const reviewErrors = validateReviewedApprovalRow(row, reviewer, {
      questionId: qId, contentHash: canonicalHash, revision: source.revision,
      sourceManifestHash: source.sourceManifestHash,
    });
    if (reviewErrors.length) { fatalErrors.push(...reviewErrors); continue; }

    // Build proposed approval facts
    const facts = {
      kind: "human_publication_approval" as const,
      schemaVersion: 1 as const,
      questionId: question.id,
      revision: source.revision,
      approvedBy: reviewer,
      approvedAt: now,
      contentHash: canonicalHash,
      sourceManifestHash: source.sourceManifestHash,
      checks: {
        correctness: true as const,
        originality: true as const,
        ageAppropriateness: true as const,
      },
      question,
    };
    const fingerprint = approvalFingerprint(facts);
    const candidateApproval: HumanPublicationApproval = { ...facts, fingerprint };

    // Validate using validateHumanApproval
    const validation = validateHumanApproval(
      candidateApproval,
      question,
      source.revision,
      source.sourceManifestHash,
    );
    if (!validation.ok) {
      fatalErrors.push(`Approval validation failed for '${qId}': ${validation.reason}`);
      continue;
    }

    // Check existing persistent approval
    const existing = existingMap.get(qId);
    if (existing) {
      const { fingerprint: existingFp, ...existingFacts } = existing;
      const computedFp = approvalFingerprint(existingFacts);
      if (existingFp !== computedFp) {
        fatalErrors.push(
          `Conflicting existing approval for '${qId}': existing approval has corrupted or conflicting fingerprint.`,
        );
        continue;
      }

      const matchesTarget =
        existing.questionId === question.id &&
        existing.contentHash === canonicalHash &&
        existing.revision === source.revision &&
        existing.sourceManifestHash === source.sourceManifestHash;

      const matchesRow = row.contentHash === existing.contentHash &&
        row.revision === existing.revision && row.sourceManifestHash === existing.sourceManifestHash;

      if (matchesTarget && matchesRow) {
        // Safe no-op
        alreadyRecorded.push(existing);
        classifiedRows.push({ kind: "already-recorded", questionId: qId, approval: existing });
        continue;
      }

      // Existing approval differs in immutable evidence -> fatal conflict!
      fatalErrors.push(
        `Conflicting existing approval for '${qId}': existing approval has different content hash, revision, or manifest hash.`,
      );
      continue;
    }

    newApprovals.push(candidateApproval);
    classifiedRows.push({ kind: "new-approval", questionId: qId, approval: candidateApproval });
  }

  if (fatalErrors.length > 0) {
    return {
      ok: false,
      fatalErrors,
      rows: [],
      newApprovals: [],
      alreadyRecorded: [],
      rejectedCount: 0,
      revisedCount: 0,
      unreviewedCount: 0,
    };
  }

  return {
    ok: true,
    fatalErrors: [],
    rows: classifiedRows,
    newApprovals,
    alreadyRecorded,
    rejectedCount,
    revisedCount,
    unreviewedCount,
  };
}

/**
 * Writes new approvals atomically to disk.
 */
export async function recordApprovalsToDisk(
  approvals: readonly HumanPublicationApproval[],
  directory = "content/publication-approvals",
): Promise<number> {
  const { access, link, mkdir, mkdtemp, rmdir, unlink, writeFile } = await import("node:fs/promises");
  await mkdir(directory, { recursive: true });
  const paths = approvals.map((approval) => path.join(directory, `${approval.questionId}.json`));
  if (new Set(paths).size !== paths.length) throw new Error("Duplicate approval target in write batch.");
  for (const filePath of paths) {
    try { await access(filePath); throw new Error(`Approval file already exists: ${filePath}`); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  const staging = await mkdtemp(path.join(directory, ".approval-batch-"));
  const stagedPaths = approvals.map((approval) => path.join(staging, `${approval.questionId}.json`));
  const linked: string[] = [];
  try {
    for (const [index, approval] of approvals.entries()) {
      await writeFile(stagedPaths[index]!, JSON.stringify(approval, null, 2) + "\n", { flag: "wx" });
    }
    for (const [index, filePath] of paths.entries()) {
      await link(stagedPaths[index]!, filePath);
      linked.push(filePath);
    }
  } catch (error) {
    await Promise.all(linked.map((filePath) => unlink(filePath)));
    throw error;
  } finally {
    await Promise.all(stagedPaths.map(async (filePath) => {
      try { await unlink(filePath); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }));
    await rmdir(staging);
  }
  return approvals.length;
}

/**
 * Validates a single approval packet / row against the unified verification module.
 */
export async function validateSingleApproval(options: {
  readonly row: ApprovalInputRow;
  readonly reviewerFullName: string;
  readonly approvedAt?: string;
  readonly existingApprovals?: ReadonlyMap<string, HumanPublicationApproval>;
  readonly questionBank: readonly Question[];
}): Promise<
  | { readonly ok: true; readonly approval: HumanPublicationApproval; readonly alreadyRecorded: boolean }
  | { readonly ok: false; readonly error: string }
> {
  const result = await validateApprovalBatch({
    rows: [options.row],
    reviewerFullName: options.reviewerFullName,
    approvedAt: options.approvedAt,
    existingApprovals: options.existingApprovals,
    questionBank: options.questionBank,
  });

  if (!result.ok) {
    return { ok: false, error: result.fatalErrors.join("; ") };
  }

  if (result.alreadyRecorded.length === 1) {
    return { ok: true, approval: result.alreadyRecorded[0], alreadyRecorded: true };
  }

  if (result.newApprovals.length === 1) {
    return { ok: true, approval: result.newApprovals[0], alreadyRecorded: false };
  }

  return { ok: false, error: "No approval produced from input row." };
}

/**
 * Parses a standard review / approval CSV sheet.
 */
export function parseApprovalCsv(csvContent: string): ApprovalInputRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = parseCsvRow(headerLine).map((h) => h.trim());

  const rows: ApprovalInputRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = values[j]?.trim() ?? "";
    }

    const questionId = rowObj.questionId || rowObj.id;
    if (!questionId) continue;

    const revisionStr = rowObj.revision;
    const revision = revisionStr && !isNaN(Number(revisionStr)) ? Number(revisionStr) : undefined;
    const sourceManifestHash =
      rowObj.sourceManifestHash === "" || rowObj.sourceManifestHash === "null"
        ? null
        : rowObj.sourceManifestHash || undefined;

    rows.push({
      questionId,
      contentHash: rowObj.contentHash || undefined,
      revision,
      sourceManifestHash,
      correctness: rowObj.correctness,
      originality: rowObj.originality,
      ageAppropriateness: rowObj.ageAppropriateness,
      decision: rowObj.decision,
      notes: rowObj.notes,
    });
  }

  return rows;
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
