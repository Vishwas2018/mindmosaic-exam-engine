import "server-only";

import { Client, type ClientConfig } from "pg";

import { checkConnectedRole, decideExamWriteTarget, type ConnectedRole } from "./target";
import { decideHostedTls, hostedClientConfig } from "./tls";

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
 *
 * POSITIVE TARGET IDENTITY (family-beta WP1). Being configured is not enough. Before any connection the URL must
 * prove which Supabase project it names (./target.ts): the ref derived from the URL, the ref this deployment
 * declares in EXAM_WRITE_EXPECTED_PROJECT_REF (mandatory for a hosted target) and the ref in the public Supabase URL
 * must all agree, and the role must be the restricted writer. A loopback database is accepted only with
 * EXAM_WRITE_ALLOW_LOOPBACK=1 and never on a hosted runtime. After connecting, the role's attributes are read back
 * from pg_roles and anything elevated is refused. Every rejection is `not_configured` with an enumerated reason:
 * the URL, the password and the connection string are never placed in an error, a response or a log.
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

/**
 * Read at call time, so importing this file (a bundler may, while tracing) never requires the secret. Returns the
 * validated connection string, or the reason it was refused. The reason is an enumerated code, never the URL.
 */
function validatedTarget(): { readonly url: string; readonly hosted: boolean } | { readonly reason: string } {
  const url = process.env.EXAM_WRITE_DB_URL?.trim();
  if (!url) return { reason: "missing_url" };
  const flag = process.env.EXAM_WRITE_ALLOW_LOOPBACK?.trim().toLowerCase();
  const decision = decideExamWriteTarget({
    url,
    expectedRef: process.env.EXAM_WRITE_EXPECTED_PROJECT_REF,
    publicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    allowLoopback: flag === "1" || flag === "true",
    hostedRuntime: Boolean(process.env.VERCEL),
  });
  return decision.ok ? { url, hosted: decision.kind === "hosted" } : { reason: decision.reason };
}

async function readConnectedRole(client: Client): Promise<ConnectedRole | null> {
  try {
    const result = await client.query<{
      current_user: string;
      session_user: string;
      rolsuper: boolean;
      rolbypassrls: boolean;
      rolcreaterole: boolean;
      rolcreatedb: boolean;
      rolreplication: boolean;
    }>(
      `select current_user::text, session_user::text, r.rolsuper, r.rolbypassrls, r.rolcreaterole, r.rolcreatedb, r.rolreplication
         from pg_roles r where r.rolname = current_user`,
    );
    const row = result.rows[0];
    return row
      ? {
          currentUser: row.current_user,
          sessionUser: row.session_user,
          superuser: row.rolsuper,
          bypassRls: row.rolbypassrls,
          createRole: row.rolcreaterole,
          createDb: row.rolcreatedb,
          replication: row.rolreplication,
        }
      : null;
  } catch {
    return null;
  }
}

async function withWriter<T>(
  run: (client: Client) => Promise<T>,
  fail: (error: ExamWriteError) => T,
): Promise<T> {
  const target = validatedTarget();
  if ("reason" in target) {
    return fail({ code: "not_configured", message: `Exam write target refused: ${target.reason}.` });
  }
  /* A hosted connection is built from parts with verified TLS (./tls.ts): the operator-supplied CA is the only trust
     anchor, the hostname is checked, and nothing in the URL can switch either off. No CA, or a process-wide
     NODE_TLS_REJECT_UNAUTHORIZED=0, is a refusal. A loopback database is local and unencrypted by design. */
  let config: ClientConfig;
  if (target.hosted) {
    const tls = decideHostedTls({
      caPem: process.env.EXAM_WRITE_DB_CA,
      nodeRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
      nowMs: Date.now(),
    });
    if (!tls.ok) return fail({ code: "not_configured", message: `Exam write target refused: ${tls.reason}.` });
    config = hostedClientConfig(target.url, tls.ca);
  } else {
    config = { connectionString: target.url, connectionTimeoutMillis: 8_000 };
  }
  const client = new Client(config);
  /* An 'error' event with no listener on a pg Client is an uncaught exception, which in a server process is a
     crash rather than a failed request. */
  client.on("error", () => undefined);
  try {
    await client.connect();
  } catch {
    return fail({ code: "unavailable", message: "Could not connect to the exam write role." });
  }
  try {
    /* The URL named a role; this proves the connection really is it, with no elevated attribute. */
    const rejection = checkConnectedRole(await readConnectedRole(client));
    if (rejection) {
      return fail({ code: "not_configured", message: `Exam write target refused: ${rejection}.` });
    }
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
