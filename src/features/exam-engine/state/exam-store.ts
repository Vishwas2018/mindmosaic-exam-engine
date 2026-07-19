"use client";

import { create } from "zustand";

import {
  ServerAuthoritativeScoringService,
  isUnanswered,
  localPracticeScoringService,
  type AssessmentScoringService,
  type ExamResult,
  type ScoredSubmission,
  type SubmissionReason,
} from "@/features/exam-engine/scoring";
import type { CreateSessionResponse } from "@/features/exam-engine/scoring/server-scoring-contract";
import {
  durationSecondsFor,
  selectExamQuestions,
  type ExamBankId,
  type ExamSelectionConfig,
} from "@/features/exam-engine/selection";
import {
  toCandidateQuestions,
  type AuthoringQuestion,
  type CandidateAnswer,
  type CandidateQuestion,
  type ExamResponses,
  type ReviewQuestion,
} from "@/features/exam-engine/types";
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
  /**
   * How this session was created, which fixes how it must be scored: a
   * "server" session (created by startServerExam via POST /api/exam/session,
   * server-chosen seed, no client-side bank) submits through
   * ServerAuthoritativeScoringService; a "local" session (guest practice)
   * scores locally. Decided at start, not at submit — auth state changing
   * mid-attempt cannot re-route a session to a scorer it wasn't built for.
   */
  sessionMode: "local" | "server";
  sessionId: string | null;
  /** Seed used for deterministic selection; null for server sessions (server-chosen, never revealed). */
  seed: string | null;
  /** Which authored bank the session draws from; see ExamBankId. */
  bankId: ExamBankId;
  config: ExamSelectionConfig | null;
  /**
   * Selected questions in their fixed session order, with answer keys
   * and explanations stripped — see toCandidateQuestion. This is the
   * question data the exam UI ever holds in reactive state.
   */
  questions: readonly CandidateQuestion[];
  /**
   * The same questions with answer keys and explanations restored,
   * populated only once the exam is submitted. Null beforehand. This is
   * what the results/review screen reads; nothing before submission ever
   * sets it.
   */
  reviewQuestions: readonly ReviewQuestion[] | null;
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
  /** Which authored bank `bank` came from; defaults to "curated". */
  bankId?: ExamBankId;
}

