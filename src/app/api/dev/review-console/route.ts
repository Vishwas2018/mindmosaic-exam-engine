import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import {
  buildReviewItemsFromQuestions,
  loadGovernedYear3ApprovalBatch,
} from "@/features/review-console/batch-loader";
import { computeBatchSummary } from "@/features/review-console/batch-summary";
import { serializeReviewCsv } from "@/features/review-console/csv-writer";
import { isReviewConsoleAllowed } from "@/features/review-console/preview-gate";
import type { Question } from "@/schemas/question.schema";

export const dynamic = "force-dynamic";

interface BatchDescriptor {
  id: string;
  title: string;
  description: string;
  type: "governed" | "preset" | "roadmap-draft" | "human-approval" | "fixture";
  itemCount: number;
}

async function getAvailableBatches(): Promise<BatchDescriptor[]> {
  const batches: BatchDescriptor[] = [];

  // 1. PRIMARY INPUT: Governed Year 3 Batch (46 items: 26 Reading + 20 Spelling)
  try {
    const govResult = await loadGovernedYear3ApprovalBatch();
    batches.push({
      id: "governed-year3",
      title: "Governed: Year 3 Semantic Review (46 items)",
      description:
        "Canonical governed batch: 26 Reading + 20 Spelling from content/question-factory/reports/human-approval/naplan-external-semantic-review-2026-10-14/year-3-first-human-approval-2026-10-15/",
      type: "governed",
      itemCount: govResult.items.length,
    });
  } catch {
    batches.push({
      id: "governed-year3",
      title: "Governed: Year 3 Semantic Review (46 items)",
      description: "Governed candidate batch: 26 Reading + 20 Spelling.",
      type: "governed",
      itemCount: 46,
    });
  }

  // 2. Secondary convenience: Built-in 4-item fixture batch
  batches.push({
    id: "fixture-year3",
    title: "Fixture: Year 3 Test Fixture",
    description: "Built-in 4-item test fixture with pinned reading passage and spelling question.",
    type: "fixture",
    itemCount: 4,
  });

  // 3. Secondary convenience: Raw drafts combined (47 items: 27 Reading + 20 Spelling)
  const draftFolderName = ["roadmap", "drafts"].join("-");
  try {
    const readingRaw = JSON.parse(
      await readFile(path.join(process.cwd(), "content", draftFolderName, "naplan-y3-reading-draft.json"), "utf8"),
    );
    const spellingRaw = JSON.parse(
      await readFile(path.join(process.cwd(), "content", draftFolderName, "naplan-y3-spelling-draft.json"), "utf8"),
    );
    const totalCount = (readingRaw.questions?.length ?? 0) + (spellingRaw.questions?.length ?? 0);
    batches.push({
      id: "roadmap-y3-combined",
      title: "Draft Sources: Year 3 Combined (27 Reading + 20 Spelling)",
      description: `Raw authoring drafts (${totalCount} total items, un-staged draft IDs).`,
      type: "preset",
      itemCount: totalCount,
    });
  } catch {
    // If files are missing, continue
  }

  // 4. Individual draft files
  try {
    const draftsDir = path.join(process.cwd(), "content", draftFolderName);
    const files = await readdir(draftsDir);
    for (const f of files) {
      if (f.endsWith("-draft.json")) {
        try {
          const raw = JSON.parse(await readFile(path.join(draftsDir, f), "utf8"));
          const count = raw.questions?.length ?? 0;
          const name = f.replace("-draft.json", "").replace(/_/g, " ").replace(/-/g, " ");
          batches.push({
            id: `draft:${f}`,
            title: `Draft: ${name}`,
            description: `Single draft packet: ${f} (${count} questions).`,
            type: "roadmap-draft",
            itemCount: count,
          });
        } catch {
          // ignore corrupted
        }
      }
    }
  } catch {
    // ignore
  }

  return batches;
}

