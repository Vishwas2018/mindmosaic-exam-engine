import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { selectExamQuestions } from "@/features/exam-engine/selection";
import { reconcileResumedSession, type ResumableSession } from "@/features/exam-engine/state/resume";
import { toCandidateQuestions } from "@/features/exam-engine/types";

const config = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "timed",
} as const;

function fixtureQuestions() {
  const selection = selectExamQuestions(questionBank, config, "resume-fixture");
  if (!selection.ok) throw new Error("fixture selection failed");
  return toCandidateQuestions(selection.questions);
}

function baseSession(overrides: Partial<ResumableSession> = {}): ResumableSession {
  const questions = fixtureQuestions();
  return {
    sessionId: "session-1",
    bankId: "curated",
    config,
    questions,
    startedAt: 0,
    durationSeconds: 900,
    responses: {},
    currentQuestionIndex: 0,
    flaggedQuestionIds: [],
    ...overrides,
  };
}

describe("reconcileResumedSession", () => {
  it("restores the exact in-progress answers and current question", () => {
    const session = baseSession({
      responses: { q1: "a", q2: ["b", "c"] },
      currentQuestionIndex: 3,
      flaggedQuestionIds: ["q2"],
    });
    const reconciled = reconcileResumedSession(session, 60_000);

    expect(reconciled.responses).toEqual({ q1: "a", q2: ["b", "c"] });
    expect(reconciled.currentQuestionIndex).toBe(3);
    expect(reconciled.flaggedQuestionIds).toEqual(["q2"]);
    expect(reconciled.sessionId).toBe("session-1");
  });

  it("recomputes the deadline from the original startedAt, not from now", () => {
    const session = baseSession({ startedAt: 0, durationSeconds: 900 });
    const resumedLate = reconcileResumedSession(session, 60_000);
    expect(resumedLate.deadlineAt).toBe(900_000);
    expect(resumedLate.remainingSeconds).toBe(840);
    expect(resumedLate.expired).toBe(false);
  });

  it("never lets a resumed attempt exceed the original deadline, however late the resume happens", () => {
    /* A 900-second exam, resumed 1,200 seconds after it started — well
       past the original deadline. */
    const session = baseSession({ startedAt: 0, durationSeconds: 900 });
    const resumedAfterDeadline = reconcileResumedSession(session, 1_200_000);

    expect(resumedAfterDeadline.deadlineAt).toBe(900_000);
    expect(resumedAfterDeadline.remainingSeconds).toBe(0);
    expect(resumedAfterDeadline.expired).toBe(true);
  });

  it("is expired exactly at the deadline (matches deadline.ts's documented boundary)", () => {
    const session = baseSession({ startedAt: 0, durationSeconds: 900 });
    const resumedAtDeadline = reconcileResumedSession(session, 900_000);
    expect(resumedAtDeadline.expired).toBe(true);
  });

  it("has no deadline for an untimed session regardless of when it resumes", () => {
    const session = baseSession({ startedAt: 0, durationSeconds: null });
    const resumed = reconcileResumedSession(session, 10_000_000);
    expect(resumed.deadlineAt).toBeNull();
    expect(resumed.remainingSeconds).toBeNull();
    expect(resumed.expired).toBe(false);
  });

  it("clamps a saved question index within the current question list bounds", () => {
    const questions = fixtureQuestions();
    const session = baseSession({ currentQuestionIndex: questions.length + 50 });
    const reconciled = reconcileResumedSession(session, 0);
    expect(reconciled.currentQuestionIndex).toBe(questions.length - 1);
  });

  it("clamps a negative saved question index up to zero", () => {
    const session = baseSession({ currentQuestionIndex: -5 });
    const reconciled = reconcileResumedSession(session, 0);
    expect(reconciled.currentQuestionIndex).toBe(0);
  });
});
