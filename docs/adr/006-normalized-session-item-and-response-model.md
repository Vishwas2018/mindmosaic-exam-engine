# ADR-006: Normalized session-item and response model

- **Status:** accepted
- **Date:** 2026-08-12
- **Spec:** §12.2–§12.6, §14, §17.2, §18, §21 Phase 2
- **Phase:** 2

## Context

A sitting is currently three shapes, none of them normalized:

- **Content:** `exam_sessions.selected_question_ids text[]` — bare IDs, no
  revision, no hash, no served time, no allocation reason.
- **In-progress answers:** one `exam_responses` row per session, whose
  `responses` jsonb is upserted wholesale on every autosave. There is no per-
  answer identity, so "when was question 7 answered" is unanswerable and a late
  or duplicate autosave overwrites the whole document.
- **Final answers and score:** one `exam_attempts.result` jsonb, computed by
  `buildExamResult()` in the submit route.

The submitted-state guarantee that holds this together is
`session_has_attempt()` (`20260811092000`): both `exam_responses` write policies
refuse once an attempt exists. That guarantee is load-bearing and must survive
into the target model — not as a policy over a rewritable document, but as a
property of the schema.

Phase 1 built the version-pinned content this model needs: `item_versions` with
a global content hash, and `item_answer_versions` in a table with **zero**
`anon`/`authenticated` privileges, RLS on, no policies. Spec §9.3 permits it
exactly one runtime reader — a narrowly scoped SECURITY DEFINER scoring function
with a fixed `search_path`. That function is this ADR's responsibility.

## Decision

### 1. `assessment_sessions` is the snapshot, and the snapshot is complete

Every version §12.3 names is pinned as a column, not inferred at read time:
assessment-profile, framework, blueprint, taxonomy, engine algorithm, scoring
algorithm, and content publication/build version, plus delivery mode, seed,
server-owned form ID, lifecycle status and an optimistic-lock `version`.

Phase 3 owns `framework_versions`/`blueprint_versions`/
`assessment_profile_versions` as tables; they do not exist yet. The pins are
therefore **text version identifiers, not foreign keys** — the same choice ADR-002
Amendment B made for `source_*` scope on `item_versions`, and for the same
reason: a foreign key to an absent table is either a stub table (a second
independently-maintained answer) or a nullable column that means nothing. A text
pin recorded now is a true record of what the sitting ran under; Phase 3 adds the
FKs when the referents exist.

`scoring_algorithm_version` is the one that must be right today, because §14.2's
determinism guarantee is stated in terms of it: same pinned content, same
responses, same framework version, same scoring algorithm version → same result.
It is pinned at creation and the scoring function refuses a version it does not
implement (`MM206`) rather than silently scoring with a newer algorithm.

### 2. `assessment_session_items` is the ledger, written once at allocation

Fixed delivery allocates the whole paper at creation (§11.2) and persists one row
per served item, carrying everything §12.4 requires: global ordinal, stage and
within-stage ordinal, item and item-version IDs, content hash, stimulus and
stimulus-version IDs, item-family ID, blueprint-cell ID, target band, allocation
decision, seed/form identifier, served timestamp, exposure window depth, and
forced-reuse reason.

`item_family_id`, `blueprint_cell_id`, `target_band` and `exposure_window_depth`
are nullable for fixed delivery, where they have no value yet — item families
arrive with Phase 3's normalization and bands are an adaptive concept (ADR-007).
They are columns now rather than a later `alter table` because §12.4 lists them
as part of what the ledger *is*, and because backfilling a ledger column after
sessions exist means backfilling values nobody recorded.

The content hash is copied onto the ledger row, duplicating `item_versions.
content_hash`. That is deliberate: the ledger must remain independently
verifiable if a content row is ever archived, and a replay that compares the two
proves nothing if it reads the same column twice.

The table is append-only. `served_at` is set at allocation and never updated;
there is no update path for any role (§3 below).

### 3. One row per response, keyed on the served item

`session_responses` has one row per `(session_id, session_item_id)` — unique, so
the served item *is* the response's identity. §12.5 requires each response to
reference the exact served session item, and this is the constraint that makes it
structural rather than conventional.

