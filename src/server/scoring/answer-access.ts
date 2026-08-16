import "server-only";

import { Client } from "pg";

import {
  scoreResponse,
  type ScorableQuestion,
  type ScoredResponse,
} from "@/features/exam-engine/scoring/question-scorers";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import { answerKeySchema } from "@/schemas/question.schema";

/**
 * THE SCORING MODULE (spec v1.2 §9.3.1, §14.1–§14.3, §17.1; ADR-006 Amendment
 * A). This file is a trust boundary, not an implementation detail.
 *
 * Spec §9.3 permits exactly two runtime readers of `item_answer_versions`. This
 * project chose the second: a dedicated least-privilege Postgres role held by
 * one isolated module. **This is that module, and it is one file on purpose.**
 * The normative control in §9.3.1 is that "the raw answer key, grading rules,
 * rubric, and private explanation MUST NOT leave that module: never returned to
 * a caller, never placed in a DTO, never logged". A boundary spread across
 * several files is a boundary whose edges have to be remembered; a boundary
 * that is one file has edges you can see. Everything that touches an answer key
 * — connecting, reading, scoring, persisting — happens between here and the
 * bottom of this file, and the only things that leave are derived outcomes.
 *
 * WHAT THIS MODULE HOLDS THAT NOTHING ELSE MAY. `SCORING_DB_URL`, the
 * credential for `mindmosaic_scoring` (20260812110000). It is not
 * `service_role`, holds no `BYPASSRLS`, and its entire privilege set is six
 * table grants and eight column grants — asserted, not described, by
 * tests/rls/assessment-scoring-role.test.ts. That the credential appears in no
 * other file is asserted by
 * src/tests/unit/scoring-module-boundary.test.ts, which is the "automated
 * check rather than convention" §9.3.1 requires.
 *
 * WHAT LEAVES. `ScoredSessionSummary` and nothing else: counts, marks, a
 * percentage, and per-item outcomes. No `answerKey`, no `privateExplanation`,
 * no `rubric`, no `gradingRules`, and no field that could carry one. The types
 * below are deliberately closed rather than `Record<string, unknown>`-ish, so
 * adding a leak means editing an exported type in this file.
 *
 * WHAT IS NOT LOGGED. Nothing here logs at all (§17.4). Not the answer, not the
 * response, not the prompt. The errors it throws name a session id and a
 * reason; none of them interpolate content. This is checked by the same
 * boundary test.
 *
 * WHY IT SCORES IN TYPESCRIPT. Because there is exactly one scorer, and it is
 * `question-scorers.ts`. The guest path has no database and must keep scoring
 * locally, so a PL/pgSQL restatement would mean two implementations of twelve
 * answer-key kinds and one learner scored differently signed-in than as a
 * guest. ADR-006 Amendment A records that trade and what it costs: the answer
 * key now exists in application-server memory during scoring, so the claim "no
 * process outside Postgres ever holds an answer key" must not be made.
 */

/** The algorithm versions this module implements (§14.2). */
const SUPPORTED_SCORING_ALGORITHM_VERSIONS = new Set(["question-scorers.v1"]);

/**
 * One item's outcome, as it crosses the boundary. Compare with
 * `ScoredResponse`: same derived facts, and no route back to the key that
 * produced them.
 */
export interface ScoredItemOutcome {
  readonly sessionItemId: string;
  readonly ordinal: number;
  readonly status: ScoredResponse["status"];
  /** Null for manual-review items — §14.3 forbids fabricated correctness. */
  readonly correct: boolean | null;
  readonly awardedMarks: number | null;
  readonly availableMarks: number;
}

/** The whole result, as it crosses the boundary. */
export interface ScoredSessionSummary {
  readonly sessionId: string;
  readonly studentId: string;
  readonly scoringAlgorithmVersion: string;
  readonly totalItems: number;
  readonly attemptedItems: number;
  readonly autoMarkedItems: number;
  readonly manualReviewItems: number;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly unansweredCount: number;
  readonly objectiveAwardedMarks: number;
  readonly objectiveAvailableMarks: number;
  readonly objectivePercentage: number;
  /** The SUM of marks_available on unmarked manual-review items — matching
   *  legacy ExamResult's pendingManualMarks (exam-report.ts's own
   *  `manualDetails.reduce((sum, d) => sum + d.availableMarks, 0)`) — not a
   *  count of how many items are pending. */
  readonly pendingManualMarks: number;
  readonly timeTakenSeconds: number;
  readonly startedAt: string;
  readonly submittedAt: string;
  readonly submissionReason: SubmissionReason;
  readonly outcomes: readonly ScoredItemOutcome[];
}

