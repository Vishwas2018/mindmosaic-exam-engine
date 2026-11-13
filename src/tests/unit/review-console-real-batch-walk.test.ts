import { describe, expect, it } from "vitest";

import { parseApprovalCsv } from "@/features/content-governance/approval-verification";
import { loadGovernedYear3ApprovalBatch } from "@/features/review-console/batch-loader";
import { computeBatchSummary } from "@/features/review-console/batch-summary";
import { serializeReviewCsv } from "@/features/review-console/csv-writer";

describe("governed Year 3 review batch walk (46 items)", () => {
  it("loads the canonical governed Year 3 batch, walks all 46 items without rendering errors, and exports blank decisions", async () => {
    // 1. Load the canonical governed batch
    const { batchId, batchTitle, items } = await loadGovernedYear3ApprovalBatch();

    expect(batchId).toBe("governed-year3");
    expect(items).toHaveLength(46);

    // 2. Walk every item and verify complete renderability
    const rendered: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

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

        // Reading items (first 26): must have non-empty stimulus body
        if (item.index < 26) {
          expect(q.metadata.subject).toBe("reading");
          expect(q.stimulus, `Item ${q.id} should have stimulus`).toBeDefined();
          expect(q.stimulus?.body?.length).toBeGreaterThan(50);
        }

        // Spelling items (26..45): 20 items, subject is language_conventions
        if (item.index >= 26) {
          expect(q.metadata.subject).toBe("language_conventions");
        }

        // Ensure 4 binding columns are populated
        expect(item.id.startsWith("man-") || item.id.startsWith("rev-")).toBe(true);
        expect(item.contentHash).toMatch(/^[a-f0-9]{64}$/);
        expect(typeof item.revision === "number" || typeof item.revision === "string").toBe(true);
        expect(item.sourceManifestHash).toBeNull();

        rendered.push(item.id);
      } catch (err) {
        failed.push({ id: item.id, error: String(err) });
      }
    }

    expect(failed).toHaveLength(0);
    expect(rendered).toHaveLength(46);

    // 3. Batch Summary metrics (Requirement D)
    const summary = computeBatchSummary(items, batchId, batchTitle);
    expect(summary.totalItems).toBe(46);

    // Subject breakdown: 26 reading, 20 spelling
    const readingItems = items.filter((i) => i.question.metadata.subject === "reading");
    const spellingItems = items.filter((i) => i.question.metadata.subject === "language_conventions");
    expect(readingItems).toHaveLength(26);
    expect(spellingItems).toHaveLength(20);

    // All 46 items are semantic review items (reading passages + spelling contexts)
    expect(summary.semanticReviewCount).toBe(46);
    expect(summary.solverBackedCount).toBe(0);

    // Verify answer positions and difficulty distributions exist
    expect(Object.keys(summary.answerPositionCounts).length).toBeGreaterThan(0);
    expect(Object.keys(summary.difficultyCounts).length).toBeGreaterThan(0);

    console.log("Governed Year 3 Batch Verification Results:");
    console.log(`  Items loaded:           ${items.length}`);
    console.log(`  Items rendered:         ${rendered.length}`);
    console.log(`  Items failed to render: ${failed.length}`);
    console.log(`  Reading items:          ${readingItems.length}`);
    console.log(`  Spelling items:         ${spellingItems.length}`);
    console.log(`  Semantic review items:  ${summary.semanticReviewCount}`);
    console.log(`  Solver-backed items:    ${summary.solverBackedCount}`);
    console.log("  Answer positions:", summary.answerPositionCounts);
    console.log("  Difficulty counts:", summary.difficultyCounts);

    // 4. Undecided CSV serialization
    const csvContent = serializeReviewCsv(items);
    const parsedRows = parseApprovalCsv(csvContent);

    expect(parsedRows).toHaveLength(46);
    for (const row of parsedRows) {
      expect(row.decision).toBe("");
      expect(row.correctness).toBe("");
      expect(row.originality).toBe("");
      expect(row.ageAppropriateness).toBe("");
      expect(row.notes).toBe("");
    }
  });
});
