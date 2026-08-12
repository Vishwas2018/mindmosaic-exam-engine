# ADR-005: Legacy `exam_*`/`essay_marks` cutover, backfill, rollback and retirement

- **Status:** accepted
- **Date:** 2026-08-12
- **Spec:** §12.7 (the ten-step runbook), §19.2, §21 Phase 2
- **Phase:** 2
- **Input contract:** [`phase0-legacy-session-inventory.md`](phase0-legacy-session-inventory.md)

## Context

`exam_sessions`, `exam_responses`, `exam_attempts` and `essay_marks` hold real
learner data and were hardened in August 2026 by `20260811090000`–`20260811093000`:
two SECURITY DEFINER write RPCs, direct `INSERT` revoked, autosave locked after
submission, residual `TRUNCATE`/`UPDATE`/`DELETE` revoked. They work. The reason
to replace them is not that they are broken but that they cannot be made
version-pinned: `exam_sessions.selected_question_ids` is a `text[]` of bare
question IDs resolved at scoring time against whichever compiled bank the running
deployment happens to have, so editing a question silently re-means every
historical attempt that used it (ADR-003 Context).

The migration hazard is specific and well known: a table swap that dual-writes
produces two authoritative records for one sitting, and the moment they diverge
there is no principled way to say which one is the learner's actual result.
Spec §12.7 therefore mandates cohort-gated expand–backfill–cutover–contract, and
this ADR fixes the parameters that runbook leaves open.

The repository audit that produced `20260811093000` also left one finding
outstanding, recorded in the inventory §7: `authenticated` still holds `TRUNCATE`
on `essay_marks` and on every other public table the migration did not name. RLS
cannot cover `TRUNCATE` — there is no per-row filter to apply — so the grant is
the only control. A cutover that creates target tables under the same
`auto_expose_new_tables` default would carry that defect into the new model.

## Decision

### 1. One session, one storage model, for life

`assessment_sessions.storage_model` is not needed as a column on the target
model, because presence *is* the discriminator: a sitting has either an
`assessment_sessions` row or an `exam_sessions` row, never both. What is needed
is the negative guarantee, and it is enforced structurally rather than by
convention:

- The target create RPC never writes `exam_sessions`, and the legacy RPC never
  writes `assessment_sessions`. Neither function references the other model's
  tables at all, so a dual-write would have to be a new code path, not a slip.
- `assessment_sessions.legacy_session_id` is `unique` and `null` for natively
  created sessions. A backfilled row carries it; a live target session cannot
  acquire one, because the create RPC does not accept the parameter.
- Nothing in the schema or the application copies a session between models —
  not at cutover, not at rollback, not on resume.

**A session's storage model is decided exactly once, at creation, and never
revisited.** This is the invariant the rest of this ADR protects.

### 2. The cohort flag is server-side and creation-only

`ASSESSMENT_TARGET_MODEL_COHORT` is read in server code at session creation and
nowhere else. It accepts:

| Value | Meaning |
| --- | --- |
| `off` (default) | Every new session is created on the legacy model. |
| `student_ids:<uuid>,<uuid>` | Named students create on the target model. |
| `all` | Every new session is created on the target model. |

It is deliberately **not** a database table and **not** client-readable: a flag a
client can see is a flag a client can be observed to disagree with, and the
storage model is not a fact the client has any use for. It is deliberately not
consulted on read, submit, resume, or autosave either — the session's identity
already answers "which model", and a flag consulted twice is a flag that can
answer differently the second time.

Rollback is `ASSESSMENT_TARGET_MODEL_COHORT=off`. That routes *new* sessions back
to legacy. Sessions already created on the target model stay there and complete
through the target path. **Rollback never copies a live session between models**
— an in-flight sitting is exactly the thing that cannot be moved without losing
either its served order or its autosave state.

### 3. Backfill covers terminal data only, idempotently, under unique legacy IDs

Only terminal legacy data is backfilled: a session with an `exam_attempts` row,
or one already past `expires_at`. An active legacy session is never copied
(decision 1), so the backfill's own selection predicate is the first line of that
defence, not just the RPC's.

