/**
 * Read-only governed bridge from DEV `public.admin_draft_review_decisions` to
 * MindMosaic's existing Git publication & writing-prompt approval workflows.
 *
 * Security & governance invariants:
 * - Strictly refuses production Supabase project ref (`uermhsptduikehuyceiz`).
 * - Never writes to Supabase, never modifies draft files, never auto-approves
 *   and never auto-publishes content.
 * - Independently re-computes D1/D2/D3 hashes and `evidence_fingerprint` from
 *   the checked-in draft source files; any stale or tampered row fails closed.
 * - Enforces strict separation between everyday `practice` items and
 *   designated `mock` reserve items.
 * - Routes Written Expression prompts exclusively to MindMosaic's existing
 *   `human_writing_prompt_approval` CSV format (no new writing taxonomy).
 *
 * Usage:
 *   npx tsx scripts/export-admin-review-approvals.mts \
 *     --bank vihaan-scholarship-500 \
 *     --pool practice|mock \
 *     [--batch vihaan-expansion-01] \
 *     --out tmp/review-export
 */
import "./lib/allow-server-only.mts";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

import {
  reviewBankIdSchema,
  type ReviewBankId,
  type ReviewChecks,
  type ReviewDecisionKind,
} from "../src/features/admin-review/contracts";
import {
  classifyReviewPool,
  getKnownDefectiveRevision,
  isDesignatedMockCandidate,
  validateHumanReviewerName,
} from "../src/features/admin-review/pool-classification";
import { scholarshipWritingItemToTask } from "../src/features/admin-review/writing-adapter";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { questionSchema } from "../src/schemas/question.schema";
import {
  computeReviewEvidenceFingerprint,
  hashDraftRevision,
} from "../src/server/admin-review";

const PROD_SUPABASE_REF = "uermhsptduikehuyceiz";
const REVIEW_SHEET_HEADER =
  "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function assertNonProductionDatabaseUrl(dbUrl: string): void {
  if (dbUrl.toLowerCase().includes(PROD_SUPABASE_REF)) {
    throw new Error(
      `Refusing to connect to production Supabase ref (${PROD_SUPABASE_REF}). Only local or DEV databases are permitted.`,
    );
  }
}

export interface SourceItemTruth {
  readonly questionId: string;
  readonly bankId: ReviewBankId;
  readonly batchId: string;
  readonly itemKind: "question" | "writing_prompt";
  readonly pool: string;
  readonly designatedForMock: boolean;
  readonly mockPaper: "mock-a" | "mock-b" | null;
  readonly revisionNumber: number;
  readonly contentHash: string;
  readonly candidateHash: string | null;
  readonly publishedContentHash: string;
}

export async function loadSourceTruthMap(
  bankId: ReviewBankId,
): Promise<Map<string, SourceItemTruth>> {
  const map = new Map<string, SourceItemTruth>();
  if (bankId === "scholarship-y6-core") {
    const files = [
      ["scholarship-y6-vr", "scholarship-y6-verbal-reasoning-draft.json"],
      ["scholarship-y6-nr", "scholarship-y6-numerical-reasoning-draft.json"],
      ["scholarship-y6-rc", "scholarship-y6-reading-draft.json"],
      ["scholarship-y6-maths", "scholarship-y6-mathematics-draft.json"],
    ] as const;
    for (const [batchId, file] of files) {
      const packet = JSON.parse(
        await readFile(path.join(process.cwd(), "content/scholarship-drafts", file), "utf8"),
      ) as { questions: Array<Record<string, unknown>> };
      for (const raw of packet.questions) {
        const id = String(raw.id);
        const candidate = candidateQuestionSchema.parse(raw);
        const published = questionSchema.parse({ ...raw, status: "published" });
        map.set(id, {
          questionId: id,
          bankId,
          batchId,
          itemKind: "question",
          pool: "practice",
          designatedForMock: false,
          mockPaper: null,
          revisionNumber: 0,
          contentHash: hashDraftRevision(raw),
          candidateHash: hashJson(candidate),
          publishedContentHash: canonicalQuestionHash(published),
        });
      }
    }
    return map;
  }

  const baseDir = path.join(process.cwd(), "content/vihaan-scholarship");
  const manifest = JSON.parse(
    await readFile(path.join(baseDir, "expansion-500/bank.draft.json"), "utf8"),
  ) as { batches: Array<{ batchId: string; file: string }> };

  const files = [
    path.join(baseDir, "pilot-01/draft.json"),
    ...manifest.batches.map((b) => path.join(baseDir, "expansion-500", b.file)),
  ];

  for (const filePath of files) {
    const batch = JSON.parse(await readFile(filePath, "utf8")) as {
      batchId: string;
      version: number;
      items: Array<{
        question: Record<string, unknown>;
        reservedForMock?: boolean;
      }>;
    };
    for (const wrapper of batch.items) {
      const raw = wrapper.question;
      const id = String(raw.id);
      const metadata = raw.metadata as {
        subject: string;
        topic: string;
        estimatedTimeSeconds: number;
        tags?: string[];
      };
      const isWriting = raw.type === "essay" && metadata.subject === "writing";
      const poolInfo = classifyReviewPool(id, {
        explicitReservedForMock:
          wrapper.reservedForMock ?? isDesignatedMockCandidate(id),
        publicRepoExposed: true,
      });

      if (isWriting) {
        const adapted = scholarshipWritingItemToTask({
          id,
          yearLevel: Number(raw.yearLevel),
          prompt: String(raw.prompt),
          metadata: {
            topic: metadata.topic,
            estimatedTimeSeconds: metadata.estimatedTimeSeconds,
            tags: metadata.tags ?? [],
          },
        });
        map.set(id, {
          questionId: id,
          bankId,
          batchId: batch.batchId,
          itemKind: "writing_prompt",
          pool: poolInfo.pool,
          designatedForMock: poolInfo.designatedForMock,
          mockPaper: poolInfo.mockPaper,
          revisionNumber: batch.version,
          contentHash: hashDraftRevision(raw),
          candidateHash: null,
          publishedContentHash: adapted.contentHash,
        });
      } else {
        const candidate = candidateQuestionSchema.parse(raw);
        const published = questionSchema.parse({ ...raw, status: "published" });
        map.set(id, {
          questionId: id,
          bankId,
          batchId: batch.batchId,
          itemKind: "question",
          pool: poolInfo.pool,
          designatedForMock: poolInfo.designatedForMock,
          mockPaper: poolInfo.mockPaper,
          revisionNumber: batch.version,
          contentHash: hashDraftRevision(raw),
          candidateHash: hashJson(candidate),
          publishedContentHash: canonicalQuestionHash(published),
        });
      }
    }
  }
  return map;
}

