# Cross-stack database access during the RLS investigation: what is confirmed and what is not

Written 19 Oct 2026 from the logs and code available. It separates what the evidence proves, what it rules out, and what cannot be known.

## What happened

`tests/rls/assessment-scoring.test.ts` deleted `SCORING_DB_URL` after its tests. The RLS run is one long-lived process, so any later file that read the variable fell back to the built-in default port 56322. On this machine port 56322 is **not** the database I was testing (the isolated stack on 58322) but a different local Supabase stack, `mindmosaic-rls-harness`, which belongs to another harness. The scoring module (`src/server/scoring/answer-access.ts`) opens its own connection from that variable at call time.

## Confirmed

1. **The mechanism and the scope.** Reproduced deterministically: a pinned file order that runs `assessment-scoring` first fails exactly eleven tests with `ScoringRefused: No assessment session`, every time (`RLS-FLAKINESS.md`).
2. **The connection really happened.** That error is thrown only after the scoring role connected, started a transaction and ran its `select ... from public.assessment_sessions where id = $1` and got no row (`loadSession`). A refused or unauthenticated connection produces a different error. So in each affected test, the scoring module **connected to 127.0.0.1:56322 as `mindmosaic_scoring` and ran `BEGIN`, one `SELECT`, `ROLLBACK`**, then disconnected. This is established by program behaviour, not by the other stack's logs.
3. **No write was issued by that path.** The module's sequence is `connect`, `begin`, `loadSession` (read), then throws, `rollback`, `end`. It never reaches `persistOutcomes`, `persistResult` or `markSubmitted`, which are the only writes. The tests' own fixture connections used the primary URL (58322) throughout.
4. **My other tooling never fell back.** From the first database command onward every script, bootstrap, migration, projection and test was run with explicit URLs for port 58322 (`env-isolated.sh`), which has no fallback.
5. **One deliberate read of the other stack.** While assessing this, I ran `docker exec supabase_db_mindmosaic-rls-harness psql -U postgres -Atc "show log_connections; show log_statement; show log_min_duration_statement"` (three `SHOW` statements, no data read, nothing changed) and `docker logs` on that container. I should have limited myself to `docker logs`; I mention the `psql` call so the record is complete.

## What the other stack's logs show

Container `supabase_db_mindmosaic-rls-harness`: retained log starts at 2026-10-18 06:33:07 UTC with a fresh `initdb`, i.e. the container was created at 17:33 local time (UTC+11). Settings: `log_connections = off`, `log_statement = ddl`, no duration logging. The saved copy is in `evidence/other-stack-db-scoring-lines.log`.

- **Successful connections and `SELECT` statements are never logged**, so this log cannot show the access in item 2, and its silence is not evidence it did not happen.
- Entries for `mindmosaic_scoring@` (116 lines) and `mindmosaic_content_answer_writer@` (37) all fall between 06:34 and 06:36 UTC, from `172.21.0.1` (the Docker gateway, meaning some process on this host), and consist of grants, `password authentication failed ... has no password assigned` (the role had no password yet) and permission-denied errors: the signature of a harness being bootstrapped. I do not believe they are mine: my bootstrap ran against 58322, and the only runs of mine that fell back to 56322 inside the retained window were the two pinned-order diagnostic runs at about 08:50 to 09:10 UTC, hours after these entries.
- After 06:36 UTC the log holds only cron and checkpoint lines to its end (11:00 UTC), which covers those two diagnostic runs: no error, no DDL and no authentication failure appears for them. That is consistent with a clean read-only connection, and equally with anything unlogged.

## Not known

1. **Runs before the container was created (before 06:33 UTC).** Several of my affected runs happened then (the full RLS runs and bisect runs between about 05:15 and 06:12 UTC, and an unmodified-`dev` comparison). The retained log cannot cover them, so I cannot say what that earlier instance of the stack recorded, or whether it held rows for the scoring module to find. The same reasoning applies: the scoring path was read-only, but this is inference from the code, not from that stack's records.
2. **Whether the other stack's owner saw anything.** Idle connections of a few milliseconds from a role they created would not normally be visible to them.
3. **The count.** About eleven tests per failing full run, an unknown number of failing runs; each affected test made at most one such connection.
4. **Whether any other process on this machine also used port 56322 during those minutes.** The log's host column is the gateway for all local processes.

## Conclusion and what changed

No evidence that anything on the other stack was written, altered or deleted, and the code path rules out writes from the scoring module; but an unknown number of short read-only connections (about eleven per affected full run) to it did occur, which should not have, and for the earliest runs the stack's own records cannot confirm even that. If the owner of `mindmosaic-rls-harness` wants certainty, they can compare their fixtures against their own expectations; nothing here needs reverting.

The class of mistake is now closed in the repository: every database variable is checked, before any connection, to be a local address naming the same host and port as `RLS_TEST_DB_URL`; the dedicated roles' default URLs are derived from that primary instead of from a fixed port; the variable is restored after every file; and a run can be pinned with `RLS_EXPECTED_DB_PORT`. The guard has unit tests and was shown refusing a split configuration and a hosted URL without opening a connection.
