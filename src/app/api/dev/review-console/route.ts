import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { buildReviewItemsFromQuestions } from "@/features/review-console/batch-loader";
import { computeBatchSummary } from "@/features/review-console/batch-summary";
import { serializeReviewCsv } from "@/features/review-console/csv-writer";
import { isReviewConsoleAllowed } from "@/features/review-console/preview-gate";
import type { Question } from "@/schemas/question.schema";

export const dynamic = "force-dynamic";

interface BatchDescriptor {
  id: string;
  title: string;
  description: string;
  type: "preset" | "roadmap-draft" | "human-approval" | "fixture";
  itemCount: number;
}

async function getAvailableBatches(): Promise<BatchDescriptor[]> {
  const batches: BatchDescriptor[] = [];

  // 1. Fixture batch
  batches.push({
    id: "fixture-year3",
    title: "Fixture: Year 3 Review Batch",
    description: "Built-in 4-item test fixture with pinned reading passage and spelling question.",
    type: "fixture",
    itemCount: 4,
  });

  // 2. Year 3 combined batch (Reading 27 + Spelling 20 = 47 items)
  try {
    const readingRaw = JSON.parse(
      await readFile(path.join(process.cwd(), "content/roadmap-drafts/naplan-y3-reading-draft.json"), "utf8"),
    );
    const spellingRaw = JSON.parse(
      await readFile(path.join(process.cwd(), "content/roadmap-drafts/naplan-y3-spelling-draft.json"), "utf8"),
    );
    const totalCount = (readingRaw.questions?.length ?? 0) + (spellingRaw.questions?.length ?? 0);
    batches.push({
      id: "roadmap-y3-combined",
      title: "Year 3 Roadmap Batch (Reading + Spelling)",
      description: `Governed Year 3 candidate drafts: 27 reading items across 4 passages + 20 spelling items (${totalCount} total items).`,
      type: "preset",
      itemCount: totalCount,
    });
  } catch {
    // If files are missing, continue
  }

  // 3. Roadmap draft files
  try {
    const draftsDir = path.join(process.cwd(), "content/roadmap-drafts");
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

  // 4. Human-approval reports if any
  try {
    const approvalDir = path.join(process.cwd(), "content/question-factory/reports/human-approval");
    const entries = await readdir(approvalDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const subDir = path.join(approvalDir, e.name);
        try {
          const subFiles = await readdir(subDir);
          const hasCsv = subFiles.includes("review.csv");
          const inputJson = subFiles.find((sf) => sf.endsWith("input.json") || sf.endsWith("pack.json"));
          if (hasCsv || inputJson) {
            batches.push({
              id: `report:${e.name}`,
              title: `Report: ${e.name}`,
              description: `Report directory in content/question-factory/reports/human-approval/${e.name}`,
              type: "human-approval",
              itemCount: 0,
            });
          }
        } catch {
          // ignore
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

  // Case 2: Year 3 Combined (47 items)
  if (batchId === "roadmap-y3-combined") {
    const readingPath = path.join(cwd, "content/roadmap-drafts/naplan-y3-reading-draft.json");
    const spellingPath = path.join(cwd, "content/roadmap-drafts/naplan-y3-spelling-draft.json");
    const readingData = JSON.parse(await readFile(readingPath, "utf8"));
    const spellingData = JSON.parse(await readFile(spellingPath, "utf8"));

    const combinedQuestions: Question[] = [
      ...(readingData.questions ?? []),
      ...(spellingData.questions ?? []),
    ];

    // Check for reviews in content/roadmap-drafts/reviews/freebuff-2026-10-12/
    const reviews: unknown[] = [];
    try {
      const revReading = JSON.parse(
        await readFile(
          path.join(cwd, "content/roadmap-drafts/reviews/freebuff-2026-10-12/naplan-y3-reading-draft-review.json"),
          "utf8",
        ),
      );
      if (Array.isArray(revReading)) reviews.push(...revReading);
    } catch {}
    try {
      const revSpelling = JSON.parse(
        await readFile(
          path.join(cwd, "content/roadmap-drafts/reviews/freebuff-2026-10-12/naplan-y3-spelling-draft-review.json"),
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

  // Case 3: Specific draft file (e.g. "draft:naplan-y3-reading-draft.json")
  if (batchId.startsWith("draft:")) {
    const fileName = batchId.replace("draft:", "");
    const draftPath = path.join(cwd, "content/roadmap-drafts", fileName);
    const data = JSON.parse(await readFile(draftPath, "utf8"));
    return {
      batchId,
      batchTitle: `Draft: ${fileName}`,
      questions: data.questions ?? [],
    };
  }

  // Case 4: Human-approval report directory
  if (batchId.startsWith("report:")) {
    const reportName = batchId.replace("report:", "");
    const dir = path.join(cwd, "content/question-factory/reports/human-approval", reportName);
    const subFiles = await readdir(dir);
    let existingCsv: string | undefined;
    if (subFiles.includes("review.csv")) {
      existingCsv = await readFile(path.join(dir, "review.csv"), "utf8");
    }

    let questions: Question[] = [];
    const inputJsonName = subFiles.find((sf) => sf.endsWith("input.json") || sf.endsWith("pack.json"));
    if (inputJsonName) {
      const parsed = JSON.parse(await readFile(path.join(dir, inputJsonName), "utf8"));
      questions = parsed.questions ?? (Array.isArray(parsed) ? parsed : []);
    }

    return {
      batchId,
      batchTitle: `Report: ${reportName}`,
      questions,
      existingCsv,
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
    const batchId = searchParams.get("batch") ?? "roadmap-y3-combined";
    try {
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

    const recordCommand = `npm run content:record-approvals -- --sheet "${path.relative(process.cwd(), finalPath).replace(/\\/g, "/")}" --reviewer "${reviewerName || "Your Full Name"}"`;

    return NextResponse.json({
      ok: true,
      csv: csvContent,
      fileName,
      filePath: finalPath,
      relativeFilePath: path.relative(process.cwd(), finalPath).replace(/\\/g, "/"),
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
