import "server-only";

import {createHash, randomUUID} from "node:crypto";

import {createClient as createAdminClient} from "@supabase/supabase-js";

import {SUPABASE_URL} from "@/lib/supabase/config";

/**
 * Durable, server-authoritative submission state for the Singapore Maths sample practice.
 *
 * Policy (QA-001 / QA-002): within one ATTEMPT, a student has exactly ONE immutable graded
 * submission per question. The first answer is the answer; any later submission for the same
 * question returns the recorded answer and verdict, never a verdict for the new answer. A student
 * who wants another go starts a NEW ATTEMPT (reset), which leaves earlier attempts untouched.
 *
 * Why this survives Vercel's multi-instance runtime: nothing is held in process memory. State lives
 * in Postgres, and "exactly one" is enforced by the table's primary key, so concurrent submissions
 * from any instance race on an INSERT and the loser reads the winner's row.
 *
 * Storage: the existing `idempotency_keys` table (service-role only; RLS on, all privileges revoked
 * from anon and authenticated). No schema change is required, which matters because this sample is
 * development-only and must not need a remote migration. Each row is keyed
 * (actor_id, endpoint, key):
 *
 *   attempt marker  endpoint `singapore_maths_sample:attempt:y<year>`    key = attempt id
 *   submission      endpoint `singapore_maths_sample:submit:y<year>:<attemptId>`  key = question id
 *
 * The current attempt is the newest marker. The first marker has a fixed key (`a0`, dated at the
 * epoch so it always sorts oldest) so two concurrent first requests cannot create two attempts.
 * Rows carry a 7-day `expires_at` for the table's operational reaper; reads never filter on it.
 * A dedicated table would be cleaner; see the PR for the follow-up.
 */

export type SampleYear = 3 | 5;

export interface SampleSubmission {
  readonly questionId: string;
  readonly answer: number;
  readonly correct: boolean;
  readonly submittedAt: string;
}

export interface StoredRow {
  readonly actor_id: string;
  readonly endpoint: string;
  readonly key: string;
  readonly request_hash: string;
  readonly response_status: number | null;
  readonly response_body: unknown;
  readonly created_at: string;
  readonly expires_at: string;
}

/** The only persistence operations the store needs. A Supabase adapter and an in-memory test fake implement it. */
export interface IdempotencyPort {
  /** Atomic: "conflict" when (actor_id, endpoint, key) already exists. Throws on any other failure. */
  insert(row: StoredRow): Promise<"inserted" | "conflict">;
  get(actorId: string, endpoint: string, key: string): Promise<StoredRow | null>;
  /** Newest row for the actor+endpoint: created_at descending, then key descending. */
  latest(actorId: string, endpoint: string): Promise<StoredRow | null>;
  list(actorId: string, endpoint: string): Promise<StoredRow[]>;
}

export class SampleStoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SampleStoreUnavailableError";
  }
}

const INITIAL_ATTEMPT_KEY = "a0";
const INITIAL_ATTEMPT_CREATED_AT = "1970-01-01T00:00:00.000Z";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const attemptEndpoint = (year: SampleYear) => `singapore_maths_sample:attempt:y${year}`;
const submitEndpoint = (year: SampleYear, attemptId: string) => `singapore_maths_sample:submit:y${year}:${attemptId}`;
const hashAnswer = (answer: number) => createHash("sha256").update(String(answer)).digest("hex");

function parseSubmission(row: StoredRow): SampleSubmission | null {
  const body = row.response_body as Record<string, unknown> | null;
  if (
    !body ||
    typeof body.questionId !== "string" ||
    typeof body.answer !== "number" ||
    typeof body.correct !== "boolean" ||
    typeof body.submittedAt !== "string"
  ) {
    return null;
  }
  return {
    questionId: body.questionId,
    answer: body.answer,
    correct: body.correct,
    submittedAt: body.submittedAt,
  };
}

export interface SampleStore {
  /** Current attempt id for this student and year, creating the first one if none exists. */
  currentAttemptId(userId: string, year: SampleYear): Promise<string>;
  /** Records the first submission for a question; later calls return the recorded one with created=false. */
  recordSubmission(
    userId: string,
    year: SampleYear,
    questionId: string,
    answer: number,
    correct: boolean,
  ): Promise<{submission: SampleSubmission; created: boolean}>;
  getSubmission(userId: string, year: SampleYear, questionId: string): Promise<SampleSubmission | null>;
  listSubmissions(userId: string, year: SampleYear): Promise<SampleSubmission[]>;
  /** Begins a fresh attempt. Earlier attempts and their submissions are kept. */
  startNewAttempt(userId: string, year: SampleYear): Promise<string>;
}

