import { scoreQuestion, type ScoreStatus } from "@/features/exam-engine/scoring";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/**
 * Pure state machine for the immediate-feedback practice engine (screen 10,
 * design-explorations/ui-mockups/08-practice.html). Deliberately its own
 * reducer rather than a re-purposed exam-store: the exam store's whole
 * design is "withhold everything until submit"  (docs/
 * ASSESSMENT_SECURITY_MODEL.md server-authoritative scoring), while this
 * engine's entire point is per-question feedback the instant a student
 * checks an answer. Scoring itself is still the one shared source of truth
 * (scoreQuestion) — only the flow around it differs.
 */

export type PracticeQuestionStatus = ScoreStatus | "skipped";

export interface PracticeQuestionResult {
  questionId: string;
  status: PracticeQuestionStatus;
}

export type PracticePhase = "answering" | "checked" | "summary";

export interface PracticeState {
  questions: readonly Question[];
  currentIndex: number;
  phase: PracticePhase;
  answers: Record<string, CandidateAnswer>;
  results: readonly PracticeQuestionResult[];
  streak: number;
  bestStreak: number;
}

export type PracticeAction =
  | { type: "set_answer"; answer: CandidateAnswer }
  | { type: "check_answer" }
  | { type: "skip" }
  | { type: "next" }
  | { type: "end_session" }
  | { type: "restart" };

export function createInitialPracticeState(
  questions: readonly Question[],
): PracticeState {
  return {
    questions,
    currentIndex: 0,
    phase: "answering",
    answers: {},
    results: [],
    streak: 0,
    bestStreak: 0,
  };
}

function advance(state: PracticeState): PracticeState {
  const isLast = state.currentIndex >= state.questions.length - 1;
  return isLast
    ? { ...state, phase: "summary" }
    : { ...state, currentIndex: state.currentIndex + 1, phase: "answering" };
}

export function practiceReducer(
  state: PracticeState,
  action: PracticeAction,
): PracticeState {
  switch (action.type) {
    case "set_answer": {
      if (state.phase !== "answering") return state;
      const question = state.questions[state.currentIndex];
      return {
        ...state,
        answers: { ...state.answers, [question.id]: action.answer },
      };
    }

    case "check_answer": {
      if (state.phase !== "answering") return state;
      const question = state.questions[state.currentIndex];
      const score = scoreQuestion(question, state.answers[question.id]);
      const streak = score.status === "correct" ? state.streak + 1 : 0;
      return {
        ...state,
        phase: "checked",
        results: [...state.results, { questionId: question.id, status: score.status }],
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
      };
    }

    case "skip": {
      if (state.phase !== "answering") return state;
      const question = state.questions[state.currentIndex];
      return advance({
        ...state,
        results: [...state.results, { questionId: question.id, status: "skipped" }],
        streak: 0,
      });
    }

    case "next": {
      if (state.phase !== "checked") return state;
      return advance(state);
    }

    case "end_session":
      return state.phase === "summary" ? state : { ...state, phase: "summary" };

    case "restart":
      return createInitialPracticeState(state.questions);

    default:
      return state;
  }
}
