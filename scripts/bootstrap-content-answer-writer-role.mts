/**
 * Sets the password for the `mindmosaic_content_answer_writer` role (spec
 * §9.3.1, ADR-006 Amendment A). Mirrors bootstrap-scoring-role.mts exactly —
 * see that file for why this is a script and not part of the migration.
 *
 * Production does NOT run this. There, the password comes from the
 * deployment's secret manager via the same `alter role ... password`
 * statement, and CONTENT_ANSWER_WRITER_DB_URL points at it.
 *
 * Re-runnable: `alter role ... password` is idempotent.
 */
import { Client } from "pg";

const DEFAULT_ADMIN_URL = "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

/* Local/CI only. A real deployment sets CONTENT_ANSWER_WRITER_DB_PASSWORD
   from a secret store; if this string ever appears in a production database,
   something has gone wrong upstream of this script. */
const DEFAULT_LOCAL_PASSWORD = "local-dev-content-answer-writer-not-a-secret";

const adminUrl = process.env.SUPABASE_DB_URL ?? DEFAULT_ADMIN_URL;
const password = process.env.CONTENT_ANSWER_WRITER_DB_PASSWORD ?? DEFAULT_LOCAL_PASSWORD;

if (!/localhost|127\.0\.0\.1/.test(adminUrl) && process.env.CONTENT_ANSWER_WRITER_DB_PASSWORD === undefined) {
  throw new Error(
    "Refusing to set the default local password on a non-local database. " +
      "Set CONTENT_ANSWER_WRITER_DB_PASSWORD from your secret store.",
  );
}

const client = new Client({ connectionString: adminUrl });
await client.connect();

try {
  const role = await client.query<{ rolname: string }>(
    `select rolname from pg_roles where rolname = 'mindmosaic_content_answer_writer'`,
  );
  if (role.rowCount === 0) {
    throw new Error(
      "Role mindmosaic_content_answer_writer does not exist. Apply " +
        "supabase/migrations/20260902090000_content_answer_writer_role.sql first.",
    );
  }

  const statement = await client.query<{ stmt: string }>(
    `select format('alter role mindmosaic_content_answer_writer password %L', $1::text) as stmt`,
    [password],
  );
  await client.query(statement.rows[0]!.stmt);

  const url = adminUrl.replace(
    /^postgresql:\/\/[^@]+@/,
    `postgresql://mindmosaic_content_answer_writer:${encodeURIComponent(password)}@`,
  );
  console.log("Password set for mindmosaic_content_answer_writer.");
  console.log("CONTENT_ANSWER_WRITER_DB_URL=" + url);
} finally {
  await client.end();
}
