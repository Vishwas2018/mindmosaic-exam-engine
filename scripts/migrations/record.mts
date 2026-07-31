/**
 * `npm run migrations:record` — creates the ledger if absent and records
 * every migration whose declared objects are verified present, right now,
 * against the live database.
 *
 * This is NOT a baseline command. It refuses to record any migration whose
 * objects it cannot find, which is the difference between a ledger that
 * documents reality and one that merely asserts it. A migration that has
 * not been applied stays absent from the ledger and `migrations:status`
 * keeps failing until someone applies it.
 *
 * Safe to re-run: creation is `if not exists` and inserts are
 * `on conflict do nothing`. It writes only to the ledger table.
 */
import { MIGRATIONS } from "./registry";
import { connect, ensureLedger, recordVerified, runChecks } from "./verify";

const client = await connect();

try {
  const created = await ensureLedger(client);
  console.log(
    created
      ? "\nCreated supabase_migrations.schema_migrations (Supabase CLI table shape).\n"
      : "\nLedger already present.\n",
  );

  const rows: Record<string, string>[] = [];
  for (const entry of MIGRATIONS) {
    const checks = await runChecks(client, entry);
    const outcome = await recordVerified(client, entry, checks);
    const failed = checks.filter((check) => !check.present);
    rows.push({
      version: entry.version,
      name: entry.name,
      objects: `${checks.length - failed.length}/${checks.length}`,
      outcome:
        outcome === "refused"
          ? `REFUSED — ${failed.map((f) => f.describes).join("; ")}`
          : outcome,
    });
  }

  console.table(rows);

  const refused = rows.filter((row) => row.outcome.startsWith("REFUSED"));
  if (refused.length > 0) {
    console.error(
      `\n${refused.length} migration(s) were NOT recorded because their objects are absent. ` +
        `Apply them, then re-run. Nothing was recorded on their behalf.\n`,
    );
    process.exit(1);
  }

  console.log(`\nRecorded ${rows.length} verified migrations.\n`);
} finally {
  await client.end();
}
