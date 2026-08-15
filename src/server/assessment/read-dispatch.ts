import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";
import type { SubjectFilter } from "@/features/exam-engine/selection";
import type {
  ActiveSessionResponse,
} from "@/features/exam-engine/scoring/server-scoring-contract";
import {
  examBankIdSchema,
  examSelectionConfigSchema,
} from "@/features/exam-engine/scoring/server-scoring-contract";
import { sessionDurationSeconds } from "@/features/exam-engine/exam-patterns";
import type { AuthoringQuestion, CandidateQuestion } from "@/features/exam-engine/types";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import {
  summarizeAttempt,
  type AttemptRow,
  type AttemptSummary,
} from "@/features/student/attempt-summary";
import { getExamBank } from "@/server/exam-bank";

/**
 * Read dispatch by session identity (spec §12.7 step 7, ADR-005 Amendment A).
 *
 * THE RULE, in one line: **a session is read from the model that created it.**
 *
 * Step 3 backfilled terminal legacy sittings into the target tables, so a
 * sitting can now have rows in both models. "Resolve the new model first" read
 * as a presence probe would source a backfilled sitting from `assessment_*` and
 * an identical-vintage un-backfilled one from `exam_*` — two sittings of the
 * same kind rendered through different pipelines, with which one gets which
 * decided by how far the backfill happened to have run. Amendment A settles it
 * on origin instead: the target model is still asked first, but it is asked
 * "did you create this", and `legacy_session_id` is exactly that record.
 *
 * Every function here resolves to ONE source. Nothing in this module reads both
 * models for one sitting and merges them, and nothing hands a client the pieces
 * to do it either: the DTOs below are the same types the legacy path already
 * returns, so a caller cannot tell which model answered.
 */

/** Which model created a sitting, and therefore which one answers for it. */
export type SittingOrigin = "legacy" | "version_pinned";

export interface SittingSource {
  readonly origin: SittingOrigin;
  /**
   * The id to read the sitting from **in its authoritative model** — which is
   * not always the id that was asked about. A backfilled sitting has two
   * identities, its `exam_sessions.id` and its `assessment_sessions.id`, and
   * both resolve here to the legacy one. That is what makes "exactly one source
   * per sitting" a property of the sitting rather than of the lookup.
   */
  readonly sessionId: string;
}

/**
 * The two client methods this module uses, and nothing else.
 *
 * `Pick` of the real client rather than a hand-written structural interface.
 * The structural version type-checked and cost a `TS2589 — type instantiation
 * is excessively deep` at one of the three call sites: PostgREST's builder
 * generics are deep enough that proving a hand-written equivalent assignable is
 * not free. `Pick` is exact by construction, so there is nothing to prove.
 *
 * A unit test passes a stub through one cast, which is the honest trade: the
 * dispatch rules — which query is issued, and what is done with the answer —
 * are worth testing without standing up a database, and the queries themselves
 * are covered against a real one in `tests/rls/read-dispatch.test.ts`.
 */
export type DispatchClient = Pick<SupabaseClient, "from" | "rpc">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

function record(data: unknown): Record<string, unknown> | null {
  return typeof data === "object" && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;
}

/**
 * Which model answers for this session id, or null if the caller cannot see it.
 *
 * Null covers "no such session" and "not yours" with one answer on purpose:
 * both must produce a 404 and nothing else, or the response distinguishes a
 * session that exists from one that does not for someone with no right to know
 * either way. RLS makes the two indistinguishable here, and this keeps them so.
 */
export async function resolveSittingSource(
  supabase: DispatchClient,
  sessionId: string,
): Promise<SittingSource | null> {
  /* ONE query, against the one place the rule lives (§12.7 step 8).
     `visible_sittings` already contains each sitting once, from its origin, and
     carries `alias_session_id` — the backfill copy's id — so a caller holding
     either identity of a backfilled sitting lands on the same row. This module
     used to probe the two models itself; that was a second copy of the rule,
     and the admin views could not have used it. */
  /* Validated before it is interpolated, because `.or()` takes PostgREST filter
     SYNTAX rather than a bound parameter — an id carrying a comma or a dot would
     otherwise be read as more filter. A session id is a uuid or it is nothing,
     and "nothing" resolves to no sitting, which is the same 404 an unknown id
     gets. */
  if (!UUID.test(sessionId)) return null;

  const result = await supabase
    .from("visible_sittings")
    .select("origin, session_id, alias_session_id")
    .or(`session_id.eq.${sessionId},alias_session_id.eq.${sessionId}`)
    .limit(1);

  const row = rows(result.data)[0];
  if (!row) return null;

  return {
    origin: row.origin === "version_pinned" ? "version_pinned" : "legacy",
    sessionId: String(row.session_id),
  };
}

