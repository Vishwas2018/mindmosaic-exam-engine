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
  /** Question ids the student marked to come back to. */
  flagged: readonly string[];
  streak: number;
  bestStreak: number;
}

export type PracticeAction =
  | { type: "set_answer"; answer: CandidateAnswer }
  | { type: "check_answer" }
  | { type: "skip" }
  | { type: "next" }
  | { type: "toggle_flag" }
  /** Clears this question's answer and result so it can be attempted again. */
  | { type: "retry" }
  /** Jump straight to a question from the strip under the card. */
  | { type: "go_to"; index: number }
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
    flagged: [],
    streak: 0,
    bestStreak: 0,
  };
}

/**
 * A question's result, by id.
 *
 * Results are appended in the order questions are checked, which matched
 * question order exactly while the only way through the set was forwards.
 * The question strip (design handoff screen 9) lets a student jump, so
 * position in `results` no longer implies position in `questions` — every
 * lookup goes through here instead of indexing the array.
 */
export function resultFor(
  state: PracticeState,
  questionId: string,
): PracticeQuestionResult | undefined {
  return state.results.find((result) => result.questionId === questionId);
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

    case "toggle_flag": {
      const question = state.questions[state.currentIndex];
      if (!question) return state;
      const flagged = state.flagged.includes(question.id)
        ? state.flagged.filter((id) => id !== question.id)
        : [...state.flagged, question.id];
      return { ...state, flagged };
    }

    /*
     * "Try again" on the explanation panel. The result is discarded so the
     * question is genuinely unanswered again rather than counted twice —
     * and the streak is not restored with it, because a second attempt
     * after seeing the worked explanation is not the same achievement as
     * getting it right first time.
     */
    case "retry": {
      if (state.phase !== "checked") return state;
      const question = state.questions[state.currentIndex];
      if (!question) return state;
      const answers = { ...state.answers };
      delete answers[question.id];
      return {
        ...state,
        phase: "answering",
        answers,
        results: state.results.filter((result) => result.questionId !== question.id),
      };
    }

    case "go_to": {
      if (state.phase === "summary") return state;
      const question = state.questions[action.index];
      if (!question) return state;
      return {
        ...state,
        currentIndex: action.index,
        /* A question already checked reopens showing its explanation; one
           that has not been reopens ready to answer. */
        phase: resultFor(state, question.id) ? "checked" : "answering",
      };
    }

    case "end_session":
      return state.phase === "summary" ? state : { ...state, phase: "summary" };

    case "restart":
      return createInitialPracticeState(state.questions);

    default:
      return state;
  }
}