Backfilled `legacy_unversioned` sessions have no ledger to point at (ADR-005 §4),
so the table carries a second identity branch: `legacy_question_id`, the bare
content-bank id, unique per session. A check constraint requires **exactly one**
branch to be populated, and each branch has its own partial unique index. Two
branches is one more than ideal; the alternative was inventing ledger rows for
sittings whose served revision cannot be established, which is the fabrication
ADR-005 §4 refuses. The branch is legacy-only and disappears with step 10.

Autosave maps onto this as an upsert on that unique key, through a SECURITY
DEFINER RPC. The learner holds **no** `INSERT` or `UPDATE` privilege on the
table, so unlike `exam_responses` today there is no direct-write path to guard
with a policy at all.

**Idempotency and ordering.** Every response commit carries a monotonic
`client_sequence` from the client's own autosave counter. The RPC applies a write
only when `client_sequence >= session_responses.client_sequence`; an out-of-order
or replayed autosave is discarded, not applied. This is what a single upserted
document cannot do: today a stale autosave arriving late overwrites newer
answers wholesale.

`answered_at` records when the response reached its current value;
`first_answered_at` is set once and never moved, so "when did they first answer
question 7" survives a later change.

**Post-submit immutability.** The `20260811092000` guarantee is reproduced one
level stronger. Rather than a policy consulting `session_has_attempt()`, the
response RPC checks `assessment_sessions.status`: a session in `submitted`,
`processed` or `abandoned` is terminal for learner writes (§12.8) and the RPC
raises `MM205`. A trigger additionally refuses any `UPDATE` to a
`session_responses` row whose session is terminal, for every role including the
table owner — the same posture `reject_content_version_update()` takes in Phase 1,
and for the same reason: a privileged job must not be able to edit submitted
evidence in place either.

### 4. Correctness is derived, never accepted

`session_responses` stores the learner's `response_value` jsonb and nothing else
about its quality. There is no client-writable correctness, score, difficulty,
skill or content-identity field on the table — not "ignored on write", *absent*.
§12.5 says client-provided values must be ignored; a column that exists and is
ignored is one refactor away from being read.

Derived outcomes (`is_correct`, `awarded_marks`, `score_status`) are written by
the scoring function only, at submission, and are `null` until then.

### 5. The scoring function is the single reader of `item_answer_versions`

`public.score_assessment_session(uuid)` — SECURITY DEFINER, `set search_path =
public, pg_temp`, `execute` granted to `authenticated` only.

It derives the actor from `auth.uid()`, re-checks ownership and session status
independently of the route, joins `assessment_session_items` to
`item_answer_versions` **through the pinned `item_version_id`**, and derives
correctness and marks in SQL. It returns per-item outcomes and totals. It never
returns an answer key, a rubric or a private explanation, and the `answer_key`
jsonb never leaves the function body.

That is what keeps the §22 proof obligation true — "direct authenticated reads
fail; scoring succeeds only for versions allocated to the caller's session". The
function reads the answer belonging to the item version *the session pinned*, so
even a caller who could name an arbitrary `item_version_id` gains nothing: the
join is from the session's ledger, not from a parameter.

Determinism (§14.2) follows from the join: the answer version is reached through
`assessment_session_items.item_version_id`, which is immutable, so a later item
revision produces a new `item_versions` row that this session's ledger does not
point at. Replaying an old sitting after a question is revised returns the
original result. That is the §21 Phase 2 exit-gate claim, and it is tested by
revising an item and re-running the function.

**Manual review (§14.3).** An item whose pinned answer key is `kind: "manual"`
is stored with `is_correct = null` and `awarded_marks = null` — never a
fabricated `false`/`0`. A blank manual item is `unanswered`, not
`manual_review`: there is nothing for a person to review. Manual items are
excluded from the objective denominator until a `manual_marks` row exists. These
three rules are the SQL restatement of `scoreEssay`/`unanswered` in
`question-scorers.ts`, and the golden test asserts the SQL and the TypeScript
agree item-for-item over the whole bank.

### 6. Results, and what a learner receives

`assessment_results` is one row per session (`session_id` unique — the target
model's equivalent of `exam_attempts_session_id_key`, and the same idempotent-409
mechanism: `23505` surfaces rather than being caught). It carries the objective
totals, the manual-pending counts, submission timestamp and reason, and the
scoring algorithm version actually used.

Learners receive the sanitized candidate DTO and nothing else. Candidate content
comes from `item_versions.candidate_content`, which by construction contains no
answer (Phase 1's `.strict()` schema makes a smuggled answer field a parse
error). Review content — correct answers and explanations — is returned only
after the result row is durably recorded (§17.1), matching what the legacy submit
route already does.

