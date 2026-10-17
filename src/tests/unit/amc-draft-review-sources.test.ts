import { readFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMC_EXCLUDED_FROM_REVIEW, buildAmcReviewTarget, loadAmcReviewTargets } from "../../../scripts/lib/amc-review-sources.mjs";
import { parseApprovalCsv, validateApprovalBatch } from "@/features/content-governance/approval-verification";
import { getExamBank } from "@/server/exam-bank";

const reviewDirectory = "docs/reviews/amc-2026-10-17";
async function rows(year: 3 | 5) {
  return parseApprovalCsv(await readFile(`${reviewDirectory}/review-sheet-amc-y${year}-blank.csv`, "utf8"));
}

async function reviewSourceResolver(question: { id: string }) {
  const target = (await loadAmcReviewTargets()).find((entry) => entry.question.id === question.id)!;
  if (JSON.stringify(target.question) !== JSON.stringify(question)) throw new Error("Stale or missing AMC review source");
  return { revision: target.source.revision, sourceManifestHash: target.sourceManifestHash };
}
const privateReviewOptions = { reviewSourceResolver, excludedReviewIds: new Set(Object.keys(AMC_EXCLUDED_FROM_REVIEW)) };
describe("clean AMC pre-publication review bindings", () => {
  it("binds all 60 current drafts without asserting publication or human approval", async () => {
    const targets = await loadAmcReviewTargets();
    expect(targets).toHaveLength(60);
    expect(new Set(targets.map((target) => target.question.id)).size).toBe(60);
    for (const target of targets) {
      expect(target.sourceManifestHash).toMatch(/^[a-f0-9]{64}$/);
      expect(target.source.contentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(target.source.kind).toBe("amc_draft_review_source");
      for (const key of ["publishedAt", "approvedBy", "humanApproval", "reviewChain"]) expect(target.source).not.toHaveProperty(key);
    }
  });

  it.each([[3, 29], [5, 28]] as const)("Year %i has %i bound rows with every reviewer cell blank", async (year, count) => {
    const sheet = await rows(year);
    expect(sheet).toHaveLength(count);
    const targets = await loadAmcReviewTargets();
    for (const row of sheet) {
      expect(row.revision).toBe(1);
      const target = targets.find((target) => target.question.id === row.questionId)!;
      expect(row.contentHash).toBe(target.source.contentHash);
      expect(row.sourceManifestHash).toBe(target.sourceManifestHash);
      for (const cell of ["correctness", "originality", "ageAppropriateness", "decision", "notes"] as const) expect(row[cell]).toBe("");
      expect(AMC_EXCLUDED_FROM_REVIEW[row.questionId]).toBeUndefined();
    }
    const result = await validateApprovalBatch({ ...privateReviewOptions, rows: sheet, questionBank: targets.map((target) => target.question), reviewerFullName: "Binding Test Reviewer", existingApprovals: new Map() });
    expect(result.ok).toBe(true);
    expect(result.unreviewedCount).toBe(count);
    expect(result.newApprovals).toEqual([]);
  });

  it("can validate a signed row against its actual source without writing an approval", async () => {
    const targets = await loadAmcReviewTargets();
    const [blank] = await rows(3);
    const signed = { ...blank, correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" };
    const options = { ...privateReviewOptions, rows: [signed], questionBank: targets.map((target) => target.question), reviewerFullName: "Binding Test Reviewer", existingApprovals: new Map() };
    const valid = await validateApprovalBatch(options);
    expect(valid.ok).toBe(true);
    expect(valid.newApprovals).toHaveLength(1);
    expect(valid.newApprovals[0].sourceManifestHash).toBe(blank.sourceManifestHash);
    const missing = await validateApprovalBatch({ ...privateReviewOptions, ...options, rows: [{ ...signed, sourceManifestHash: null }] });
    expect(missing.ok).toBe(false);
    expect(missing.fatalErrors).toContain(`Stale or missing source manifest hash for '${blank.questionId}'.`);
  });

  it("rejects changed content even if the caller supplies the old signed binding", async () => {
    const targets = await loadAmcReviewTargets();
    const [blank] = await rows(3);
    const changed = targets.map((target) => target.question.id === blank.questionId ? { ...target.question, prompt: `${target.question.prompt} Changed.` } : target.question);
    const result = await validateApprovalBatch({ ...privateReviewOptions, rows: [{ ...blank, correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" }], questionBank: changed, reviewerFullName: "Binding Test Reviewer", existingApprovals: new Map() });
    expect(result.ok).toBe(false);
    expect(result.fatalErrors.join(" ")).toContain("Stale or missing AMC review source");
  });

  it("keeps all three excluded items in the revision loop, even if inserted into an approval sheet", async () => {
    const targets = await loadAmcReviewTargets();
    const revisions = parseApprovalCsv(await readFile(`${reviewDirectory}/revision-loop-amc.csv`, "utf8"));
    expect(revisions.map((row) => row.questionId).sort()).toEqual(Object.keys(AMC_EXCLUDED_FROM_REVIEW).sort());
    expect(revisions.every((row) => row.decision === "revise")).toBe(true);
    const result = await validateApprovalBatch({ ...privateReviewOptions, rows: revisions.map((row) => ({ ...row, correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" })), questionBank: targets.map((target) => target.question), reviewerFullName: "Binding Test Reviewer", existingApprovals: new Map() });
    expect(result.ok).toBe(false);
    expect(result.fatalErrors).toHaveLength(3);
    expect(result.newApprovals).toEqual([]);
    expect((await rows(3)).length + (await rows(5)).length + revisions.length).toBe(60);
  });

  it("refuses stale or duplicate registered review sources", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "amc-review-source-"));
    try {
      for (const directory of ["content/roadmap-drafts", "content/review-sources/amc"]) await mkdir(path.join(root, directory), { recursive: true });
      for (const year of [3, 5]) {
        for (const file of [`content/roadmap-drafts/amc-y${year}-draft.json`, `content/review-sources/amc/y${year}.json`]) await writeFile(path.join(root, file), await readFile(file));
      }
      const file = path.join(root, "content/review-sources/amc/y3.json");
      const sources = JSON.parse(await readFile(file, "utf8"));
      const original = sources[0].sourceQuestionHash;
      sources[0].sourceQuestionHash = "0".repeat(64);
      await writeFile(file, JSON.stringify(sources));
      await expect(loadAmcReviewTargets(root)).rejects.toThrow("Stale AMC review source");
      sources[0].sourceQuestionHash = original;
      sources[1] = sources[0];
      await writeFile(file, JSON.stringify(sources));
      await expect(loadAmcReviewTargets(root)).rejects.toThrow("Duplicate AMC review source identity");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("refuses an AMC source whose file/year identity was swapped", async () => {
    const raw = JSON.parse(await readFile("content/roadmap-drafts/amc-y3-draft.json", "utf8")).questions[0];
    expect(() => buildAmcReviewTarget(raw, "content/roadmap-drafts/amc-y5-draft.json")).toThrow("mismatch");
  });

  it("still serves zero AMC questions", () => {
    const bank = getExamBank("practice");
    expect(bank.length).toBeGreaterThan(0);
    expect(bank.filter((question) => question.examStyle === "amc_style")).toEqual([]);
  });
});