| Source | Target | Unique legacy key |
| --- | --- | --- |
| `exam_sessions` | `assessment_sessions` | `legacy_session_id` unique |
| `exam_attempts` | `assessment_results` | `legacy_attempt_id` unique |
| `exam_responses` / attempt response snapshot | `session_responses` | `(session_id, session_item_id)` unique, plus `legacy_source` provenance |
| `essay_marks` | `manual_marks` | `legacy_essay_mark_id` unique |

Every insert is `on conflict do nothing` against those constraints, so the
backfill is re-runnable and a second run inserts zero rows. That is asserted, not
assumed: the reconciliation script runs the backfill twice and fails if the
second pass changes any count (spec §22, "Backfill twice idempotently").

The attempt's own `responses` snapshot is preferred over the `exam_responses`
autosave row where both exist. The snapshot is what was actually submitted and
scored; the autosave row is a buffer that may lag it.

### 4. Content identity is classified by evidence, and the honest answer is `legacy_unversioned`

`assessment_session_items` rows are created for a backfilled session **only when
each legacy question ID binds to an exact imported item revision** — meaning the
legacy row carries evidence of the content that was served, not merely a code
that still resolves to something today.

It does not. `selected_question_ids` is bare IDs with no revision and no content
hash (inventory §1). A question ID matching an `items.item_code` proves the code
still exists; it does not prove the learner saw that revision. So:

- Every backfilled session is labelled `content_identity = 'legacy_unversioned'`.
- No `assessment_session_items` rows are created for it. A ledger of items whose
  version cannot be established would be a fabricated ledger, and §12.4 calls
  that table "the authoritative exposure ledger" — authoritative records must not
  be invented.
- The original `exam_attempts.result` jsonb is preserved verbatim on
  `assessment_results.legacy_result` for history.
- **`legacy_unversioned` results are never recomputed.** The scoring function
  refuses to run against a session with no served-item ledger; there is nothing
  to score it from, and re-deriving a score from today's bank is precisely the
  drift this phase exists to end.

The classifier is written to look for the evidence rather than to hardcode its
absence, so the day a legacy row does carry a hash it binds instead of being
labelled. Today it reports zero bound rows, and that number is in the
reconciliation report.

### 5. Shadow verification is a gate, not a report

Cutover does not begin until `npm run cutover:verify` is clean. It compares, for
every backfilled sitting:

ownership (`student_id`) · session creation and expiry timestamps · submission
timestamp · response count and per-question response values · result totals
(awarded marks, available marks, percentage, per-question statuses) · manual mark
count and awarded values · row counts on all four source/target pairs ·
`legacy_unversioned` count against the count of sessions with no served-item
ledger (these must be equal — a session that is neither pinned nor labelled is
the failure this check exists to find).

**Any unexplained mismatch blocks cutover.** "Explained" means recorded in the
report with a reason, not silenced.

### 6. Reads dispatch by identity, in server code

During the transition every read service resolves the target model first and the
legacy model second, keyed on the session/attempt identity it was given. No
client queries both and merges: a client-side merge makes the client the
arbiter of which record is authoritative, which is the dual-write failure
wearing a different hat.

A read-only union view is permitted by §12.7 step 7 and is **not** used here.
The two models' result shapes differ (`assessment_results` columns versus
`exam_attempts.result` jsonb), so a union would need a jsonb-shaping expression
in SQL that duplicates the TypeScript mapper — two implementations of one
mapping, drifting.

### 7. Workflow move order

Dependent workflows move in this order, each verified on the target model before
its legacy reader is removed:

1. Results and history (learner-facing)
2. Student dashboard, engagement, assignments
3. Parent dashboard
4. Teacher class data, marking queue, marking
5. Assignment linkage (`assignments.attempt_id`)
6. The six admin views
7. Exports and deletion/erasure workflows