export interface DbDecisionRow {
  readonly bank_id: ReviewBankId;
  readonly batch_id: string;
  readonly question_id: string;
  readonly item_kind: "question" | "writing_prompt";
  readonly pool: string;
  readonly source_revision: string;
  readonly revision_number: number;
  readonly content_hash: string;
  readonly candidate_hash: string | null;
  readonly published_content_hash: string;
  readonly decision: ReviewDecisionKind;
  readonly checks: ReviewChecks;
  readonly blind_solved: boolean;
  readonly notes: string;
  readonly reviewer_id: string;
  readonly reviewer_name: string;
  readonly reviewer_email: string;
  readonly evidence_fingerprint: string;
  readonly decided_at: string;
}

export function verifyAndPartitionExportRows(
  rows: readonly DbDecisionRow[],
  truthMap: ReadonlyMap<string, SourceItemTruth>,
  poolFilter: "practice" | "mock",
): {
  readonly questionCsv: string;
  readonly writingCsv: string;
  readonly questionCount: number;
  readonly writingCount: number;
  readonly rejectedReasons: string[];
  readonly skippedOtherPool: number;
} {
  const questionRows = [REVIEW_SHEET_HEADER];
  const writingRows = [REVIEW_SHEET_HEADER];
  const rejectedReasons: string[] = [];
  let questionCount = 0;
  let writingCount = 0;
  let skippedOtherPool = 0;
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.question_id)) continue;
    seen.add(row.question_id);

    if (row.decision !== "approve") continue;

    const truth = truthMap.get(row.question_id);
    if (!truth) {
      rejectedReasons.push(`${row.question_id}: unknown question in source bank.`);
      continue;
    }

    const isMockSlot =
      truth.pool === "unseen_mock" ||
      truth.designatedForMock ||
      truth.mockPaper !== null;
    if (poolFilter === "practice" && isMockSlot) {
      skippedOtherPool += 1;
      continue;
    }
    if (poolFilter === "mock" && !isMockSlot) {
      skippedOtherPool += 1;
      continue;
    }

    const knownDefect = getKnownDefectiveRevision(
      row.question_id,
      truth.contentHash,
    );
    if (knownDefect) {
      rejectedReasons.push(
        `${row.question_id}: blocked by known Defect ${knownDefect.defectId} at current revision hash — correct and re-review before export.`,
      );
      continue;
    }

    const nameCheck = validateHumanReviewerName(row.reviewer_name);
    if (!nameCheck.ok) {
      rejectedReasons.push(`${row.question_id}: invalid reviewer name '${row.reviewer_name}'.`);
      continue;
    }

    if (
      row.content_hash !== truth.contentHash ||
      row.published_content_hash !== truth.publishedContentHash ||
      (truth.candidateHash !== null && row.candidate_hash !== truth.candidateHash)
    ) {
      rejectedReasons.push(
        `${row.question_id}: stale or mismatched content hash against current Git draft.`,
      );
      continue;
    }

    const expectedFingerprint = computeReviewEvidenceFingerprint({
      bankId: row.bank_id,
      batchId: row.batch_id,
      questionId: row.question_id,
      itemKind: row.item_kind,
      pool: row.pool,
      sourceRevision: row.source_revision,
      revisionNumber: row.revision_number,
      contentHash: row.content_hash,
      candidateHash: row.candidate_hash,
      publishedContentHash: row.published_content_hash,
      decision: row.decision,
      checks: row.checks,
      blindSolved: row.blind_solved,
      notes: row.notes,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_name,
      reviewerEmail: row.reviewer_email,
    });
    if (row.evidence_fingerprint !== expectedFingerprint) {
      rejectedReasons.push(`${row.question_id}: evidence_fingerprint mismatch (tampered or corrupt record).`);
      continue;
    }

    const csvLine = [
      escapeCsvCell(row.question_id),
      escapeCsvCell(truth.publishedContentHash),
      escapeCsvCell(truth.revisionNumber),
      "",
      row.checks.correctness ? "yes" : "",
      row.checks.originality ? "yes" : "",
      row.checks.ageAppropriateness ? "yes" : "",
      "approve",
      escapeCsvCell(
        `[reviewer:${row.reviewer_name}|${row.reviewer_email}|${row.reviewer_id}|pool:${poolFilter}] ${row.notes}`.trim(),
      ),
    ].join(",");

    if (truth.itemKind === "writing_prompt") {
      writingRows.push(csvLine);
      writingCount += 1;
    } else {
      questionRows.push(csvLine);
      questionCount += 1;
    }
  }

  return {
    questionCsv: `${questionRows.join("\n")}\n`,
    writingCsv: `${writingRows.join("\n")}\n`,
    questionCount,
    writingCount,
    rejectedReasons,
    skippedOtherPool,
  };
}