### 7. Stages exist and stay unused

`assessment_session_stages` and `stage_transitions` are created now, with the
shape §12.6 and ADR-008 will need, and **no fixed-delivery code path writes
them**. Fixed sessions record `stage_number = 1` on their ledger rows and create
no stage row.

Creating them now is not speculative in the sense Appendix B rejects — that
prohibition is about deploying queues and intelligence tables with no producer
*and* no consumer in prospect. These two are the same migration's worth of work
either way, and adding stage columns to `assessment_session_items` after real
sessions exist means choosing a default for rows nobody staged. What is
deliberately *not* built here is stage routing: no sealing, no band selection, no
transition RPC. That is Phase 4, gated on ADR-007 and ADR-008.

`outbox_events` is created for the same reason and is likewise unwritten by fixed
delivery — but §19.3 is explicit that an outbox should arrive with a real
consumer, so this one carries no worker, no schedule, and no producer until one
exists. If Phase 4 does not need it, it should be dropped rather than kept.

### 8. The guest flow gains no server-side representation

Guests practise client-side with no server session at all. Giving them an
`assessment_sessions` row would mean creating child-data rows for users who have
not signed in and whose data the retention schedule (ADR-012) has no owner for.
The guest flow is preserved exactly as it is, and §21 Phase 2 requires it stay
working.

## Consequences

- Response writes cost one RPC round-trip instead of a PostgREST upsert. The
  learner holds no table privilege in exchange, which is the trade §17.2 asks for.
- Scoring logic now exists in SQL as well as TypeScript. That duplication is real
  and is the main cost of this ADR. It is contained by a golden test that runs
  both over the same bank and requires identical outcomes; the SQL is
  authoritative for signed-in sittings and the TypeScript remains authoritative
  for the guest/local path, which has no database.
- Per-response rows change the row-count profile: ~40 rows per sitting instead of
  1. §20.1 already names session items and responses as the primary scale driver,
  and the indexes in §20.2 are created with the tables.
- `assessment_session_items` cannot be created for backfilled legacy sessions
  (ADR-005 §4), so a `legacy_unversioned` session has responses and a result but
  no ledger. Every consumer must tolerate that, and the scoring function refuses
  it outright rather than scoring from an absent ledger.

## Alternatives considered

**Keep the response document, add version pinning only.** Rejected: it fixes
content drift but leaves autosave as a whole-document overwrite with no per-answer
identity, so late/duplicate autosaves still clobber and §12.5's "each response
must reference the exact served session item" stays unenforceable.

**Score in TypeScript and write the outcome through an RPC** (what the legacy
path does). Rejected for the target model: it keeps the answer key readable by
the application server, so §9.3's "one runtime read path" would be a convention
about which module imports the bank rather than a privilege boundary. Scoring in
the definer function means no process outside Postgres ever holds an answer key
for a signed-in sitting.

**Compute correctness at response time rather than at submission.** Rejected: it
means the database holds a per-answer correctness flag while the learner is still
sitting, and every additional row that knows the answer is another row that can
leak it. It also makes a mid-sitting answer change a re-score.

**Store `is_correct` as `false` for unmarked manual items.** Rejected explicitly
by §14.3, and it is the specific bug the legacy `blank-sitting-aggregates` test
exists to prevent.

## Verification

| Claim | Where it is proved |
| --- | --- |
| Learners hold no write privilege on any session table | `tests/rls/assessment-session-model.test.ts`, per-table incl. `TRUNCATE` |
| The answer table stays unreadable to learners | `tests/rls/assessment-scoring-role.test.ts` — direct select is `42501` |
| Scoring succeeds only for versions allocated to the session being scored | Same suite |
| A revised item does not change an old sitting | Same suite, replay case |
| A blank manual item is unanswered, an attempted one is manual_review | Same suite, three cases (blank/answered/marked) |
| A stale autosave cannot overwrite a newer answer | `tests/rls/assessment-session-model.test.ts` sequence case |
| A submitted session refuses further response writes | Same suite — the owner-level trigger case |

---

## Amendment A (2026-08-12, Phase 2 step 2b): scoring runs in a dedicated least-privilege role, not in PL/pgSQL