/* ------------------------------------------------------------------------ */
/* History                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * One `visible_sittings` row as the `AttemptRow` every pure reducer already
 * consumes — `summarizeAttempt`, `aggregateMastery`, `buildOverview`.
 *
 * This is the seam that lets every dependent surface move models without
 * changing a line of its display logic. The legacy branch hands back the stored
 * `ExamResult` verbatim, so those reducers see exactly the bytes they saw
 * before; the target branch rebuilds the same shape from typed columns and the
 * view's derived breakdowns.
 *
 * `id` is the SESSION id on both sides, not the attempt id. Nothing downstream
 * uses it as anything but a React key, and the session is the identity the
 * resolution rule is expressed in — a target sitting has no attempt id to give.
 */
export function toAttemptRow(row: Record<string, unknown>): AttemptRow {
  return {
    id: String(row.session_id ?? row.id),
    submitted_at: String(row.submitted_at),
    result: sittingResult(row),
    session: { config: row.config ?? null },
  };
}

/**
 * The stored original where there is one, a faithful reconstruction where there
 * is not.
 *
 * The preference is not an optimisation: for a backfilled sitting the original
 * blob is what the learner was actually told, and the typed columns are a
 * transcription of it (ADR-005 §3). Reconstructing from the transcription when
 * the original is present would be choosing the copy over the record.
 */
function sittingResult(row: Record<string, unknown>): unknown {
  if (row.legacy_result !== null && row.legacy_result !== undefined) return row.legacy_result;

  const reconstructed: Partial<ExamResult> = {
    totalQuestions: numberOrUndefined(row.total_items),
    attemptedQuestions: numberOrUndefined(row.attempted_items) ?? 0,
    correctCount: numberOrUndefined(row.correct_count) ?? 0,
    incorrectCount: numberOrUndefined(row.incorrect_count) ?? 0,
    unansweredCount: numberOrUndefined(row.unanswered_count) ?? 0,
    objectiveMarksEarned: numberOrUndefined(row.objective_awarded_marks),
    objectiveMarksAvailable: numberOrUndefined(row.objective_available_marks),
    objectivePercentage: numberOrUndefined(row.objective_percentage),
    pendingManualMarks: numberOrUndefined(row.pending_manual_marks) ?? 0,
    timeTakenSeconds: numberOrUndefined(row.time_taken_seconds) ?? 0,
  };

  /* Carried through untouched. The view builds it in the same shape the legacy
     scorer emitted, which is what lets `aggregateMastery` count a target
     sitting's subjects without knowing that it is one. */
  return row.breakdowns === null || row.breakdowns === undefined
    ? reconstructed
    : { ...reconstructed, breakdowns: row.breakdowns };
}

/**
 * Finished sittings as `AttemptRow`s, for the surfaces that reduce them rather
 * than render a summary: student overview and mastery, parent dashboard,
 * teacher class data.
 *
 * `studentIds` scopes the read to named children; omitting it returns whatever
 * the caller may see, which for a signed-in student is their own sittings —
 * the same rows the RLS-only queries these replaced returned.
 */
export async function fetchSittingRows(
  supabase: DispatchClient,
  options: { readonly studentIds?: readonly string[]; readonly limit?: number | null } = {},
): Promise<AttemptRow[]> {
  const base = supabase
    .from("visible_sittings")
    .select(SITTING_COLUMNS)
    .not("submitted_at", "is", null);

  const scoped = options.studentIds
    ? base.in("student_id", [...options.studentIds])
    : base;

  /* `limit: null` means "no explicit limit", which is not the same as a large
     one: it reproduces exactly what an unbounded query did before, leaving
     PostgREST's own row cap as the only bound. The engagement streak needs
     every sitting a student has ever had, and silently truncating that at 200
     would shorten a long streak rather than fail. */
  const ordered = scoped.order("submitted_at", { ascending: false });
  const result = await (options.limit === null
    ? ordered
    : ordered.limit(options.limit ?? HISTORY_LIMIT));

  return rows(result.data).map(toAttemptRow);
}

