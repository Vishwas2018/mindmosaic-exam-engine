import { describe, expect, it } from "vitest";

import { PROGRAMS } from "@/features/catalogue/catalogue";
import {
  EXAM_PATTERNS,
  STARTABLE_EXAM_PATTERNS,
  examPatternSchema,
  getExamPattern,
  groupExamPatterns,
  hasVisibleSections,
  parseProgrammeId,
  sourcesInSittingOrder,
} from "@/features/exam-engine/exam-patterns";
import { patternSubjectName } from "@/features/exam-engine/exam-patterns/pattern-presentation";

/**
 * The registry is the transcription of `docs/content-status/exam-patterns.md`
 * §2-§4. These assert both that the transcription is internally consistent,
 * and — more importantly — that the rules which keep it honest still bite: a
 * pattern cannot claim a shape its sources do not add up to, cannot draw from
 * a programme that does not exist, and cannot omit an adaptation it actually
 * makes.
 */

/** A minimal valid pattern to mutate one field of at a time. */
function validPattern(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-pattern",
    label: "NAPLAN-style Year 3 Numeracy — full-length practice",
    examStyle: "naplan_style",
    yearLevel: 3,
    presentation: "full_length_practice",
    basis: "official_length_and_time",
    adaptations: ["fixed_path"],
    questionCount: 10,
    timeMinutes: 15,
    sources: [
      { id: "numeracy", programmeId: "naplan-y3-numeracy", count: 10, display: "merged" },
    ],
    ...overrides,
  };
}