**Status:** accepted · **Spec:** §9.3.1, §17.1, §22 (spec v1.2, §1.2)
**Supersedes:** §5 above, and the "SQL scoring equals TypeScript scoring" row of
the original verification table.

### What changed

§5 decided that `public.score_assessment_session(uuid)` — a `SECURITY DEFINER`
function — would be the single runtime reader of `item_answer_versions`, deriving
correctness in SQL. That is no longer the design. **Signed-in scoring reads the
pinned answer version through a dedicated least-privilege Postgres role and
scores with the existing `question-scorers.ts`.**

### Why

§5's own Consequences section named the cost and understated it: "Scoring logic
now exists in SQL as well as TypeScript. That duplication is real and is the main
cost of this ADR."

It is not merely a cost, it is the wrong kind of cost. The TypeScript scorer
cannot be retired — the guest path has no database and must keep scoring locally
— so the SQL scorer is a permanent *second* implementation of one rule, across
twelve answer-key kinds with real semantic depth: per-blank accepted-answer lists
with case and whitespace normalization under `en-AU` collation, numeric
tolerance, set-versus-order comparison, record equality with exact key-set
matching, and the three-way blank/attempted/manual distinction that
`blank-sitting-aggregates` exists to protect.

A parity test over the bank does not make two implementations equal. It reports
when they have *stopped* being equal — after the divergence is written, and only
for the cases the bank happens to contain. The failure it cannot prevent is a
learner scored one way signed-in and another way as a guest, on the same
question, with both answers defensible in isolation. Against that, the thing the
definer function buys is that the answer key never enters a Node process. That is
a real property, and it is worth less than one scorer.

### The decision

1. **One scorer.** `src/features/exam-engine/scoring/question-scorers.ts` scores
   every path, signed-in and guest. No PL/pgSQL restatement exists, and none may
   be added without superseding this amendment.

2. **A dedicated Postgres role**, `mindmosaic_scoring`. Not `anon`, not
   `authenticated`, and explicitly **not** `service_role` — the point is a
   credential whose leak exposes answer keys and nothing else, which
   `service_role` (RLS bypass on every table) is the opposite of. No `BYPASSRLS`,
   no membership in a role that has it.

3. **Exactly the grants it needs**, asserted by test: `SELECT` on
   `item_answer_versions`, the reads required to resolve which answer versions the
   session pinned, the writes required to persist derived outcomes. Nothing else,
   on any object.

4. **A single module boundary.** `src/server/scoring/answer-access.ts` is the only
   file that holds the scoring credential and the only file that ever sees an
   `answer_key`. It exports derived outcomes. The raw answer, grading rules,
   rubric and private explanation never cross it — not into a return value, not
   into a DTO, not into a log line (§17.4). Enforced by an ESLint
   `no-restricted-imports` boundary, not by convention, matching how the content
   modules are already fenced (ADR-003 Context).

5. **Learner-facing posture is unchanged.** `anon` and `authenticated` keep zero
   privileges on `item_answer_versions`; no answer-read RPC or view is granted to
   `authenticated`; learners receive the sanitized candidate DTO only.

### What this trades away

The answer key now exists in application-server memory during scoring. Under §5
it never left Postgres. Concretely this widens the blast radius of: a heap dump
or core file on the scoring host, an APM agent that captures local variables, and
any future logging added inside the module. The compensating controls target
exactly those: one file to audit, a log scan in CI, and a credential that is
useless for anything but reading answers.

It also forecloses the §5 property that "no process outside Postgres ever holds
an answer key for a signed-in sitting." That claim must not appear in product or
security documentation from here on. What may be claimed is narrower and true:
*no learner-reachable credential can read answer data, and only one audited module
can.*

### Residual risk this decision does not close: pg_net is reachable by every role

Spec §9.3.1 says the scoring role "MUST hold nothing else on any object". On
Supabase that is **not fully achievable from a migration**, and the least-privilege
sweep written to prove it is what found out why.

`pg_net` ships enabled. `net.http_request_queue` and `net._http_response` carry
`arwdDxtm` for `PUBLIC`, and `net.http_delete` / `net.http_collect_response` have
null ACLs, i.e. the default `EXECUTE` to `PUBLIC`. A role with no grants of its own
can therefore insert a row into the queue, which the pg_net worker dispatches as a
real outbound HTTP request. For a credential whose purpose is reading answer keys,
that is an exfiltration primitive.

