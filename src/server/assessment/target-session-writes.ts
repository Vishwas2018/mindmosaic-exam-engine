import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ExamResult, QuestionResultDetail, BreakdownRow } from "@/features/exam-engine/scoring";
import type { ExamSelectionConfig } from "@/features/exam-engine/selection";
import type { AuthoringQuestion, CandidateQuestion, ReviewQuestion } from "@/features/exam-engine/types";
import { toCandidateQuestionFromItem } from "@/server/assessment/read-dispatch";
import { getExamBank } from "@/server/exam-bank";
import {
  scoreAssessmentSession,
  ScoringRefused,
  type ScoredItemOutcome,
  type ScoredSessionSummary,
  type SubmissionReason,
} from "@/server/scoring/answer-access";

/**
 * The target-model half of the create/autosave/submit lifecycle (Gate A item
 * A9, docs/phase2-cutover-readiness-checklist.md). Legacy stays exactly as it
 * was — see the three routes under src/app/api/exam/session/** — this module
 * is what a route calls once it has resolved a session (or a NEW session's
 * caller) onto the version-pinned model, via `resolveSittingSource`
 * (@/server/assessment/read-dispatch) for an existing session or
 * `resolveSessionStorageModel` (@/server/assessment/storage-model) for a new
 * one. Nothing here is reachable for a legacy sitting.
 *
 * THE ONE NEW READ THIS MODULE ADDS. `get_assessment_session` already exists
 * and is the sanctioned candidate reader (§17.1); every function below calls
 * it to learn the session's served-item ledger — sessionItemId <-> itemCode —
 * because a client speaks the public item code (the same id space
 * CandidateQuestion has always used) and every write RPC on the target model
 * (`commit_assessment_responses`) is keyed by the immutable session-item id
 * instead (§12.5). THE MAPPING LIVES HERE, at the HTTP boundary, for exactly
 * the reason read-dispatch.ts's flag-mapping comment gives: both identities
 * are in hand at the same moment, so no second identity needs to travel
 * anywhere and no second lookup is needed downstream.
 *
 * THE REVIEW REVEAL DOES NOT READ item_answer_versions. ADR-006 Amendment A's
 * boundary is "no application-callable function reads item_answer_versions
 * except the isolated scoring module" — a third path to the answer table,
 * however narrow, is exactly what that boundary forbids, and this module is
 * not the scoring module (it holds no SCORING_DB_URL credential and cannot
 * acquire one). So `buildReviewQuestions` below never touches the DB for
 * answer content at all: for the curated and factory-published pools, the
 * projected item_versions row and the compiled bank entry are the SAME
 * content, verified byte-for-byte by `scripts/shadow-compare-runtime-content.mts`
 * — the projection's whole reason to exist is that they never diverge. So the
 * review reveal reads the compiled bank in-process, exactly the way the
 * legacy submit route already does (`getExamBank(...)`), for the exact same
 * closed set of items this module could otherwise only get answers for by
 * building a second scoring-module-shaped credential. This is not a new
 * privilege; it is the one legacy already has, applied to items this session
 * happens to have served from the target model.
 */

/* ---------------------------------------------------------------------- */
/* The served-item ledger, minimally                                       */
/* ---------------------------------------------------------------------- */

/**
 * KNOWN LATENT GAP, not fixed here (docs/two-stream-reconciliation.md §2.6):
 * `create_assessment_session`'s allocation query has no awareness of
 * `item_group_version_id`/`item_group_version_items` (from the concurrent
 * capability-expansion stream) — it selects individually from `item_versions`
 * and never populates `assessment_session_items.item_group_version_id` /
 * `group_ordinal` / `part_label`. If a group-authored item (a shared-stimulus
 * multi-part item) is ever projected, this whole lifecycle — this file
 * included, since `ServedItem` below carries no group fields — would allocate
 * and serve it as a lone item, silently losing its shared stimulus and part
 * labelling. Not reachable today: the concurrent migration seeds zero
 * `item_group_versions` rows, so no group-authored content exists to trigger
 * it. Close this when the item-group model lands, not as part of A9.
 */
export interface ServedItem {
  readonly sessionItemId: string;
  readonly itemCode: string;
  readonly questionType: string;
  readonly answerKind: string | null;
  readonly sourceSubject: string;
  readonly sourceSkill: string | null;
  readonly sourceTopic: string;
  readonly sourceYearLevel: number;
  readonly sourceExamStyle: string;
  readonly authoredDifficulty: string;
  readonly marksAvailable: number;
}

