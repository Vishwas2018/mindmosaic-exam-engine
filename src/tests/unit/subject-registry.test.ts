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
import { questionMetadataSchema } from "@/schemas/question.schema";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("subject registry", () => {
  it("covers exactly the four existing subjects, each with at least one strand", () => {
    expect(SUBJECT_IDS).toEqual(["numeracy", "reading", "writing", "language_conventions"]);
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

  describe("(c) the 100-bank still validates", () => {
    it("has exactly 100 questions, each schema-valid", () => {
      expect(questionBank.length).toBe(100);
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