export interface ExamActions {
  startExam: (
    bank: readonly AuthoringQuestion[],
    config: ExamSelectionConfig,
    options?: StartExamOptions,
  ) => boolean;
  /**
   * Start a signed-in exam via POST /api/exam/session: the server selects
   * and stores the questions (server-chosen seed) before the student sees
   * any of them, and returns only answer-stripped CandidateQuestions.
   * Resolves false if the session could not be created.
   */
  startServerExam: (
    config: ExamSelectionConfig,
    options?: Pick<StartExamOptions, "bankId">,
  ) => Promise<boolean>;
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
    sessionMode: "local",
    sessionId: null,
    seed: null,
    bankId: "curated",
    config: null,
    questions: [],
    reviewQuestions: null,
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

/**
 * Attempt identity is independent of the selection seed: two sessions
 * started with the same seed deterministically select the same questions
 * in the same order (that is the point of the seed), but they are still
 * two different attempts and must not share an id. `crypto.randomUUID()`
 * is a real global in every supported browser and in Node 19+; the
 * fallback below only matters for older/unusual JS runtimes and is never
 * exercised in this project's supported targets. Tests mock
 * `crypto.randomUUID` directly rather than needing a bespoke injection
 * point.
 */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

/** Real clock used in production; tests substitute fake timers via `vi.setSystemTime`. */
const clock: Clock = systemClock;

/*
 * The bank passed to the most recent startExam call, kept outside the
 * Zustand store deliberately — not part of the reactive state tree the UI
 * subscribes to. Selection is a pure function of (bank, config, seed), so
 * submitExam can deterministically recompute the same full authoring
 * questions (answer keys included) it needs to score against, without the
 * store's `questions` field — what the UI actually reads — ever holding
 * an answer key. See toCandidateQuestion and docs/ASSESSMENT_SECURITY_MODEL.md.
 */
let activeBank: readonly AuthoringQuestion[] = [];

function recomputeAuthoringQuestions(
  config: ExamSelectionConfig,
  seed: string,
): readonly AuthoringQuestion[] {
  const selection = selectExamQuestions(activeBank, config, seed);
  return selection.ok ? selection.questions : [];
}

export const useExamStore = create<ExamStore>((set, get) => ({
  ...createInitialExamState(),

  startExam: (bank, config, options) => {
    const seed = options?.seed ?? generateSeed();
    const selection = selectExamQuestions(bank, config, seed);
    if (!selection.ok) {
      return false;
    }
    activeBank = bank;
    const timed = config.timing === "timed";
    const durationSeconds = timed
      ? durationSecondsFor(config.questionCount, selection.questions)
      : null;
    const startedAt = clock();
    const deadlineAt = durationSeconds === null ? null : startedAt + durationSeconds * 1000;
    set({
      ...createInitialExamState(),
      status: "in_progress",
      sessionId: generateSessionId(),
      seed,
      bankId: options?.bankId ?? "curated",
      config,
      questions: toCandidateQuestions(selection.questions),
      startedAt,
      durationSeconds,
      deadlineAt,
      remainingSeconds: durationSeconds,
    });
    return true;
  },

  startServerExam: async (config, options) => {
    const bankId = options?.bankId ?? "curated";
    try {
      const response = await fetch("/api/exam/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, bankId }),
      });
      if (!response.ok) {
        return false;
      }
      const created = (await response.json()) as CreateSessionResponse;
      if (!created.sessionId || !Array.isArray(created.questions) || created.questions.length === 0) {
        return false;
      }
      /* No client-side bank for a server session: selection and scoring
         both live behind the endpoint. */
      activeBank = [];
      const timed = config.timing === "timed";
      const durationSeconds = timed
        ? durationSecondsFor(config.questionCount, created.questions)
        : null;
      const startedAt = clock();
      const deadlineAt =
        durationSeconds === null ? null : startedAt + durationSeconds * 1000;
      set({
        ...createInitialExamState(),
        status: "in_progress",
        sessionMode: "server",
        sessionId: created.sessionId,
        seed: null,
        bankId,
        config,
        questions: created.questions,
        startedAt,
        durationSeconds,
        deadlineAt,
        remainingSeconds: durationSeconds,
      });
      return true;
    } catch (error) {
      console.error("Could not start a server exam session.", error);
      return false;
    }
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
    /*
     * Recompute the full authoring questions (answer keys included) from
     * the same deterministic (bank, config, seed) rather than reading
     * them from state — state.questions never carries an answer key.
     * config/seed are non-null here: both are always set together with
     * status "in_progress" by startExam, which the guard above requires.
     */
    /*
     * The one runtime choice the AssessmentScoringService seam exists for
     * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum), decided by
     * how the session was created: a server session submits to the server,
     * which recomputes the questions from its own stored selection and
     * records the attempt; a local (guest) session recomputes and scores
     * client-side exactly as before. A server session has no client-side
     * bank, so its locally "recomputed" question list is empty and the
     * review questions arrive in the submit response instead.
     */
    const isServerSession = state.sessionMode === "server";
    const authoringQuestions = isServerSession
      ? []
      : recomputeAuthoringQuestions(state.config!, state.seed!);
    const context = {
      startedAt: state.startedAt,
      submittedAt: effectiveSubmittedAt,
      submissionReason: effectiveReason,
    };
    const scoringService: AssessmentScoringService = isServerSession
      ? new ServerAuthoritativeScoringService(state.sessionId!)
      : localPracticeScoringService;
    const finalize = (submission: ScoredSubmission) =>
      set({
        status: "submitted",
        submittedAt: effectiveSubmittedAt,
        submissionReason: effectiveReason,
        result: submission.result,
        reviewQuestions: submission.reviewQuestions,
        remainingSeconds: state.durationSeconds === null ? null : 0,
      });
    const outcome = scoringService.score(authoringQuestions, state.responses, context);
    if (outcome instanceof Promise) {
      outcome.then(finalize).catch((error) => {
        /*
         * A server session cannot be scored locally — the client holds no
         * answer keys — so the only honest recovery is to return to
         * in_progress and let the student submit again (the server clamps
         * a late retry to the deadline and records timer_expired). For an
         * expired timed exam the tick loop will keep retrying roughly once
         * a second until the server responds; answers are read-only past
         * the deadline either way.
         */
        console.error("Server-authoritative submission failed; please retry.", error);
        set({ status: "in_progress" });
      });
    } else {
      finalize(outcome);
    }
  },

  resetExam: () => {
    activeBank = [];
    set(createInitialExamState());
  },
}));

/* Selectors. */

export function selectCurrentQuestion(state: ExamStore): CandidateQuestion | undefined {
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
