import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { partitionPendingAmcApprovals } from "@/features/content-governance/pending-amc-approvals";
import { getExamBank } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";

const source = JSON.parse(readFileSync("content/review-sources/amc/y3.json", "utf8"))[0];
const approval = JSON.parse(readFileSync("content/publication-approvals/roadmap-amc-y3-001.json", "utf8"));

describe("human approval is distinct from AMC publication", () => {
  it("recognizes a valid source-bound signature as pending, never published", () => {
    const result = partitionPendingAmcApprovals(new Set(), [approval], [source]);
    expect(result.pending).toEqual([approval]);
    expect(result.publicationRecords).toEqual([]);
  });
  it("does not classify an already-published target as pending", () => {
    const result = partitionPendingAmcApprovals(new Set([approval.questionId]), [approval], [source]);
    expect(result.pending).toEqual([]);
    expect(result.publicationRecords).toEqual([approval]);
  });
  it.each([{ sources: [] }, { sources: [source, source] }, { sources: [{ ...source, sourceQuestionHash: "0".repeat(64) }] }])("leaves missing/duplicate/stale review sources as orphan errors", ({ sources }) => {
    const result = partitionPendingAmcApprovals(new Set(), [approval], sources);
    expect(result.pending).toEqual([]);
    expect(result.publicationRecords).toEqual([approval]);
  });
  it("refuses an invalid signature fingerprint", () => {
    const changed = { ...approval, approvedBy: "Changed Reviewer" };
    expect(partitionPendingAmcApprovals(new Set(), [changed], [source]).pending).toEqual([]);
  });
  it("refuses duplicate approvals rather than silently deduplicating", () => {
    const result = partitionPendingAmcApprovals(new Set(), [approval, approval], [source]);
    expect(result.pending).toEqual([]);
    expect(result.publicationRecords).toHaveLength(2);
  });
  it("verifies all 55 current signatures and serves exactly those AMC questions", () => {
    const report = getPublicationEligibility();
    expect(report.problems).toEqual([]);
    expect(report.pendingPublication).toEqual([]);
    const bank = getExamBank("practice");
    expect(bank.filter((question) => question.examStyle === "amc_style")).toHaveLength(55);
    expect(report.questions.filter((question) => question.examStyle === "amc_style")).toHaveLength(55);
  });
});
