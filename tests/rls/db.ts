import { Client } from "pg";

// Matches the `db.port` in supabase/config.toml. Shifted off Supabase's
// 543xx defaults because other local Supabase stacks may already be
// running on this machine, and because 55271-55370 falls inside a Windows
// TCP excluded-port range on at least one dev box.
const DEFAULT_DB_URL = "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

export function dbUrl(): string {
  return process.env.RLS_TEST_DB_URL ?? DEFAULT_DB_URL;
}

export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: dbUrl() });
  /* An 'error' event with no listener is an uncaught exception, not a rejected
     promise — in a vitest fork that kills the worker, and a killed worker is
     reported as a missing test file rather than a failing one. See the note on
     fileParallelism in vitest.rls.config.ts for how that actually presented. */
  client.on("error", () => undefined);
  await client.connect();
  return client;
}

/**
 * The `mindmosaic_scoring` credential (spec §9.3.1), as its module would
 * present it. Matches the default written by `npm run scoring:bootstrap`.
 *
 * A real connection rather than `set local role`, for two reasons. It is what
 * the scoring module actually does, so the test exercises the same path; and
 * PostgreSQL 16 separated a role grant's ADMIN option from its SET option, so
 * the creating role holding ADMIN does not imply it may `SET ROLE` to it —
 * impersonation would fail for a reason that has nothing to do with the
 * privileges under test.
 */
const DEFAULT_SCORING_DB_URL =
  "postgresql://mindmosaic_scoring:local-dev-scoring-not-a-secret@127.0.0.1:56322/postgres";

export function scoringDbUrl(): string {
  return process.env.SCORING_DB_URL ?? DEFAULT_SCORING_DB_URL;
}

export async function connectAsScoringRole(): Promise<Client> {
  const client = new Client({ connectionString: scoringDbUrl() });
  /* A pg Client is an EventEmitter, and an 'error' event with no listener is an
     uncaught exception rather than a rejected promise — in a vitest fork that
     kills the worker, and a killed worker is reported as a *missing* file
     ("Test Files 8 passed (9)") next to a separate unhandled error, which is
     far easier to read past than a failure. This listener keeps a connection
     that drops mid-suite an ordinary rejection on the next query. */
  client.on("error", () => undefined);
  try {
    await client.connect();
  } catch (cause) {
    /* The overwhelmingly likely cause, so it is named rather than left to be
       rediscovered: 20260812110000 creates this role with LOGIN and no
       password on purpose (a migration is committed; a credential must not
       be), so a fresh database has a role that cannot yet authenticate. */
    throw new Error(
      "Could not connect as mindmosaic_scoring. Run `npm run scoring:bootstrap` " +
        "to set the local password, or set SCORING_DB_URL to a credential for it.",
      { cause },
    );
  }
  return client;
}

/**
 * The `mindmosaic_content_answer_writer` credential (spec §9.3.1), as
 * src/server/scoring/answer-version-writer.ts would present it. Matches the
 * default written by `npm run content:answer-writer:bootstrap`. Same real-
 * connection reasoning as connectAsScoringRole above.
 */
const DEFAULT_CONTENT_ANSWER_WRITER_DB_URL =
  "postgresql://mindmosaic_content_answer_writer:local-dev-content-answer-writer-not-a-secret@127.0.0.1:56322/postgres";

export function contentAnswerWriterDbUrl(): string {
  return process.env.CONTENT_ANSWER_WRITER_DB_URL ?? DEFAULT_CONTENT_ANSWER_WRITER_DB_URL;
}

export async function connectAsContentAnswerWriterRole(): Promise<Client> {
  const client = new Client({ connectionString: contentAnswerWriterDbUrl() });
  client.on("error", () => undefined);
  try {
    await client.connect();
  } catch (cause) {
    throw new Error(
      "Could not connect as mindmosaic_content_answer_writer. Run " +
        "`npm run content:answer-writer:bootstrap` to set the local password, or set " +
        "CONTENT_ANSWER_WRITER_DB_URL to a credential for it.",
      { cause },
    );
  }
  return client;
}
