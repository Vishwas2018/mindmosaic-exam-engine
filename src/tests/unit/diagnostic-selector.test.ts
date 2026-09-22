import { describe, expect, it } from "vitest";
import { publishedExamBank } from "@/content/questions/practice-bank";
import {
  selectDiagnosticQuestions,
  DIAGNOSTIC_QUESTION_COUNT,
} from "@/features/student/onboarding/diagnostic-selector";

describe("selectDiagnosticQuestions (Guardrail G2)", () => {
  it("selects exactly 5 questions for Year 3", () => {
    const result = selectDiagnosticQuestions(publishedExamBank, 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.questions.length).toBe(DIAGNOSTIC_QUESTION_COUNT);
    expect(result.yearLevel).toBe(3);

    // Assert all selected questions are for Year 3
    for (const q of result.questions) {
      expect(q.yearLevel).toBe(3);
      expect(q.type).not.toBe("essay");
    }
  });

  it("selects exactly 5 questions for Year 5", () => {
    const result = selectDiagnosticQuestions(publishedExamBank, 5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.questions.length).toBe(DIAGNOSTIC_QUESTION_COUNT);
    expect(result.yearLevel).toBe(5);

    for (const q of result.questions) {
      expect(q.yearLevel).toBe(5);
      expect(q.type).not.toBe("essay");
    }
  });

  it("produces deterministic output for the same seed", () => {
    const result1 = selectDiagnosticQuestions(publishedExamBank, 3, "test-seed-123");
    const result2 = selectDiagnosticQuestions(publishedExamBank, 3, "test-seed-123");

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    if (!result1.ok || !result2.ok) return;

    expect(result1.questions.map((q) => q.id)).toEqual(
      result2.questions.map((q) => q.id),
    );
  });

  it("selects unique questions with no duplicates", () => {
    const result = selectDiagnosticQuestions(publishedExamBank, 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ids = result.questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it("rejects unsupported year levels with an explicit failure", () => {
    const result = selectDiagnosticQuestions(publishedExamBank, 7);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_year_level");
  });
});
