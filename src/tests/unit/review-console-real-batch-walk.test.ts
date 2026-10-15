import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseApprovalCsv } from "@/features/content-governance/approval-verification";
import { buildReviewItemsFromQuestions } from "@/features/review-console/batch-loader";
import { computeBatchSummary } from "@/features/review-console/batch-summary";
import { serializeReviewCsv } from "@/features/review-console/csv-writer";
import type { Question } from "@/schemas/question.schema";

describe("real Year 3 review batch walk (~47 items)", () => {
  it("loads the real Year 3 batch, walks all items without rendering errors, and exports blank decisions", async () => {
    const cwd = process.cwd();
    const readingPath = path.join(cwd, "content/roadmap-drafts/naplan-y3-reading-draft.json");
    const spellingPath = path.join(cwd, "content/roadmap-drafts/naplan-y3-spelling-draft.json");

    const readingData = JSON.parse(await readFile(readingPath, "utf8"));
    const spellingData = JSON.parse(await readFile(spellingPath, "utf8"));

    const questions: Question[] = [
      ...(readingData.questions ?? []),
      ...(spellingData.questions ?? []),
    ];

    expect(questions).toHaveLength(47);

    // 1. Measure load and mapping time
    const startBuild = performance.now();
    const items = buildReviewItemsFromQuestions(questions);
    const buildDurationMs = performance.now() - startBuild;

    expect(items).toHaveLength(47);
    expect(buildDurationMs).toBeLessThan(1000); // Super fast (<1s)

    // 2. Walk every item and verify rendering integrity
    const rendered: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    const startWalk = performance.now();
    for (const item of items) {
      try {
        const q = item.question;
        expect(q.id).toBeTruthy();
        expect(q.prompt).toBeTruthy();
        expect(q.metadata?.difficulty).toBeTruthy();
        expect(q.metadata?.subject).toBeTruthy();
        expect(q.answerKey).toBeTruthy();

        // Check options and answerKey alignment
        if (q.options && q.options.length > 0) {
          const key = q.answerKey;
          if (key.kind === "single_option") {
            const keyOption = q.options.find((o) => o.id === key.optionId);
            expect(keyOption, `Missing option for key ${key.optionId} in item ${q.id}`).toBeDefined();
          }
        }

        // Reading items must have non-empty stimulus body
        if (item.index < 27) {
          expect(q.stimulus, `Item ${q.id} should have stimulus`).toBeDefined();
          expect(q.stimulus?.body?.length).toBeGreaterThan(50);
        }

        // Spelling items (28..47) are standalone questions
        if (item.index >= 27) {
          expect(q.metadata.subject).toBe("language_conventions");
        }

        rendered.push(item.id);
      } catch (err) {
        failed.push({ id: item.id, error: String(err) });
      }
    }
    const walkDurationMs = performance.now() - startWalk;

    expect(failed).toHaveLength(0);
    expect(rendered).toHaveLength(47);

    console.log(`Real Year 3 Batch Walk Results:`);
    console.log(`  Items rendered: ${rendered.length} / 47`);
    console.log(`  Items failed:   ${failed.length}`);
    console.log(`  Build time:     ${buildDurationMs.toFixed(2)} ms`);
    console.log(`  Walk pass time: ${walkDurationMs.toFixed(2)} ms`);

    // 3. Verify Batch Summary metrics (Requirement D)
    const summary = computeBatchSummary(items, "year3-real", "Year 3 Real Batch");
    expect(summary.totalItems).toBe(47);

    // Answer-position distribution: { a: 13, b: 11, c: 13, d: 10 }
    expect(summary.answerPositionCounts["a"]).toBe(13);
    expect(summary.answerPositionCounts["b"]).toBe(11);
    expect(summary.answerPositionCounts["c"]).toBe(13);
    expect(summary.answerPositionCounts["d"]).toBe(10);

    // Difficulty distribution: { easy: 24, medium: 16, challenging: 7 }
    expect(summary.difficultyCounts["easy"]).toBe(24);
    expect(summary.difficultyCounts["medium"]).toBe(16);
    expect(summary.difficultyCounts["challenging"]).toBe(7);

    // 4. Verify CSV serialization with decisions left blank (Requirement A & B)
    const csvContent = serializeReviewCsv(items);
    const parsedRows = parseApprovalCsv(csvContent);

    expect(parsedRows).toHaveLength(47);
    for (const row of parsedRows) {
      expect(row.decision).toBe("");
      expect(row.correctness).toBe("");
      expect(row.originality).toBe("");
      expect(row.ageAppropriateness).toBe("");
    }
  });
});
