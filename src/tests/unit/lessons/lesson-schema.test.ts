import { describe, expect, it } from "vitest";
import { lessonSchema } from "@/features/curriculum/lessons/schema";

describe("Curriculum Lesson Schema", () => {
  const validLesson = {
    curriculumCode: "VC2M3N01",
    title: "Odd and Even Numbers",
    strand: "number",
    level: "Level 3",
    estimatedMinutes: 15,
    learningIntention: "We are learning to identify odd and even numbers.",
    successCriteria: ["I can check the ones digit to identify parity."],
    prerequisites: [],
    status: "draft" as const,
    provenance: {
      author: "MindMosaic Curriculum Team",
      version: 1,
      createdAt: "2026-08-29T10:00:00.000Z",
      originalityStatement: "Original test lesson authored from scratch.",
    },
    sections: [
      {
        kind: "concept" as const,
        id: "test-concept",
        heading: "Concept",
        explanation: "Numbers ending in 0, 2, 4, 6, 8 are even.",
        keyTerms: [{ term: "Parity", definition: "Odd or even." }],
      },
      {
        kind: "worked_example" as const,
        id: "test-we",
        heading: "Worked Example",
        problem: "Is 42 odd or even?",
        steps: [
          {
            stepNumber: 1,
            label: "Inspect ones digit",
            working: "The ones digit is 2.",
            why: "The ones digit determines parity.",
          },
        ],
        finalAnswer: "42 is even.",
      },
      {
        kind: "misconception" as const,
        id: "test-mis",
        heading: "Misconception",
        claim: "Numbers with 3 digits are always odd.",
        whyWrong: "Hundreds digit does not set parity.",
        correction: "Only ones digit matters.",
      },
      {
        kind: "check" as const,
        id: "test-check",
        heading: "Check",
        prompt: "Practise parity problems.",
        curriculumCode: "VC2M3N01",
        practiceCount: 5,
      },
    ],
  };

  it("successfully parses a fully compliant lesson", () => {
    const result = lessonSchema.safeParse(validLesson);
    expect(result.success).toBe(true);
  });

  it("rejects lessons missing learning intentions", () => {
    const invalid = { ...validLesson, learningIntention: "" };
    const result = lessonSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects lessons with invalid section kinds", () => {
    const invalid = {
      ...validLesson,
      sections: [{ kind: "unknown_section", id: "bad" }],
    };
    const result = lessonSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects worked example steps missing 'why' lines", () => {
    const invalid = {
      ...validLesson,
      sections: [
        {
          kind: "worked_example" as const,
          id: "we-1",
          heading: "Step Missing Why",
          problem: "A math question",
          steps: [
            {
              stepNumber: 1,
              label: "Step 1",
              working: "Calculation",
              why: "", // Empty why
            },
          ],
          finalAnswer: "Answer",
        },
      ],
    };
    const result = lessonSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
