import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  selectAnsweredCount,
  selectCurrentQuestion,
  useExamStore,
} from "@/features/exam-engine/state";
import type { ExamSelectionConfig } from "@/features/exam-engine/selection";

const timedConfig: ExamSelectionConfig = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "timed",
};

const untimedConfig: ExamSelectionConfig = { ...timedConfig, timing: "untimed" };

function start(config: ExamSelectionConfig = timedConfig, seed = "store-test") {
  return useExamStore.getState().startExam(questionBank, config, { seed });
}

beforeEach(() => {
  useExamStore.getState().resetExam();
});

describe("session creation", () => {
  it("starts a session with deterministic questions and timer state", () => {
    expect(start()).toBe(true);
    const state = useExamStore.getState();
    expect(state.status).toBe("in_progress");
    expect(state.sessionId).toBe("exam-store-test");
    expect(state.seed).toBe("store-test");
    expect(state.questions).toHaveLength(10);
    expect(state.durationSeconds).toBe(15 * 60);
    expect(state.remainingSeconds).toBe(15 * 60);
    expect(state.startedAt).not.toBeNull();
  });

  it("keeps the same selected questions across navigation", () => {
    start();
    const before = useExamStore.getState().questions.map((question) => question.id);
    useExamStore.getState().goToNextQuestion();
    useExamStore.getState().goToQuestion(7);
    useExamStore.getState().goToPreviousQuestion();
    const after = useExamStore.getState().questions.map((question) => question.id);
    expect(after).toEqual(before);
  });

  it("refuses to start when not enough questions match", () => {
    const started = useExamStore
      .getState()
      .startExam(
        questionBank,
        { ...timedConfig, examStyle: "icas_style", questionCount: 30 },
        { seed: "impossible" },
      );
    expect(started).toBe(false);
    expect(useExamStore.getState().status).toBe("not_started");
  });

  it("leaves the timer off for untimed sessions", () => {
    start(untimedConfig);
    const state = useExamStore.getState();
    expect(state.durationSeconds).toBeNull();
    expect(state.remainingSeconds).toBeNull();
  });
});

describe("responses and flags", () => {
  it("keeps responses and flags across navigation", () => {
    start();
    const state = useExamStore.getState();
    const firstId = state.questions[0].id;
    state.setResponse(firstId, "some-answer");
    state.toggleFlag(firstId);
    state.goToQuestion(5);
    state.goToQuestion(0);

    const after = useExamStore.getState();
    expect(after.responses[firstId]).toBe("some-answer");
    expect(after.flaggedQuestionIds).toContain(firstId);
  });

  it("derives the answered count consistently", () => {
    start();
    const state = useExamStore.getState();
    expect(selectAnsweredCount(useExamStore.getState())).toBe(0);
    state.setResponse(state.questions[0].id, "answer");
    state.setResponse(state.questions[1].id, "");
    state.setResponse(state.questions[2].id, []);
    expect(selectAnsweredCount(useExamStore.getState())).toBe(1);
  });

  it("toggles a flag off again", () => {
    start();
    const id = useExamStore.getState().questions[0].id;
    useExamStore.getState().toggleFlag(id);
    useExamStore.getState().toggleFlag(id);
    expect(useExamStore.getState().flaggedQuestionIds).not.toContain(id);
  });
});

describe("navigation bounds", () => {
  it("clamps navigation to the valid range", () => {
    start();
    useExamStore.getState().goToQuestion(999);
    expect(useExamStore.getState().currentQuestionIndex).toBe(9);
    useExamStore.getState().goToQuestion(-5);
    expect(useExamStore.getState().currentQuestionIndex).toBe(0);
    useExamStore.getState().goToPreviousQuestion();
    expect(useExamStore.getState().currentQuestionIndex).toBe(0);
    useExamStore.getState().goToQuestion(9);
    useExamStore.getState().goToNextQuestion();
    expect(useExamStore.getState().currentQuestionIndex).toBe(9);
  });

  it("exposes the current question via selector", () => {
    start();
    const state = useExamStore.getState();
    expect(selectCurrentQuestion(state)?.id).toBe(state.questions[0].id);
  });
});

describe("submission", () => {
  it("computes and stores the result on submit", () => {
    start();
    const state = useExamStore.getState();
    const question = state.questions[0];
    state.setResponse(question.id, "anything");
    state.submitExam();

    const after = useExamStore.getState();
    expect(after.status).toBe("submitted");
    expect(after.submissionReason).toBe("user_submitted");
    expect(after.submittedAt).not.toBeNull();
    expect(after.result?.totalQuestions).toBe(10);
    expect(after.result?.attemptedQuestions).toBe(1);
  });

  it("prevents duplicate submission", () => {
    start();
    useExamStore.getState().submitExam("user_submitted");
    const firstSubmittedAt = useExamStore.getState().submittedAt;
    const firstResult = useExamStore.getState().result;
    useExamStore.getState().submitExam("timer_expired");
    expect(useExamStore.getState().submittedAt).toBe(firstSubmittedAt);
    expect(useExamStore.getState().submissionReason).toBe("user_submitted");
    expect(useExamStore.getState().result).toBe(firstResult);
  });

  it("makes the exam immutable after submission", () => {
    start();
    const questionId = useExamStore.getState().questions[0].id;
    useExamStore.getState().setResponse(questionId, "before");
    useExamStore.getState().submitExam();
    useExamStore.getState().setResponse(questionId, "after");
    useExamStore.getState().toggleFlag(questionId);
    const state = useExamStore.getState();
    expect(state.responses[questionId]).toBe("before");
    expect(state.flaggedQuestionIds).not.toContain(questionId);
  });
});

describe("timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T09:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down from the configured duration", () => {
    start();
    vi.setSystemTime(new Date("2026-07-11T09:01:00Z"));
    useExamStore.getState().tick();
    expect(useExamStore.getState().remainingSeconds).toBe(14 * 60);
  });

  it("never goes negative and auto-submits exactly once at zero", () => {
    start();
    const questionId = useExamStore.getState().questions[0].id;
    useExamStore.getState().setResponse(questionId, "kept-answer");

    vi.setSystemTime(new Date("2026-07-11T09:20:00Z"));
    useExamStore.getState().tick();
    const afterExpiry = useExamStore.getState();
    expect(afterExpiry.remainingSeconds).toBe(0);
    expect(afterExpiry.status).toBe("submitted");
    expect(afterExpiry.submissionReason).toBe("timer_expired");
    expect(afterExpiry.responses[questionId]).toBe("kept-answer");

    const submittedAt = afterExpiry.submittedAt;
    vi.setSystemTime(new Date("2026-07-11T09:25:00Z"));
    useExamStore.getState().tick();
    expect(useExamStore.getState().submittedAt).toBe(submittedAt);
    expect(useExamStore.getState().remainingSeconds).toBe(0);
  });

  it("does nothing for untimed sessions", () => {
    start(untimedConfig);
    vi.setSystemTime(new Date("2026-07-11T11:00:00Z"));
    useExamStore.getState().tick();
    const state = useExamStore.getState();
    expect(state.remainingSeconds).toBeNull();
    expect(state.status).toBe("in_progress");
  });

  it("records time taken from real timestamps for untimed sessions", () => {
    start(untimedConfig);
    vi.setSystemTime(new Date("2026-07-11T09:03:20Z"));
    useExamStore.getState().submitExam();
    expect(useExamStore.getState().result?.timeTakenSeconds).toBe(200);
  });
});
