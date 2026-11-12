import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { parseApprovalCsv, validateReviewedApprovalRow } from "@/features/content-governance/approval-verification";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";

/**
 * The immutable October 18 package binds the historical release. Current sample
 * sheets are versioned separately below; neither package grants human approval.
 */
const pkg = (p: string) => path.join(process.cwd(), "docs/reviews/scholarship-2026-10-18", p);
const sections = { nr: "nr", maths: "maths", vr: "vr", rc: "rc" } as const;

describe("historical scholarship review package retains its exact source bindings", () => {
  for (const key of Object.keys(sections) as (keyof typeof sections)[]) {
    it(`${key}: the blank sheet binds the canonical published hash and ingested revision, and leaves every decision blank`, () => {
      const originalBytes = readFileSync("docs/reviews/scholarship-sample-2026-10-21/release-preparation/packet-reviewed-original.json");
      expect(createHash("sha256").update(originalBytes).digest("hex")).toBe("c82c57d77f099f326b187b37f1943a46b1b87dc5f5fe3addb3af9dbba18cd2bf");
      const original = JSON.parse(originalBytes.toString("utf8")) as { id: string; prompt: string }[];
      // Exactly one prompt was subsequently amended. All other publication fields
      // remain unchanged; the original answer-withheld packet preserves that prompt.
      const questions = loadScholarshipDraftQuestions(key).map(q => q.id === "scholarship-y6-maths-014"
        ? { ...q, prompt: original.find(item => item.id === q.id)!.prompt } : q);
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

describe("current sample pre-stage review sheet", () => {
  it("binds all 12 current publication and candidate hashes, with no invented provenance or decisions", () => {
    const root = "docs/reviews/scholarship-sample-2026-10-22";
    const identities = JSON.parse(readFileSync("src/features/admin-review/releases/scholarship-2026-10-22.json", "utf8"));
    const manifest = JSON.parse(readFileSync("docs/reviews/scholarship-sample-2026-10-21/approval-manifest.json", "utf8"));
    const binding = JSON.parse(readFileSync(`${root}/preview-binding.json`, "utf8"));
    expect(createHash("sha256").update(readFileSync("docs/reviews/scholarship-sample-2026-10-21/approval-manifest.json")).digest("hex")).toBe(binding.manifestSha256);
    const bytes = readFileSync(`${root}/review-sheet-sample-prestage-blank.csv`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(binding.sheetSha256);
    const rows = parseApprovalCsv(bytes.toString("utf8"));
    expect(rows).toHaveLength(12);
    expect(rows.map(row => row.questionId)).toEqual(manifest.items.map((item: { id: string }) => item.id));
    const questions = Object.values(sections).flatMap(key => loadScholarshipDraftQuestions(key));
    for (const row of rows) {
      const question = questions.find(q => q.id === row.questionId)!;
      expect(row.contentHash, question.id).toBe(canonicalQuestionHash(question));
      expect(row.contentHash, question.id).toBe(identities.questions[question.id].publishedContentHash);
      expect(bytes.toString("utf8")).toContain(`${question.id},${identities.questions[question.id].candidateHash},${row.contentHash},,,,,,,`);
      expect(row.revision).toBeUndefined();
      expect(row.sourceManifestHash).toBeNull();
      for (const field of [row.correctness, row.originality, row.ageAppropriateness, row.decision, row.notes]) expect(field ?? "").toBe("");
      // Even filling decision cells cannot make a pre-stage row publishable.
      const filled = { ...row, correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" };
      expect(validateReviewedApprovalRow(filled, "Reviewer Name", { questionId: question.id, contentHash: row.contentHash!, revision: 0, sourceManifestHash: "f".repeat(64) })).toContain(`Stale or missing revision for '${question.id}'.`);
    }
    expect(binding.publicationEnabled).toBe(false);
    expect(binding.ownerApprovalRecorded).toBe(false);
  });
});

describe("difficulty decision sheet", () => {
  const lines = readFileSync(pkg("difficulty/difficulty-decision-sheet.csv"), "utf8").trim().split("\n");
  const rows = lines.slice(1).map((line) => line.split(","));

  it("covers all 160 items exactly once with every decision cell blank", () => {
    expect(rows).toHaveLength(160);
    expect(new Set(rows.map((r) => r[0])).size).toBe(160);
    const status = JSON.parse(readFileSync(pkg("status.json"), "utf8")) as { items: { id: string }[] };
    expect(new Set(rows.map((r) => r[0]))).toEqual(new Set(status.items.map((i) => i.id)));
    // The last two columns (Vish's decision and notes) and the external reviewer's rating are empty: nothing is decided here.
    for (const r of rows) {
      expect(r[r.length - 1], r[0]).toBe("");
      expect(r[r.length - 2], r[0]).toBe("");
    }
  });

  it("gives every item the gate would block today an advisory label, and matches the estimator file", () => {
    const blocked = rows.filter((r) => /^blocked_/.test(r[5]!));
    expect(blocked).toHaveLength(78);
    for (const r of blocked) expect(["easy", "medium", "challenging"], r[0]).toContain(r[7]);
    const estimator = readFileSync(pkg("difficulty/estimator-all-160.csv"), "utf8").trim().split("\n").slice(1);
    expect(estimator.filter((l) => /,blocked_/.test(l))).toHaveLength(78);
  });

  it("only ever offers the estimator's own label as the one that clears the gate", () => {
    for (const r of rows.filter((x) => x[6] !== "")) expect(r[6], r[0]).toBe(r[4]);
  });
});