export type TargetPaperOutcome =
  | { readonly kind: "ok"; readonly status: string; readonly items: readonly ServedItem[] }
  | { readonly kind: "not_found" }
  | { readonly kind: "corrupt" };

function record(data: unknown): Record<string, unknown> | null {
  return typeof data === "object" && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;
}

/**
 * The one RPC call every function below starts from. `get_assessment_session`
 * re-derives the sitter from `auth.uid()` and refuses anyone else (MM003), so
 * this doubles as the ownership check — a caller-scoped Supabase client is the
 * only kind this module ever takes.
 */
async function loadServedItems(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<TargetPaperOutcome> {
  const result = await supabase.rpc("get_assessment_session", { p_session_id: sessionId });
  if (result.error) {
    const code = (result.error as { code?: unknown }).code;
    if (code === "MM003" || code === "MM001") return { kind: "not_found" };
    return { kind: "corrupt" };
  }

  const body = record(result.data);
  if (!body) return { kind: "not_found" };

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) return { kind: "corrupt" };

  const items: ServedItem[] = [];
  for (const raw of rawItems) {
    const item = record(raw);
    if (!item) return { kind: "corrupt" };
    items.push({
      sessionItemId: String(item.sessionItemId),
      itemCode: String(item.itemCode),
      questionType: String(item.questionType),
      answerKind: typeof item.answerKind === "string" ? item.answerKind : null,
      sourceSubject: String(item.sourceSubject),
      sourceSkill: typeof item.sourceSkill === "string" ? item.sourceSkill : null,
      sourceTopic: String(item.sourceTopic),
      sourceYearLevel: Number(item.sourceYearLevel),
      sourceExamStyle: String(item.sourceExamStyle),
      authoredDifficulty: String(item.authoredDifficulty),
      marksAvailable: Number(item.marksAvailable),
    });
  }

  return { kind: "ok", status: String(body.status), items };
}

/**
 * Public question ids -> session-item ids, refusing the whole request rather
 * than dropping a key it cannot resolve. A key that does not match a served
 * item can only come from a forged or corrupted client, and silently
 * dropping it would be recording a paper that is not the one served — the
 * same fail-closed shape `commit_assessment_responses` itself applies to the
 * same check, one layer down.
 */
function translateResponseKeys(
  responses: Record<string, unknown>,
  items: readonly ServedItem[],
): Record<string, unknown> | null {
  const sessionItemIdByCode = new Map(items.map((item) => [item.itemCode, item.sessionItemId]));
  const translated: Record<string, unknown> = {};
  for (const [questionId, answer] of Object.entries(responses)) {
    const sessionItemId = sessionItemIdByCode.get(questionId);
    if (sessionItemId === undefined) return null;
    translated[sessionItemId] = answer;
  }
  return translated;
}

function translateFlaggedIds(
  flaggedQuestionIds: readonly string[],
  items: readonly ServedItem[],
): string[] | null {
  const sessionItemIdByCode = new Map(items.map((item) => [item.itemCode, item.sessionItemId]));
  const translated: string[] = [];
  for (const questionId of flaggedQuestionIds) {
    const sessionItemId = sessionItemIdByCode.get(questionId);
    if (sessionItemId === undefined) return null;
    translated.push(sessionItemId);
  }
  return translated;
}

/* ---------------------------------------------------------------------- */
/* Autosave                                                                 */
/* ---------------------------------------------------------------------- */

export type TargetAutosaveOutcome =
  | { readonly kind: "ok"; readonly savedAt: string }
  | { readonly kind: "not_found" }
  | { readonly kind: "expired" }
  | { readonly kind: "terminal" }
  | { readonly kind: "invalid" }
  | { readonly kind: "corrupt" };