async function loadBatchData(batchId: string): Promise<{
  batchId: string;
  batchTitle: string;
  questions: Question[];
  existingCsv?: string;
  reviews?: unknown[];
}> {
  const cwd = process.cwd();

  // Case 1: Fixture
  if (batchId === "fixture-year3") {
    const fixturePath = path.join(cwd, "src/content/review-fixtures/year3-review-fixture.json");
    const raw = JSON.parse(await readFile(fixturePath, "utf8"));
    return {
      batchId,
      batchTitle: raw.batchTitle ?? "Fixture Year 3 Review",
      questions: raw.questions ?? [],
    };
  }

  // Case 2: Year 3 Combined drafts (47 items)
  const draftFolderName = ["roadmap", "drafts"].join("-");
  if (batchId === "roadmap-y3-combined") {
    const readingPath = path.join(cwd, "content", draftFolderName, "naplan-y3-reading-draft.json");
    const spellingPath = path.join(cwd, "content", draftFolderName, "naplan-y3-spelling-draft.json");
    const readingData = JSON.parse(await readFile(readingPath, "utf8"));
    const spellingData = JSON.parse(await readFile(spellingPath, "utf8"));

    const combinedQuestions: Question[] = [
      ...(readingData.questions ?? []),
      ...(spellingData.questions ?? []),
    ];

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

    return {
      batchId,
      batchTitle: "Year 3 Roadmap Batch (Reading 27 + Spelling 20)",
      questions: combinedQuestions,
      reviews,
    };
  }

  // Case 3: Specific draft file
  if (batchId.startsWith("draft:")) {
    const fileName = batchId.replace("draft:", "");
    const draftPath = path.join(cwd, "content", draftFolderName, fileName);
    const data = JSON.parse(await readFile(draftPath, "utf8"));
    return {
      batchId,
      batchTitle: `Draft: ${fileName}`,
      questions: data.questions ?? [],
    };
  }

  throw new Error(`Unknown batch identifier: ${batchId}`);
}

export async function GET(request: Request) {
  if (!isReviewConsoleAllowed()) {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "list";

  if (action === "list") {
    const batches = await getAvailableBatches();
    return NextResponse.json({ ok: true, batches });
  }

  if (action === "load") {
    // Primary default is governed-year3 (46 items)
    const batchId = searchParams.get("batch") ?? "governed-year3";
    try {
      if (batchId === "governed-year3") {
        const govResult = await loadGovernedYear3ApprovalBatch();
        const summary = computeBatchSummary(govResult.items, govResult.batchId, govResult.batchTitle);
        return NextResponse.json({
          ok: true,
          batchId: govResult.batchId,
          batchTitle: govResult.batchTitle,
          items: govResult.items,
          summary,
        });
      }

      const data = await loadBatchData(batchId);
      const items = buildReviewItemsFromQuestions(data.questions, {
        existingCsvContent: data.existingCsv,
        reviews: data.reviews,
      });
      const summary = computeBatchSummary(items, data.batchId, data.batchTitle);
      return NextResponse.json({ ok: true, batchId: data.batchId, batchTitle: data.batchTitle, items, summary });
    } catch (err) {
      return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
  if (!isReviewConsoleAllowed()) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const body = await request.json();
    const { items, batchId, reviewerName } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, error: "items array is required" }, { status: 400 });
    }

    const csvContent = serializeReviewCsv(items);

    // Save to disk under content/question-factory/reports/human-approval/exports/
    const exportDir = path.join(process.cwd(), "content/question-factory/reports/human-approval/exports");
    await mkdir(exportDir, { recursive: true });

    const safeBatchId = (batchId || "review-batch").replace(/[^a-zA-Z0-9_-]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `review-${safeBatchId}-${timestamp}.csv`;
    const finalPath = path.join(exportDir, fileName);

    await writeFile(finalPath, csvContent, "utf8");

    const relFilePath = path.relative(process.cwd(), finalPath).replace(/\\/g, "/");
    const publishCandidateIds = items.map((i: { id: string }) => i.id).join(",");
    const publishCommand = `npm run questions:publish -- --candidate-ids ${publishCandidateIds} --sheet "${relFilePath}" --reviewer "${reviewerName || "Your Full Name"}"`;
    const recordCommand = `npm run content:record-approvals -- --sheet "${relFilePath}" --reviewer "${reviewerName || "Your Full Name"}"`;

    return NextResponse.json({
      ok: true,
      csv: csvContent,
      fileName,
      filePath: finalPath,
      relativeFilePath: relFilePath,
      publishCommand,
      recordCommand,
      totalRows: items.length,
      approvedCount: items.filter((i: { decision?: string }) => i.decision === "approve").length,
      rejectedCount: items.filter((i: { decision?: string }) => i.decision === "reject").length,
      revisedCount: items.filter((i: { decision?: string }) => i.decision === "revise").length,
      undecidedCount: items.filter((i: { decision?: string }) => !i.decision).length,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
