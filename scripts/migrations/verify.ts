import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

import { decideHostedTls, hostedClientConfig } from "../../src/server/exam-write/tls";
import { MIGRATIONS, fileNameFor, type MigrationEntry } from "./registry";

/**
 * Shared plumbing for the migration ledger commands. Read-only except for
 * `recordVerified`, which writes ledger rows and only ever for migrations
 * whose objects it has just confirmed exist.
 */

export const MIGRATIONS_DIR = "supabase/migrations";
export const LEDGER_SCHEMA = "supabase_migrations";
export const LEDGER_TABLE = "schema_migrations";

export function migrationFilesOnDisk(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

/** Reads SUPABASE_DB_URL from the environment, falling back to .env.local. */
export function databaseUrl(): string {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (line.startsWith("SUPABASE_DB_URL=")) return line.slice("SUPABASE_DB_URL=".length).trim();
    }
  }
  throw new Error(
    "SUPABASE_DB_URL is not set. Export it, or add it to .env.local, before running this command.",
  );
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** The CA for a hosted connection: SUPABASE_DB_CA (PEM, literal \n accepted) or the file named by SUPABASE_DB_CA_FILE. */
function hostedCa(): string | undefined {
  if (process.env.SUPABASE_DB_CA?.trim()) return process.env.SUPABASE_DB_CA;
  const file = process.env.SUPABASE_DB_CA_FILE?.trim();
  return file ? fs.readFileSync(file, "utf8") : undefined;
}

/**
 * Connects to the ledger database. A loopback host connects as given. ANY other host is connected to ONLY with verified
 * TLS: the operator-supplied CA is the sole trust anchor, the certificate must match the URL's host, and
 * NODE_TLS_REJECT_UNAUTHORIZED=0 or a missing/invalid CA refuses before anything is sent. Whether a host is loopback is
 * decided on the parsed host, never by searching the string (a password or query containing "localhost" must not
 * switch encryption off), and the connection is built from parts so an `sslmode` in the URL cannot override verification.
 */
export async function connect(): Promise<Client> {
  const connectionString = databaseUrl();
  let host: string;
  try {
    host = new URL(connectionString).hostname.toLowerCase();
  } catch {
    throw new Error("SUPABASE_DB_URL is not a valid postgres:// URL (percent-encode special characters in the password).");
  }
  if (LOOPBACK_HOSTS.has(host)) {
    const local = new Client({ connectionString });
    await local.connect();
    return local;
  }
  const tls = decideHostedTls({
    caPem: hostedCa(),
    nodeRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED,
    nowMs: Date.now(),
  });
  if (!tls.ok) {
    throw new Error(
      `Refusing to connect to ${host} without verified TLS (${tls.reason}). Set SUPABASE_DB_CA (or SUPABASE_DB_CA_FILE) to the ` +
        "project's CA certificate from the dashboard's Database settings, and unset NODE_TLS_REJECT_UNAUTHORIZED.",
    );
  }
  const client = new Client(hostedClientConfig(connectionString, tls.ca));
  await client.connect();
  return client;
}

export interface CheckOutcome {
  readonly describes: string;
  readonly present: boolean;
}

export interface MigrationState {
  readonly version: string;
  readonly name: string;
  readonly onDisk: boolean;
  readonly inLedger: boolean;
  /** Every declared object check passed against the live database. */
  readonly objectsPresent: boolean;
  readonly checks: readonly CheckOutcome[];
}

export async function ledgerExists(client: Client): Promise<boolean> {
  const { rows } = await client.query(
    `select exists (
       select 1 from information_schema.tables
       where table_schema = $1 and table_name = $2
     ) as present`,
    [LEDGER_SCHEMA, LEDGER_TABLE],
  );
  return rows[0].present === true;
}

export async function ledgerVersions(client: Client): Promise<Set<string>> {
  if (!(await ledgerExists(client))) return new Set();
  const { rows } = await client.query(
    `select version from ${LEDGER_SCHEMA}.${LEDGER_TABLE} order by version`,
  );
  return new Set(rows.map((row: { version: string }) => row.version));
}

export async function runChecks(
  client: Client,
  entry: MigrationEntry,
): Promise<CheckOutcome[]> {
  const outcomes: CheckOutcome[] = [];
  for (const check of entry.checks) {
    try {
      const { rows } = await client.query(check.sql);
      outcomes.push({ describes: check.describes, present: rows[0]?.present === true });
    } catch {
      /* A check that cannot even run (e.g. a regclass cast against a table
         that does not exist) means the object is absent, not that the tool
         is broken. */
      outcomes.push({ describes: check.describes, present: false });
    }
  }
  return outcomes;
}

export async function inspect(client: Client): Promise<MigrationState[]> {
  const onDisk = new Set(migrationFilesOnDisk());
  const recorded = await ledgerVersions(client);

  const states: MigrationState[] = [];
  for (const entry of MIGRATIONS) {
    const checks = await runChecks(client, entry);
    states.push({
      version: entry.version,
      name: entry.name,
      onDisk: onDisk.has(fileNameFor(entry)),
      inLedger: recorded.has(entry.version),
      objectsPresent: checks.every((check) => check.present),
      checks,
    });
  }
  return states;
}

/**
 * Creates the ledger if absent, using the Supabase CLI's own table shape so
 * the CLI reads and writes the same state this project does.
 */
export async function ensureLedger(client: Client): Promise<boolean> {
  if (await ledgerExists(client)) return false;
  await client.query(`create schema if not exists ${LEDGER_SCHEMA}`);
  await client.query(
    `create table if not exists ${LEDGER_SCHEMA}.${LEDGER_TABLE} (
       version text not null primary key,
       statements text[],
       name text
     )`,
  );
  return true;
}

/**
 * Records a migration as applied — but only if every one of its declared
 * objects is genuinely present. This is the whole point: a ledger that can
 * be baselined by assertion is worth nothing, because the failure it is
 * supposed to catch is precisely someone assuming.
 *
 * `statements` is deliberately left null for rows written here. The CLI
 * populates it with the SQL it executed; these migrations were applied
 * out-of-band, and pretending otherwise would be another small lie in a
 * ledger whose only value is that it does not contain any.
 */
export async function recordVerified(
  client: Client,
  entry: MigrationEntry,
  checks: readonly CheckOutcome[],
): Promise<"recorded" | "already-recorded" | "refused"> {
  if (!checks.every((check) => check.present)) return "refused";
  const { rowCount } = await client.query(
    `insert into ${LEDGER_SCHEMA}.${LEDGER_TABLE} (version, name)
     values ($1, $2) on conflict (version) do nothing`,
    [entry.version, entry.name],
  );
  return rowCount === 1 ? "recorded" : "already-recorded";
}