It cannot be revoked by this repository. Those objects are owned by
`supabase_admin`; the migration role (`postgres`) is neither the owner nor a member
and is not a superuser, so `REVOKE` is a no-op that emits a notice rather than an
error. A migration attempting it was written, verified to change nothing, and
deleted rather than kept as reassuring dead code.

**Scope, honestly stated.** This is not specific to `mindmosaic_scoring` — `anon`
and `authenticated` reach the same primitive identically, and have since the
project was created. It is a property of the platform, the same shape as the
`TRUNCATE`-on-every-public-table finding in
[`phase0-legacy-session-inventory.md`](phase0-legacy-session-inventory.md) §7.

**Severity, honestly stated.** Against the threat this decision is really about —
a leaked scoring credential — it adds little: an attacker holding the credential
already has a database connection and receives query results over it directly. It
matters in the narrower blind-SQL-injection case, where an attacker can execute
statements but not read results. It does not make the dedicated-role design worse
than the definer-function design, which ran in the same database with the same
extension installed.

**Remediation, for whoever owns the platform decision.** One of: have a superuser
run `revoke all on net.http_request_queue, net._http_response from public` plus
`revoke execute` on the non-`SECURITY DEFINER` net callables — `http_get`/`http_post`
are `SECURITY DEFINER` and keep working, and nothing in this repository calls
pg_net at all; or `drop extension pg_net` if no Supabase feature in use needs it.
Until then `tests/rls/assessment-scoring-role.test.ts` records the capability as a
known, named exposure rather than letting it pass unnoticed.

### Alternatives considered

**Keep the SQL scorer and treat parity as sufficient.** Rejected above: a parity
test detects divergence, it does not prevent it, and the consequence of
divergence lands on a learner's score.

**Generate the PL/pgSQL from the TypeScript.** Considered and rejected: a
generator is a third artifact to keep correct, and the semantics that actually
differ between the runtimes — collation-sensitive lowercasing, float comparison,
JSON key ordering — are precisely the ones a generator would have to get right by
hand anyway.

**Score in the definer function but only for objective single-option items, and
in TypeScript for the rest.** Rejected: it splits the boundary by question type,
so "can this code read answers" stops being answerable per module.

**Use `service_role` for the scoring read.** Rejected explicitly, and this is the
alternative most likely to be reached for later: it is one environment variable
already present in the repository (`provision-child.ts`). It bypasses RLS on every
table, so a leaked scoring credential would expose the entire database rather than
one table's answer keys — the same reasoning `20260811090000` used to prefer a
definer function over the service-role client.

### Verification

| Claim | Where it is proved |
| --- | --- |
| The scoring role holds exactly the intended grants and no more | `tests/rls/assessment-scoring-role.test.ts` grant sweep |
| The scoring role is not `service_role` and cannot bypass RLS | Same suite — `rolbypassrls` false, membership sweep empty |
| `authenticated`/`anon` still hold zero privileges on `item_answer_versions` | Same suite, re-asserted rather than inherited |
| No DTO carries an answer, rubric or explanation | `src/tests/unit/candidate-session-dto.test.ts` (the `.strict()` rejection cases) and `tests/rls/assessment-session-create.test.ts` (`get_assessment_session` omits every answer-bearing field) |
| No log line can carry an answer key | `src/tests/unit/scoring-module-boundary.test.ts` — the module contains no `console` call at all |
| Only one module holds the scoring credential | `src/tests/unit/scoring-module-boundary.test.ts` — `SCORING_DB_URL` appears in exactly one file, and the module reaches for no other credential |
| The raw answer does not leave the module at runtime | `tests/rls/assessment-scoring.test.ts` — the seeded explanation and rubric appear in neither the returned summary nor the persisted result |
| One scorer, deterministic under a pinned algorithm version | `tests/rls/assessment-scoring.test.ts` — two sittings over identical pinned content and responses produce identical derived numbers |

> **Note on this table.** It originally named four test files that did not exist
> yet, and three of them were subsequently written in different places: the log
> check folded into the module-boundary suite rather than becoming a file of its
> own, and the replay check moved to `tests/rls/` because determinism over
> *pinned* content is only observable against a database. The row claiming an
> ESLint boundary rule was removed rather than implemented — there is no such
> rule, and the static suite is what §9.3.1's "automated check rather than
> convention" is actually satisfied by. A verification table that names
> aspirational files is worse than none, because it reads as evidence.

