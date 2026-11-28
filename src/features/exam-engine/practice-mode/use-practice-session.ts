"use client";

import { useMemo, useReducer } from "react";

import type { CandidateAnswer, CandidateQuestion } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

import {
  createInitialPracticeState,
  practiceReducer,
  type PracticeQuestionStatus,
  type PracticeState,
} from "./practice-reducer";

export interface UsePracticeSessionResult {
  state: PracticeState;
  setAnswer: (answer: CandidateAnswer) => void;
  checkAnswer: () => void;
  checkAnswerResult: (payload: {
    status: PracticeQuestionStatus;
    explanation?: string | null;
    correctAnswer?: string | null;
    yourAnswer?: string | null;
  }) => void;
  skip: () => void;
  next: () => void;
  toggleFlag: () => void;
  retry: () => void;
  goTo: (index: number) => void;
  endSession: () => void;
  restart: () => void;
}

/** Thin React binding over the pure practiceReducer — see practice-reducer.ts. */
export function usePracticeSession(
  questions: readonly (Question | CandidateQuestion)[],
): UsePracticeSessionResult {
  const [state, dispatch] = useReducer(
    practiceReducer,
    questions,
    createInitialPracticeState,
  );

  return useMemo(
    () => ({
      state,
      setAnswer: (answer: CandidateAnswer) => dispatch({ type: "set_answer", answer }),
      checkAnswer: () => dispatch({ type: "check_answer" }),
      checkAnswerResult: (payload) =>
        dispatch({ type: "check_answer_result", ...payload }),
      skip: () => dispatch({ type: "skip" }),
      next: () => dispatch({ type: "next" }),
      toggleFlag: () => dispatch({ type: "toggle_flag" }),
      retry: () => dispatch({ type: "retry" }),
      goTo: (index: number) => dispatch({ type: "go_to", index }),
      endSession: () => dispatch({ type: "end_session" }),
      restart: () => dispatch({ type: "restart" }),
    }),
    [state],
  );
}
