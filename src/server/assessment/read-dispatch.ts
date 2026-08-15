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
  /* The new model first, as §12.7 step 7 says — asked whether it CREATED this
     session, not merely whether it holds a row for it. */
  const target = await supabase
    .from("assessment_sessions")
    .select("id, legacy_session_id")
    .eq("id", sessionId)
    .maybeSingle();

  const targetRow = record(target.data);
  if (targetRow) {
    const legacyId = targetRow.legacy_session_id;
    /* A backfill copy. Its origin is the legacy model and that is where it is
       read from, however complete the copy is: step 5 proved these rows match
       their source, which is not the same as making them the source
       (Amendment A4). */
    if (typeof legacyId === "string") return { origin: "legacy", sessionId: legacyId };
    return { origin: "version_pinned", sessionId: String(targetRow.id) };
  }

  const legacy = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  const legacyRow = record(legacy.data);
  if (legacyRow) return { origin: "legacy", sessionId: String(legacyRow.id) };

  return null;
}

/* ------------------------------------------------------------------------ */
/* History                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * One target-model result row, mapped to the same summary the legacy path
 * produces.
 *
 * Pure and exported so the mapping can be tested without a database — the
 * property that matters ("both models produce the same shape") is a property of
 * these two functions, not of the queries around them.
 *
 * `legacyResult` is preferred when present, because a backfilled row's typed
 * columns are a *transcription* of the original `ExamResult` and the original is
 * what the learner was actually told (ADR-005 §3). In practice this branch is
 * unreachable from `fetchSittingHistory` below, which excludes backfilled rows
 * by origin — it is here because the function is also the mapper a future
 * step-10 flip would use, and at that point it must not start quietly
 * re-deriving history from the transcription.
 */
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
 * The de-duplication is the origin rule again, applied to results:
 * `assessment_results.legacy_attempt_id is null` selects the results the target
 * model PRODUCED, and excludes the ones it was handed by the backfill — whose
 * `exam_attempts` row is already in the legacy half of this union. The
 * discriminator is a unique column, not a heuristic key like
 * `(student, submitted_at)`, which would also collapse two genuinely distinct
 * sittings submitted in the same second.
 *
 * No student id is passed in anywhere: RLS on both tables is the access control,
 * exactly as it was for the legacy-only version of this query.
 */
export async function fetchSittingHistory(
  supabase: DispatchClient,
): Promise<SittingSummary[]> {
  const legacy = await supabase
    .from("exam_attempts")
    .select("id, submitted_at, result, session_id, session:exam_sessions(config)")
    .order("submitted_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const target = await supabase
    .from("assessment_results")
    .select(
      "id, session_id, submitted_at, total_items, attempted_items, objective_percentage, " +
        "objective_available_marks, pending_manual_marks, legacy_result, " +
        "session:assessment_sessions(config)",
    )
    .is("legacy_attempt_id", null)
    .order("submitted_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const legacySummaries = rows(legacy.data).map((row) => {
    const session = embeddedSession(row.session);
    return {
      ...summarizeAttempt(toAttemptRow(row)),
      sessionId: String(row.session_id),
      subject: configSubject(session),
    };
  });

  const targetSummaries = rows(target.data).map((row) => {
    const session = embeddedSession(row.session);
    return {
      ...summarizeAssessmentResult({
        id: row.id,
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
      subject: configSubject(session),
    };
  });

  /* Ordered across the union, not within each half — a merge that kept the two
     lists adjacent would sort correctly inside each model and read as two
     interleaved histories. */
  return [...legacySummaries, ...targetSummaries]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, HISTORY_LIMIT);
}

function toAttemptRow(row: Record<string, unknown>): AttemptRow {
  return {
    id: String(row.id),
    submitted_at: String(row.submitted_at),
    result: row.result,
    session: embeddedSession(row.session),
  };
}

/** PostgREST returns an embedded to-one relation as an object or a 1-element array. */
function embeddedSession(value: unknown): { config: unknown } | null {
  const first = Array.isArray(value) ? (value[0] ?? null) : value;
  const row = record(first);
  return row ? { config: row.config } : null;
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
 * "What, if anything, is my resumable sitting?" — across both models.
 *
 * Resolved by origin, like everything else here: the most recent unexpired,
 * unsubmitted session in each model is found, the newer of the two wins, and it
 * is read from the model that created it. A learner cannot have one in both
 * models at once by design (a session never changes model, and each create path
 * writes only its own tables), but the comparison is written anyway rather than
 * assuming — an assumption about the data is not a control over it.
 */
export async function fetchActiveSitting(
  supabase: DispatchClient,
  studentId: string,
): Promise<ActiveSittingOutcome> {
  const nowIso = new Date().toISOString();

  const target = await mostRecentTargetSession(supabase, studentId, nowIso);
  const legacy = await mostRecentLegacySession(supabase, studentId, nowIso);

  if (target && (!legacy || target.createdAt > legacy.createdAt)) {
    return readTargetSitting(supabase, target.id);
  }
  if (legacy) return readLegacySitting(supabase, legacy.id, studentId);
  return { kind: "none" };
}

interface CandidateSession {
  readonly id: string;
  readonly createdAt: string;
}

async function mostRecentTargetSession(
  supabase: DispatchClient,
  studentId: string,
  nowIso: string,
): Promise<CandidateSession | null> {
  /* Natively created only. A backfilled row is a copy of a TERMINAL legacy
     sitting (ADR-005 §3) so it can never be resumable, but filtering on origin
     rather than on that reasoning keeps this consistent with every other
     resolution in this module. */
  /* The explicit ownership filter is redundant with RLS and kept anyway: it is
     what the legacy route did, and a read whose only control is a policy is one
     policy edit away from being no control at all. */
  const result = await supabase
    .from("assessment_sessions")
    .select("id, created_at, status, legacy_session_id")
    .eq("student_id", studentId)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(20);

  for (const row of rows(result.data)) {
    if (row.legacy_session_id !== null) continue;
    if (row.status !== "created" && row.status !== "active" && row.status !== "interrupted") {
      continue;
    }
    return { id: String(row.id), createdAt: String(row.created_at) };
  }
  return null;
}

async function mostRecentLegacySession(
  supabase: DispatchClient,
  studentId: string,
  nowIso: string,
): Promise<CandidateSession | null> {
  /* Unchanged from the route this moved out of: same table, same filters, same
     order, same limit. If more than one session is somehow still open (e.g. two
     tabs), the most recent is the one worth resuming. */
  const result = await supabase
    .from("exam_sessions")
    .select("id, created_at")
    .eq("student_id", studentId)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = rows(result.data)[0];
  if (!row) return null;

  /* Already submitted — nothing to resume; the student should start a new exam,
     not reopen a settled one. The target model answers this from the session's
     own status; the legacy model has no status column, so the attempt row is
     the status. */
  const attempt = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("session_id", String(row.id))
    .maybeSingle();
  if (record(attempt.data)) return null;

  return { id: String(row.id), createdAt: String(row.created_at) };
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
      /* ADR-005 Amendment A5: the normalized model records answers, not the UI
         state around them, so these are honest zeros rather than a restore.
         Recorded as a gap that must close before a cohort opens. */
      currentQuestionIndex: 0,
      flaggedQuestionIds: [],
      startedAt,
      durationSeconds: targetDurationSeconds(body, config.data.timing),
    },
  };
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
