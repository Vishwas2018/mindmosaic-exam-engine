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

import {
  getEffectiveRemainingSeconds,
  getEffectiveSubmissionReason,
  getEffectiveSubmittedAt,
  hasDeadlineExpired,
  systemClock,
  type Clock,
} from "./deadline";

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
  /**
   * Authoritative absolute deadline in epoch milliseconds; null for
   * untimed exams. This — not the UI timer tick — is the sole source of
   * truth for whether a response or submission is still valid.
   */
  deadlineAt: number | null;
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
    deadlineAt: null,
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

/** Real clock used in production; tests substitute fake timers via `vi.setSystemTime`. */
const clock: Clock = systemClock;

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
    const startedAt = clock();
    const deadlineAt = durationSeconds === null ? null : startedAt + durationSeconds * 1000;
    set({
      ...createInitialExamState(),
      status: "in_progress",
      sessionId: generateSessionId(seed),
      seed,
      config,
      questions: selection.questions,
      startedAt,
      durationSeconds,
      deadlineAt,
      remainingSeconds: durationSeconds,
    });
    return true;
  },

  /*
   * Every response mutation is gated by the authoritative deadline, not by
   * whether a timer tick has already fired. A delayed or missed tick can
   * never let a late answer through: the first mutation attempt after the
   * deadline instead finalises the session as `timer_expired` and discards
   * the attempted change.
   */
  setResponse: (questionId, answer) => {
    const state = get();
    if (state.status !== "in_progress") return;
    if (hasDeadlineExpired(state.deadlineAt, clock())) {
      get().submitExam("timer_expired");
      return;
    }
    set({ responses: { ...state.responses, [questionId]: answer } });
  },

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

  /*
   * The timer tick only refreshes the *display*. It recomputes remaining
   * time from the authoritative deadline rather than owning any state of
   * its own, so a missed or delayed tick can never grant extra time — the
   * deadline check in `setResponse` and `submitExam` is what actually
   * enforces expiry.
   */
  tick: () => {
    const state = get();
    if (state.status !== "in_progress" || state.deadlineAt === null) {
      return;
    }
    const now = clock();
    const remaining = getEffectiveRemainingSeconds(state.deadlineAt, now);
    if (remaining !== state.remainingSeconds) {
      set({ remainingSeconds: remaining });
    }
    if (hasDeadlineExpired(state.deadlineAt, now)) {
      get().submitExam("timer_expired");
    }
  },

  submitExam: (reason = "user_submitted") => {
    const state = get();
    /* Guard against duplicate finalisation from any path (tick, dialog,
       or an expired setResponse) — `set` below is synchronous, so once
       status leaves "in_progress" every other caller's `get()` sees it. */
    if (state.status !== "in_progress" || state.startedAt === null) {
      return;
    }
    set({ status: "submitting" });
    const now = clock();
    /*
     * The deadline is authoritative over the caller-supplied reason and
     * timestamp: a late `user_submitted` request past the deadline is
     * recorded as `timer_expired`, and the submission instant is clamped
     * to the deadline so recorded time-taken never exceeds the configured
     * duration, even if this call arrives long after expiry.
     */
    const effectiveReason = getEffectiveSubmissionReason(reason, state.deadlineAt, now);
    const effectiveSubmittedAt = getEffectiveSubmittedAt(now, state.deadlineAt);
    const result = buildExamResult(state.questions, state.responses, {
      startedAt: state.startedAt,
      submittedAt: effectiveSubmittedAt,
      submissionReason: effectiveReason,
    });
    set({
      status: "submitted",
      submittedAt: effectiveSubmittedAt,
      submissionReason: effectiveReason,
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
