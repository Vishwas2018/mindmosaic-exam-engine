/**
 * `npm run scoring:bootstrap` — sets the password for the `mindmosaic_scoring`
 * role (spec §9.3.1, ADR-006 Amendment A).
 *
 * Why this is a script and not part of 20260812110000_scoring_role.sql: a
 * migration is committed to the repository and a credential must not be. The
 * migration creates the role with LOGIN and no password, which under
 * scram/md5 authentication cannot authenticate at all — the correct state for a
 * fresh apply. This script is how local development and CI give it one.
 *
 * Production does NOT run this. There, the password comes from the deployment's
 * secret manager via the same `alter role ... password` statement, and
 * SCORING_DB_URL points at it. The value below is a local-only convenience and
 * is deliberately obvious about being one.
 *
 * Re-runnable: `alter role ... password` is idempotent.
 */
import { Client } from "pg";

/* The same default the RLS harness uses (tests/rls/db.ts) — the local Supabase
   stack on the port pinned in supabase/config.toml. */
const DEFAULT_ADMIN_URL = "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

/* Local/CI only. A real deployment sets SCORING_DB_PASSWORD from a secret
   store; if this string ever appears in a production database, something has
   gone wrong upstream of this script. */
const DEFAULT_LOCAL_PASSWORD = "local-dev-scoring-not-a-secret";

const adminUrl = process.env.SUPABASE_DB_URL ?? DEFAULT_ADMIN_URL;
const password = process.env.SCORING_DB_PASSWORD ?? DEFAULT_LOCAL_PASSWORD;

if (!/localhost|127\.0\.0\.1/.test(adminUrl) && process.env.SCORING_DB_PASSWORD === undefined) {
  /* Refusing rather than defaulting: silently writing a known password into a
     remote database is the one failure mode this script must not have. */
  throw new Error(
    "Refusing to set the default local password on a non-local database. " +
      "Set SCORING_DB_PASSWORD from your secret store.",
  );
}

const client = new Client({ connectionString: adminUrl });
await client.connect();

try {
  const role = await client.query<{ rolname: string }>(
    `select rolname from pg_roles where rolname = 'mindmosaic_scoring'`,
  );
  if (role.rowCount === 0) {
    throw new Error(
      "Role mindmosaic_scoring does not exist. Apply " +
        "supabase/migrations/20260812110000_scoring_role.sql first.",
    );
  }

  /* ALTER ROLE accepts no bind parameter for the password, and a DO block
     accepts no parameters at all. So the literal is quoted by the server via
     format(%L) in a parameterised SELECT, and only then executed — which keeps
     the password out of any string this script concatenates by hand. */
  const statement = await client.query<{ stmt: string }>(
    `select format('alter role mindmosaic_scoring password %L', $1::text) as stmt`,
    [password],
  );
  await client.query(statement.rows[0]!.stmt);

  const url = adminUrl.replace(
    /^postgresql:\/\/[^@]+@/,
    `postgresql://mindmosaic_scoring:${encodeURIComponent(password)}@`,
  );
  console.log("Password set for mindmosaic_scoring.");
  console.log("SCORING_DB_URL=" + url);
} finally {
  await client.end();
}