export type SubmissionReason = "user_submitted" | "timer_expired";

/** Every refusal this module can produce, as a code a route can map. */
export type ScoringFailureCode =
  | "session_not_found"
  | "not_session_owner"
  | "session_not_scoreable"
  | "session_not_version_pinned"
  | "unsupported_scoring_algorithm";

export class ScoringRefused extends Error {
  constructor(
    readonly code: ScoringFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "ScoringRefused";
  }
}

/**
 * The credential. Read at call time rather than at module load so that
 * importing this file — which the boundary test does, and which a bundler may
 * do while tracing — never requires the secret to be present.
 */
function scoringConnectionString(): string {
  const url = process.env.SCORING_DB_URL;
  if (!url) {
    throw new Error(
      "SCORING_DB_URL is not set. Scoring requires the dedicated mindmosaic_scoring " +
        "credential (spec §9.3.1); it deliberately cannot fall back to any other.",
    );
  }
  return url;
}

/* The rows this module reads. Private: no shape carrying an answer key is
   exported, so there is no type a caller could name to receive one. */

interface PinnedItemRow {
  session_item_id: string;
  global_ordinal: number;
  /* The pinned revision's own id. Used as the question identity the scorer
     reports in a malformed-key error. Deliberately not `items.item_code`: the
     scoring role holds no grant on `items` at all, and reaching for a friendlier
     label would mean widening the grant set to improve an error message. */
  item_version_id: string;
  question_type: string;
  marks_available: number;
  answer_key: unknown;
  response_value: unknown;
}

interface SessionRow {
  id: string;
  student_id: string;
  status: string;
  content_identity: string;
  scoring_algorithm_version: string;
  created_at: Date;
  started_at: Date | null;
}

/**
 * Scores a session and records the result, server-side, from the versions the
 * session pinned.
 *
 * Takes the session, the actor, and why the sitting ended. There is deliberately
 * no parameter for the item set, the responses, the marks or any outcome: §12.5
 * and §14.1 require all of those to come from the server's own record, and a
 * parameter that exists is a parameter that can be supplied. Every scored input
 * is read here, inside one transaction, through the ledger the session wrote.
 *
 * `actorId` is a CHECK, not a value. Nothing derived from it is written — the
 * `student_id` on the result comes from the session row, read here — and if the
 * two disagree this refuses rather than reconciling them. That is §17.2's "MUST
 * derive the actor from `auth.uid()` and independently re-check ownership",
 * applied to a module that has no JWT of its own: the route supplies the actor
 * it authenticated, and this verifies it against the database rather than
 * trusting it. Passing a session belonging to somebody else is therefore a
 * refusal and not a scored result for a learner the caller never authenticated.
 *
 * Deterministic (§14.2): the same pinned content, the same stored responses and
 * the same algorithm version produce the same summary, because the answers are
 * reached through `assessment_session_items.item_version_id` — an immutable row
 * — rather than through the item's current revision.
 */