export async function autosaveTargetSession(
  supabase: SupabaseClient,
  sessionId: string,
  input: {
    readonly responses: Record<string, unknown>;
    readonly currentQuestionIndex: number;
    readonly flaggedQuestionIds: readonly string[];
  },
): Promise<TargetAutosaveOutcome> {
  const paper = await loadServedItems(supabase, sessionId);
  if (paper.kind !== "ok") return paper;

  const translatedResponses = translateResponseKeys(input.responses, paper.items);
  const translatedFlags = translateFlaggedIds(input.flaggedQuestionIds, paper.items);
  if (translatedResponses === null || translatedFlags === null) {
    return { kind: "invalid" };
  }

  /* ADR-006 §3's monotonic autosave counter (p_client_sequence). The legacy
     model has no such concept — a plain upsert always wins — because a single
     JSON document autosave has nothing to be stale RELATIVE TO but itself.
     The target model's per-item response rows do, so the RPC requires one.
     Wall-clock milliseconds is a safe proxy here specifically because this
     route's own debounce already serialises one caller's autosave calls (the
     client never has two in flight at once), and `commit_assessment_responses`
     applies `>=`, not `>`, so two calls landing in the same millisecond still
     both apply rather than one losing spuriously. A genuine client-generated
     counter would be needed only if this endpoint ever accepted concurrent
     writers for one session, which it does not. */
  const clientSequence = Date.now();

  const result = await supabase.rpc("commit_assessment_responses", {
    p_session_id: sessionId,
    p_responses: translatedResponses,
    p_client_sequence: clientSequence,
    p_current_question_index: input.currentQuestionIndex,
    p_flagged_session_item_ids: translatedFlags,
  });

  if (result.error) {
    const code = (result.error as { code?: unknown }).code;
    if (code === "MM003" || code === "MM001") return { kind: "not_found" };
    if (code === "MM004") return { kind: "expired" };
    if (code === "MM214") return { kind: "terminal" };
    if (code === "MM215" || code === "MM216") return { kind: "invalid" };
    return { kind: "corrupt" };
  }

  return { kind: "ok", savedAt: new Date().toISOString() };
}

/* ---------------------------------------------------------------------- */
/* Submit + score                                                           */
/* ---------------------------------------------------------------------- */

export type TargetSubmitOutcome =
  | { readonly kind: "ok"; readonly result: ExamResult; readonly reviewQuestions: readonly ReviewQuestion[] }
  | { readonly kind: "not_found" }
  | { readonly kind: "expired" }
  | { readonly kind: "already_submitted" }
  | { readonly kind: "invalid" }
  | { readonly kind: "corrupt" };

/**
 * The compiled-bank lookup the module header explains. Every served item MUST
 * resolve — an item projected from the published bank that is no longer IN
 * the compiled bank the server is currently running is exactly the kind of
 * drift `corrupt` exists to name rather than paper over with a partial
 * review screen.
 */
function buildReviewQuestions(items: readonly ServedItem[]): readonly AuthoringQuestion[] | null {
  const byCode = new Map(
    [...getExamBank("published")].map((question) => [question.id, question] as const),
  );
  const questions: AuthoringQuestion[] = [];
  for (const item of items) {
    const question = byCode.get(item.itemCode);
    if (!question) return null;
    questions.push(question);
  }
  return questions;
}

function emptyRow(): BreakdownRow {
  return {
    total: 0,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    manualReview: 0,
    objectiveMarksEarned: 0,
    objectiveMarksAvailable: 0,
  };
}

function accumulate(rows: Record<string, BreakdownRow>, dimension: string, detail: QuestionResultDetail): void {
  const row = (rows[dimension] ??= emptyRow());
  row.total += 1;
  if (detail.attempted) row.attempted += 1;
  if (detail.status === "correct") row.correct += 1;
  if (detail.status === "incorrect") row.incorrect += 1;
  if (detail.status === "unanswered") row.unanswered += 1;
  if (detail.pendingManualReview) row.manualReview += 1;
  if (!detail.requiresManualMarking) {
    row.objectiveMarksEarned += detail.awardedMarks;
    row.objectiveMarksAvailable += detail.availableMarks;
  }
}

/**
 * Reshapes the DB-authoritative `ScoredSessionSummary` into the same
 * `ExamResult` the legacy path returns — never a second scoring, only a
 * second shape. Every per-question verdict (`ScoredItemOutcome`) already
 * came from `scoreAssessmentSession`, the one and only place that reads an
 * answer key for this sitting; this function counts and buckets those
 * verdicts by the item metadata `get_assessment_session` already returned,
 * exactly as `read-dispatch.ts`'s history reconstruction reshapes
 * `resolved_sittings` columns rather than re-deriving them.
 *
 * `requiresManualMarking` is read from `item.answerKind === "manual"`, not
 * from `ScoredItemOutcome` (which does not carry it): the outcome's own
 * `status` collapses "unanswered because blank" and "unanswered because
 * nobody marked it yet" into the same `"unanswered"` value, and conflating
 * them here would reproduce the exact §14.3 bug
 * `src/tests/unit/blank-sitting-aggregates.test.ts` exists to catch — an
 * unanswered essay counted as an objective zero instead of excluded from the
 * denominator entirely.
 */
