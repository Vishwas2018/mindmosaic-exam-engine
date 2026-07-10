"use client";

import { create } from "zustand";

import type {
  CandidateAnswer,
  ExamResponses,
} from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

export interface ExamState {
  questions: readonly Question[];
  currentQuestionIndex: number;
  responses: ExamResponses;
  flaggedQuestionIds: readonly string[];
  startedAt: number | null;
  submittedAt: number | null;
}

export interface ExamActions {
  initialiseExam: (questions: readonly Question[]) => void;
  setResponse: (questionId: string, answer: CandidateAnswer) => void;
  goToQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  toggleFlag: (questionId: string) => void;
  submitExam: () => void;
  resetExam: () => void;
}

export type ExamStore = ExamState & ExamActions;

function createInitialExamState(): ExamState {
  return {
    questions: [],
    currentQuestionIndex: 0,
    responses: {},
    flaggedQuestionIds: [],
    startedAt: null,
    submittedAt: null,
  };
}

export const initialExamState: Readonly<ExamState> = createInitialExamState();

export const useExamStore = create<ExamStore>((set) => ({
  ...createInitialExamState(),

  initialiseExam: (questions) =>
    set({
      ...createInitialExamState(),
      questions: [...questions],
      startedAt: Date.now(),
    }),

  setResponse: (questionId, answer) =>
    set((state) =>
      state.submittedAt === null
        ? { responses: { ...state.responses, [questionId]: answer } }
        : state,
    ),

  goToQuestion: (index) =>
    set((state) => ({
      currentQuestionIndex: Math.max(
        0,
        Math.min(index, Math.max(0, state.questions.length - 1)),
      ),
    })),

  goToNextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        Math.max(0, state.questions.length - 1),
      ),
    })),

  goToPreviousQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
    })),

  toggleFlag: (questionId) =>
    set((state) =>
      state.submittedAt === null
        ? {
            flaggedQuestionIds: state.flaggedQuestionIds.includes(questionId)
              ? state.flaggedQuestionIds.filter((id) => id !== questionId)
              : [...state.flaggedQuestionIds, questionId],
          }
        : state,
    ),

  submitExam: () =>
    set((state) =>
      state.submittedAt === null ? { submittedAt: Date.now() } : state,
    ),

  resetExam: () => set(createInitialExamState()),
}));

export function selectCurrentQuestion(state: ExamStore): Question | undefined {
  return state.questions[state.currentQuestionIndex];
}

export function selectIsFlagged(questionId: string) {
  return (state: ExamStore): boolean =>
    state.flaggedQuestionIds.includes(questionId);
}