/**
 * The same rows, keeping the fields a caller needs to attribute a sitting to a
 * child and to link back to it. Used where a list mixes several students.
 */
export async function fetchSittingRowsWithIdentity(
  supabase: DispatchClient,
  options: { readonly studentIds?: readonly string[]; readonly limit?: number | null } = {},
): Promise<{ studentId: string; sessionId: string; attemptId: string | null; row: AttemptRow }[]> {
  const base = supabase
    .from("visible_sittings")
    .select(`${SITTING_COLUMNS}, attempt_id`)
    .not("submitted_at", "is", null);

  const scoped = options.studentIds
    ? base.in("student_id", [...options.studentIds])
    : base;

  /* `limit: null` means "no explicit limit", which is not the same as a large
     one: it reproduces exactly what an unbounded query did before, leaving
     PostgREST's own row cap as the only bound. The engagement streak needs
     every sitting a student has ever had, and silently truncating that at 200
     would shorten a long streak rather than fail. */
  const ordered = scoped.order("submitted_at", { ascending: false });
  const result = await (options.limit === null
    ? ordered
    : ordered.limit(options.limit ?? HISTORY_LIMIT));

  return rows(result.data).map((row) => ({
    studentId: String(row.student_id),
    sessionId: String(row.session_id),
    attemptId: typeof row.attempt_id === "string" ? row.attempt_id : null,
    row: toAttemptRow(row),
  }));
}