function buildExamResultFromOutcomes(
  items: readonly ServedItem[],
  summary: ScoredSessionSummary,
): ExamResult {
  const outcomeByItemId = new Map(summary.outcomes.map((outcome) => [outcome.sessionItemId, outcome]));

  const questionDetails: QuestionResultDetail[] = items.map((item) => {
    const outcome = outcomeByItemId.get(item.sessionItemId) as ScoredItemOutcome;
    return {
      questionId: item.itemCode,
      status: outcome.status,
      attempted: outcome.status !== "unanswered",
      requiresManualMarking: item.answerKind === "manual",
      pendingManualReview: outcome.status === "manual_review",
      awardedMarks: outcome.awardedMarks ?? 0,
      availableMarks: outcome.availableMarks,
    };
  });

  const byQuestionType: Record<string, BreakdownRow> = {};
  const bySubject: Record<string, BreakdownRow> = {};
  const bySkill: Record<string, BreakdownRow> = {};
  const byDifficulty: Record<string, BreakdownRow> = {};
  const byYearLevel: Record<string, BreakdownRow> = {};
  const byExamStyle: Record<string, BreakdownRow> = {};

  items.forEach((item, index) => {
    const detail = questionDetails[index]!;
    accumulate(byQuestionType, item.questionType, detail);
    accumulate(bySubject, item.sourceSubject, detail);
    accumulate(bySkill, item.sourceSkill ?? item.sourceTopic, detail);
    accumulate(byDifficulty, item.authoredDifficulty, detail);
    accumulate(byYearLevel, `year-${item.sourceYearLevel}`, detail);
    accumulate(byExamStyle, item.sourceExamStyle, detail);
  });

  return {
    totalQuestions: summary.totalItems,
    attemptedQuestions: summary.attemptedItems,
    autoMarkedQuestions: summary.autoMarkedItems,
    manualReviewQuestions: summary.manualReviewItems,
    correctCount: summary.correctCount,
    incorrectCount: summary.incorrectCount,
    unansweredCount: summary.unansweredCount,
    objectiveMarksEarned: summary.objectiveAwardedMarks,
    objectiveMarksAvailable: summary.objectiveAvailableMarks,
    objectivePercentage: summary.objectivePercentage,
    /* summary.pendingManualMarks is now correctly a sum of marks, not a
       count (answer-access.ts) — trusted directly rather than recomputed
       from questionDetails, since both would now compute the same value
       from the same underlying outcomes. */
    pendingManualMarks: summary.pendingManualMarks,
    timeTakenSeconds: summary.timeTakenSeconds,
    submissionReason: summary.submissionReason,
    startedAt: Date.parse(summary.startedAt),
    submittedAt: Date.parse(summary.submittedAt),
    questionDetails,
    breakdowns: { byQuestionType, bySubject, bySkill, byDifficulty, byYearLevel, byExamStyle },
  };
}