export function createSampleStore(port: IdempotencyPort, now: () => Date = () => new Date()): SampleStore {
  const rowFor = (
    userId: string,
    endpoint: string,
    key: string,
    requestHash: string,
    body: unknown,
    createdAt: string,
  ): StoredRow => ({
    actor_id: userId,
    endpoint,
    key,
    request_hash: requestHash,
    response_status: 200,
    response_body: body,
    created_at: createdAt,
    expires_at: new Date(now().getTime() + RETENTION_MS).toISOString(),
  });

  async function currentAttemptId(userId: string, year: SampleYear): Promise<string> {
    const existing = await port.latest(userId, attemptEndpoint(year));
    if (existing) return existing.key;
    await port.insert(
      rowFor(userId, attemptEndpoint(year), INITIAL_ATTEMPT_KEY, "attempt", {year}, INITIAL_ATTEMPT_CREATED_AT),
    );
    const created = await port.latest(userId, attemptEndpoint(year));
    if (!created) throw new SampleStoreUnavailableError("attempt marker was not readable after creation");
    return created.key;
  }

  return {
    currentAttemptId,

    async recordSubmission(userId, year, questionId, answer, correct) {
      const attemptId = await currentAttemptId(userId, year);
      const submission: SampleSubmission = {questionId, answer, correct, submittedAt: now().toISOString()};
      const outcome = await port.insert(
        rowFor(userId, submitEndpoint(year, attemptId), questionId, hashAnswer(answer), submission, submission.submittedAt),
      );
      if (outcome === "inserted") return {submission, created: true};
      const winner = await port.get(userId, submitEndpoint(year, attemptId), questionId);
      const recorded = winner ? parseSubmission(winner) : null;
      if (!recorded) throw new SampleStoreUnavailableError("recorded submission was not readable after a conflict");
      return {submission: recorded, created: false};
    },

    async getSubmission(userId, year, questionId) {
      const attempt = await port.latest(userId, attemptEndpoint(year));
      if (!attempt) return null;
      const row = await port.get(userId, submitEndpoint(year, attempt.key), questionId);
      return row ? parseSubmission(row) : null;
    },

    async listSubmissions(userId, year) {
      const attempt = await port.latest(userId, attemptEndpoint(year));
      if (!attempt) return [];
      const rows = await port.list(userId, submitEndpoint(year, attempt.key));
      return rows.map(parseSubmission).filter((s): s is SampleSubmission => s !== null);
    },

    async startNewAttempt(userId, year) {
      const attemptId = `a-${randomUUID()}`;
      const outcome = await port.insert(
        rowFor(userId, attemptEndpoint(year), attemptId, "attempt", {year}, now().toISOString()),
      );
      if (outcome !== "inserted") throw new SampleStoreUnavailableError("attempt id collision");
      return attemptId;
    },
  };
}

/** Supabase adapter over `idempotency_keys`, using the service-role key (server only). Null when not configured. */
export function createSupabasePort(env: Readonly<Record<string, string | undefined>> = process.env): IdempotencyPort | null {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey || !SUPABASE_URL.trim()) return null;
  const admin = createAdminClient(SUPABASE_URL, serviceRoleKey, {
    auth: {autoRefreshToken: false, persistSession: false},
  });
  const TABLE = "idempotency_keys";
  const fail = (what: string, message: string): never => {
    throw new SampleStoreUnavailableError(`${what}: ${message}`);
  };
  return {
    async insert(row) {
      const {error} = await admin.from(TABLE).insert(row);
      if (!error) return "inserted";
      if (error.code === "23505") return "conflict";
      return fail("insert", error.message);
    },
    async get(actorId, endpoint, key) {
      const {data, error} = await admin
        .from(TABLE)
        .select("*")
        .eq("actor_id", actorId)
        .eq("endpoint", endpoint)
        .eq("key", key)
        .maybeSingle();
      if (error) return fail("get", error.message);
      return (data as StoredRow | null) ?? null;
    },
    async latest(actorId, endpoint) {
      const {data, error} = await admin
        .from(TABLE)
        .select("*")
        .eq("actor_id", actorId)
        .eq("endpoint", endpoint)
        .order("created_at", {ascending: false})
        .order("key", {ascending: false})
        .limit(1)
        .maybeSingle();
      if (error) return fail("latest", error.message);
      return (data as StoredRow | null) ?? null;
    },
    async list(actorId, endpoint) {
      const {data, error} = await admin
        .from(TABLE)
        .select("*")
        .eq("actor_id", actorId)
        .eq("endpoint", endpoint)
        .limit(200);
      if (error) return fail("list", error.message);
      return (data as StoredRow[] | null) ?? [];
    },
  };
}

/** The store the routes use. Throws SampleStoreUnavailableError when the server has no service-role configuration. */
export function getSampleStore(): SampleStore {
  const port = createSupabasePort();
  if (!port) throw new SampleStoreUnavailableError("sample storage is not configured on this server");
  return createSampleStore(port);
}
