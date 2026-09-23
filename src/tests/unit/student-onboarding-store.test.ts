import { beforeEach, describe, expect, it } from "vitest";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";
import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";
import type { DiagnosticBaselineRecord } from "@/features/student/onboarding/baseline-contract";

describe("student onboarding store state machine", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("initialises with closed modal and default preferences", () => {
    const state = useOnboardingStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.step).toBe("welcome");
    expect(state.yearLevel).toBe(3);
    expect(state.weeklyGoalMinutes).toBe(60);
    expect(state.interests).toEqual(["Mathematics", "Reading"]);
    expect(state.responses).toEqual({});
  });

  it("opens with custom initial values when provided", () => {
    const store = useOnboardingStore.getState();
    store.open({
      initialYearLevel: 5,
      initialInterests: ["Science", "Problem Solving"],
      initialWeeklyGoal: 90,
    });

    const state = useOnboardingStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.yearLevel).toBe(5);
    expect(state.interests).toEqual(["Science", "Problem Solving"]);
    expect(state.weeklyGoalMinutes).toBe(90);
  });

  it("toggles interests cleanly without mutating original array", () => {
    const store = useOnboardingStore.getState();
    store.open({ initialInterests: ["Mathematics"] });

    store.toggleInterest("Science");
    expect(useOnboardingStore.getState().interests).toEqual([
      "Mathematics",
      "Science",
    ]);

    store.toggleInterest("Mathematics");
    expect(useOnboardingStore.getState().interests).toEqual(["Science"]);
  });

  it("updates year level and weekly goal minutes", () => {
    const store = useOnboardingStore.getState();
    store.setYearLevel(5);
    expect(useOnboardingStore.getState().yearLevel).toBe(5);

    store.setWeeklyGoalMinutes(120);
    expect(useOnboardingStore.getState().weeklyGoalMinutes).toBe(120);
  });

  it("records candidate answers and tracks question navigation index", () => {
    const store = useOnboardingStore.getState();
    store.setAnswer("q-1", "A");
    store.setAnswer("q-2", 42);

    expect(useOnboardingStore.getState().responses).toEqual({
      "q-1": "A",
      "q-2": 42,
    });

    store.setCurrentQuestionIndex(3);
    expect(useOnboardingStore.getState().currentQuestionIndex).toBe(3);
  });

  it("transitions to warmup_summary upon setting diagnostic outcome", () => {
    const store = useOnboardingStore.getState();
    const mockResult = {
      totalQuestions: 5,
      attemptedQuestions: 5,
      correctCount: 4,
      objectivePercentage: 80,
    } as unknown as ExamResult;

    const mockBaseline = {
      version: 1,
      studentId: "student-123",
      yearLevel: 3,
      overallAccuracy: 80,
      skills: [],
      subjects: {},
    } as unknown as DiagnosticBaselineRecord;

    store.setDiagnosticOutcome(mockResult, mockBaseline);

    const state = useOnboardingStore.getState();
    expect(state.step).toBe("warmup_summary");
    expect(state.diagnosticResult).toBe(mockResult);
    expect(state.baselineRecord).toBe(mockBaseline);
    expect(state.isSubmitting).toBe(false);
  });

  it("resets state completely on reset()", () => {
    const store = useOnboardingStore.getState();
    store.open({ initialYearLevel: 5 });
    store.setStep("warmup_questions");
    store.setAnswer("q-1", "B");

    store.reset();
    const state = useOnboardingStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.step).toBe("welcome");
    expect(state.yearLevel).toBe(3);
    expect(state.responses).toEqual({});
  });
});
