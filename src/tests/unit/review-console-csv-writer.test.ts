import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseApprovalCsv } from "@/features/content-governance/approval-verification";
import {
  parseCsvRow,
  parseGovernedApprovalCsv,
  loadGovernedYear3ApprovalBatch,
} from "@/features/review-console/batch-loader";
import {
  APPROVAL_CSV_HEADER,
  escapeCsvCell,
  formatApprovalCsvRow,
  serializeReviewCsv,
} from "@/features/review-console/csv-writer";
import type { ReviewItem } from "@/features/review-console/types";
import type { Question } from "@/schemas/question.schema";

describe("review console CSV writer governance", () => {
  it("uses the exact 9-column header consumed by content:record-approvals", () => {
    expect(APPROVAL_CSV_HEADER).toBe(
      "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes",
    );
  });

  it("exports undecided items with blank decision and blank checks (never an approval)", () => {
    const row = formatApprovalCsvRow({
      questionId: "roadmap-naplan-y3-reading-01-q1",
      contentHash: "abc123hash",
      revision: 1,
      sourceManifestHash: null,
      decision: "",
      notes: "",
    });

    // Format: questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes
    // 9 columns = 8 commas:
    expect(row).toBe("roadmap-naplan-y3-reading-01-q1,abc123hash,1,,,,,,");

    // Parse back with the governed approval CSV parser
    const parsed = parseApprovalCsv(`${APPROVAL_CSV_HEADER}\r\n${row}\r\n`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].questionId).toBe("roadmap-naplan-y3-reading-01-q1");
    expect(parsed[0].decision).toBe("");
    expect(parsed[0].correctness).toBe("");
    expect(parsed[0].originality).toBe("");
    expect(parsed[0].ageAppropriateness).toBe("");
  });

  it("exports approved items with all three checks marked 'yes' and decision 'approve'", () => {
    const row = formatApprovalCsvRow({
      questionId: "roadmap-naplan-y3-reading-01-q2",
      contentHash: "def456hash",
      revision: 1,
      sourceManifestHash: null,
      decision: "approve",
      notes: "Clear and age appropriate.",
    });

    expect(row).toBe("roadmap-naplan-y3-reading-01-q2,def456hash,1,,yes,yes,yes,approve,Clear and age appropriate.");

    const parsed = parseApprovalCsv(`${APPROVAL_CSV_HEADER}\r\n${row}\r\n`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].decision).toBe("approve");
    expect(parsed[0].correctness).toBe("yes");
    expect(parsed[0].originality).toBe("yes");
    expect(parsed[0].ageAppropriateness).toBe("yes");
    expect(parsed[0].notes).toBe("Clear and age appropriate.");
  });

  it("exports rejected items with explicit 'reject' decision and blank checks", () => {
    const row = formatApprovalCsvRow({
      questionId: "roadmap-naplan-y3-reading-01-q3",
      contentHash: "ghi789hash",
      revision: 2,
      sourceManifestHash: "manifest-hash-99",
      decision: "reject",
      notes: "Ambiguous stem conflicting with passage sentence 4.",
    });

    expect(row).toBe(
      "roadmap-naplan-y3-reading-01-q3,ghi789hash,2,manifest-hash-99,,,,reject,Ambiguous stem conflicting with passage sentence 4.",
    );

    const parsed = parseApprovalCsv(`${APPROVAL_CSV_HEADER}\r\n${row}\r\n`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].decision).toBe("reject");
    expect(parsed[0].correctness).toBe("");
    expect(parsed[0].originality).toBe("");
    expect(parsed[0].ageAppropriateness).toBe("");
    expect(parsed[0].notes).toBe("Ambiguous stem conflicting with passage sentence 4.");
  });

  it("exports revision items with explicit 'revise' decision and reviewer fixes", () => {
    const row = formatApprovalCsvRow({
      questionId: "roadmap-naplan-y3-spelling-001",
      contentHash: "spell-hash-1",
      revision: 1,
      sourceManifestHash: null,
      decision: "revise",
      notes: "Reconsider difficulty label (easy rather than medium).",
    });

    expect(row).toBe(
      "roadmap-naplan-y3-spelling-001,spell-hash-1,1,,,,,revise,Reconsider difficulty label (easy rather than medium).",
    );

    const parsed = parseApprovalCsv(`${APPROVAL_CSV_HEADER}\r\n${row}\r\n`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].decision).toBe("revise");
    expect(parsed[0].notes).toBe("Reconsider difficulty label (easy rather than medium).");
  });

  it("escapes cells containing commas and quotes according to RFC 4180 and normalizes newlines for parseApprovalCsv", () => {
    expect(escapeCsvCell('Contains, comma and "quotes" and\nnewline')).toBe(
      '"Contains, comma and ""quotes"" and\nnewline"',
    );

    const row = formatApprovalCsvRow({
      questionId: "test-q1",
      contentHash: "h1",
      revision: 1,
      sourceManifestHash: null,
      decision: "reject",
      notes: 'Line 1: error,\nLine 2: "quoted issue"',
    });

    const parsed = parseApprovalCsv(`${APPROVAL_CSV_HEADER}\r\n${row}\r\n`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].notes).toBe('Line 1: error, Line 2: "quoted issue"');
  });

  it("serializes a complete multi-item batch with CRLF line endings", () => {
    const mockItems: ReviewItem[] = [
      {
        id: "item-1",
        index: 0,
        contentHash: "hash-1",
        revision: 1,
        sourceManifestHash: null,
        question: {} as unknown as Question,
        decision: "approve",
        notes: "Approved note",
        checks: { correctness: true, originality: true, ageAppropriateness: true },
        isMachineVerifiable: false,
        verificationNotes: [],
      },
      {
        id: "item-2",
        index: 1,
        contentHash: "hash-2",
        revision: 1,
        sourceManifestHash: null,
        question: {} as unknown as Question,
        decision: "", // Undecided
        notes: "",
        checks: { correctness: false, originality: false, ageAppropriateness: false },
        isMachineVerifiable: true,
        verificationNotes: [],
      },
    ];

    const csv = serializeReviewCsv(mockItems);
    expect(csv.startsWith(`${APPROVAL_CSV_HEADER}\r\n`)).toBe(true);

    const parsed = parseApprovalCsv(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].questionId).toBe("item-1");
    expect(parsed[0].decision).toBe("approve");
    expect(parsed[0].correctness).toBe("yes");
    expect(parsed[1].questionId).toBe("item-2");
    expect(parsed[1].decision).toBe("");
    expect(parsed[1].correctness).toBe("");
  });
});