async function main(): Promise<void> {
  const bankArg = readArg("--bank");
  const poolArg = readArg("--pool") ?? "practice";
  const batchArg = readArg("--batch");
  const outDir = readArg("--out") ?? "tmp/review-export";

  const bankParsed = reviewBankIdSchema.safeParse(bankArg);
  if (!bankParsed.success) {
    throw new Error("Usage: --bank scholarship-y6-core|vihaan-scholarship-500 --pool practice|mock [--batch <id>] [--out <dir>]");
  }
  if (poolArg !== "practice" && poolArg !== "mock") {
    throw new Error("--pool must be 'practice' or 'mock' (strict separation enforced).");
  }

  const dbUrl =
    process.env.SUPABASE_DB_URL ??
    process.env.RLS_TEST_DB_URL ??
    process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("Set SUPABASE_DB_URL, RLS_TEST_DB_URL or DATABASE_URL (local or DEV only).");
  }
  assertNonProductionDatabaseUrl(dbUrl);

  const truthMap = await loadSourceTruthMap(bankParsed.data);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const query = batchArg
      ? `select * from public.admin_draft_review_decisions where bank_id = $1 and batch_id = $2 order by decided_at desc`
      : `select * from public.admin_draft_review_decisions where bank_id = $1 order by decided_at desc`;
    const params = batchArg ? [bankParsed.data, batchArg] : [bankParsed.data];
    const { rows } = await client.query<DbDecisionRow>(query, params);

    const exported = verifyAndPartitionExportRows(rows, truthMap, poolArg);
    if (exported.rejectedReasons.length > 0) {
      throw new Error(
        `Refused export due to ${exported.rejectedReasons.length} verification failure(s):\n  - ${exported.rejectedReasons.join("\n  - ")}`,
      );
    }

    await mkdir(outDir, { recursive: true });
    const questionPath = path.join(outDir, `${bankParsed.data}-${poolArg}-questions-approved.csv`);
    const writingPath = path.join(outDir, `${bankParsed.data}-${poolArg}-writing-prompts-approved.csv`);
    await writeFile(questionPath, exported.questionCsv, "utf8");
    await writeFile(writingPath, exported.writingCsv, "utf8");

    console.log(
      JSON.stringify(
        {
          bankId: bankParsed.data,
          pool: poolArg,
          batch: batchArg ?? "all",
          questionApprovalsExported: exported.questionCount,
          writingPromptApprovalsExported: exported.writingCount,
          skippedOtherPool: exported.skippedOtherPool,
          questionCsv: questionPath,
          writingCsv: writingPath,
          publicationStateChanged: false,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]).endsWith("export-admin-review-approvals.mts")
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