## Amendment B (2026-08-12, Phase 2 step 2b): the fixed-session create path

Two decisions were made while implementing the create RPC that are not derivable
from the model above.

### B1. Fixed allocation is a new, smaller algorithm — not the TypeScript selector

`create_assessment_session` selects the paper itself, in SQL, rather than
accepting a server-computed item list. The alternative was the legacy shape:
`create_exam_session` takes `p_selected_question_ids`, and because that function
is granted to `authenticated`, PostgREST accepts the same call from a learner's
own JWT — the array that decides which questions they sit is a request
parameter, and the database cannot tell the route's array from a forged one.
Spec §17.2 says client-provided item IDs and allocation metadata MUST NOT be
trusted, so the new path has no such parameter, and the migration registry
asserts the signature to keep it that way.

That choice forces a selection algorithm into SQL, and this is **not** a
translation of `src/features/exam-engine/selection`. Restating that selector in
PL/pgSQL would repeat precisely the mistake Amendment A declined to make for the
scorer: two implementations of one rule, drifting, with a parity test that can
only report divergence after it has been written. So the SQL algorithm is a
different and deliberately smaller one, named `fixed_scope_seeded.v1` and pinned
under that name on every session it creates. Its whole definition is: every
non-retired, currently-published, scoreable item in the requested scope, ordered
by `md5(seed || content_hash)`, first N.

What that gives up, stated plainly: it is blueprint-blind, difficulty-blind and
skill-blind, where the configurator's selector is none of those. A signed-in
sitting created on the target model today would therefore be a *worse-composed*
paper than the same request on the legacy path. That is acceptable only because
the flag is off and Phase 3 replaces this with form- and blueprint-driven
selection before any learner sees it — and it is survivable across that change
because each session records the algorithm that actually produced it, so
sessions created under `fixed_scope_seeded.v1` remain interpretable rather than
being retroactively described as blueprint-driven.

The join to `item_answer_versions` in the selection is load-bearing rather than
incidental: an item with no answer row cannot be scored, and allocating one
produces a sitting that can be sat and never marked. Unscoreable content is not
eligible content.

### B2. The cutover flag lives in the database, not only in the application

