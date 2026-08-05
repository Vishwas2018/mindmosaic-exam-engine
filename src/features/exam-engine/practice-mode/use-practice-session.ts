"use client";

import { useMemo, useReducer } from "react";

import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

import {
  createInitialPracticeState,
  practiceReducer,
  type PracticeState,
} from "./practice-reducer";

export interface UsePracticeSessionResult {
  state: PracticeState;
  setAnswer: (answer: CandidateAnswer) => void;
  checkAnswer: () => void;
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
  questions: readonly Question[],
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