export function summarizeAssessmentResult(row: {
  id: unknown;
  submitted_at: unknown;
  total_items: unknown;
  attempted_items: unknown;
  objective_percentage: unknown;
  objective_available_marks: unknown;
  pending_manual_marks: unknown;
  legacy_result: unknown;
  session: { config: unknown } | null;
}): AttemptSummary {
  if (row.legacy_result !== null && row.legacy_result !== undefined) {
    return summarizeAttempt({
      id: String(row.id),
      submitted_at: String(row.submitted_at),
      result: row.legacy_result,
      session: row.session,
    });
  }

  /* Built as an ExamResult and handed to the legacy summarizer rather than
     re-implementing its title, subject-label and blank-sitting rules. Two
     implementations of "what does this sitting look like in a list" is exactly
     the drift ADR-005 §6 refused a union view over. */
  const asExamResult: Partial<ExamResult> = {
    totalQuestions: numberOrUndefined(row.total_items),
    attemptedQuestions: numberOrUndefined(row.attempted_items) ?? 0,
    objectivePercentage: numberOrUndefined(row.objective_percentage),
    objectiveMarksAvailable: numberOrUndefined(row.objective_available_marks),
    pendingManualMarks: numberOrUndefined(row.pending_manual_marks) ?? 0,
  };

  return summarizeAttempt({
    id: String(row.id),
    submitted_at: String(row.submitted_at),
    result: asExamResult,
    session: row.session,
  });
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * One finished sitting, in the shape every history surface already renders.
 *
 * `AttemptSummary` is the legacy path's own display model, reused rather than
 * re-invented so that "identical across models" is enforced by the type system
 * instead of by two mappers agreeing. The two additions are facts both models
 * hold: the session identity the sitting belongs to, and the subject it was
 * configured for — needed by callers that exclude the current sitting or filter
 * by subject, and previously read straight off the legacy row.
 *
 * There is deliberately NO field naming the storage model. A client that could
 * see which model served a sitting would be a client that could be built to
 * treat them differently, which is the whole failure §12.7 step 7 is written
 * against.
 */
export interface SittingSummary extends AttemptSummary {
  readonly sessionId: string;
  /** Whose sitting it is — needed by the parent and teacher surfaces, which
   *  render several children's sittings in one list. */
  readonly studentId: string;
  readonly subject: SubjectFilter | null;
}

const HISTORY_LIMIT = 200;

function configSubject(session: { config: unknown } | null): SubjectFilter | null {
  const config = record(session?.config);
  const subject = config?.subject;
  return subject === "numeracy" ||
    subject === "reading" ||
    subject === "language" ||
    subject === "mixed"
    ? subject
    : null;
}

/**
 * The signed-in student's finished sittings across both models, newest first,
 * each from exactly one source.
 *
 * The de-duplication is not done here at all any more: `visible_sittings`
 * already contains each sitting once, from its origin, because §12.7 step 8
 * moved the rule into the database so the SQL-only admin views could share it.
 * What this function adds is the display mapping and the ordering; if it ever
 * grows a filter on a backfill column again, the rule has been forked.
 *
 * No student id is passed in anywhere: RLS on both tables is the access control,
 * exactly as it was for the legacy-only version of this query.
 */
export async function fetchSittingHistory(
  supabase: DispatchClient,
  options: { readonly studentId?: string } = {},
): Promise<SittingSummary[]> {
  const query = supabase
    .from("visible_sittings")
    .select(SITTING_COLUMNS)
    .not("submitted_at", "is", null);

  /* Scoped when the caller is asking about a named child (parent and teacher
     surfaces), unscoped when it is asking about itself — because
     `visible_sittings` already restricts to what this caller may see, through
     the same three relationships the base tables' policies use. An unscoped
     read therefore returns exactly the rows the previous RLS-only query
     returned, which is what keeps this behaviour-preserving. */
  const scoped = options.studentId ? query.eq("student_id", options.studentId) : query;

  const result = await scoped
    .order("submitted_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  return rows(result.data).map(toSittingSummary);
}

/** The columns every summary needs, named once so no consumer selects a subset. */
const SITTING_COLUMNS =
  "origin, session_id, alias_session_id, student_id, config, created_at, expires_at, " +
  "submitted_at, status, total_items, attempted_items, objective_percentage, " +
  "objective_available_marks, pending_manual_marks, legacy_result";

/**
 * One `visible_sittings` row as the summary every history surface renders.
 *
 * The two models are already reconciled by the view, so there is one mapper
 * rather than one per model — and the legacy branch is chosen by the presence of
 * the preserved original, not by an origin flag, because that original is what
 * the learner was actually told (ADR-005 §3).
 */
export function toSittingSummary(row: Record<string, unknown>): SittingSummary {
  const session = { config: row.config };
  return {
    ...summarizeAssessmentResult({
      id: row.session_id,
      submitted_at: row.submitted_at,
      total_items: row.total_items,
      attempted_items: row.attempted_items,
      objective_percentage: row.objective_percentage,
      objective_available_marks: row.objective_available_marks,
      pending_manual_marks: row.pending_manual_marks,
      legacy_result: row.legacy_result,
      session,
    }),
    sessionId: String(row.session_id),
    studentId: String(row.student_id),
    subject: configSubject(session),
  };
}

/* ------------------------------------------------------------------------ */
/* The paper                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * One allocated item as `get_assessment_session` returns it.
 *
 * Every field here is candidate content. The answer key, the private
 * explanation, the grading rules and the rubric are in another table that no
 * application-callable function reads (§17.1, ADR-006 Amendments A and D), so
 * the omission is structural rather than a matter of this mapper being careful.
 */
interface AllocatedItem {
  /** The ledger row this item was served as — the identity responses and flags
   *  are keyed by on the target model (§12.5, ADR-005 Amendment A5). */
  readonly sessionItemId: unknown;
  readonly itemCode: unknown;
  readonly origin: unknown;
  readonly questionType: unknown;
  readonly answerKind: unknown;
  readonly minWords: unknown;
  readonly maxWords: unknown;
  readonly prompt: unknown;
  readonly candidateContent: unknown;
  readonly visuals: unknown;
  readonly marksAvailable: unknown;
  readonly estimatedTimeSeconds: unknown;
  readonly authoredDifficulty: unknown;
  readonly locale: unknown;
  readonly contentSchemaVersion: unknown;
  readonly sourceYearLevel: unknown;
  readonly sourceExamStyle: unknown;
  readonly sourceSubject: unknown;
  readonly sourceSkill: unknown;
  readonly sourceStrand: unknown;
  readonly sourceTopic: unknown;
  readonly sourceTags: unknown;
  readonly stimulus: unknown;
}

/**
 * A version-pinned allocated item, as the candidate question the legacy path
 * produces.
 *
 * Nothing is invented. Every field is read from the row, which is why
 * 20260814090000 had to project four of them first: a mapper that filled
 * `strand` with a placeholder would be shipping fabricated taxonomy on a real
 * child's paper, and a DTO that is identical in shape but not in provenance is
 * the wrong kind of identical.
 */
export function toCandidateQuestionFromItem(item: AllocatedItem): CandidateQuestion {
  const content = record(item.candidateContent) ?? {};
  const stimulus = record(item.stimulus);

  return {
    id: String(item.itemCode),
    type: item.questionType as CandidateQuestion["type"],
    yearLevel: item.sourceYearLevel as CandidateQuestion["yearLevel"],
    examStyle: item.sourceExamStyle as CandidateQuestion["examStyle"],
    /* A row exists in `item_versions` only once its content is published — the
       projection runs off published manifests and a published bank — so this is
       a fact about any served item rather than a default. */
    status: "published",
    origin: item.origin as CandidateQuestion["origin"],
    prompt: String(item.prompt),
    ...(typeof content.instructions === "string"
      ? { instructions: content.instructions }
      : {}),
    ...(stimulus ? { stimulus: stimulus as CandidateQuestion["stimulus"] } : {}),
    options: (Array.isArray(content.options)
      ? content.options
      : []) as CandidateQuestion["options"],
    ...(content.interaction
      ? { interaction: content.interaction as CandidateQuestion["interaction"] }
      : {}),
    visuals: (Array.isArray(item.visuals) ? item.visuals : []) as CandidateQuestion["visuals"],
    answerKind: item.answerKind as CandidateQuestion["answerKind"],
    ...(typeof item.minWords === "number" ? { minWords: item.minWords } : {}),
    ...(typeof item.maxWords === "number" ? { maxWords: item.maxWords } : {}),
    metadata: {
      subject: item.sourceSubject as CandidateQuestion["metadata"]["subject"],
      strand: String(item.sourceStrand),
      topic: String(item.sourceTopic),
      ...(typeof item.sourceSkill === "string" ? { skill: item.sourceSkill } : {}),
      difficulty: item.authoredDifficulty as CandidateQuestion["metadata"]["difficulty"],
      marks: Number(item.marksAvailable),
      estimatedTimeSeconds: Number(item.estimatedTimeSeconds),
      tags: (Array.isArray(item.sourceTags) ? item.sourceTags : []) as string[],
      locale: item.locale as CandidateQuestion["metadata"]["locale"],
      source: "original",
      schemaVersion: Number(item.contentSchemaVersion),
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Active sitting / resume                                                    */
/* ------------------------------------------------------------------------ */

export type ActiveSittingOutcome =
  | { kind: "none" }
  | { kind: "corrupt" }
  | { kind: "ready"; payload: ActiveSessionResponse };

/**
 * One named sitting, read from the model that created it.
 *
 * This is the dispatch rule at its narrowest: an identity in, one source out.
 * The caller never says which model to look in and never learns which one
 * answered — the payload is the same type either way.
 */
export async function fetchSitting(
  supabase: DispatchClient,
  sessionId: string,
  studentId: string,
): Promise<ActiveSittingOutcome> {
  const source = await resolveSittingSource(supabase, sessionId);
  if (!source) return { kind: "none" };

  /* SITTER-ONLY, and the caller id is what makes it so. Both models let a
     parent or teacher SEE that a session exists — `exam_sessions` and
     `assessment_sessions` carry the same three read policies — and neither has
     ever handed them the paper. `get_assessment_session` enforces that itself
     by re-deriving the sitter from auth.uid(); the legacy tables have no such
     function, so the ownership filter goes here. Without it, introducing this
     endpoint would have widened parent access to their child's live exam paper
     as a side effect of a read-dispatch step. */
  return source.origin === "version_pinned"
    ? readTargetSitting(supabase, source.sessionId)
    : readLegacySitting(supabase, source.sessionId, studentId);
}

/**
 * The same grace the create path adds to a timed target session's expiry
 * (20260812120000's `c_timed_grace`). Subtracted back out here so the client
 * restores the paper's time limit rather than the limit plus its own grace.
 */
const TARGET_TIMED_GRACE_SECONDS = 300;

/**
 * "What, if anything, is my resumable sitting?" — across both models, in one
 * query.
 *
 * This used to ask each model separately and compare the two answers. It now
 * asks `visible_sittings`, which has already reconciled them: one row per
 * sitting, from its origin, with backfill copies excluded — and a backfill copy
 * could never be resumable anyway, being a copy of a terminal sitting (ADR-005
 * §3). The winner is then read from the model that created it.
 */
export async function fetchActiveSitting(
  supabase: DispatchClient,
  studentId: string,
): Promise<ActiveSittingOutcome> {
  const open = await mostRecentOpenSitting(supabase, studentId, new Date().toISOString());
  if (!open) return { kind: "none" };

  return open.origin === "version_pinned"
    ? readTargetSitting(supabase, open.id)
    : readLegacySitting(supabase, open.id, studentId);
}

interface CandidateSession {
  readonly id: string;
  readonly origin: SittingOrigin;
}

/**
 * The most recent unexpired, unsubmitted sitting for this student, on either
 * model.
 *
 * `submitted_at is null` is the whole "not already finished" test, and it means
 * the same thing on both sides: the view derives it from the attempt row on the
 * legacy side and from the result row on the target side, so this function does
 * not need to know that the legacy model has no status column.
 *
 * The explicit ownership filter is redundant with the view's own predicate and
 * kept anyway — it is what the legacy route did, and a read whose only control
 * is a policy is one policy edit away from being no control at all.
 *
 * If more than one sitting is somehow still open (two tabs), the most recent is
 * the one worth resuming; an older abandoned one is simply not offered.
 */
async function mostRecentOpenSitting(
  supabase: DispatchClient,
  studentId: string,
  nowIso: string,
): Promise<CandidateSession | null> {
  const result = await supabase
    .from("visible_sittings")
    .select("session_id, origin, created_at")
    .eq("student_id", studentId)
    .gt("expires_at", nowIso)
    .is("submitted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = rows(result.data)[0];
  if (!row) return null;

  return {
    id: String(row.session_id),
    origin: row.origin === "version_pinned" ? "version_pinned" : "legacy",
  };
}

/**
 * The legacy read, unchanged in behaviour from the route that used to hold it:
 * same tables, same order, same reconstruction from the server's own stored
 * selection, same corrupt-session conditions.
 */
async function readLegacySitting(
  supabase: DispatchClient,
  sessionId: string,
  studentId: string,
): Promise<ActiveSittingOutcome> {
  const sessionResult = await supabase
    .from("exam_sessions")
    .select("id, config, selected_question_ids, created_at, expires_at")
    .eq("id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  const session = record(sessionResult.data);
  if (!session) return { kind: "none" };

  const config = examSelectionConfigSchema.safeParse(session.config);
  const bankId = examBankIdSchema.safeParse(
    (session.config as Record<string, unknown> | null)?.bankId,
  );
  if (!config.success || !bankId.success) return { kind: "corrupt" };

  const bank = getExamBank(bankId.data);
  const byId = new Map(bank.map((question) => [question.id, question]));
  const selected = Array.isArray(session.selected_question_ids)
    ? (session.selected_question_ids as string[])
    : [];
  const questions = selected.map((questionId) => byId.get(questionId));
  if (questions.some((question) => question === undefined)) return { kind: "corrupt" };
  const authoringQuestions = questions as AuthoringQuestion[];

  const autosaveResult = await supabase
    .from("exam_responses")
    .select("responses, current_question_index, flagged_question_ids")
    .eq("session_id", sessionId)
    .maybeSingle();
  const autosave = record(autosaveResult.data);

  return {
    kind: "ready",
    payload: {
      sessionId: String(session.id),
      bankId: bankId.data,
      config: config.data,
      questions: toCandidateQuestions(authoringQuestions),
      responses: (autosave?.responses as Record<string, unknown> | undefined) ?? {},
      currentQuestionIndex:
        typeof autosave?.current_question_index === "number"
          ? autosave.current_question_index
          : 0,
      flaggedQuestionIds: Array.isArray(autosave?.flagged_question_ids)
        ? (autosave.flagged_question_ids as string[])
        : [],
      startedAt: String(session.created_at),
      durationSeconds: sessionDurationSeconds(config.data, authoringQuestions),
    },
  };
}

/**
 * The target read, producing the identical payload.
 *
 * One RPC, because `assessment_session_items` and `session_responses` are not
 * learner-readable at all: the definer reader is the sanctioned path (§17.1) and
 * this module holds no privilege the client does not.
 */
async function readTargetSitting(
  supabase: DispatchClient,
  sessionId: string,
): Promise<ActiveSittingOutcome> {
  const result = await supabase.rpc("get_assessment_session", { p_session_id: sessionId });
  if (result.error) {
    /* MM003 is "not yours", MM001 is "not signed in", and both must read as
       "no such sitting" rather than as a failure. The session row itself is
       visible to a parent or teacher through its read policies, so this branch
       IS reachable: without it, asking for a child's paper would answer 500
       where asking for a stranger's answers 404, and the difference is itself
       an answer. */
    const code = (result.error as { code?: unknown }).code;
    if (code === "MM003" || code === "MM001") return { kind: "none" };
    return { kind: "corrupt" };
  }

  const body = record(result.data);
  if (!body) return { kind: "none" };

  const config = examSelectionConfigSchema.safeParse(body.config);
  if (!config.success) return { kind: "corrupt" };

  const items = Array.isArray(body.items) ? (body.items as AllocatedItem[]) : [];
  if (items.length === 0) return { kind: "corrupt" };

  const startedAt =
    typeof body.startedAt === "string" ? body.startedAt : String(body.createdAt);

  return {
    kind: "ready",
    payload: {
      sessionId: String(body.sessionId),
      /* The projection this content was served from is the published bank, so
         this is a fact about the paper rather than a placeholder. It is
         informational for a target sitting — the questions came back with the
         session and are not rebuilt from a compiled bank — but the field is part
         of the contract and must therefore be true, not merely filled. */
      bankId: "published",
      config: config.data,
      questions: items.map(toCandidateQuestionFromItem),
      responses: (record(body.responses) ?? {}) as Record<string, unknown>,
      /* ADR-005 Amendment A5, closed. These were honest zeros while the
         normalized model had nowhere to record the UI state around the answers;
         20260816090000 gave it one, so a resumed target sitting now lands where
         the learner left it with the questions they flagged still flagged. */
      currentQuestionIndex:
        typeof body.currentQuestionIndex === "number" ? body.currentQuestionIndex : 0,
      /* THE MAPPING LIVES HERE, once, and only here. The server stores flags as
         served-item ids because that is the identity it can verify against the
         session's own ledger (§17.2); the client's contract speaks question ids
         because that is what it renders. Both halves are in hand at this point —
         the paper has just been read above — so the translation needs no second
         identity travelling in the payload and no second lookup. An id with no
         item in this paper is dropped rather than passed through: a flag on a
         question that is not on the paper is not a flag the client can show. */
      flaggedQuestionIds: mapFlagsToQuestionIds(body.flaggedSessionItemIds, items),
      startedAt,
      durationSeconds: targetDurationSeconds(body, config.data.timing),
    },
  };
}

/**
 * Served-item ids as the question ids the client flags by.
 *
 * Exported for the unit test rather than inlined, because the interesting cases
 * are the degenerate ones — no state row, a flag for an item that is no longer
 * on the paper — and those are worth asserting without a database.
 */
export function mapFlagsToQuestionIds(
  flagged: unknown,
  /* Only the two fields the mapping needs, rather than the whole allocated item:
     the narrower parameter is what it actually depends on, and it keeps the test
     from having to build a paper to check an id translation. */
  items: readonly { readonly sessionItemId: unknown; readonly itemCode: unknown }[],
): string[] {
  if (!Array.isArray(flagged)) return [];

  const codeByItemId = new Map(
    items.map((item) => [String(item.sessionItemId), String(item.itemCode)]),
  );

  return flagged.flatMap((id) => {
    const code = codeByItemId.get(String(id));
    return code === undefined ? [] : [code];
  });
}

/**
 * The paper's own time limit, recovered from the expiry the create path derived.
 *
 * `create_assessment_session` set `expires_at = created_at + estimated + grace`
 * for a timed sitting, so subtracting the grace gives back the limit the paper
 * was built with — the same number the legacy path takes from the pattern. An
 * untimed sitting has no limit, and its 24-hour expiry is a reaping deadline
 * rather than a clock to show anyone.
 */
function targetDurationSeconds(body: Record<string, unknown>, timing: string): number | null {
  if (timing !== "timed") return null;

  const createdAt = Date.parse(String(body.createdAt));
  const expiresAt = Date.parse(String(body.expiresAt));
  if (Number.isNaN(createdAt) || Number.isNaN(expiresAt)) return null;

  const seconds = Math.round((expiresAt - createdAt) / 1000) - TARGET_TIMED_GRACE_SECONDS;
  return seconds > 0 ? seconds : null;
}

/* ------------------------------------------------------------------------ */
/* Marking                                                                    */
/* ------------------------------------------------------------------------ */

export interface ManualReviewQuestion {
  readonly questionKey: string;
  readonly availableMarks: number;
  /**
   * The served-item id on the target model, which is what
   * `record_manual_mark` is keyed by. Null for a legacy sitting, whose marks
   * hang off `essay_marks (attempt_id, question_id)` — the bare question id
   * being the only identity that model ever recorded.
   */
  readonly sessionItemId: string | null;
}

export interface ManualReviewSitting {
  readonly origin: SittingOrigin;
  readonly sessionId: string;
  /** The legacy attempt id, which is still the marking write path's identity. */
  readonly attemptId: string | null;
  readonly studentId: string;
  readonly submittedAt: string;
  readonly questions: readonly ManualReviewQuestion[];
}

/**
 * Sittings with at least one question still awaiting a human mark, for the
 * teacher's marking queue.
 *
 * The per-question rows come from `visible_sitting_questions`, which normalises
 * where each model records them — the legacy model in the immutable
 * `questionDetails` array, the target model as scored response rows. So the
 * queue has no union of its own.
 *
 * MARKING NOW LISTS BOTH MODELS. Step 8 filtered this to legacy-origin sittings
 * and said why in as many words: the write path recorded against
 * `essay_marks.attempt_id`, a target sitting has no attempt, and listing one
 * would put a row in a teacher's queue that no button can clear. That is no
 * longer true — 20260816100000 is the button — so the filter is gone rather
 * than merely relaxed. §12.7 step 8's rule is that a consumer moves once it can
 * be verified on the target model, and `tests/rls/manual-marks-write-path.test.ts`
 * is that verification: a target essay sitting is marked, and the mark clears
 * this queue.
 */
export async function fetchManualReviewSittings(
  supabase: DispatchClient,
  studentIds: readonly string[],
): Promise<ManualReviewSitting[]> {
  if (studentIds.length === 0) return [];

  const [questionRows, sittingRows] = await Promise.all([
    supabase
      .from("visible_sitting_questions")
      .select(
        "origin, session_id, student_id, submitted_at, question_key, available_marks, session_item_id",
      )
      .in("student_id", [...studentIds])
      .eq("pending_manual", true),
    supabase
      .from("visible_sittings")
      .select("session_id, attempt_id")
      .in("student_id", [...studentIds])
      .not("submitted_at", "is", null),
  ]);

  const attemptBySession = new Map<string, string | null>();
  for (const row of rows(sittingRows.data)) {
    attemptBySession.set(
      String(row.session_id),
      typeof row.attempt_id === "string" ? row.attempt_id : null,
    );
  }

  const bySession = new Map<string, ManualReviewSitting>();
  for (const row of rows(questionRows.data)) {
    const sessionId = String(row.session_id);
    const existing = bySession.get(sessionId);
    const question: ManualReviewQuestion = {
      questionKey: String(row.question_key),
      availableMarks: Number(row.available_marks ?? 0),
      sessionItemId: typeof row.session_item_id === "string" ? row.session_item_id : null,
    };
    if (existing) {
      (existing.questions as ManualReviewQuestion[]).push(question);
      continue;
    }
    bySession.set(sessionId, {
      origin: row.origin === "version_pinned" ? "version_pinned" : "legacy",
      sessionId,
      attemptId: attemptBySession.get(sessionId) ?? null,
      studentId: String(row.student_id),
      submittedAt: String(row.submitted_at),
      questions: [question],
    });
  }

  return [...bySession.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export interface ResolvedManualMark {
  readonly sessionId: string;
  readonly questionKey: string;
  readonly markedBy: string;
  readonly awardedMarks: number;
  readonly maxMarks: number;
  readonly feedback: string | null;
  readonly markedAt: string;
}

/**
 * Marks already awarded for these sittings, from whichever model holds them.
 *
 * Keyed on the sitting rather than on the legacy attempt, because that is the
 * identity the resolution rule is expressed in and the only one both models
 * have. Teacher-visible only: `visible_manual_marks` carries a single
 * teacher predicate, matching `essay_marks`' single policy.
 */
export async function fetchManualMarks(
  supabase: DispatchClient,
  sessionIds: readonly string[],
): Promise<ResolvedManualMark[]> {
  if (sessionIds.length === 0) return [];

  const result = await supabase
    .from("visible_manual_marks")
    .select("session_id, question_key, marked_by, awarded_marks, max_marks, feedback, marked_at")
    .in("session_id", [...sessionIds]);

  return rows(result.data).map((row) => ({
    sessionId: String(row.session_id),
    questionKey: String(row.question_key),
    markedBy: String(row.marked_by),
    awardedMarks: Number(row.awarded_marks),
    maxMarks: Number(row.max_marks),
    feedback: typeof row.feedback === "string" ? row.feedback : null,
    markedAt: String(row.marked_at),
  }));
}
