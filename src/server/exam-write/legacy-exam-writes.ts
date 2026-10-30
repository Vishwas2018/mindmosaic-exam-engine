import "server-only";

import { Client } from "pg";

/**
 * THE LEGACY EXAM WRITE MODULE (ADR-005 interim; the P1 assessment-integrity fix).
 *
 * Creating a legacy exam session and recording its attempt are the two writes that decide what a student was
 * asked and what they scored. Until 20261031090100 both were SECURITY DEFINER functions executable by
 * `authenticated`, so a signed-in student could call them over PostgREST with a question list or a result of
 * their own choosing. They are now executable only by the dedicated `mindmosaic_exam_writer` role, and this file
 * is the one place that holds its credential.
 *
 * WHAT THE CALLER MUST HAVE ALREADY DONE. `studentId` must be the id of a user the route has just authenticated
 * (`supabase.auth.getUser()`, which also applies the archived-account denial). It must never come from the request
 * body. The database re-checks that the id is a student (MM002), that the session belongs to that id (MM003) and
 * that it has not expired (MM004); it cannot check that the caller is who they say, which is why the identity
 * comes from the verified session and nowhere else.
 *
 * WHAT THE CREDENTIAL CAN DO. Execute the two `_for` functions. It has no table privilege, cannot read an answer
 * key and cannot call the legacy functions or the target-model functions (tests/rls/exam-write-lockdown.test.ts
 * asserts all of that). It is not service_role, which would bypass RLS on every table.
 *
 * FAIL CLOSED. If EXAM_WRITE_DB_URL is unset the write is refused with `not_configured`. There is deliberately no
 * fallback to the user's own client or to any other credential: a fallback is exactly the path this change
 * removes. That the credential is named in no other file is asserted by src/tests/unit/scoring-module-boundary.test.ts.
 */

export interface ExamWriteError {
  /** A SQLSTATE (`MM001`..`MM004`, `23505`, ...) or `not_configured` / `unavailable`. */
  readonly code: string;
  readonly message: string;
}

export type CreateSessionOutcome =
  | { readonly sessionId: string; readonly error: null }
  | { readonly sessionId: null; readonly error: ExamWriteError };

export type RecordAttemptOutcome =
  | { readonly attemptId: string; readonly error: null }
  | { readonly attemptId: null; readonly error: ExamWriteError };

export interface CreateLegacyExamSessionInput {
  readonly studentId: string;
  readonly config: Record<string, unknown>;
  readonly seed: string;
  readonly selectedQuestionIds: readonly string[];
  readonly expiresAt: string;
}

export interface RecordLegacyExamAttemptInput {
  readonly studentId: string;
  readonly sessionId: string;
  readonly responses: unknown;
  readonly result: unknown;
}

/** Read at call time, so importing this file (a bundler may, while tracing) never requires the secret. */
function connectionString(): string | null {
  const url = process.env.EXAM_WRITE_DB_URL?.trim();
  return url ? url : null;
}

async function withWriter<T>(
  run: (client: Client) => Promise<T>,
  fail: (error: ExamWriteError) => T,
): Promise<T> {
  const url = connectionString();
  if (!url) {
    return fail({ code: "not_configured", message: "EXAM_WRITE_DB_URL is not set." });
  }
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 8_000 });
  /* An 'error' event with no listener on a pg Client is an uncaught exception, which in a server process is a
     crash rather than a failed request. */
  client.on("error", () => undefined);
  try {
    await client.connect();
  } catch {
    return fail({ code: "unavailable", message: "Could not connect to the exam write role." });
  }
  try {
    return await run(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

function toError(error: unknown): ExamWriteError {
  const e = error as { code?: unknown; message?: unknown } | null;
  return {
    code: typeof e?.code === "string" ? e.code : "unavailable",
    message: typeof e?.message === "string" ? e.message : "exam write failed",
  };
}

export async function createLegacyExamSession(input: CreateLegacyExamSessionInput): Promise<CreateSessionOutcome> {
  return withWriter<CreateSessionOutcome>(
    async (client) => {
      try {
        const result = await client.query<{ id: string }>(
          `select public.create_exam_session_for($1::uuid, $2::jsonb, $3::text, $4::text[], $5::timestamptz) as id`,
          [input.studentId, JSON.stringify(input.config), input.seed, [...input.selectedQuestionIds], input.expiresAt],
        );
        const id = result.rows[0]?.id;
        return id
          ? { sessionId: id, error: null }
          : { sessionId: null, error: { code: "unavailable", message: "no session id returned" } };
      } catch (error) {
        return { sessionId: null, error: toError(error) };
      }
    },
    (error) => ({ sessionId: null, error }),
  );
}

export async function recordLegacyExamAttempt(input: RecordLegacyExamAttemptInput): Promise<RecordAttemptOutcome> {
  return withWriter<RecordAttemptOutcome>(
    async (client) => {
      try {
        const result = await client.query<{ id: string }>(
          `select public.record_exam_attempt_for($1::uuid, $2::uuid, $3::jsonb, $4::jsonb) as id`,
          [input.studentId, input.sessionId, JSON.stringify(input.responses), JSON.stringify(input.result)],
        );
        const id = result.rows[0]?.id;
        return id
          ? { attemptId: id, error: null }
          : { attemptId: null, error: { code: "unavailable", message: "no attempt id returned" } };
      } catch (error) {
        return { attemptId: null, error: toError(error) };
      }
    },
    (error) => ({ attemptId: null, error }),
  );
}
