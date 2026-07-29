import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  createInitialPracticeState,
  practiceReducer,
} from "@/features/exam-engine/practice-mode/practice-reducer";
import type { Question } from "@/schemas/question.schema";

/* Two real single-option (multiple-choice) questions, one for each of the
   two check_answer test cases below — deterministic, no fixture drift. */
const singleOption = questionBank.filter(
  (q): q is Question & { answerKey: { kind: "single_option"; optionId: string } } =>
    q.answerKey.kind === "single_option",
);
const [Q1, Q2] = singleOption;

function correctOptionId(question: typeof Q1): string {
  return question.answerKey.optionId;
}

function wrongOptionId(question: typeof Q1): string {
  const wrong = question.options.find((o) => o.id !== question.answerKey.optionId);
  if (!wrong) throw new Error("fixture question needs at least two options");
  return wrong.id;
}

describe("practiceReducer", () => {
  it("starts on question 1, answering phase, zero streak", () => {
    const state = createInitialPracticeState([Q1, Q2]);
    expect(state.currentIndex).toBe(0);
    expect(state.phase).toBe("answering");
    expect(state.streak).toBe(0);
    expect(state.results).toHaveLength(0);
  });

  it("ignores set_answer/check_answer/skip outside the answering phase", () => {
    let state = createInitialPracticeState([Q1, Q2]);
    state = practiceReducer(state, { type: "set_answer", answer: correctOptionId(Q1) });
    state = practiceReducer(state, { type: "check_answer" });
    const checked = state;
    expect(practiceReducer(state, { type: "set_answer", answer: "x" })).toBe(checked);
    expect(practiceReducer(state, { type: "check_answer" })).toBe(checked);
    expect(practiceReducer(state, { type: "skip" })).toBe(checked);
  });

  it("scores a correct answer and increments the streak", () => {
    let state = createInitialPracticeState([Q1, Q2]);
    state = practiceReducer(state, { type: "set_answer", answer: correctOptionId(Q1) });
    state = practiceReducer(state, { type: "check_answer" });
    expect(state.phase).toBe("checked");
    expect(state.results).toEqual([{ questionId: Q1.id, status: "correct" }]);
    expect(state.streak).toBe(1);
    expect(state.bestStreak).toBe(1);
  });

  it("scores an incorrect answer and resets the streak", () => {
    let state = createInitialPracticeState([Q1, Q2]);
    state = practiceReducer(state, { type: "set_answer", answer: correctOptionId(Q1) });
    state = practiceReducer(state, { type: "check_answer" });
    state = practiceReducer(state, { type: "next" });
    state = practiceReducer(state, { type: "set_answer", answer: wrongOptionId(Q2) });
    state = practiceReducer(state, { type: "check_answer" });
    expect(state.results.at(-1)).toEqual({ questionId: Q2.id, status: "incorrect" });
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(1);
  });

  it("checking with no answer records unanswered and does not touch the streak", () => {
    let state = createInitialPracticeState([Q1]);
    state = practiceReducer(state, { type: "check_answer" });
    expect(state.results).toEqual([{ questionId: Q1.id, status: "unanswered" }]);
    expect(state.streak).toBe(0);
  });

  it("skip records a skipped result and advances without checking", () => {
    let state = createInitialPracticeState([Q1, Q2]);
    state = practiceReducer(state, { type: "skip" });
    expect(state.results).toEqual([{ questionId: Q1.id, status: "skipped" }]);
    expect(state.currentIndex).toBe(1);
    expect(state.phase).toBe("answering");
  });

  it("next moves to summary after the last question", () => {
    let state = createInitialPracticeState([Q1]);
    state = practiceReducer(state, { type: "set_answer", answer: correctOptionId(Q1) });
    state = practiceReducer(state, { type: "check_answer" });
    state = practiceReducer(state, { type: "next" });
    expect(state.phase).toBe("summary");
  });

  it("end_session jumps straight to summary from mid-session", () => {
    let state = createInitialPracticeState([Q1, Q2]);
    state = practiceReducer(state, { type: "set_answer", answer: correctOptionId(Q1) });
    state = practiceReducer(state, { type: "check_answer" });
    state = practiceReducer(state, { type: "end_session" });
    expect(state.phase).toBe("summary");
    expect(state.results).toHaveLength(1);
  });

  it("restart resets to the initial state for the same question set", () => {
    let state = createInitialPracticeState([Q1, Q2]);
    state = practiceReducer(state, { type: "set_answer", answer: correctOptionId(Q1) });
    state = practiceReducer(state, { type: "check_answer" });
    state = practiceReducer(state, { type: "restart" });
    expect(state).toEqual(createInitialPracticeState([Q1, Q2]));
  });
});