describe("exam pattern registry", () => {
  it("declares every pattern the doc lists, and no writing pattern is startable", () => {
    const ids = EXAM_PATTERNS.map((pattern) => pattern.id);
    expect(ids).toEqual([...new Set(ids)]);

    /* §2 and §3: six NAPLAN papers, five ICAS papers per year plus the two
       English halves, and four deferred writing tasks. */
    expect(EXAM_PATTERNS).toHaveLength(24);
    expect(EXAM_PATTERNS.filter((pattern) => pattern.status === "deferred")).toHaveLength(4);
    expect(STARTABLE_EXAM_PATTERNS.every((pattern) => pattern.status === "available")).toBe(
      true,
    );
    for (const pattern of EXAM_PATTERNS) {
      if (pattern.id.includes("writing")) {
        expect(pattern.status).toBe("deferred");
      }
    }
  });

  it.each(EXAM_PATTERNS.map((pattern) => [pattern.id, pattern] as const))(
    "%s: source counts sum to its question count",
    (_id, pattern) => {
      const total = pattern.sources.reduce((sum, source) => sum + source.count, 0);
      expect(total).toBe(pattern.questionCount);
    },
  );

  it.each(EXAM_PATTERNS.map((pattern) => [pattern.id, pattern] as const))(
    "%s: every programmeId names a sitting the catalogue also knows",
    (_id, pattern) => {
      for (const source of pattern.sources) {
        const scope = parseProgrammeId(source.programmeId);
        expect(scope, `${source.programmeId} did not parse`).toBeDefined();
        expect(scope!.yearLevel).toBe(pattern.yearLevel);
        expect(scope!.examStyle).toBe(pattern.examStyle);
        /* The catalogue addresses the same cell by scope rather than by the
           doc's id spelling (its own slugs use "g3" and hyphens), so this
           matches on the three facts both vocabularies agree on. `writing`
           has no catalogue program by design — the engine cannot isolate it,
           which is why every writing pattern is deferred. */
        if (scope!.subject === undefined) {
          expect(pattern.status).toBe("deferred");
          continue;
        }
        const inCatalogue = PROGRAMS.some(
          (program) =>
            program.scope?.yearLevel === scope!.yearLevel &&
            program.scope.examStyle === scope!.examStyle &&
            program.scope.subject === scope!.subject,
        );
        expect(inCatalogue, `${source.programmeId} is not in the catalogue`).toBe(true);
      }
    },
  );

  it.each(EXAM_PATTERNS.map((pattern) => [pattern.id, pattern] as const))(
    "%s: declares its adaptations and a readable subject name",
    (_id, pattern) => {
      expect(Array.isArray(pattern.adaptations)).toBe(true);
      expect(pattern.adaptations).toEqual([...new Set(pattern.adaptations)]);
      expect(patternSubjectName(pattern).length).toBeGreaterThan(0);
      expect(patternSubjectName(pattern)).not.toBe(pattern.label);
    },
  );

  it("every NAPLAN pattern declares fixed_path", () => {
    for (const pattern of EXAM_PATTERNS.filter(
      (candidate) => candidate.examStyle === "naplan_style",
    )) {
      expect(pattern.adaptations, pattern.id).toContain("fixed_path");
    }
  });

  it("every spelling-bearing pattern declares text_only_spelling", () => {
    const spellingBearing = EXAM_PATTERNS.filter((pattern) =>
      pattern.sources.some(
        (source) =>
          parseProgrammeId(source.programmeId)?.subjectId === "spelling" ||
          (source.filters?.strandIn ?? []).includes("Spelling"),
      ),
    );
    /* NAPLAN language x2 and ICAS Spelling Bee x2. */
    expect(spellingBearing.map((pattern) => pattern.id).sort()).toEqual([
      "icas-y3-spelling-full",
      "icas-y5-spelling-full",
      "naplan-y3-language-full",
      "naplan-y5-language-full",
    ]);
    for (const pattern of spellingBearing) {
      expect(pattern.adaptations, pattern.id).toContain("text_only_spelling");
    }
  });

  it("both ICAS English patterns declare internal_english_mix and show no sections", () => {
    for (const id of ["icas-y3-english-full", "icas-y5-english-full"]) {
      const pattern = getExamPattern(id)!;
      expect(pattern.adaptations).toContain("internal_english_mix");
      /* The 27/18 and 30/20 quotas are internal composition controls. The
         child sits one undivided English paper, so neither source may be a
         visible section and there is no sectionOrder to render. */
      expect(pattern.sources.every((source) => source.display === "merged")).toBe(true);
      expect(pattern.sectionOrder).toBeUndefined();
      expect(hasVisibleSections(pattern)).toBe(false);
    }
    expect(getExamPattern("icas-y3-english-full")!.sources.map((s) => s.count)).toEqual([
      27, 18,
    ]);
    expect(getExamPattern("icas-y5-english-full")!.sources.map((s) => s.count)).toEqual([
      30, 20,
    ]);
  });

  it("NAPLAN language sits spelling before grammar and punctuation", () => {
    for (const id of ["naplan-y3-language-full", "naplan-y5-language-full"]) {
      const pattern = getExamPattern(id)!;
      expect(hasVisibleSections(pattern)).toBe(true);
      expect(pattern.adaptations).toContain("no_section_lock");
      expect(pattern.sectionOrder?.map((section) => section.id)).toEqual([
        "spelling",
        "grammar-and-punctuation",
      ]);
      /* Not locked, and the schema will not let it claim to be: the engine
         cannot stop a candidate returning to a completed section. */
      expect(pattern.sectionOrder?.every((section) => section.locked === false)).toBe(true);
      expect(sourcesInSittingOrder(pattern).map((source) => source.id)).toEqual([
        "spelling",
        "grammar-and-punctuation",
      ]);
      /* Spelling vs grammar-and-punctuation only. The 18/9 grammar-to-
         punctuation split is deliberately NOT enforced — see the doc's note
         on the missing subdivision. */
      expect(pattern.sources.map((source) => source.count)).toEqual([25, 27]);
      expect(pattern.sources[0]!.filters?.strandIn).toEqual(["Spelling"]);
    }
  });

  it("the single-programme ICAS English halves are practice modules", () => {
    for (const id of [
      "icas-y3-reading-module",
      "icas-y3-language-module",
      "icas-y5-reading-module",
      "icas-y5-language-module",
    ]) {
      const pattern = getExamPattern(id)!;
      expect(pattern.presentation).toBe("practice_module");
      /* Their size is our own composition choice, not a published figure. */
      expect(pattern.basis).toBe("internal");
      expect(pattern.label).toContain("practice module");
    }
  });

  it("no label calls a paper official, real or a simulation", () => {
    for (const pattern of EXAM_PATTERNS) {
      expect(pattern.label).not.toMatch(/official|real paper|simulation|mock|full paper/i);
    }
  });

  it("groups by year level then exam type", () => {
    const groups = groupExamPatterns();
    expect(groups.map((group) => group.yearLevel)).toEqual([3, 5]);
    for (const group of groups) {
      expect(group.styles.map((style) => style.examStyle)).toEqual([
        "naplan_style",
        "icas_style",
      ]);
      for (const style of group.styles) {
        expect(
          style.patterns.every(
            (pattern) =>
              pattern.yearLevel === group.yearLevel &&
              pattern.examStyle === style.examStyle,
          ),
        ).toBe(true);
      }
    }
    expect(groups.flatMap((g) => g.styles.flatMap((s) => s.patterns))).toHaveLength(
      EXAM_PATTERNS.length,
    );
  });
});

