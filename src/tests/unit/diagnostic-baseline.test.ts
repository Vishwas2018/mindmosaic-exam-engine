import { describe, expect, it } from "vitest";
import { buildExamResult } from "@/features/exam-engine/scoring";
import {
  buildDiagnosticBaseline,
  derivePerformanceTier,
} from "@/features/student/onboarding/baseline-contract";
import type { Question } from "@/schemas/question.schema";

const mockQuestions: Question[] = [
  {
    id: "diag-q1",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is 4 x 5?",
    explanation: "4 times 5 equals 20.",
    options: [
      { id: "A", text: "20" },
      { id: "B", text: "25" },
    ],
    answerKey: { kind: "single_option", optionId: "A" },
    metadata: {
      subject: "numeracy",
      strand: "Number & Arithmetic",
      topic: "Multiplication",
      skill: "Multiplication facts",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    visuals: [],
  },
  {
    id: "diag-q2",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is the main idea of the story?",
    explanation: "The story focuses on friendship.",
    options: [
      { id: "A", text: "Friendship" },
      { id: "B", text: "Adventure" },
    ],
    answerKey: { kind: "single_option", optionId: "A" },
    metadata: {
      subject: "reading",
      strand: "Reading Comprehension",
      topic: "Themes",
      skill: "Main idea",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    visuals: [],
  },
  {
    id: "diag-q3",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence uses correct punctuation?",
    explanation: "A question requires a question mark.",
    options: [
      { id: "A", text: "Where is my hat?" },
      { id: "B", text: "Where is my hat." },
    ],
    answerKey: { kind: "single_option", optionId: "A" },
    metadata: {
      subject: "language_conventions",
      strand: "Grammar & Punctuation",
      topic: "Punctuation",
      skill: "Question marks",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    visuals: [],
  },
  {
    id: "diag-q4",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is 100 - 35?",
    explanation: "100 minus 35 equals 65.",
    options: [
      { id: "A", text: "65" },
      { id: "B", text: "75" },
    ],
    answerKey: { kind: "single_option", optionId: "A" },
    metadata: {
      subject: "numeracy",
      strand: "Number & Arithmetic",
      topic: "Subtraction",
      skill: "Subtraction with regrouping",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    visuals: [],
  },
  {
    id: "diag-q5",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which tool measures temperature?",
    explanation: "A thermometer measures temperature.",
    options: [
      { id: "A", text: "Thermometer" },
      { id: "B", text: "Ruler" },
    ],
    answerKey: { kind: "single_option", optionId: "A" },
    metadata: {
      subject: "science",
      strand: "Physical Science",
      topic: "Measurement",
      skill: "Measurement tools",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    visuals: [],
  },
];

describe("diagnostic baseline builder (Guardrail G3)", () => {
  it("derives performance tiers accurately", () => {
    expect(derivePerformanceTier(100)).toBe("strength");
    expect(derivePerformanceTier(80)).toBe("strength");
    expect(derivePerformanceTier(75)).toBe("developing");
    expect(derivePerformanceTier(50)).toBe("developing");
    expect(derivePerformanceTier(49)).toBe("focus_area");
    expect(derivePerformanceTier(0)).toBe("focus_area");
  });

  it("builds a canonical DiagnosticBaselineRecord matching G3 specification", () => {
    // 4 correct, 1 incorrect
    const responses = {
      "diag-q1": "A", // Correct
      "diag-q2": "A", // Correct
      "diag-q3": "B", // Incorrect
      "diag-q4": "A", // Correct
      "diag-q5": "A", // Correct
    };

    const examResult = buildExamResult(mockQuestions, responses, {
      startedAt: 1000,
      submittedAt: 60000,
      submissionReason: "user_submitted",
    });

    const baseline = buildDiagnosticBaseline(
      examResult,
      mockQuestions,
      "student-test-uuid",
      3,
    );

    expect(baseline.version).toBe(1);
    expect(baseline.studentId).toBe("student-test-uuid");
    expect(baseline.yearLevel).toBe(3);
    expect(baseline.totalQuestions).toBe(5);
    expect(baseline.correctCount).toBe(4);
    expect(baseline.overallAccuracy).toBe(80);
    expect(baseline.objectiveMarksEarned).toBe(4);
    expect(baseline.objectiveMarksAvailable).toBe(5);

    // Assert skills breakdown
    expect(baseline.skills.length).toBe(5);

    const multSkill = baseline.skills.find(
      (s) => s.skill === "Multiplication facts",
    );
    expect(multSkill).toBeDefined();
    expect(multSkill?.subject).toBe("numeracy");
    expect(multSkill?.strand).toBe("Number & Arithmetic");
    expect(multSkill?.accuracy).toBe(100);
    expect(multSkill?.performanceTier).toBe("strength");

    const punctSkill = baseline.skills.find(
      (s) => s.skill === "Question marks",
    );
    expect(punctSkill).toBeDefined();
    expect(punctSkill?.accuracy).toBe(0);
    expect(punctSkill?.performanceTier).toBe("focus_area");
    expect(punctSkill?.incorrectCount).toBe(1);

    // Assert subjects rollup
    expect(baseline.subjects.numeracy).toEqual({
      subject: "numeracy",
      marksEarned: 2,
      marksAvailable: 2,
      accuracy: 100,
      total: 2,
    });
    expect(baseline.subjects.reading).toEqual({
      subject: "reading",
      marksEarned: 1,
      marksAvailable: 1,
      accuracy: 100,
      total: 1,
    });
    expect(baseline.subjects.language_conventions).toEqual({
      subject: "language_conventions",
      marksEarned: 0,
      marksAvailable: 1,
      accuracy: 0,
      total: 1,
    });
  });
});
