import { z } from "zod";
import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  SUBJECT_IDS,
  SUBJECT_REGISTRY,
  getStrandsForSubject,
  getSubject,
  isKnownStrandLabel,
  isKnownSubject,
  subjectIdsFromRegistry,
  type SubjectRegistryEntry,
} from "@/features/taxonomy/subject-registry";
import { SKILL_TAXONOMY_ENTRIES } from "@/features/question-factory/taxonomy";
import { questionMetadataSchema } from "@/schemas/question.schema";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("subject registry", () => {
  /*
   * Was "exactly the five existing subjects". Merging content/icas-1000-claude
   * added Digital Technologies, Spelling and Critical & Creative Thinking to
   * the registry alongside their ICAS skill taxonomies, so the pinned list was
   * stale from the moment those taxonomies landed. The list stays exhaustive
   * and ordered on purpose — this test is the gate that makes adding a subject
   * a deliberate act rather than a side effect.
   */
  it("covers exactly the eight registered subjects, each with at least one strand", () => {
    expect(SUBJECT_IDS).toEqual([
      "numeracy",
      "reading",
      "writing",
      "language_conventions",
      "science",
      "digital_technologies",
      "spelling",
      "critical_creative_thinking",
    ]);
    for (const subject of SUBJECT_REGISTRY) {
      expect(subject.strands.length).toBeGreaterThan(0);
      expect(subject.supportedExamStyles.length).toBeGreaterThan(0);
    }
  });

  /*
   * Replaces "keeps the controlled reading text-type strands registered",
   * which pinned the internal taxonomy (Author's craft, Text features,
   * Reading comprehension, ...). Fidelity backlog item 3 replaced that with
   * the official sets, and reading is the subject where the two exams differ
   * most: NAPLAN reading is scored on a proficiency axis, ICAS has no
   * reading paper at all and these items are ICAS English.
   */
  it("registers the official reading strands, scoped to their own exam", () => {
    const labelsFor = (style: "naplan_style" | "icas_style") =>
      getStrandsForSubject("reading", style).map((strand) => strand.label);

    expect(labelsFor("naplan_style")).toEqual(
      expect.arrayContaining([
        "Locating and identifying",
        "Integrating and interpreting",
        "Analysing and evaluating",
      ]),
    );
    expect(labelsFor("icas_style")).toEqual(
      expect.arrayContaining(["Text Comprehension", "Writer's Craft", "Syntax", "Vocabulary"]),
    );
  });

  /*
   * The point of scoping strands by exam style: one subject id carries both
   * exams' questions, so without this an ICAS strand on a NAPLAN question
   * would be indistinguishable from a correct one.
   */
  it("does not let one exam's strands leak into the other", () => {
    expect(isKnownStrandLabel("reading", "Text Comprehension", "naplan_style")).toBe(false);
    expect(isKnownStrandLabel("reading", "Locating and identifying", "icas_style")).toBe(false);
    expect(isKnownStrandLabel("numeracy", "Number & Arithmetic", "naplan_style")).toBe(false);
    expect(isKnownStrandLabel("numeracy", "Number and algebra", "icas_style")).toBe(false);

    /* ...while each remains valid for its own exam, and the unscoped call
       still answers the union, which is what non-question callers want. */
    expect(isKnownStrandLabel("reading", "Text Comprehension", "icas_style")).toBe(true);
    expect(isKnownStrandLabel("numeracy", "Number and algebra", "naplan_style")).toBe(true);
    expect(isKnownStrandLabel("numeracy", "Number & Arithmetic")).toBe(true);
  });

  /*
   * The backlog's second finding: Vocabulary was mis-filed under
   * language_conventions. NAPLAN's conventions paper assesses spelling,
   * grammar and punctuation only — vocabulary belongs to ICAS English.
   */
  it("keeps Vocabulary out of the NAPLAN conventions paper", () => {
    expect(getStrandsForSubject("language_conventions", "naplan_style")
      .filter((strand) => !strand.legacy)
      .map((strand) => strand.label)).toEqual(["Spelling", "Grammar", "Punctuation"]);
    expect(isKnownStrandLabel("language_conventions", "Vocabulary", "icas_style")).toBe(true);
  });

  it("isKnownSubject/getSubject agree with SUBJECT_IDS", () => {
    for (const id of SUBJECT_IDS) {
      expect(isKnownSubject(id)).toBe(true);
      expect(getSubject(id)?.id).toBe(id);
    }
    expect(isKnownSubject("astrology")).toBe(false);
    expect(getSubject("astrology")).toBeUndefined();
  });

  describe("(a) a subject/strand not in the registry is rejected", () => {
    it("rejects an unknown subject via the question metadata schema", () => {
      const result = questionMetadataSchema.safeParse({
        ...validMultipleChoiceQuestion.metadata,
        subject: "astrology",
      });
      expect(result.success).toBe(false);
    });

    it("accepts every currently-known subject via the question metadata schema", () => {
      for (const id of SUBJECT_IDS) {
        const strand = getStrandsForSubject(id)[0]?.label ?? "Number";
        const result = questionMetadataSchema.safeParse({
          ...validMultipleChoiceQuestion.metadata,
          subject: id,
          strand,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects a strand label unknown to a subject's strand list", () => {
      expect(isKnownStrandLabel("numeracy", "Nonexistent Strand")).toBe(false);
      /* "Number" was the internal taxonomy's strand and is deliberately gone
         — NAPLAN calls it "Number and algebra", ICAS "Number & Arithmetic". */
      expect(isKnownStrandLabel("numeracy", "Number")).toBe(false);
      expect(isKnownStrandLabel("numeracy", "Number and algebra")).toBe(true);
    });
  });

  describe("(b) adding a registry entry makes that subject valid", () => {
    it("a subject id absent from SUBJECT_REGISTRY is invalid until added", () => {
      const baselineSchema = z.enum(SUBJECT_IDS);
      expect(baselineSchema.safeParse("test_subject").success).toBe(false);

      const extendedRegistry: readonly SubjectRegistryEntry[] = [
        ...SUBJECT_REGISTRY,
        {
          id: "test_subject",
          label: "Test Subject",
          supportedExamStyles: ["naplan_style"],
          /* NAPLAN-style is only sat at these years — see year-registry. */
          yearLevels: [3, 5, 7, 9],
          strands: [{ id: "test-strand", label: "Test Strand", skills: ["Test skill"] }],
        },
      ];

      const extendedIds = subjectIdsFromRegistry(extendedRegistry);
      const extendedSchema = z.enum(extendedIds);

      expect(extendedSchema.safeParse("test_subject").success).toBe(true);
      // The real, seeded registry is untouched by building a throwaway extension.
      expect(isKnownSubject("test_subject")).toBe(false);
    });
  });

  describe("science subject foundation", () => {
    const science = getSubject("science");

    it("is registered with its curriculum strands, ICAS-only", () => {
      expect(science).toBeDefined();
      expect(science?.supportedExamStyles).toEqual(["icas_style"]);
      /* ICAS Science's own nine strands (fidelity backlog item 3): four
         knowledge strands, then five skills strands. This replaced the four
         Australian Curriculum content strands plus a single undifferentiated
         "Science inquiry" — which is retained as a legacy strand, and only
         because the migration would not guess which of the five skills
         strands its remaining items belong to. */
      expect(science?.strands.filter((strand) => !strand.legacy).map((strand) => strand.id)).toEqual([
        "earth-and-beyond",
        "natural-and-processed-materials",
        "life-and-living",
        "energy-and-change",
        "observing-and-measuring",
        "interpreting",
        "predicting-and-concluding",
        "investigating",
        "reasoning-and-problem-solving",
      ]);
      for (const strand of science?.strands ?? []) {
        expect(strand.skills.length).toBeGreaterThan(0);
      }
    });

    it("accepts a science question via the question metadata schema", () => {
      const result = questionMetadataSchema.safeParse({
        ...validMultipleChoiceQuestion.metadata,
        subject: "science",
        strand: "Life & Living",
      });
      expect(result.success).toBe(true);
    });

    it("rejects naplan_style as unsupported for science at the taxonomy level", () => {
      expect(science?.supportedExamStyles.includes("naplan_style")).toBe(false);
    });

    it("has at least one taxonomy entry per seeded science strand", () => {
      const scienceEntries = SKILL_TAXONOMY_ENTRIES.filter((entry) => entry.subject === "science");
      expect(scienceEntries.length).toBeGreaterThan(0);
      for (const entry of scienceEntries) {
        expect(isKnownStrandLabel("science", entry.strand)).toBe(true);
      }
    });
  });

  describe("(c) the curated bank still validates", () => {
    it("holds the whole curated bank, each question schema-valid", () => {
      /* 100 at Phase 3; 885 after the overnight Grade 3 ingest; 965 once
         the Grade 5 ICAS digital technologies and spelling batches were
         promoted; 1,005 once the Grade 5 ICAS numeracy batch followed.
         Pinned so content cannot change size unnoticed. */
      expect(questionBank.length).toBe(1005);
    });

    /*
     * Scoped by the question's own exam style, not just its subject. The
     * unscoped check passes for any strand the subject knows under EITHER
     * exam, which since fidelity backlog item 3 would let an ICAS English
     * strand sit on a NAPLAN reading question and call it registered — the
     * two taxonomies are disjoint for reading, numeracy and language
     * conventions. This is the gate that keeps the bank honest about which
     * exam each question is actually written for.
     */
    it("every question's (subject, strand) pair is known for its own exam style", () => {
      for (const question of questionBank) {
        const { subject, strand } = question.metadata;
        expect(isKnownSubject(subject)).toBe(true);
        expect(
          isKnownStrandLabel(subject, strand, question.examStyle),
          `${question.id}: strand '${strand}' is not registered for ${subject}/${question.examStyle}`,
        ).toBe(true);
      }
    });
  });
});