describe("exam pattern schema", () => {
  it("accepts a well-formed pattern", () => {
    expect(examPatternSchema.safeParse(validPattern()).success).toBe(true);
  });

  it("rejects sources that do not sum to the question count", () => {
    const result = examPatternSchema.safeParse(validPattern({ questionCount: 11 }));
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("Source counts total 10");
  });

  it("rejects a programmeId that is not a real sitting", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        sources: [
          /* NAPLAN sets no Science paper at any year. */
          { id: "s", programmeId: "naplan-y3-science", count: 10, display: "merged" },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("does not name a real sitting");
  });

  it("rejects a source whose year or style disagrees with the pattern", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        sources: [
          { id: "s", programmeId: "naplan-y5-numeracy", count: 10, display: "merged" },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("does not match the pattern's");
  });

  it("rejects a strand filter naming a strand the subject does not have", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        sources: [
          {
            id: "s",
            programmeId: "naplan-y3-numeracy",
            count: 10,
            filters: { strandIn: ["Punctuation"] },
            display: "merged",
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("is not registered for subject");
  });

  it("rejects a NAPLAN pattern that does not declare fixed_path", () => {
    const result = examPatternSchema.safeParse(validPattern({ adaptations: [] }));
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("must declare 'fixed_path'");
  });

  it("rejects a spelling source that does not declare text_only_spelling", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        examStyle: "icas_style",
        adaptations: [],
        sources: [
          { id: "s", programmeId: "icas-y3-spelling", count: 10, display: "merged" },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("text_only_spelling");
  });

  it("rejects merging two programmes without declaring internal_english_mix", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        examStyle: "icas_style",
        adaptations: [],
        sources: [
          { id: "r", programmeId: "icas-y3-reading", count: 6, display: "merged" },
          { id: "l", programmeId: "icas-y3-language", count: 4, display: "merged" },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("internal_english_mix");
  });

  it("rejects a section claiming to be locked", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        adaptations: ["fixed_path", "no_section_lock"],
        sources: [
          { id: "s", programmeId: "naplan-y3-numeracy", count: 10, display: "section" },
        ],
        sectionOrder: [{ id: "s", label: "S", sourceIds: ["s"], locked: true }],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects showing a merged source as a section", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        adaptations: ["fixed_path", "no_section_lock"],
        sectionOrder: [{ id: "s", label: "S", sourceIds: ["numeracy"], locked: false }],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("must not be shown as a section");
  });

  it("rejects visible sections without the no_section_lock adaptation", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        sources: [
          { id: "s", programmeId: "naplan-y3-numeracy", count: 10, display: "section" },
        ],
        sectionOrder: [{ id: "s", label: "S", sourceIds: ["s"], locked: false }],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("no_section_lock");
  });

  it("rejects a stimulus rule whose bounds cannot reach the question count", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        questionCount: 100,
        sources: [
          { id: "numeracy", programmeId: "naplan-y3-numeracy", count: 100, display: "merged" },
        ],
        stimulusRule: {
          selectWholeGroup: true,
          questionsPerStimulus: [4, 7],
          distinctStimuli: [6, 7],
        },
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("cannot be composed from");
  });

  it("refuses to mark a pattern available when its subject cannot be isolated", () => {
    const result = examPatternSchema.safeParse(
      validPattern({
        questionCount: 1,
        sources: [
          { id: "w", programmeId: "naplan-y3-writing", count: 1, display: "merged" },
        ],
      }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("cannot be isolated");
  });
});
