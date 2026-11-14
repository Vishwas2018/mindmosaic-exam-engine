// @vitest-environment node
import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: false }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/server/exam-bank", () => ({
  getExamBank: vi.fn(() => []),
  getPatternReadiness: vi.fn(() => ({ marker: "default" })),
}));

import { EXAM_PATTERNS, getExamPattern, selectPatternQuestions } from "@/features/exam-engine/exam-patterns";
import { scoreExam } from "@/features/exam-engine/scoring";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import {
  getPatternReadinessFor,
  isScholarshipHiddenFor,
  isScholarshipSampleAllowedFor,
  isScholarshipSampleModeActive,
  loadScholarshipSampleQuestions,
  SCHOLARSHIP_SAMPLE_PATTERN_ID,
  SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES,
  visibleExamPatterns,
  withScholarshipSample,
} from "@/server/scholarship-sample-preview";

const ALLOWED = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const ACTIVE_ENV = {
  SCHOLARSHIP_SAMPLE_PREVIEW: "enabled",
  SCHOLARSHIP_SAMPLE_SUPABASE_REF: "devref123",
  PRODUCTION_SUPABASE_PROJECT_REF: "prodref4567",
  NEXT_PUBLIC_SUPABASE_URL: "https://devref123.supabase.co",
  SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: ALLOWED,
  VERCEL_ENV: "preview",
} as const;

const KEYS: Record<string, string> = {
  "scholarship-y6-vr-001": "e",
  "scholarship-y6-vr-016": "d",
  "scholarship-y6-vr-032": "c",
  "scholarship-y6-nr-001": "e",
  "scholarship-y6-nr-022": "e",
  "scholarship-y6-nr-023": "b",
  "scholarship-y6-rc-001": "a",
  "scholarship-y6-rc-002": "c",
  "scholarship-y6-rc-003": "e",
  "scholarship-y6-maths-004": "b",
  "scholarship-y6-maths-007": "a",
  "scholarship-y6-maths-014": "c",
};

afterEach(() => vi.restoreAllMocks());

describe("Scholarship sample preview gate: fail-closed access", () => {
  it("is off by default and in every environment where the flag is not exactly 'enabled'", () => {
    expect(isScholarshipSampleModeActive({})).toBe(false);
    for (const value of ["", "1", "true", "ENABLED", "enabled "]) {
      expect(isScholarshipSampleModeActive({ ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_PREVIEW: value })).toBe(false);
    }
    expect(isScholarshipSampleAllowedFor(ALLOWED, {})).toBe(false);
  });

  it("never activates on Vercel production, whatever else is configured", () => {
    expect(isScholarshipSampleModeActive({ ...ACTIVE_ENV, VERCEL_ENV: "production" })).toBe(false);
    expect(isScholarshipSampleModeActive({ ...ACTIVE_ENV, VERCEL_TARGET_ENV: "production" })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, VERCEL_ENV: "production" })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, VERCEL_ENV: "preview" })).toBe(true);
  });

  it("requires the Supabase project binding to match the configured project", () => {
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_SUPABASE_REF: undefined })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_SUPABASE_REF: "someotherref" })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, NEXT_PUBLIC_SUPABASE_URL: undefined })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, NEXT_PUBLIC_SUPABASE_URL: "https://example.com" })).toBe(false);
    expect(
      isScholarshipSampleAllowedFor(ALLOWED, {
        ...ACTIVE_ENV,
        SCHOLARSHIP_SAMPLE_SUPABASE_REF: "local",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toBe(true);
  });

  it("allows only listed, well-formed user ids", () => {
    expect(isScholarshipSampleAllowedFor(ALLOWED, ACTIVE_ENV)).toBe(true);
    expect(isScholarshipSampleAllowedFor(ALLOWED.toUpperCase(), ACTIVE_ENV)).toBe(true);
    expect(isScholarshipSampleAllowedFor(OTHER, ACTIVE_ENV)).toBe(false);
    expect(isScholarshipSampleAllowedFor(null, ACTIVE_ENV)).toBe(false);
    expect(isScholarshipSampleAllowedFor(undefined, ACTIVE_ENV)).toBe(false);
    expect(isScholarshipSampleAllowedFor("", ACTIVE_ENV)).toBe(false);
    // Malformed entries (including a wildcard) never grant access.
    expect(isScholarshipSampleAllowedFor("*", { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: "*" })).toBe(false);
    expect(isScholarshipSampleAllowedFor("student-1", { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: "student-1" })).toBe(false);
    expect(isScholarshipSampleAllowedFor(OTHER, { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: "" })).toBe(false);
  });

  it("hides every Scholarship pattern from non-allowlisted viewers while active, and nothing else", () => {
    const scholarship = EXAM_PATTERNS.filter((pattern) => pattern.examStyle === "scholarship_style");
    const other = EXAM_PATTERNS.filter((pattern) => pattern.examStyle !== "scholarship_style");
    expect(scholarship.length).toBeGreaterThan(0);
    for (const pattern of scholarship) {
      expect(isScholarshipHiddenFor(pattern, OTHER, ACTIVE_ENV)).toBe(true);
      expect(isScholarshipHiddenFor(pattern, null, ACTIVE_ENV)).toBe(true);
      expect(isScholarshipHiddenFor(pattern, ALLOWED, ACTIVE_ENV)).toBe(false);
    }
    for (const pattern of other) expect(isScholarshipHiddenFor(pattern, OTHER, ACTIVE_ENV)).toBe(false);
    expect(visibleExamPatterns(OTHER, ACTIVE_ENV).some((pattern) => pattern.examStyle === "scholarship_style")).toBe(false);
    expect(visibleExamPatterns(ALLOWED, ACTIVE_ENV)).toHaveLength(EXAM_PATTERNS.length);
  });

  it("leaves production behaviour unchanged: registry, readiness and bank are returned untouched", async () => {
    expect(visibleExamPatterns(null, {})).toEqual(EXAM_PATTERNS);
    expect(visibleExamPatterns(OTHER, { ...ACTIVE_ENV, VERCEL_ENV: "production" })).toEqual(EXAM_PATTERNS);
    const bank = [] as const;
    expect(await withScholarshipSample(bank, ALLOWED, {})).toBe(bank);
    expect(await withScholarshipSample(bank, OTHER, ACTIVE_ENV)).toBe(bank);
    // process.env here has no flag, so readiness is the default one.
    expect(await getPatternReadinessFor(ALLOWED)).toEqual({ marker: "default" });
  });
});

