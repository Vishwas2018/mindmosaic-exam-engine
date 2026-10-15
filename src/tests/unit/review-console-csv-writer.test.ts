import { describe, expect, it } from "vitest";
import { parseApprovalCsv } from "@/features/content-governance/approval-verification";
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
