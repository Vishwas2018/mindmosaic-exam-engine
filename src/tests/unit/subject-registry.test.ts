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
      expect(isKnownStrandLabel("numeracy", "Number")).toBe(true);
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
      /* The four Australian Curriculum content strands the subject was
         seeded with, plus "Science inquiry", which the 2026-08-08 Grade 3
         ingest authored against — inquiry-skill items are set by ICAS and
         belong to no single content strand. */
      expect(science?.strands.map((strand) => strand.id)).toEqual([
        "biological-sciences",
        "chemical-sciences",
        "physical-sciences",
        "earth-and-space-sciences",
        "science-inquiry",
      ]);
      for (const strand of science?.strands ?? []) {
        expect(strand.skills.length).toBeGreaterThan(0);
      }
    });

    it("accepts a science question via the question metadata schema", () => {
      const result = questionMetadataSchema.safeParse({
        ...validMultipleChoiceQuestion.metadata,
        subject: "science",
        strand: "Biological Sciences",
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
      /* 100 at Phase 3; 885 after the overnight Grade 3 ingest. Pinned so
         content cannot change size unnoticed. */
      expect(questionBank.length).toBe(885);
    });

    it("every question's (subject, strand) pair is known to the registry", () => {
      for (const question of questionBank) {
        const { subject, strand } = question.metadata;
        expect(isKnownSubject(subject)).toBe(true);
        expect(isKnownStrandLabel(subject, strand)).toBe(true);
      }
    });
  });
});