describe("governed Year 3 approval batch CSV round-trip & byte-for-byte binding preservation", () => {
  const realBatchRelPath =
    "content/question-factory/reports/human-approval/naplan-external-semantic-review-2026-10-14/year-3-first-human-approval-2026-10-15/year-3-review.csv";

  async function getRealCsvContent(): Promise<string> {
    const cwd = process.cwd();
    try {
      return await readFile(path.join(cwd, realBatchRelPath), "utf8");
    } catch {
      try {
        return await readFile(
          path.join("C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine", realBatchRelPath),
          "utf8",
        );
      } catch {
        return await readFile(
          path.join(cwd, "src/content/review-fixtures/governed-year-3/year-3-review.csv"),
          "utf8",
        );
      }
    }
  }

  it("round-trips Codex's actual 46-row year-3-review.csv and fails on any byte change to the four binding columns across all 46 rows", async () => {
    const rawCsv = await getRealCsvContent();
    const inputLines = rawCsv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    expect(inputLines).toHaveLength(47); // 1 header + 46 rows
    expect(inputLines[0]).toBe(APPROVAL_CSV_HEADER);

    const parsedGovernedRows = parseGovernedApprovalCsv(rawCsv);
    expect(parsedGovernedRows).toHaveLength(46);

    // Verify each row's 4 binding columns
    for (let i = 0; i < parsedGovernedRows.length; i++) {
      const parsedRow = parsedGovernedRows[i];
      const rawCols = parseCsvRow(inputLines[i + 1]);

      const expectedQuestionId = rawCols[0];
      const expectedContentHash = rawCols[1];
      const expectedRevision = rawCols[2];
      const expectedSourceManifestHash = rawCols[3]; // blank in staged candidates

      // 1. In-memory parsed bindings match input line verbatim
      expect(parsedRow.questionId, `Row ${i} questionId mismatch`).toBe(expectedQuestionId);
      expect(parsedRow.contentHash, `Row ${i} contentHash mismatch`).toBe(expectedContentHash);
      expect(String(parsedRow.revision), `Row ${i} revision mismatch`).toBe(expectedRevision);
      expect(parsedRow.sourceManifestHash ?? "", `Row ${i} sourceManifestHash mismatch`).toBe(
        expectedSourceManifestHash,
      );
      expect(parsedRow.sourceManifestHash).toBeNull(); // Exactly blank

      // 2. Format row using formatApprovalCsvRow with undecided state
      const exportedRow = formatApprovalCsvRow({
        questionId: parsedRow.questionId,
        contentHash: parsedRow.contentHash,
        revision: parsedRow.revision,
        sourceManifestHash: parsedRow.sourceManifestHash,
        decision: "",
        notes: "",
      });

      // 3. Fails on ANY byte change to the four binding columns across all 46 rows
      const exportedCols = exportedRow.split(",");
      expect(exportedCols[0], `Row ${i} exported col 0 questionId changed`).toBe(expectedQuestionId);
      expect(exportedCols[1], `Row ${i} exported col 1 contentHash changed`).toBe(expectedContentHash);
      expect(exportedCols[2], `Row ${i} exported col 2 revision changed`).toBe(expectedRevision);
      expect(exportedCols[3], `Row ${i} exported col 3 sourceManifestHash changed`).toBe(
        expectedSourceManifestHash,
      );

      // 4. In undecided state, the entire row matches the input CSV row byte-for-byte
      expect(exportedRow, `Row ${i} full line byte mismatch`).toBe(inputLines[i + 1]);
    }
  });

  it("re-proves undecided-row behavior against the real 46-item CSV: unreviewed items leave reviewer checks and decision completely blank", async () => {
    const { items } = await loadGovernedYear3ApprovalBatch();
    expect(items).toHaveLength(46);

    // When undecided, serialize full batch
    const serialized = serializeReviewCsv(items);
    const parsed = parseApprovalCsv(serialized);

    expect(parsed).toHaveLength(46);
    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      expect(row.decision, `Item ${i} (${row.questionId}) decision must be blank`).toBe("");
      expect(row.correctness, `Item ${i} (${row.questionId}) correctness must be blank`).toBe("");
      expect(row.originality, `Item ${i} (${row.questionId}) originality must be blank`).toBe("");
      expect(row.ageAppropriateness, `Item ${i} (${row.questionId}) ageAppropriateness must be blank`).toBe("");
      expect(row.notes, `Item ${i} (${row.questionId}) notes must be blank`).toBe("");
    }
  });

  it("preserves all 4 binding columns byte-for-byte when decisions are applied", async () => {
    const { items } = await loadGovernedYear3ApprovalBatch();
    expect(items).toHaveLength(46);

    // Apply explicit decisions to first 3 items:
    items[0].decision = "approve";
    items[0].notes = "Passage recall verified against paragraph 2.";
    items[1].decision = "reject";
    items[1].notes = "Distractor B is also defensible.";
    items[2].decision = "revise";
    items[2].notes = "Rephrase question stem.";

    const serialized = serializeReviewCsv(items);
    const parsed = parseApprovalCsv(serialized);

    expect(parsed).toHaveLength(46);

    // Item 0: Approved
    expect(parsed[0].decision).toBe("approve");
    expect(parsed[0].correctness).toBe("yes");
    expect(parsed[0].originality).toBe("yes");
    expect(parsed[0].ageAppropriateness).toBe("yes");
    expect(parsed[0].notes).toBe("Passage recall verified against paragraph 2.");
    // Binding columns intact
    expect(parsed[0].questionId).toBe(items[0].id);
    expect(parsed[0].contentHash).toBe(items[0].contentHash);
    expect(parsed[0].revision).toBe(Number(items[0].revision));
    expect(parsed[0].sourceManifestHash).toBeNull();

    // Item 1: Rejected
    expect(parsed[1].decision).toBe("reject");
    expect(parsed[1].correctness).toBe("");
    expect(parsed[1].notes).toBe("Distractor B is also defensible.");
    expect(parsed[1].questionId).toBe(items[1].id);
    expect(parsed[1].contentHash).toBe(items[1].contentHash);

    // Item 2: Revise
    expect(parsed[2].decision).toBe("revise");
    expect(parsed[2].correctness).toBe("");
    expect(parsed[2].notes).toBe("Rephrase question stem.");

    // Remaining items (3..45) remain strictly undecided and blank
    for (let i = 3; i < 46; i++) {
      expect(parsed[i].decision).toBe("");
      expect(parsed[i].correctness).toBe("");
      expect(parsed[i].questionId).toBe(items[i].id);
      expect(parsed[i].contentHash).toBe(items[i].contentHash);
    }
  });
});
