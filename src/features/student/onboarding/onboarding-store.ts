"use client";

import { create } from "zustand";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";
import type { DiagnosticBaselineRecord } from "./baseline-contract";

export type OnboardingStep =
  | "welcome"
  | "interests"
  | "goal"
  | "warmup_intro"
  | "warmup_questions"
  | "warmup_summary";

export interface OnboardingStoreState {
  isOpen: boolean;
  step: OnboardingStep;
  yearLevel: 3 | 5;
  interests: string[];
  weeklyGoalMinutes: number;
  currentQuestionIndex: number;
  responses: Record<string, CandidateAnswer>;
  isSubmitting: boolean;
  error: string | null;
  diagnosticResult: ExamResult | null;
  baselineRecord: DiagnosticBaselineRecord | null;

  // Actions
  open: (config?: {
    initialYearLevel?: number | null;
    initialInterests?: readonly string[];
    initialWeeklyGoal?: number;
  }) => void;
  close: () => void;
  setStep: (step: OnboardingStep) => void;
  setYearLevel: (year: 3 | 5) => void;
  toggleInterest: (interest: string) => void;
  setWeeklyGoalMinutes: (minutes: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: CandidateAnswer) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  setDiagnosticOutcome: (
    result: ExamResult,
    baseline: DiagnosticBaselineRecord,
  ) => void;
  reset: () => void;
}

const DEFAULT_INTERESTS: string[] = ["Mathematics", "Reading"];
const DEFAULT_WEEKLY_GOAL = 60;

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  isOpen: false,
  step: "welcome",
  yearLevel: 3,
  interests: DEFAULT_INTERESTS,
  weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL,
  currentQuestionIndex: 0,
  responses: {},
  isSubmitting: false,
  error: null,
  diagnosticResult: null,
  baselineRecord: null,

  open: (config) =>
    set((state) => ({
      isOpen: true,
      yearLevel:
        config?.initialYearLevel === 5 || config?.initialYearLevel === 3
          ? (config.initialYearLevel as 3 | 5)
          : state.yearLevel,
      interests:
        config?.initialInterests && config.initialInterests.length > 0
          ? [...config.initialInterests]
          : state.interests,
      weeklyGoalMinutes:
        config?.initialWeeklyGoal && config.initialWeeklyGoal > 0
          ? config.initialWeeklyGoal
          : state.weeklyGoalMinutes,
    })),

  close: () => set({ isOpen: false }),

  setStep: (step) => set({ step, error: null }),

  setYearLevel: (yearLevel) => set({ yearLevel }),

  toggleInterest: (interest) =>
    set((state) => {
      const exists = state.interests.includes(interest);
      const next = exists
        ? state.interests.filter((i) => i !== interest)
        : [...state.interests, interest];
      return { interests: next };
    }),

  setWeeklyGoalMinutes: (weeklyGoalMinutes) => set({ weeklyGoalMinutes }),

  setCurrentQuestionIndex: (currentQuestionIndex) =>
    set({ currentQuestionIndex }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      responses: {
        ...state.responses,
        [questionId]: answer,
      },
    })),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  setError: (error) => set({ error }),

  setDiagnosticOutcome: (result, baseline) =>
    set({
      diagnosticResult: result,
      baselineRecord: baseline,
      step: "warmup_summary",
      isSubmitting: false,
      error: null,
    }),

  reset: () =>
    set({
      isOpen: false,
      step: "welcome",
      yearLevel: 3,
      interests: DEFAULT_INTERESTS,
      weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL,
      currentQuestionIndex: 0,
      responses: {},
      isSubmitting: false,
      error: null,
      diagnosticResult: null,
      baselineRecord: null,
    }),
}));