Spec §12.7 step 6 requires a *server-side* feature flag to choose the storage
model for a newly created session. An environment variable read by the Next
server satisfies the letter of that and not the substance: `create_assessment_session`
must be granted to `authenticated` for the application to call it at all (the
app connects with the learner's own JWT), so PostgREST exposes it to every
signed-in client directly. A flag that lived only in application code would make
"the target model is off" true of our routes and false of the database.

So `platform_flags.target_session_model` is the authoritative switch, read by the
function itself, and `src/server/assessment/storage-model.ts` is the second of
two gates rather than the only one. Both ship off. Disabling either stops new
target-model sessions.

The read function is deliberately **not** gated on the flag. §12.7's rollback
rule is that a session never changes storage model and sessions already created
on the target model complete there; a read that switched off with the flag would
strand exactly the sittings that rule exists to protect.

### B3. A consequence worth recording: grants without policies are silent

The least-privilege sweep for the scoring role asserted its grants and passed,
and scoring still read nothing. `20260812110000` granted `SELECT` on
`assessment_sessions` and created no `SELECT` **policy** for the role; the
table's existing policies are all `to authenticated`. Under RLS that is not a
narrower permission, it is zero rows — and a scoring module that reads no session
is indistinguishable from one reading a session that does not exist. It was
caught by `tests/rls/assessment-scoring.test.ts`, which exercises the module
through a real connection as the role, and not by the grant sweep, which cannot
see the difference. Both halves are needed; neither is sufficient.

## Amendment C (2026-08-13, Phase 2 step 6): one authoritative cutover flag, in the database

Amendment B2 established that the cutover switch has to live in the database.
This amendment makes it the **only** switch, resolves the contradiction with
ADR-005 §2, and defines the cohort.

### C1. The contradiction, and why the database wins

ADR-005 §2 specified an environment variable and said the flag is "deliberately
not a database table". Amendment B2 put it in a table. Both were accepted, the
code followed B2, and for a while the repository documented two different
answers to one question — which is worse than either answer, because a reader
cannot tell which is load-bearing.

It resolves in favour of the database, and not as a preference.
`create_assessment_session` is granted to `authenticated`, because the
application calls it with the learner's own JWT; PostgREST therefore exposes it
to every signed-in client. A cohort held in the Next server's environment governs
what our *routes* do. It cannot govern what the database does when someone calls
the function directly, and "the routing decision is enforced" is exactly the
property that must survive that call. Only a flag the function itself can read
gives it.

ADR-005 §2's stated reason for avoiding a table — that a client could observe it
— does not apply: `platform_flags` has RLS on, no policy, and no `anon`/
`authenticated` privileges, so no client can read it. *In the database* and
*client-readable* are independent properties; the original clause conflated them.

### C2. The one authoritative source

`platform_flags.target_session_model`, plus the cohort attached to it:

| `enabled` | `cohort_mode` | Effect on a NEW session |
| --- | --- | --- |
| `false` (shipped default) | any | Legacy, for everyone. The master kill switch. |
| `true` | `off` (default) | Legacy, for everyone. |
| `true` | `student_ids` | Target model for students listed in `assessment_cutover_cohort`; legacy for everyone else. |
| `true` | `all` | Target model for every student. |

`public.session_storage_model_for(uuid)` is the single predicate that reads that
table and returns `'legacy'` or `'version_pinned'`. `create_assessment_session`
calls it with `auth.uid()` and refuses when the answer is `legacy`, so an
out-of-cohort learner calling the RPC directly gets `MM210` rather than a target
session. The application asks the same predicate through
`public.session_storage_model_for_caller()` so that app and database cannot
disagree — there is one answer, computed in one place.

### C3. The surviving environment variable is withhold-only

`ASSESSMENT_TARGET_MODEL_DISABLED` remains, deliberately narrowed. It can only
**withhold** the target path: when set, our routes create legacy sessions no
matter what the database says. It can never grant the target path, and it can
never override the database gate — a request that reaches the RPC is judged by
the RPC.

That asymmetry is the whole point of keeping it. An operator who needs to stop
target-model creation *right now*, without a database connection, has a lever
that is safe in the only direction an emergency lever is ever needed. A lever
that could also turn the feature *on* would be a second source of truth, which is
what this amendment exists to remove.

Three names for one flag was the failure mode. There is now one flag
(`platform_flags.target_session_model`), one predicate
(`session_storage_model_for`), and one kill switch that subtracts and never adds.

### C4. `storage_model` is recorded on the session, not inferred

ADR-005 §1 argued that presence is the discriminator — a sitting has either an
`exam_sessions` row or an `assessment_sessions` row — and that a `storage_model`
column is therefore unnecessary. That argument is still correct as far as it
goes, and the column added here is, on the target table, true by construction.

It is added anyway, for two reasons that the inference does not give. It makes
the routing decision an explicit, immutable fact on the row rather than something
re-derived by whichever reader is asking, which matters when step 7 introduces a
dispatcher whose whole job is answering "which model is this session on" — an
inference by table-existence probe is a query that can be got wrong, and a column
with a check constraint cannot. And it gives the immutability something to bind
to: `assessment_sessions_transition_guard` now refuses any change to it, so "a
session never changes storage model" is enforced by the schema rather than
asserted by this document.

The redundancy is real and is accepted deliberately. A column that can only hold
one value is a weak record; a column that can only hold one value *and cannot be
changed* is the enforcement point for ADR-005 §1's central invariant.

### C5. The production cohort stays empty until step 7

This step wires and proves the mechanism. It does not enable a real cohort, and
the migration ships `enabled = false`, `cohort_mode = 'off'` and an empty cohort
table.

The reason is not caution for its own sake: a target-model session is not fully
readable yet. §12.7 step 7 is where the transition-period read dispatch lands, so
until it does, a learner routed to the target model would create a sitting that
results, history and the parent/teacher surfaces cannot display. Enabling a
cohort before then would strand real learners in exactly the way this sequence is
designed to prevent.

## Amendment D (2026-08-14, Phase 2 step 7): one candidate DTO, and where the answer-key discriminant lives

Step 7's read dispatch has to return a DTO a client cannot tell the model from
(§12.7 step 7, and §17.1's rule that a learner sees candidate content only).
Since §12.7 also requires the legacy path to be unchanged for legacy sessions,
"identical shape" cannot be achieved by changing the legacy contract. The target
model has to produce the existing one: `CandidateQuestion`.

### D1. The blocker, and why it is not a mapping problem

`CandidateQuestion.answerKind` is the answer key's discriminant — `single_option`,
`manual`, `text`, and ten others. The legacy path gets it in
`toCandidateQuestion`, which reads the compiled bank's authored question. The
target path reads `item_versions`, and Phase 1's projection put the key in
`item_answer_versions` without ever copying the discriminant across.

It cannot be derived from `question_type`. `question.schema.ts`'s own
`compatibleAnswerKinds` map is the evidence: `short_answer` admits `text` **or**
`manual`, and `reading_comprehension` admits four kinds. Guessing gets the
short-answer case wrong half the time, and that case decides whether a learner
is shown the "reviewed by a marker" notice — i.e. whether they are told their
answer is not scored yet.

### D2. Rejected: read the discriminant inside `get_assessment_session`

The smallest change would have been a join to `item_answer_versions` returning
`answer_key->>'kind'` and never the key. It is rejected.

Amendment A moved scoring into its own least-privilege role precisely so that no
application-callable function reads answer rows, and stated the boundary as "the
role and the module, not the function signature". A `SECURITY DEFINER` function
granted to `authenticated` that touches `item_answer_versions` is a third path to
answer data no matter how narrow its select list, and the next person to edit it
would be editing a function that already has the answer table in scope. The
column list is not the boundary.

### D3. The decision: the discriminant is candidate metadata, and lives in the candidate row

`item_versions.answer_kind`, next to `prompt` and `candidate_content`.

This is not a compromise to get around D2 — it is where the field belonged. The
discriminant is already learner-visible: `candidate-question.ts` says so in as
many words ("knowing a question is multiple-choice doesn't reveal which option is
correct") and the legacy path has been shipping it to browsers since v1. A field
every candidate is entitled to see was filed with the answers by omission, not by
decision.

- Backfilled from the existing answer rows in the same migration, so no
  re-projection is needed and no content hash moves. `contentHashOf` hashes the
  authored question, not the projected row, and the projection's insert is
  `on conflict (content_hash) do nothing`, so a re-run would not have updated
  existing rows anyway.
- `projectQuestion` emits it for every newly projected row, and
  `runtimeContentVersionSchema` — which is `.strict()` — requires it, so a
  projection that forgets it fails at the contract rather than at a learner.
- Nullable, because the schema permits an `item_version` with no answer row at
  all. `get_assessment_session` raises rather than serving an item whose kind is
  unknown: an unrenderable paper is worse than a refused one, and the refusal is
  loud where a wrong renderer is silent.

### D4. The same argument, applied to everything else the DTO promises

`answerKind` was not the only field filed in the wrong place. Working through
what a target-model paper actually has to produce turned up four more, and every
one of them fails the same test — candidate-visible, shipped to browsers by the
legacy path since v1, and absent from the projection:

- `minWords` / `maxWords`, instructions to the candidate that happen to live on
  the `manual` answer key. Projected as columns beside `answer_kind`.
- `metadata.strand`, `metadata.topic`, `metadata.tags`. These could not be
  backfilled in SQL at all — they exist nowhere in the database, only in the
  authoring bank — so `projection:apply` gained an update pass keyed on
  `content_hash` that fills exactly those three and nothing else. A general
  update-from-bank pass would make projected content mutable, which is what
  ADR-003's immutable versioning forbids.

Two fields need no column. A row is projected only from published content, so
`status = 'published'` is a fact about any served item; and `origin` is already
on `public.items`.

The alternative was a mapper that filled `strand` with a placeholder, which
would have put fabricated taxonomy on a real child's paper — the same class of
mistake as ADR-005 §4's fabricated exposure ledger, and a DTO that is identical
in shape but not in provenance is the wrong kind of identical.

What is **not** closed is on the session rather than the item, and is recorded in
ADR-005 Amendment A5: the normalized model has nowhere to put
`current_question_index` or `flagged_question_ids`, so a resumed target-model
sitting restores every answer and lands on question one with no flags.

> **CLOSED (2026-08-15, Gate A item A1) by `20260816090000`** —
> `public.session_ui_state`, session-scoped rather than per-response, with the
> flags keyed on served items. See ADR-005 Amendment A5 for the reasoning; this
> paragraph is left in place because it is what a reader following D4 will reach
> for, and a sentence that describes a closed gap as open is worse than none.
