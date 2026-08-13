/**
 * `npm run cutover:backfill` — copy terminal legacy sittings into the target
 * model (spec §12.7 step 3, ADR-005 §3).
 *
 * A thin runner over `public.backfill_legacy_terminal_sessions()`, which holds
 * all the logic. The split is deliberate: the function is what the migration
 * registry can verify and what runs inside one transaction, and this file is
 * only the operator's handle on it.
 *
 * Safe to run repeatedly. The function is idempotent against unique legacy
 * source ids, and `npm run cutover:verify` proves that by running it twice.
 *
 * It writes only target tables. The legacy `exam_*`/`essay_marks` rows are read
 * and never modified, so this is recoverable by deleting target rows and does
 * not disturb the legacy model's authority for a moment.
 */
import { connect } from "./migrations/verify";

/* The shared helper, so a remote deploy target gets the same TLS handling every
   other migration command uses rather than a second connection policy here. */
const client = await connect();

try {
  /* One transaction. A backfill that committed halfway would leave sessions
     whose responses had not landed, and the terminal-response lock would then
     refuse to add them on a re-run — the session is already 'submitted'. */
  await client.query("begin");
  const result = await client.query<{ summary: Record<string, number> }>(
    `select public.backfill_legacy_terminal_sessions() as summary`,
  );
  await client.query("commit");

  const summary = result.rows[0]!.summary;
  console.log("\nBackfill complete (spec §12.7 step 3).\n");
  console.table(
    Object.entries(summary).map(([metric, value]) => ({ metric, value })),
  );

  if (summary.resultsSkippedUnmappable > 0) {
    /* Not fatal here — the verifier is the gate, and it fails on exactly this
       condition with the attempt ids named. Surfaced now so an operator is not
       surprised by a red verify. */
    console.warn(
      `\n${summary.resultsSkippedUnmappable} legacy attempt(s) have a result blob that ` +
        `cannot be mapped onto the typed columns. No result row was written for them ` +
        `and no value was invented. \`npm run cutover:verify\` will fail and name them.\n`,
    );
  }

  if (summary.backfilledVersionPinned === 0 && summary.backfilledLegacyUnversioned > 0) {
    console.log(
      `All ${summary.backfilledLegacyUnversioned} backfilled sitting(s) are ` +
        `legacy_unversioned. That is the expected answer (ADR-005 §4): the legacy ` +
        `model recorded bare question ids with no revision and no content hash, so ` +
        `no sitting can be proved reproducible. They are labelled, not pinned, and ` +
        `they are never recomputed.\n`,
    );
  }
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