export async function submitTargetSession(
  supabase: SupabaseClient,
  sessionId: string,
  actorId: string,
  input: {
    readonly responses: Record<string, unknown>;
    readonly submissionReason: SubmissionReason;
  },
): Promise<TargetSubmitOutcome> {
  const paper = await loadServedItems(supabase, sessionId);
  if (paper.kind !== "ok") return paper;
  if (paper.status === "submitted" || paper.status === "processed" || paper.status === "abandoned") {
    /* Mirrors the legacy route's own pre-check (existingAttempt -> 409): a
       defined conflict on retry, not a second scored result. The DB-side
       repeat is refused identically by scoreAssessmentSession below
       (session_not_scoreable) — this is the fast path that avoids the round
       trip and the answer-key read for the common case. */
    return { kind: "already_submitted" };
  }

  const translatedResponses = translateResponseKeys(input.responses, paper.items);
  if (translatedResponses === null) return { kind: "invalid" };

  /* The final answers must be committed before scoring: scoreAssessmentSession
     reads only from session_responses, never from a parameter (§12.5, §14.1) —
     unlike the legacy route, which scores whatever the client just sent
     directly. A submit that never autosaved its last answer must still commit
     it here or the target sitting would be scored one keystroke behind. */
  const commit = await supabase.rpc("commit_assessment_responses", {
    p_session_id: sessionId,
    p_responses: translatedResponses,
    p_client_sequence: Date.now(),
    p_current_question_index: null,
    p_flagged_session_item_ids: null,
  });
  if (commit.error) {
    const code = (commit.error as { code?: unknown }).code;
    if (code === "MM003" || code === "MM001") return { kind: "not_found" };
    if (code === "MM004") return { kind: "expired" };
    if (code === "MM214") return { kind: "already_submitted" };
    if (code === "MM215") return { kind: "invalid" };
    return { kind: "corrupt" };
  }

  let summary: ScoredSessionSummary;
  try {
    summary = await scoreAssessmentSession(sessionId, actorId, input.submissionReason);
  } catch (error) {
    if (error instanceof ScoringRefused) {
      if (error.code === "session_not_found" || error.code === "not_session_owner") {
        return { kind: "not_found" };
      }
      if (error.code === "session_not_scoreable") return { kind: "already_submitted" };
      /* session_not_version_pinned / unsupported_scoring_algorithm: both are
         real states of a real row, neither is a client mistake. corrupt is
         the same code the read side uses for an equivalent "the row exists
         but this route cannot honestly serve it" situation. */
      return { kind: "corrupt" };
    }
    throw error;
  }

  const reviewQuestions = buildReviewQuestions(paper.items);
  if (reviewQuestions === null) return { kind: "corrupt" };

  return {
    kind: "ok",
    result: buildExamResultFromOutcomes(paper.items, summary),
    reviewQuestions,
  };
}

/* ---------------------------------------------------------------------- */
/* Create                                                                   */
/* ---------------------------------------------------------------------- */

export type TargetCreateOutcome =
  | { readonly kind: "ok"; readonly sessionId: string; readonly questions: readonly CandidateQuestion[] }
  | { readonly kind: "no_eligible_content" }
  | { readonly kind: "pattern_not_supported" }
  | { readonly kind: "idempotency_conflict" }
  | { readonly kind: "corrupt" };

/**
 * `create_assessment_session` selects the paper itself, server-side, under a
 * seed it generates (§17.2) — this function's whole job is to call it and
 * then read back what it served, exactly the shape `get_assessment_session`
 * already returns for a resume. The RPC's own response carries no items
 * (only `sessionId` and pins), by design: the ledger it just wrote is the
 * one thing a definer function should not have to serialise twice.
 *
 * `patternId` (an exam-simulation paper) has no target-model equivalent yet:
 * `create_assessment_session` is deliberately "blueprint-blind" (its own
 * migration header, 20260812120000) because blueprints are Phase 3. A
 * target-cohort caller asking for a pattern gets a named refusal rather than
 * either a silent fallback to legacy (which would make "the cohort routes
 * this student to target" stop being true for one request in a way nothing
 * else in this lifecycle does) or a paper shaped like something it is not.
 */
export async function createTargetSession(
  supabase: SupabaseClient,
  input: {
    readonly config?: ExamSelectionConfig;
    readonly patternId?: string;
    readonly idempotencyKey: string;
  },
): Promise<TargetCreateOutcome> {
  if (input.patternId !== undefined || input.config === undefined) {
    return { kind: "pattern_not_supported" };
  }

  const created = await supabase.rpc("create_assessment_session", {
    p_config: input.config,
    p_idempotency_key: input.idempotencyKey,
  });
  if (created.error) {
    const code = (created.error as { code?: unknown }).code;
    if (code === "MM212") return { kind: "no_eligible_content" };
    if (code === "MM211") return { kind: "idempotency_conflict" };
    return { kind: "corrupt" };
  }

  const body = record(created.data);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
  if (!sessionId) return { kind: "corrupt" };

  const served = await supabase.rpc("get_assessment_session", { p_session_id: sessionId });
  if (served.error) return { kind: "corrupt" };

  const paper = record(served.data);
  const rawItems = Array.isArray(paper?.items) ? paper.items : [];
  if (rawItems.length === 0) return { kind: "corrupt" };

  return {
    kind: "ok",
    sessionId,
    questions: rawItems.map((item) =>
      toCandidateQuestionFromItem(item as Parameters<typeof toCandidateQuestionFromItem>[0]),
    ),
  };
}
