"use client";

import { create } from "zustand";

import {
  buildExamResult,
  isUnanswered,
  type ExamResult,
  type SubmissionReason,
} from "@/features/exam-engine/scoring";
import {
  durationSecondsFor,
  selectExamQuestions,
  type ExamSelectionConfig,
} from "@/features/exam-engine/selection";
import type {
  CandidateAnswer,
  ExamResponses,
} from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

export type ExamStatus = "not_started" | "in_progress" | "submitting" | "submitted";

export type { SubmissionReason } from "@/features/exam-engine/scoring";

export interface ExamState {
  status: ExamStatus;
  sessionId: string | null;
  /** Seed used for deterministic question selection. */
  seed: string | null;
  config: ExamSelectionConfig | null;
  /** Selected questions in their fixed session order. */
  questions: readonly Question[];
  currentQuestionIndex: number;
  responses: ExamResponses;
  flaggedQuestionIds: readonly string[];
  startedAt: number | null;
  /** Total exam duration in seconds; null when the exam is untimed. */
  durationSeconds: number | null;
  /** Remaining whole seconds; null when the exam is untimed. */
  remainingSeconds: number | null;
  submittedAt: number | null;
  submissionReason: SubmissionReason | null;
  result: ExamResult | null;
}

export interface StartExamOptions {
  /** Explicit seed for reproducible sessions (tests, shared exams). */
  seed?: string;
}

export interface ExamActions {
  startExam: (
    bank: readonly Question[],
    config: ExamSelectionConfig,
    options?: StartExamOptions,
  ) => boolean;
  setResponse: (questionId: string, answer: CandidateAnswer) => void;
  goToQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  toggleFlag: (questionId: string) => void;
  /** Recompute remaining time from the clock; auto-submits at zero. */
  tick: () => void;
  submitExam: (reason?: SubmissionReason) => void;
  resetExam: () => void;
}

export type ExamStore = ExamState & ExamActions;

function createInitialExamState(): ExamState {
  return {
    status: "not_started",
    sessionId: null,
    seed: null,
    config: null,
    questions: [],
    currentQuestionIndex: 0,
    responses: {},
    flaggedQuestionIds: [],
    startedAt: null,
    durationSeconds: null,
    remainingSeconds: null,
    submittedAt: null,
    submissionReason: null,
    result: null,
  };
}

export const initialExamState: Readonly<ExamState> = createInitialExamState();

function generateSeed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

function generateSessionId(seed: string): string {
  return `exam-${seed}`;
}

function remainingSecondsAt(
  now: number,
  startedAt: number,
  durationSeconds: number,
): number {
  const elapsedMs = now - startedAt;
  return Math.max(0, Math.ceil((durationSeconds * 1000 - elapsedMs) / 1000));
}

export const useExamStore = create<ExamStore>((set, get) => ({
  ...createInitialExamState(),

  startExam: (bank, config, options) => {
    const seed = options?.seed ?? generateSeed();
    const selection = selectExamQuestions(bank, config, seed);
    if (!selection.ok) {
      return false;
    }
    const timed = config.timing === "timed";
    const durationSeconds = timed ? durationSecondsFor(config.questionCount) : null;
    set({
      ...createInitialExamState(),
      status: "in_progress",
      sessionId: generateSessionId(seed),
      seed,
      config,
      questions: selection.questions,
      startedAt: Date.now(),
      durationSeconds,
      remainingSeconds: durationSeconds,
    });
    return true;
  },

  setResponse: (questionId, answer) =>
    set((state) =>
      state.status === "in_progress"
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
      state.status === "in_progress"
        ? {
            flaggedQuestionIds: state.flaggedQuestionIds.includes(questionId)
              ? state.flaggedQuestionIds.filter((id) => id !== questionId)
              : [...state.flaggedQuestionIds, questionId],
          }
        : state,
    ),

  tick: () => {
    const state = get();
    if (
      state.status !== "in_progress" ||
      state.startedAt === null ||
      state.durationSeconds === null
    ) {
      return;
    }
    const remaining = remainingSecondsAt(
      Date.now(),
      state.startedAt,
      state.durationSeconds,
    );
    if (remaining !== state.remainingSeconds) {
      set({ remainingSeconds: remaining });
    }
    if (remaining <= 0) {
      get().submitExam("timer_expired");
    }
  },

  submitExam: (reason = "user_submitted") => {
    const state = get();
    /* Guard against duplicate submission from any path. */
    if (state.status !== "in_progress" || state.startedAt === null) {
      return;
    }
    set({ status: "submitting" });
    const submittedAt = Date.now();
    const result = buildExamResult(state.questions, state.responses, {
      startedAt: state.startedAt,
      submittedAt,
      submissionReason: reason,
    });
    set({
      status: "submitted",
      submittedAt,
      submissionReason: reason,
      result,
      remainingSeconds: state.durationSeconds === null ? null : 0,
    });
  },

  resetExam: () => set(createInitialExamState()),
}));

/* Selectors. */

export function selectCurrentQuestion(state: ExamStore): Question | undefined {
  return state.questions[state.currentQuestionIndex];
}

export function selectIsFlagged(questionId: string) {
  return (state: ExamStore): boolean =>
    state.flaggedQuestionIds.includes(questionId);
}

export function selectAnsweredQuestionIds(state: ExamStore): readonly string[] {
  return state.questions
    .filter((question) => !isUnanswered(state.responses[question.id]))
    .map((question) => question.id);
}

export function selectAnsweredCount(state: ExamStore): number {
  return selectAnsweredQuestionIds(state).length;
}