describe("Scholarship sample preview: content integrity", () => {
  it("pins exactly the 12 sample questions to the import manifest's raw-question hashes", () => {
    const manifest = JSON.parse(
      readFileSync("docs/reviews/legacy-content-provenance-phase1/sample-import-manifest.json", "utf8"),
    ) as { items: { id: string; rawQuestionHash: string }[] };
    const manifestHashes = Object.fromEntries(manifest.items.map((item) => [item.id, item.rawQuestionHash]));
    expect(Object.keys(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES)).toHaveLength(12);
    expect(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES).toEqual(manifestHashes);

    const pattern = getExamPattern(SCHOLARSHIP_SAMPLE_PATTERN_ID)!;
    const patternIds = pattern.sources.flatMap((source) => source.filters!.questionIds!);
    expect([...patternIds].sort()).toEqual(Object.keys(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES).sort());
  });

  it("serves exactly 12 unaltered questions: 3+3+3+3, shared passage, original answer keys", async () => {
    const sample = await loadScholarshipSampleQuestions();
    expect(sample).toHaveLength(12);
    expect(sample.map((question) => question.id).sort()).toEqual(Object.keys(KEYS).sort());

    const bySubject = (subject: string) => sample.filter((question) => question.metadata.subject === subject);
    expect(bySubject("verbal_reasoning")).toHaveLength(3);
    expect(bySubject("numerical_reasoning")).toHaveLength(3);
    expect(bySubject("reading")).toHaveLength(3);
    expect(bySubject("numeracy")).toHaveLength(3);

    const passages = bySubject("reading").map((question) => question.stimulus);
    expect(passages.every((stimulus) => stimulus?.title === "The Estuary Watchers")).toBe(true);
    expect(new Set(passages.map((stimulus) => stimulus?.body)).size).toBe(1);

    expect(scoreExam(sample, KEYS)).toMatchObject({ availableMarks: 12, correctCount: 12, incorrectCount: 0 });
    for (const question of sample) expect(question.examStyle).toBe("scholarship_style");
  });

  it("lets the existing pattern selection draw the whole 18-minute paper from the sample alone", async () => {
    const sample = await loadScholarshipSampleQuestions();
    const pattern = getExamPattern(SCHOLARSHIP_SAMPLE_PATTERN_ID)!;
    expect(pattern.timeMinutes).toBe(18);
    expect(pattern.questionCount).toBe(12);
    const draw = selectPatternQuestions(sample, pattern, "preview-seed");
    expect(draw.ok).toBe(true);
    if (draw.ok) expect(draw.questions).toHaveLength(12);
  });

  it("adds the sample for an allowlisted user only, without duplicating an existing id", async () => {
    const sample = await loadScholarshipSampleQuestions();
    const withSample = await withScholarshipSample([], ALLOWED, ACTIVE_ENV);
    expect(withSample).toHaveLength(12);
    const deduped = await withScholarshipSample([sample[0]!], ALLOWED, ACTIVE_ENV);
    expect(deduped).toHaveLength(12);
  });

  it("refuses to serve anything (empty sample) if a source question drifts from its pinned hash", async () => {
    vi.resetModules();
    vi.doMock("@/features/question-factory/provenance/content-hash", () => ({ hashJson: () => "0".repeat(64) }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mod = await import("@/server/scholarship-sample-preview");
    expect(await mod.loadScholarshipSampleQuestions()).toHaveLength(0);
    expect(await mod.withScholarshipSample([], ALLOWED, ACTIVE_ENV)).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalled();
    vi.doUnmock("@/features/question-factory/provenance/content-hash");
    vi.resetModules();
  });

  it("serves from a data file whose 12 objects are identical to the drafts (the runtime never imports the drafts)", () => {
    const files = ["verbal-reasoning", "numerical-reasoning", "reading", "mathematics"].map(
      (name) => `content/scholarship-drafts/scholarship-y6-${name}-draft.json`,
    );
    const raws = files.flatMap((file) => (JSON.parse(readFileSync(file, "utf8")) as { questions: { id: string }[] }).questions);
    const copy = (JSON.parse(readFileSync("src/server/scholarship-sample-questions.json", "utf8")) as { questions: { id: string }[] }).questions;
    expect(copy.map((q) => q.id).sort()).toEqual(Object.keys(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES).sort());
    // Every served object hashes to its pinned manifest revision. Where the draft file has moved on from that revision
    // the draft is the stale side: today only maths-014, whose pinned prompt revision lives in PR #73 and not yet on dev.
    const drifted: string[] = [];
    for (const question of copy) {
      expect(hashJson(question)).toBe(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES[question.id]);
      const draft = raws.find((raw) => raw.id === question.id);
      if (hashJson(draft) === SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES[question.id]) expect(question).toEqual(draft);
      else drifted.push(question.id);
    }
    expect(drifted.filter((id) => id !== "scholarship-y6-maths-014")).toEqual([]);
  });
});

describe("Scholarship sample preview gate: deployment-context and identity hardening", () => {
  it("only serves in allowlisted non-production contexts; production and unknown contexts refuse", () => {
    for (const context of ["preview", "development"]) {
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, VERCEL_ENV: context })).toBe(true);
    }
    for (const context of ["production", "staging", "prod", "unknown"]) {
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, VERCEL_ENV: context })).toBe(false);
    }
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, VERCEL_TARGET_ENV: "production" })).toBe(false);
  });

  it("with no Vercel context, only a loopback Supabase qualifies (unknown hosting is refused)", () => {
    const noVercel = { ...ACTIVE_ENV, VERCEL_ENV: undefined };
    expect(isScholarshipSampleAllowedFor(ALLOWED, noVercel)).toBe(false);
    expect(
      isScholarshipSampleAllowedFor(ALLOWED, {
        ...noVercel,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SCHOLARSHIP_SAMPLE_SUPABASE_REF: "local",
      }),
    ).toBe(true);
  });

  it("fails closed when the Supabase identity is missing, unparseable, unexpected or on the forbidden list", () => {
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, NEXT_PUBLIC_SUPABASE_URL: undefined })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, NEXT_PUBLIC_SUPABASE_URL: "not a url" })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, NEXT_PUBLIC_SUPABASE_URL: "https://db.example.com" })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_SUPABASE_REF: undefined })).toBe(false);
    expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_SUPABASE_REF: "otherref" })).toBe(false);
    // Preview wrongly bound to the production project: the production ref is on the forbidden list.
    expect(
      isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_FORBIDDEN_SUPABASE_REFS: "x, DEVREF123" }),
    ).toBe(false);
  });

  describe("production-project exclusion (PRODUCTION_SUPABASE_PROJECT_REF)", () => {
    it("is granted when a well-formed production ref is declared and differs from the bound project", () => {
      expect(isScholarshipSampleAllowedFor(ALLOWED, ACTIVE_ENV)).toBe(true);
      /* Declaration is trimmed and case-insensitive. */
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, PRODUCTION_SUPABASE_PROJECT_REF: "  PRODREF4567 " })).toBe(true);
    });

    it("fails closed when the production ref is absent or blank", () => {
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, PRODUCTION_SUPABASE_PROJECT_REF: undefined })).toBe(false);
      for (const blank of ["", "   "]) {
        expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, PRODUCTION_SUPABASE_PROJECT_REF: blank })).toBe(false);
      }
    });

    it("fails closed when the production ref is malformed", () => {
      for (const malformed of [
        "short", // too short to be a project ref
        "https://prodref4567.supabase.co", // a URL, not a ref
        "prodref4567.supabase.co",
        "prodref4567,otherref89", // a list, not a single ref
        "prod ref 4567",
        "prodref-4567",
        "prodref4567/",
        "*",
        "x".repeat(33),
      ]) {
        expect(isScholarshipSampleAllowedFor(ALLOWED, { ...ACTIVE_ENV, PRODUCTION_SUPABASE_PROJECT_REF: malformed })).toBe(false);
      }
    });

    it("refuses the production project under all circumstances (declared ref matches the bound project)", () => {
      const boundToProduction = {
        ...ACTIVE_ENV,
        SCHOLARSHIP_SAMPLE_SUPABASE_REF: "prodref4567",
        NEXT_PUBLIC_SUPABASE_URL: "https://prodref4567.supabase.co",
      };
      expect(isScholarshipSampleAllowedFor(ALLOWED, boundToProduction)).toBe(false);
      /* No other setting can rescue it: not the forbidden list, not a different casing, not another Vercel context. */
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...boundToProduction, SCHOLARSHIP_SAMPLE_FORBIDDEN_SUPABASE_REFS: "unrelated" })).toBe(false);
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...boundToProduction, PRODUCTION_SUPABASE_PROJECT_REF: "PRODREF4567" })).toBe(false);
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...boundToProduction, VERCEL_ENV: "development" })).toBe(false);
    });

    it("a declared ref that differs from the bound project does not by itself grant access (other gates still apply)", () => {
      const mismatched = { ...ACTIVE_ENV, PRODUCTION_SUPABASE_PROJECT_REF: "anotherref99" };
      expect(isScholarshipSampleAllowedFor(ALLOWED, mismatched)).toBe(true);
      expect(isScholarshipSampleAllowedFor(OTHER, mismatched)).toBe(false);
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...mismatched, SCHOLARSHIP_SAMPLE_PREVIEW: "" })).toBe(false);
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...mismatched, VERCEL_ENV: "production" })).toBe(false);
    });

    it("also applies to a local loopback stack: the declaration is still required", () => {
      const local = {
        ...ACTIVE_ENV,
        VERCEL_ENV: undefined,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SCHOLARSHIP_SAMPLE_SUPABASE_REF: "local",
      };
      expect(isScholarshipSampleAllowedFor(ALLOWED, local)).toBe(true);
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...local, PRODUCTION_SUPABASE_PROJECT_REF: undefined })).toBe(false);
      expect(isScholarshipSampleAllowedFor(ALLOWED, { ...local, PRODUCTION_SUPABASE_PROJECT_REF: "not a ref" })).toBe(false);
    });

    it("an invalid declaration serves nothing: no sample questions, and Scholarship stays hidden from the allowlisted user's peers", async () => {
      const broken = { ...ACTIVE_ENV, PRODUCTION_SUPABASE_PROJECT_REF: undefined };
      const bank = Object.freeze([]);
      expect(await withScholarshipSample(bank, ALLOWED, broken)).toBe(bank);
      const scholarship = EXAM_PATTERNS.find((pattern) => pattern.examStyle === "scholarship_style")!;
      expect(isScholarshipHiddenFor(scholarship, ALLOWED, broken)).toBe(true);
      expect(visibleExamPatterns(ALLOWED, broken).some((pattern) => pattern.examStyle === "scholarship_style")).toBe(false);
    });
  });

  it("rejects anonymous viewers and malformed allowlist entries", () => {
    expect(isScholarshipSampleAllowedFor(null, ACTIVE_ENV)).toBe(false);
    expect(isScholarshipSampleAllowedFor(undefined, ACTIVE_ENV)).toBe(false);
    expect(isScholarshipSampleAllowedFor("student@example.com", { ...ACTIVE_ENV, SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: "student@example.com,*" })).toBe(false);
  });

  it("never lets generic selection see the sample: the ordinary bank stays unchanged for everyone", async () => {
    const bank = Object.freeze([]);
    expect(await withScholarshipSample(bank, OTHER, ACTIVE_ENV)).toBe(bank);
    expect(await withScholarshipSample(bank, ALLOWED, { ...ACTIVE_ENV, VERCEL_ENV: "production" })).toBe(bank);
    const served = await withScholarshipSample(bank, ALLOWED, ACTIVE_ENV);
    expect(served.map((question) => question.id).sort()).toEqual(Object.keys(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES).sort());
  });
});