export async function scoreAssessmentSession(
  sessionId: string,
  actorId: string,
  submissionReason: SubmissionReason = "user_submitted",
): Promise<ScoredSessionSummary> {
  const client = new Client({ connectionString: scoringConnectionString() });
  /* An 'error' event with no listener on a pg Client is an uncaught exception,
     which in a server process is a crash rather than a failed request. */
  client.on("error", () => undefined);
  await client.connect();

  try {
    await client.query("begin");
    const summary = await scoreWithin(client, sessionId, actorId, submissionReason);
    await client.query("commit");
    return summary;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function scoreWithin(
  client: Client,
  sessionId: string,
  actorId: string,
  submissionReason: SubmissionReason,
): Promise<ScoredSessionSummary> {
  const session = await loadSession(client, sessionId, actorId);
  const pinned = await loadPinnedItems(client, sessionId);

  /* Score first, flip the lifecycle last. The terminal-response lock
     (20260812100000) refuses any write to a submitted session's responses for
     every role, and it has no exemption by design: an ordering is a hole that
     does not exist, where an exemption flag is a hole that has to be trusted. */
  const outcomes: ScoredItemOutcome[] = [];
  for (const row of pinned) {
    const scored = scoreOne(row);
    outcomes.push({
      sessionItemId: row.session_item_id,
      ordinal: row.global_ordinal,
      status: scored.status,
      correct: scored.status === "manual_review" ? null : scored.correct,
      awardedMarks: scored.status === "manual_review" ? null : scored.earnedMarks,
      availableMarks: scored.availableMarks,
    });
  }

  await persistOutcomes(client, sessionId, outcomes);
  const summary = summarise(session, outcomes, submissionReason);
  await persistResult(client, summary);
  await markSubmitted(client, sessionId, summary.submittedAt);

  return summary;
}

async function loadSession(
  client: Client,
  sessionId: string,
  actorId: string,
): Promise<SessionRow> {
  const result = await client.query<SessionRow>(
    `select id, student_id, status, content_identity, scoring_algorithm_version,
            created_at, started_at
       from public.assessment_sessions
      where id = $1`,
    [sessionId],
  );

  const session = result.rows[0];
  if (session === undefined) {
    /* The scoring role can read every session row (its policy is `using
       (true)`), so "not found" here means the row genuinely does not exist —
       not that this credential could not see it. */
    throw new ScoringRefused("session_not_found", `No assessment session ${sessionId}.`);
  }

  /* Distinct from session_not_found on purpose. This module runs behind an
     already-authenticated route, so the two are not an enumeration oracle to a
     learner, and a route that scores the wrong session needs to be able to tell
     "no such sitting" from "you authenticated somebody else". */
  if (session.student_id !== actorId) {
    throw new ScoringRefused(
      "not_session_owner",
      `Assessment session ${sessionId} does not belong to the authenticated actor.`,
    );
  }

  if (session.status === "submitted" || session.status === "processed") {
    throw new ScoringRefused(
      "session_not_scoreable",
      `Assessment session ${sessionId} is already ${session.status}.`,
    );
  }
  if (session.status === "abandoned") {
    throw new ScoringRefused(
      "session_not_scoreable",
      `Assessment session ${sessionId} was abandoned.`,
    );
  }

  /* ADR-005 §4: a backfilled sitting carries no evidence of which revision was
     served, so it "MUST NOT be recomputed or presented as reproducible". This
     is the check that makes that a refusal rather than a policy. */
  if (session.content_identity !== "version_pinned") {
    throw new ScoringRefused(
      "session_not_version_pinned",
      `Assessment session ${sessionId} is ${session.content_identity} and must never be recomputed.`,
    );
  }

  if (!SUPPORTED_SCORING_ALGORITHM_VERSIONS.has(session.scoring_algorithm_version)) {
    /* §14.2: refuse rather than silently score with a newer algorithm than the
       one the sitting was sat under. */
    throw new ScoringRefused(
      "unsupported_scoring_algorithm",
      `Assessment session ${sessionId} pins scoring algorithm ` +
        `${session.scoring_algorithm_version}, which this module does not implement.`,
    );
  }

  return session;
}

/**
 * The one query that reads answer keys. Note the join path: the answer is
 * reached from `assessment_session_items.item_version_id`, so it is the answer
 * to the exact revision this sitting served. A later revision of the same item
 * is a different `item_versions` row that this ledger does not point at, which
 * is what makes §14.2's determinism structural rather than procedural.
 *
 * A left join to `session_responses`, because an unanswered item still has to
 * be scored — §14.3's blank/attempted/manual three-way depends on the absence
 * of a response being a case rather than a missing row.
 */
async function loadPinnedItems(
  client: Client,
  sessionId: string,
): Promise<PinnedItemRow[]> {
  const result = await client.query<PinnedItemRow>(
    `select si.id            as session_item_id,
            si.global_ordinal,
            iv.id::text      as item_version_id,
            iv.question_type,
            iv.marks_available,
            av.answer_key,
            sr.response_value
       from public.assessment_session_items si
       join public.item_versions iv        on iv.id = si.item_version_id
       join public.item_answer_versions av on av.item_version_id = si.item_version_id
  left join public.session_responses sr    on sr.session_item_id = si.id
      where si.session_id = $1
      order by si.global_ordinal`,
    [sessionId],
  );
  return result.rows;
}

/**
 * The only place an answer key is turned into an outcome.
 *
 * The key is parsed rather than trusted: `item_answer_versions.answer_key` is
 * jsonb, and a scorer that received a malformed key would otherwise throw from
 * inside `expectKey` with a message naming the question. Parsing here means a
 * bad key is a bad key, caught before scoring, and it is the same schema the
 * authoring bank validates against — one definition of what an answer is.
 */
function scoreOne(row: PinnedItemRow): ScoredResponse {
  const answerKey = answerKeySchema.parse(row.answer_key);
  const question: ScorableQuestion = {
    id: row.item_version_id,
    type: row.question_type as ScorableQuestion["type"],
    answerKey,
    metadata: { marks: row.marks_available },
  };
  /* An absent response row and a stored SQL null are the same thing to the
     learner: they did not answer. `isUnansweredResponse` owns what "blank"
     means for every other shape. */
  const answer = (row.response_value ?? undefined) as CandidateAnswer | undefined;
  return scoreResponse(question, answer);
}

/**
 * Writes the derived outcome onto each response row.
 *
 * The scoring role's UPDATE grant is column-level (20260812110000), so this
 * statement is the *whole* of what it may write: it cannot touch
 * `response_value` or `client_sequence`, which is what stops the thing that
 * scores the evidence from being able to alter it.
 *
 * Rows are only updated, never inserted — the role holds no INSERT here. An
 * item the learner never touched has no response row, is scored `unanswered`,
 * and correctly leaves no row behind.
 */
async function persistOutcomes(
  client: Client,
  sessionId: string,
  outcomes: readonly ScoredItemOutcome[],
): Promise<void> {
  if (outcomes.length === 0) return;

  await client.query(
    `update public.session_responses sr
        set score_status    = o.status,
            is_correct      = o.correct,
            awarded_marks   = o.awarded_marks,
            available_marks = o.available_marks,
            scored_at       = now()
       from jsonb_to_recordset($2::jsonb)
              as o(session_item_id uuid, status text, correct boolean,
                   awarded_marks integer, available_marks integer)
      where sr.session_id = $1 and sr.session_item_id = o.session_item_id`,
    [
      sessionId,
      JSON.stringify(
        outcomes.map((outcome) => ({
          session_item_id: outcome.sessionItemId,
          status: outcome.status,
          correct: outcome.correct,
          awarded_marks: outcome.awardedMarks,
          available_marks: outcome.availableMarks,
        })),
      ),
    ],
  );
}

/**
 * §14.3, which is the rule this project has already been bitten by:
 * "Manual-review items MUST be excluded from objective percentage denominators
 * until marked. A blank manual item is unanswered, not pending review."
 *
 * So `objective_available_marks` counts only auto-marked items. A learner who
 * answers every objective question correctly and writes an essay scores 100%
 * with an essay pending, not a lower percentage that will silently rise when a
 * teacher marks it. src/tests/unit/blank-sitting-aggregates.test.ts exists
 * because the legacy path got this wrong.
 */
function summarise(
  session: SessionRow,
  outcomes: readonly ScoredItemOutcome[],
  submissionReason: SubmissionReason,
): ScoredSessionSummary {
  const manualReview = outcomes.filter((outcome) => outcome.status === "manual_review");
  const autoMarked = outcomes.filter((outcome) => outcome.status !== "manual_review");

  const correctCount = outcomes.filter((outcome) => outcome.status === "correct").length;
  const incorrectCount = outcomes.filter((outcome) => outcome.status === "incorrect").length;
  const unansweredCount = outcomes.filter((outcome) => outcome.status === "unanswered").length;

  const objectiveAwardedMarks = autoMarked.reduce(
    (total, outcome) => total + (outcome.awardedMarks ?? 0),
    0,
  );
  const objectiveAvailableMarks = autoMarked.reduce(
    (total, outcome) => total + outcome.availableMarks,
    0,
  );

  const startedAt = session.started_at ?? session.created_at;
  const submittedAt = new Date();

  return {
    sessionId: session.id,
    studentId: session.student_id,
    scoringAlgorithmVersion: session.scoring_algorithm_version,
    totalItems: outcomes.length,
    /* Attempted means "produced an outcome that was not blank" — a manual item
       with real text counts, a blank one does not (§14.3). */
    attemptedItems: outcomes.filter((outcome) => outcome.status !== "unanswered").length,
    autoMarkedItems: autoMarked.length,
    manualReviewItems: manualReview.length,
    correctCount,
    incorrectCount,
    unansweredCount,
    objectiveAwardedMarks,
    objectiveAvailableMarks,
    /* Whole-number percentage, matching the legacy ExamResult contract exactly
       so history renders identically across both models. A paper with nothing
       objective in it is 0%, not a division by zero. */
    objectivePercentage:
      objectiveAvailableMarks === 0
        ? 0
        : Math.round((objectiveAwardedMarks / objectiveAvailableMarks) * 100),
    /* The sum of marks awaiting a human's judgement, not the count of items
       awaiting it — was `manualReview.length` (a count silently mislabelled
       "Marks"), diverging from legacy ExamResult's own sum-based contract the
       moment a manual item was worth anything but one mark. Fixed here so
       every downstream reader of this field — the stored
       assessment_results.pending_manual_marks column, resolved_sittings'
       history column for a target sitting (which reads that column
       verbatim), and A9's target-session-writes.ts reshaping — agrees with
       what legacy has always reported for the same fact. */
    pendingManualMarks: manualReview.reduce((sum, outcome) => sum + outcome.availableMarks, 0),
    timeTakenSeconds: Math.max(
      0,
      Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000),
    ),
    startedAt: startedAt.toISOString(),
    submittedAt: submittedAt.toISOString(),
    submissionReason,
    outcomes,
  };
}

/**
 * One row per submitted session. `assessment_results.session_id` is unique and
 * this module deliberately does not catch 23505: a lost double-submit race must
 * surface as a conflict, not as a second result, which is the same reasoning
 * 20260722100000 applied to `exam_attempts_session_id_key`.
 *
 * The role holds INSERT and no SELECT on this table, so it can record the score
 * it computed and cannot enumerate anybody else's.
 */
async function persistResult(client: Client, summary: ScoredSessionSummary): Promise<void> {
  await client.query(
    `insert into public.assessment_results (
       session_id, student_id, scoring_algorithm_version,
       total_items, attempted_items, auto_marked_items, manual_review_items,
       correct_count, incorrect_count, unanswered_count,
       objective_awarded_marks, objective_available_marks, objective_percentage,
       pending_manual_marks, time_taken_seconds, started_at, submitted_at, submission_reason
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      summary.sessionId,
      summary.studentId,
      summary.scoringAlgorithmVersion,
      summary.totalItems,
      summary.attemptedItems,
      summary.autoMarkedItems,
      summary.manualReviewItems,
      summary.correctCount,
      summary.incorrectCount,
      summary.unansweredCount,
      summary.objectiveAwardedMarks,
      summary.objectiveAvailableMarks,
      summary.objectivePercentage,
      summary.pendingManualMarks,
      summary.timeTakenSeconds,
      summary.startedAt,
      summary.submittedAt,
      summary.submissionReason,
    ],
  );
}

/**
 * The lifecycle flip, last and in the same transaction (§12.8). The role's
 * UPDATE grant on `assessment_sessions` is three columns — status, submitted_at
 * and version — so this is the only session change it can make, and the
 * transition trigger independently refuses an illegal one or a version that
 * does not advance.
 */
async function markSubmitted(
  client: Client,
  sessionId: string,
  submittedAt: string,
): Promise<void> {
  await client.query(
    `update public.assessment_sessions
        set status = 'submitted', submitted_at = $2, version = version + 1
      where id = $1`,
    [sessionId, submittedAt],
  );
}
