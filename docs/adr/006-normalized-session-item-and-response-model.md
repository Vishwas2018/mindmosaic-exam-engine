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
| The answer table stays unreadable, and scoring is its only reader | `tests/rls/assessment-scoring.test.ts` — direct select is `42501`; the function returns outcomes only |
| Scoring succeeds only for versions allocated to the caller's session | Same suite: another student's session raises `MM203` |
| SQL scoring equals TypeScript scoring | `src/tests/unit/scoring-parity.test.ts` over the whole bank |
| A revised item does not change an old sitting | `tests/rls/assessment-scoring.test.ts` replay case |
| A blank manual item is unanswered, an attempted one is manual_review | Same suite, three cases (blank/answered/marked) |
| A stale autosave cannot overwrite a newer answer | `tests/rls/assessment-session-model.test.ts` sequence case |
| A submitted session refuses further response writes | Same suite — `MM205`, plus the owner-level trigger case |
