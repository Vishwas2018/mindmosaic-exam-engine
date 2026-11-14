import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REVIEW_DIR = "docs/reviews/scholarship-2026-10-18";
const read = (f: string) => readFileSync(path.join(REVIEW_DIR, f), "utf8");

const PACKAGE_DOCS = [
  "SCHOLARSHIP-160-READINESS.md",
  "PROVENANCE-AND-ADMISSION-ROUTE-MATRIX.md",
  "NUMERICAL-40-CRITICAL-PATH-PLAN.md",
  "VERBAL-READING-80-EXTERNAL-REVIEW-REPORT.md",
  "NUMERICAL-40-OWNER-REVIEW.md",
  "MATHEMATICS-40-OWNER-REVIEW.md",
] as const;

/** Blanket claims that a stored key and solver match cannot support, plus provenance claims PR #78 review rejected. */
const UNSUPPORTED_CLAIMS: ReadonlyArray<[string, RegExp]> = [
  ["blanket unique-solution claim", /Prompt has a unique mathematical solution/i],
  ["blanket distractor claim", /Distractors are plausible and distinct/i],
  ["blanket curriculum claim", /Victorian Curriculum Level 6 aligned/i],
  ["blanket unambiguity count", /\d+ of \d+ admit a single defensible answer/i],
  ["'key matches' report line", /\(key matches\)/i],
  ["generated-in-Claude-family as fact", /generated in the Anthropic Claude family/i],
  ["all 160 originated from Claude as fact", /All 160 (?:were|are) (?:original )?(?:generated|originated)[^.\n]*Claude/i],
  ["unsupported 100% recompute claim", /160 \(100%\)/],
  ["'independent' self-description of the audit agent", /independent AI-generated advisory analysis by Antigravity/i],
  ["named approver in an example", /Vishwas Joshi/],
  ["nonexistent signed approval sheet", /review-sheet-scholarship-y6-nr-signed\.csv|nr-40-ids\.txt/],
];

describe("PR #78 review package: unsupported claims are absent", () => {
  it.each(PACKAGE_DOCS)("%s contains none of the rejected claims", (file) => {
    const text = read(file);
    for (const [label, re] of UNSUPPORTED_CLAIMS) expect(re.test(text), `${file}: ${label}`).toBe(false);
  });

  it("the plan and readiness report offer no publication, approval or assembly command", () => {
    for (const file of ["NUMERICAL-40-CRITICAL-PATH-PLAN.md", "SCHOLARSHIP-160-READINESS.md"]) {
      const text = read(file);
      expect(text, file).not.toMatch(/questions:publish|questions:assemble|questions:review-ingest|questions:requeue|questions:pipeline|--reviewer/);
    }
  });

  it("the plan does not propose automatic expansion to all 40 Numerical Reasoning items", () => {
    const plan = read("NUMERICAL-40-CRITICAL-PATH-PLAN.md");
    expect(plan).toMatch(/NOT authorised, NOT adopted/);
    expect(plan).not.toMatch(/expands? (?:the )?(?:`?deterministic_legacy_admission`? )?(?:scope|route)[^.\n]*to (?:cover )?all 40/i);
    expect(plan).toMatch(/Class B and Class C are unresolved/);
  });

  it("every file path the plan, matrix and readiness report cite exists, or is declared a future artefact", () => {
    const FUTURE = new Set(["qualified-review-records.json"]);
    const candidates = (file: string) => [...read(file).matchAll(/`([A-Za-z0-9_./-]+\.(?:md|json|mts|ts|csv|html|txt))`/g)].map((m) => m[1]);
    for (const file of ["NUMERICAL-40-CRITICAL-PATH-PLAN.md", "PROVENANCE-AND-ADMISSION-ROUTE-MATRIX.md", "SCHOLARSHIP-160-READINESS.md"]) {
      for (const ref of candidates(file)) {
        if (FUTURE.has(path.basename(ref))) continue;
        const tries = [ref, path.join(REVIEW_DIR, ref), path.join(REVIEW_DIR, "answer-blind", ref), path.join(REVIEW_DIR, "answer-key-companions", ref)];
        expect(tries.some((p) => existsSync(p)), `${file} cites nonexistent path ${ref}`).toBe(true);
      }
    }
  });

  it("owner packs state evidence statuses per question instead of blanket verification", () => {
    for (const file of ["NUMERICAL-40-OWNER-REVIEW.md", "MATHEMATICS-40-OWNER-REVIEW.md"]) {
      const text = read(file);
      expect(text.match(/\| Stem-to-solver semantic verification \| not_established \|/g)?.length).toBe(40);
      expect(text.match(/\| Age and curriculum appropriateness \| not_established \|/g)?.length).toBe(40);
      expect(text.match(/\| Machine-verified result \| verified \|/g)?.length).toBe(40);
    }
  });
});
