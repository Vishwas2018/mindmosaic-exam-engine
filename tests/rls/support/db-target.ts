/**
 * The database-target guard for the RLS suite.
 *
 * WHY. The suite runs in one long-lived process and several modules under test open their OWN connections from
 * environment variables (the scoring module reads SCORING_DB_URL at call time). When one URL points at the
 * database under test and another silently falls back to a built-in default, the suite splits across two
 * databases: it wrote fixtures to one and then read the other. On a machine that shares Docker with other local
 * Supabase stacks the default can be somebody else's database. Before this guard that was only noticed because
 * eleven tests failed with "No assessment session"; the same mistake against a stack where the rows did exist
 * would have passed, or written to the wrong place.
 *
 * WHAT IT DOES. Before anything connects, and before any query or mutation, it checks that:
 *   1. every database URL the suite can use is a LOCAL host (loopback only, never a remote or hosted database);
 *   2. every configured URL names the same host and port as the primary RLS_TEST_DB_URL;
 *   3. when RLS_EXPECTED_DB_PORT is set, the primary port is that port (an explicit pin, for shared machines).
 * It parses URLs only. It opens no connection and prints no credentials, only host:port.
 *
 * Credentials for the dedicated roles are derived from the primary host and port, so an unset override can no
 * longer fall back to a different database.
 */

type Env = Readonly<Record<string, string | undefined>>;
type MutableEnv = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/** The documented default (supabase/config.toml `db.port`). Used only when nothing is configured at all. */
export const DEFAULT_PRIMARY_URL = "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

const SCORING_CREDENTIAL = "mindmosaic_scoring:local-dev-scoring-not-a-secret";
const WRITER_CREDENTIAL = "mindmosaic_content_answer_writer:local-dev-content-answer-writer-not-a-secret";
const EXAM_WRITER_CREDENTIAL = "mindmosaic_exam_writer:local-dev-exam-writer-not-a-secret";

/** Variables that may carry a database URL, in the order they are reported. */
export const DB_URL_VARIABLES = [
  "RLS_TEST_DB_URL",
  "SUPABASE_DB_URL",
  "DATABASE_URL",
  "SCORING_DB_URL",
  "CONTENT_ANSWER_WRITER_DB_URL",
  "EXAM_WRITE_DB_URL",
] as const;

export class DbTargetError extends Error {
  constructor(message: string) {
    super(`RLS database-target guard: ${message} Nothing was connected to and nothing was changed.`);
    this.name = "DbTargetError";
  }
}

export interface DbTarget {
  readonly host: string;
  readonly port: number;
}

export function targetOf(label: string, url: string): DbTarget {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new DbTargetError(`${label} is not a valid URL.`);
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new DbTargetError(`${label} is not a postgres URL.`);
  }
  const host = parsed.hostname.toLowerCase();
  const port = parsed.port === "" ? 5432 : Number(parsed.port);
  if (!LOCAL_HOSTS.has(host)) {
    throw new DbTargetError(`${label} points at '${host}:${port}', which is not a local address. The suite only runs against a local database.`);
  }
  return { host: host === "localhost" || host === "[::1]" || host === "::1" ? "127.0.0.1" : host, port };
}

export function primaryUrl(env: Env = process.env): string {
  return env.RLS_TEST_DB_URL ?? DEFAULT_PRIMARY_URL;
}

/** A role-specific URL on the same host and port as the primary. */
function derived(env: Env, credential: string): string {
  const primary = new URL(primaryUrl(env));
  return `postgresql://${credential}@${primary.hostname}:${primary.port || "5432"}${primary.pathname || "/postgres"}`;
}

export function defaultScoringUrl(env: Env = process.env): string {
  return derived(env, SCORING_CREDENTIAL);
}

export function defaultContentAnswerWriterUrl(env: Env = process.env): string {
  return derived(env, WRITER_CREDENTIAL);
}

export function defaultExamWriterUrl(env: Env = process.env): string {
  return derived(env, EXAM_WRITER_CREDENTIAL);
}

/**
 * Throws unless every configured database URL is local and names the primary host:port. Returns the single
 * target on success.
 */
export function assertSingleLocalTarget(env: Env = process.env): DbTarget {
  const primary = targetOf("RLS_TEST_DB_URL", primaryUrl(env));

  const pin = env.RLS_EXPECTED_DB_PORT;
  if (pin !== undefined && pin !== "" && Number(pin) !== primary.port) {
    throw new DbTargetError(
      `RLS_EXPECTED_DB_PORT is ${pin} but the primary database is on port ${primary.port}.`,
    );
  }

  for (const name of DB_URL_VARIABLES) {
    const value = env[name];
    if (value === undefined || value === "") continue;
    const other = targetOf(name, value);
    if (other.host !== primary.host || other.port !== primary.port) {
      throw new DbTargetError(
        `${name} targets ${other.host}:${other.port} but RLS_TEST_DB_URL targets ${primary.host}:${primary.port}. ` +
          "Every database variable must name the same local database, or the suite would split across two.",
      );
    }
  }
  return primary;
}

/** The variables a test file may change; snapshotted and restored around every file as a safety net. */
export const GUARDED_ENV_VARIABLES = DB_URL_VARIABLES;

export type EnvSnapshot = ReadonlyMap<string, string | undefined>;

export function snapshotEnv(names: readonly string[] = GUARDED_ENV_VARIABLES, env: Env = process.env): EnvSnapshot {
  return new Map(names.map((name) => [name, env[name]]));
}

/** Puts every snapshotted variable back exactly: restored if it was set, removed if it was not. */
export function restoreEnv(snapshot: EnvSnapshot, env: MutableEnv = process.env): void {
  for (const [name, value] of snapshot) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }
}
