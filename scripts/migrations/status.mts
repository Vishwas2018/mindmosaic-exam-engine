/**
 * `npm run migrations:status` — reports repo-vs-live migration drift.
 *
 * Exits non-zero on any drift, so it fails loudly in CI or a pre-deploy
 * step rather than needing someone to read the output and notice. Drift is
 * any of:
 *
 *   - a migration file in the repo whose objects are NOT present in the
 *     database (the failure that started all this);
 *   - a migration whose objects ARE present but which is missing from the
 *     ledger (silently applied out-of-band);
 *   - a migration recorded in the ledger whose objects are NOT present (a
 *     dishonest or stale ledger row — the failure mode a ledger introduces);
 *   - a migration file on disk with no registry entry, or vice versa.
 *
 * Read-only. It never writes to the ledger; `migrations:record` does that.
 */
import { MIGRATIONS, fileNameFor } from "./registry";
import { connect, inspect, ledgerExists, ledgerVersions, migrationFilesOnDisk } from "./verify";

const client = await connect();

try {
  const hasLedger = await ledgerExists(client);
  const states = await inspect(client);

  const registryFiles = new Set(MIGRATIONS.map(fileNameFor));
  const diskFiles = migrationFilesOnDisk();
  const unregistered = diskFiles.filter((file) => !registryFiles.has(file));
  const missingFiles = MIGRATIONS.filter((entry) => !diskFiles.includes(fileNameFor(entry)));

  const rows = states.map((state) => {
    const failing = state.checks.filter((check) => !check.present);
    const verdict = !state.objectsPresent
      ? "NOT APPLIED"
      : !state.inLedger
        ? "APPLIED, UNRECORDED"
        : "ok";
    return {
      version: state.version,
      name: state.name,
      onDisk: state.onDisk ? "yes" : "NO",
      objects: state.objectsPresent ? `${state.checks.length}/${state.checks.length}` :
        `${state.checks.length - failing.length}/${state.checks.length}`,
      ledger: state.inLedger ? "recorded" : "absent",
      verdict,
    };
  });

  console.log(`\nMigration status — ${states.length} migrations\n`);
  console.table(rows);

  if (!hasLedger) {
    console.log(`ledger: supabase_migrations.schema_migrations does NOT exist.`);
  }

  const notApplied = states.filter((state) => !state.objectsPresent);
  const unrecorded = states.filter((state) => state.objectsPresent && !state.inLedger);
  const ghostRows = states.filter((state) => !state.objectsPresent && state.inLedger);

  for (const state of notApplied) {
    console.log(`\nNOT APPLIED — ${state.version}_${state.name}`);
    for (const check of state.checks.filter((c) => !c.present)) {
      console.log(`    missing: ${check.describes}`);
    }
  }
  for (const state of ghostRows) {
    console.log(
      `\nLEDGER LIES — ${state.version}_${state.name} is recorded as applied but its objects are absent.`,
    );
  }
  for (const file of unregistered) {
    console.log(`\nUNREGISTERED — ${file} has no entry in scripts/migrations/registry.ts, so it is unverifiable.`);
  }
  for (const entry of missingFiles) {
    console.log(`\nMISSING FILE — registry lists ${fileNameFor(entry)} but it is not in ${"supabase/migrations"}.`);
  }

  /* A ledger row for a version nothing in the repo knows about. Iterating
     the registry alone would never surface it, so the ledger is checked in
     the other direction too. */
  const knownVersions = new Set(MIGRATIONS.map((entry) => entry.version));
  const strayLedgerRows = [...(await ledgerVersions(client))].filter(
    (version) => !knownVersions.has(version),
  );
  for (const version of strayLedgerRows) {
    console.log(
      `\nUNKNOWN LEDGER ROW — ${version} is recorded as applied but no migration in this repo has that version.`,
    );
  }

  const drift =
    notApplied.length +
    unrecorded.length +
    ghostRows.length +
    unregistered.length +
    missingFiles.length +
    strayLedgerRows.length;

  if (drift === 0) {
    console.log(
      `\nNo drift: ${states.length} of ${states.length} migrations applied, verified against live objects, and recorded.\n`,
    );
    process.exit(0);
  }

  console.error(
    `\nDRIFT: ${notApplied.length} not applied, ${unrecorded.length} applied but unrecorded, ` +
      `${ghostRows.length} recorded but absent, ${unregistered.length} unregistered, ` +
      `${missingFiles.length} missing file(s), ${strayLedgerRows.length} unknown ledger row(s).\n`,
  );
  process.exit(1);
} finally {
  await client.end();
}
