import { describe, expect, it } from "vitest";
import { mkdtemp, readdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  parseApprovalCsv,
  recordApprovalsToDisk,
  validateApprovalBatch,
  validateSingleApproval,
  type ApprovalInputRow,
} from "@/features/content-governance/approval-verification";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { createTestHumanApproval } from "@/tests/helpers/publication-approvals";

import { questionBank } from "@/content/questions/question-bank";

describe("Approval Verification Core (Sections 5, 6, 7, 11)", () => {
  const qA = questionBank[0];
  const qB = questionBank[1];
  const qC = questionBank[2];
  const bank = [qA, qB, qC];
  const bound = (question: typeof qA): ApprovalInputRow => ({
    questionId: question.id, contentHash: canonicalQuestionHash(question), revision: 1,
    sourceManifestHash: null, correctness: "yes", originality: "yes",
    ageAppropriateness: "yes", decision: "approve",
  });

  it("validates valid new approval rows", async () => {
    const rows: ApprovalInputRow[] = [
      {
        questionId: qA.id,
        contentHash: canonicalQuestionHash(qA),
        revision: 1,
        sourceManifestHash: null,
        correctness: "yes",
        originality: "yes",
        ageAppropriateness: "yes",
        decision: "approve",
        notes: "Looks good",
      },
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      questionBank: bank,
    });

    expect(result.ok).toBe(true);
    expect(result.newApprovals.length).toBe(1);
    expect(result.alreadyRecorded.length).toBe(0);
    expect(result.newApprovals[0].questionId).toBe(qA.id);
    expect(result.newApprovals[0].approvedBy).toBe("Dr Eleanor Vance");
  });

  it("requires reviewer full name explicitly (Section 6)", async () => {
    const rows: ApprovalInputRow[] = [
      {
        questionId: qA.id,
        correctness: "yes",
        originality: "yes",
        ageAppropriateness: "yes",
        decision: "approve",
      },
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "   ",
      questionBank: bank,
    });

    expect(result.ok).toBe(false);
    expect(result.fatalErrors.some((e) => e.includes("Reviewer full name"))).toBe(true);
  });

  it("rejects duplicates within the same input sheet atomically (Section 5)", async () => {
    const rows: ApprovalInputRow[] = [
      {
        questionId: qA.id,
        correctness: "yes",
        originality: "yes",
        ageAppropriateness: "yes",
        decision: "approve",
      },
      {
        questionId: qA.id,
        correctness: "yes",
        originality: "yes",
        ageAppropriateness: "yes",
        decision: "approve",
      },
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      questionBank: bank,
    });

    expect(result.ok).toBe(false);
    expect(result.newApprovals.length).toBe(0);
    expect(result.fatalErrors.some((e) => e.includes("Duplicate approval target"))).toBe(true);
  });

  it("handles a sheet partly recorded earlier correctly (Section 7)", async () => {
    // Existing approval for A matches exact immutable evidence
    const existingA = createTestHumanApproval({ question: qA });
    const existingMap = new Map([[qA.id, existingA]]);

    const rows: ApprovalInputRow[] = [
      bound(qA), bound(qB), bound(qC),
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      existingApprovals: existingMap,
      questionBank: bank,
    });

    expect(result.ok).toBe(true);
    expect(result.alreadyRecorded.length).toBe(1);
    expect(result.alreadyRecorded[0].questionId).toBe(qA.id);
    expect(result.newApprovals.length).toBe(2);
    expect(result.newApprovals.map((a) => a.questionId).sort()).toEqual([qB.id, qC.id].sort());
  });

  it("aborts the whole batch when an existing approval conflicts (Section 5, 7)", async () => {
    // Existing approval for A has a DIFFERENT content hash
    const conflictingA = {
      ...createTestHumanApproval({ question: qA }),
      contentHash: "0000000000000000000000000000000000000000000000000000000000000000",
    };
    const existingMap = new Map([[qA.id, conflictingA]]);

    const rows: ApprovalInputRow[] = [
      bound(qA), bound(qB),
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      existingApprovals: existingMap,
      questionBank: bank,
    });

    expect(result.ok).toBe(false);
    expect(result.newApprovals.length).toBe(0);
    expect(result.fatalErrors.some((e) => e.includes("Conflicting existing approval"))).toBe(true);
  });

  it("rejects approved row with blank or missing checks (Section 6)", async () => {
    const rows: ApprovalInputRow[] = [
      {
        ...bound(qA),
        originality: "", // blank check
      },
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      questionBank: bank,
    });

    expect(result.ok).toBe(false);
    expect(result.newApprovals.length).toBe(0);
    expect(result.fatalErrors.some((e) => e.includes("must have all three checks"))).toBe(true);
  });

  it("does not write approval for reject, revise, or unreviewed rows (Section 6)", async () => {
    const rows: ApprovalInputRow[] = [
      {
        questionId: qA.id,
        decision: "reject",
        notes: "Ambiguous stem wording",
      },
      {
        questionId: qB.id,
        decision: "revise",
        notes: "Option D typo",
      },
      {
        questionId: qC.id,
        decision: "", // unreviewed
      },
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      questionBank: bank,
    });

    expect(result.ok).toBe(true);
    expect(result.newApprovals.length).toBe(0);
    expect(result.rejectedCount).toBe(1);
    expect(result.revisedCount).toBe(1);
    expect(result.unreviewedCount).toBe(1);
  });

  it("rejects stale content hash (Section 6)", async () => {
    const rows: ApprovalInputRow[] = [
      {
        ...bound(qA),
        contentHash: "badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb",
      },
    ];

    const result = await validateApprovalBatch({
      rows,
      reviewerFullName: "Dr Eleanor Vance",
      questionBank: bank,
    });

    expect(result.ok).toBe(false);
    expect(result.fatalErrors.some((e) => e.includes("Stale or mismatched content hash"))).toBe(true);
  });

  it("rejects an approved row with a missing content binding", async () => {
    const { contentHash: _omitted, ...row } = bound(qA);
    void _omitted;
    const result = await validateApprovalBatch({
      rows: [row], reviewerFullName: "Dr Eleanor Vance", questionBank: bank,
    });
    expect(result.ok).toBe(false);
    expect(result.newApprovals).toHaveLength(0);
    expect(result.fatalErrors.some((error) => error.includes("content hash"))).toBe(true);
  });

  it("parses CSV correctly (Section 10)", () => {
    const csv = `questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes\r\n` +
      `test-q-1,hash123,2,manifest456,yes,yes,yes,approve,"Valid question, verified"\r\n` +
      `test-q-2,,,,,,,reject,"Needs revision"\r\n`;

    const parsed = parseApprovalCsv(csv);
    expect(parsed.length).toBe(2);
    expect(parsed[0].questionId).toBe("test-q-1");
    expect(parsed[0].contentHash).toBe("hash123");
    expect(parsed[0].revision).toBe(2);
    expect(parsed[0].sourceManifestHash).toBe("manifest456");
    expect(parsed[0].correctness).toBe("yes");
    expect(parsed[0].decision).toBe("approve");
    expect(parsed[0].notes).toBe("Valid question, verified");

    expect(parsed[1].questionId).toBe("test-q-2");
    expect(parsed[1].decision).toBe("reject");
  });

  it("validates a single approval via validateSingleApproval (Section 11)", async () => {
    const row: ApprovalInputRow = bound(qA);

    const res = await validateSingleApproval({
      row,
      reviewerFullName: "Dr Eleanor Vance",
      questionBank: bank,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.alreadyRecorded).toBe(false);
      expect(res.approval.questionId).toBe(qA.id);
    }
  });

  it("does not overwrite an earlier approval or leave a partial batch", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mm-approval-write-"));
    try {
      const first = createTestHumanApproval({ question: qA });
      const second = createTestHumanApproval({ question: qB });
      await writeFile(path.join(directory, `${second.questionId}.json`), "existing record\n");
      await expect(recordApprovalsToDisk([first, second], directory)).rejects.toThrow("already exists");
      expect((await readdir(directory)).sort()).toEqual([`${second.questionId}.json`]);
    } finally {
      for (const file of await readdir(directory)) await unlink(path.join(directory, file));
      await rmdir(directory);
    }
  });
});