The admin views are called out because **a file-grep misses them**:
`src/server/admin-analytics.ts` never names the four tables, and the dependency
is entirely inside `20260718120000_admin_aggregate_views.sql`. All six —
`admin_platform_totals`, `admin_weekly_activity`, `admin_score_distribution`,
`admin_subject_performance`, `admin_skill_performance`, `admin_question_stats` —
read `exam_attempts` (and `exam_sessions` for platform totals) behind
`is_admin()`. Re-pointed rather than duplicated: a second set of admin views over
the target model would report two different platform totals.

### 8. Legacy writes close only when drained

Step 9 requires all of:

- No `exam_sessions` row without an `exam_attempts` row and with
  `expires_at > now()` — i.e. no active legacy session.
- Every application writer on the target RPCs (verified by inventory re-grep, not
  by assertion).
- The reconciliation report clean on the current data.

Then, in one migration: revoke `execute` on `create_exam_session` and
`record_exam_attempt` from `authenticated`; revoke `insert`/`update` on
`exam_responses` from `authenticated`; and **revoke the residual `TRUNCATE` on
`essay_marks`** that `20260811093000` never covered (inventory §7). The legacy
tables stay `SELECT`-able for a defined observation window.

The drain condition is checked by the migration itself and raises rather than
proceeding, so applying it to an environment with a live legacy session fails
loudly instead of stranding a learner mid-exam.

### 9. Retirement requires a further ADR

Step 10 — dropping or archiving `exam_sessions`, `exam_responses`,
`exam_attempts`, `essay_marks` — is **not authorized by this ADR**. It requires a
successor ADR that records: the reconciliation report at the time of retirement,
where the rollback artifact lives and how it is restored, how ADR-012's retention
and erasure schedule is honoured for the archived copy, and the observation
window actually observed. This ADR authorizes expand, backfill, cutover and the
closing of writes. Nothing destructive.

## Consequences

- Two storage models coexist for the length of the transition, and every read
  service pays a second lookup for sessions not found in the target model. That
  is the price of never dual-writing; it is bounded and it ends at step 10.
- Historical sittings do not become version-pinned. They cannot — the evidence
  was never recorded. They become *honestly labelled*, which is the strongest
  true claim available, and the product must not present a `legacy_unversioned`
  result as reproducible.
- The guest flow is untouched. It has no server-side session, touches none of the
  four tables, and gains no server-side representation (ADR-006 §8).
- `assignments.attempt_id → exam_attempts(id)` outlives the cutover as a
  referential dependency and is re-pointed in workflow move 5, not before.

## Alternatives considered

**Dual-write both models and reconcile nightly.** Rejected by §12.7 and on its
own merits: two authoritative records that can diverge, with a reconciliation job
that has to pick a winner. The situation where they disagree is exactly the
situation where the learner disputes their score.

**Migrate active sessions at cutover.** Rejected. An in-flight sitting's autosave
state and served order would have to be reconstructed from a model that never
recorded served order. A learner mid-exam is the worst possible subject for a
best-effort reconstruction.

**Add version pinning to `exam_sessions` in place.** Rejected: it makes the
legacy table a partial target model, so the repository ends with two half-models
and no cutover boundary. The normalized model is also what §12.4's exposure
ledger and Phase 4's stage sealing need; retrofitting them onto a `text[]` is
not a smaller change, only a less honest one.

**Recompute legacy results against the current bank to "upgrade" them.**
Rejected as fabrication. It would produce a version-pinned-looking row whose
score was computed from content the learner may never have seen.

## Verification

| Claim | Where it is proved |
| --- | --- |
| Backfill is idempotent | `scripts/cutover-verify.mts` runs it twice; a non-zero second-pass delta fails |
| Every mapped row matches | Same script, §5's comparison list |
| No dual-write is possible | `tests/rls/assessment-sessions.test.ts` — the target RPC leaves `exam_sessions` untouched and vice versa |
| One legacy and one target session can complete during cutover | `src/tests/unit/session-model-dispatch.test.ts` |
| `legacy_unversioned` rows are never recomputed | Scoring function raises `MM204` for a session with no served-item ledger |
| No target table grants learners a write | `tests/rls/assessment-session-model.test.ts`, including a `TRUNCATE`-revoke case per table |
| Legacy writes cannot close while a session is live | The step-9 migration's own drain check |
