import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { parseApprovalCsv, validateReviewedApprovalRow } from "@/features/content-governance/approval-verification";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";

/**
 * The review package under docs/reviews/scholarship-2026-10-18 is generated from the drafts by
 * scripts/scholarship-release-package.mts. If a draft changes and the package is not regenerated, these fail,
 * so a human can never sign a sheet that names content which is no longer the content.
 */
const pkg = (p: string) => path.join(process.cwd(), "docs/reviews/scholarship-2026-10-18", p);
const sections = { nr: "nr", maths: "maths", vr: "vr", rc: "rc" } as const;

describe("scholarship review package matches the current drafts", () => {
  for (const key of Object.keys(sections) as (keyof typeof sections)[]) {
    it(`${key}: the blank sheet binds the canonical published hash and ingested revision, and leaves every decision blank`, () => {
      const questions = loadScholarshipDraftQuestions(key);
      const rows = parseApprovalCsv(readFileSync(pkg(`review-sheets/review-sheet-scholarship-y6-${key}-blank.csv`), "utf8"));
      expect(rows.map((r) => r.questionId)).toEqual(questions.map((q) => q.id));
      for (const [index, row] of rows.entries()) {
        const q = questions[index];
        expect(row.contentHash, q.id).toBe(canonicalQuestionHash(q));
        expect(row.revision, q.id).toBe(0);
        expect(row.decision ?? "", q.id).toBe("");
        expect(row.correctness ?? "", q.id).toBe("");
        // A filled copy of the row is exactly what questions:publish accepts for this content.
        const filled = { ...row, correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" };
        expect(validateReviewedApprovalRow(filled, "Reviewer Name", { questionId: q.id, contentHash: canonicalQuestionHash(q), revision: 0 }), q.id).toEqual([]);
        // An unfilled row can never approve anything.
        expect(validateReviewedApprovalRow(row, "Reviewer Name", { questionId: q.id, contentHash: canonicalQuestionHash(q), revision: 0 }).length, q.id).toBeGreaterThan(0);
      }
    });
  }

  it("classifies all 160 items exactly once, with nothing marked approved", () => {
    const status = JSON.parse(readFileSync(pkg("status.json"), "utf8")) as { totals: Record<string, number>; items: { id: string; bucket: string }[] };
    expect(status.items).toHaveLength(160);
    expect(new Set(status.items.map((i) => i.id)).size).toBe(160);
    expect(Object.values(status.totals).reduce((a, b) => a + b, 0)).toBe(160);
    expect(status.totals.previously_approved_valid_evidence ?? 0).toBe(0);
    const ids = new Set(Object.values(sections).flatMap((k) => loadScholarshipDraftQuestions(k).map((q) => q.id)));
    expect(new Set(status.items.map((i) => i.id))).toEqual(ids);
  });

  it("keeps the external packet in step with its manifest and free of answers, explanations and labels", () => {
    const packet = readFileSync(pkg("external-review/packet.txt"), "utf8");
    const manifest = JSON.parse(readFileSync(pkg("external-review/packet-manifest.json"), "utf8")) as { packetSha256: string };
    expect(createHash("sha256").update(packet).digest("hex")).toBe(manifest.packetSha256);
    for (const key of ["vr", "rc"] as const) {
      for (const q of loadScholarshipDraftQuestions(key)) {
        expect(packet, q.id).toContain(`ID: ${q.id}`);
        expect(packet, `${q.id} explanation`).not.toContain(q.explanation);
      }
    }
    // The header sentence names what is withheld; the items themselves must contain none of it.
    const items = packet.slice(packet.indexOf("\nVERBAL REASONING"));
    expect(items).not.toMatch(/\b(correct answer|answer key|declared key|difficulty:)/i);
    const prompt = readFileSync(pkg("external-review/prompt-with-packet.txt"), "utf8");
    expect(prompt).toContain(manifest.packetSha256);
  });

  it("records the three difficulty views for all 35 previously blocked items", () => {
    const rows = readFileSync(pkg("difficulty/blocked-35-recommendations.csv"), "utf8").trim().split("\n");
    expect(rows).toHaveLength(36);
    const estimator = readFileSync(pkg("difficulty/estimator-all-160.csv"), "utf8").trim().split("\n");
    expect(estimator).toHaveLength(161);
    const blocked = estimator.filter((l) => /blocked_/.test(l) && /,(nr|maths),/.test(l));
    expect(blocked).toHaveLength(35);
  });
});
