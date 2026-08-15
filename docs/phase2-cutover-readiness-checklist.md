# Phase 2 — Cutover Readiness Checklist

> Status: living checklist. Owner: architect.
> Purpose: the single list of what must close before (A) a real cohort is opened onto
> the target session model, and (B) legacy writes are closed (§12.7 step 9 — the point
> of no easy return). Nothing flips until the relevant gate is fully green.

## How to read this

Two gates, in order. **Gate A** (cohort-open) is the safety gate: it must be fully
closed before a single real student is routed to the target model, because a target
sitting must work *and be safe* end-to-end. **Gate B** (close legacy writes) is
additional and comes only after a cohort is open, verified, and legacy is drained.

The cohort ships `enabled=false, cohort_mode='off'` and every item below is why it must
stay that way for now. Each open item names the concrete test that closes it — "done"
is the test passing, not a claim.

---

## Gate A — Cohort-open readiness (before any real student on target)

| # | Item | Why it blocks cohort-open | Status | Closing evidence |
| --- | --- | --- | --- | --- |
| A1 | Resume UI state — `current_question_index` + `flagged_question_ids` | A resumed target sitting restores answers but lands on question one with no flags (ADR-005 A5; the resume migration's own comment). A child mid-exam loses their place. | **Done** (`20260816090000`) | `session_ui_state`, written by `commit_assessment_responses` and read by `get_assessment_session`; `tests/rls/assessment-session-resume-state.test.ts` (15 cases) — sit, flag, leave, resume → same index, same flags; plus stale-autosave, foreign-item, out-of-range, terminal-lock, privilege and erasure cases. |
| A2 | Marking write path for target sittings | Teachers can read a target sitting through the shared views, but the write records against `essay_marks.attempt_id`; a target sitting has no attempt, so a queued essay can't be cleared. | **Done** (`20260816100000`) | `record_manual_mark` + `get_manual_review_response`; the legacy-origin filter removed from the queue read; `tests/rls/manual-marks-write-path.test.ts` (19 cases) — a target essay is marked and clears the queue, teacher-of-another-student → MM217, anon → 42501, ceiling from the pinned item version, backfill copy refused. |
| A3 | Assignment linkage for target sittings | `assignments.attempt_id` has no target-model counterpart, so a target sitting cannot be linked to an assignment at all. | **Done** (`20260816110000`) | `assignment_students.session_id` + `link_assessment_session_to_assignment`; `tests/rls/assignment-target-linkage.test.ts` (13 cases) — assign → sit on target → score attributed once, legacy `attempt_id` scoring unchanged, and the double-count refused from both sides and against a backfill copy. |
| A4 | Erasure operational | `erase_student` exists and is proven, but is executable by nobody — §17.5 step 1 requester verification and an invocation path don't exist. A child on target could not actually be erased on request. | **Done** (`20260817090000`, `20260817100000`) — **for the two exam-data models named by `erase_student`; see the scope note below** | `erasure_requests` (admin-recorded, ticket-referenced) + `request_student_erasure`/`cancel_student_erasure` (admin-gated, immediate reversible revocation: `profiles.access_revoked_at`, `auth.users.banned_until`, live session/refresh-token rows deleted) + a 30-day window + `process_due_erasures`/`admin_trigger_due_erasures` (idempotent processor, `erase_student` still granted to nobody, reached only by ownership). `tests/rls/erasure-operational.test.ts` (24 cases, connect-as-role) — admin can request, non-admin/anon refused on all three functions incl. the worker directly, access revoked synchronously with the request, nothing erased before `execute_after`, a cancel inside the window restores access and the request is never executed, the processor is idempotent and touches only due requests, both-models erasure re-proven through this path, audit rows carry no person data. **Scope, honestly stated (external review #8's concern):** this closes the request/verification/invocation workflow and the two models `erase_student` already reaches. Telemetry, caches and exports are not built subsystems yet; logs and backup age-out are platform settings outside migration control; legal hold has no mechanism anywhere in the product. All four are named, not silently dropped — tracked as ADR-012 §7/§8 follow-ups and in Downstream below. |
| A5 | Approved retention / data schedule (§17.5) | Production use of children's data on the new model requires a product-owner-approved retention & erasure schedule. "Retain forever" is not a default. | **Done** — ADR-012 finalized, status `accepted` | The §17.5 default schedule adopted verbatim, explicitly flagged "adopted 2026-08-15, pending legal review; reconcile the 90-day backup-aging window with the actual DR retention policy before production." Deletion-over-de-identification, the minimal two-part audit (`erasure_requests` + `erasure_audit`), the admin-processed verification model and the 30-day grace are all recorded as decisions, not left implicit. Privacy owner: `TODO(owner)` — named as a gap for the product owner to fill, not guessed. |
| A6 | End-to-end target sitting proven | Individual steps are green, but no single test runs create → serve → respond → submit → score → results/history on one target sitting. | **Partial — DB/service, not HTTP** (see A9) | `tests/rls/target-sitting-end-to-end.test.ts` (11 ordered steps) — create under a test cohort → serve → respond → resume mid-way → finish → score **through the real `mindmosaic_scoring` module** → once in history, once in `resolved_sittings`, once in the admin totals → the essay marked and cleared → attributed to an assignment → still one identity in one model; and the cohort left empty with the flag off. **External-review caveat:** this runs at the DB/RPC + scoring-module level, NOT through the `/api/exam` HTTP routes — the product create/autosave/submit path is still legacy-only. Wiring it is A9. |
| A7 | Read dispatch + resolution rule | Reads must resolve one source per sitting, no client merge, no double-count of backfill copies. | **Done** (step 7/8) | Consistency test (history vs admin totals agree on identity), fence test (single source of the rule). |
| A8 | Cohort mechanism + boundary | The flag/predicate must be un-bypassable by a direct authenticated RPC call. | **Done** (step 6) | Boundary proof: out-of-cohort direct RPC → MM210, zero rows. |
| A9 | Target create/autosave/submit/score/review over HTTP | DB tests pass but a learner cannot complete a target sitting through the app: create returns `503 target_model_not_readable_yet`, autosave writes `exam_responses`, submit calls `record_exam_attempt`, and no production route imports the target scorer (external review #5). | **Open** | Origin-aware create/resume/autosave/submit/score/review routes; map public question IDs → immutable session-item IDs; target sessions stay on target storage for their whole lifecycle. HTTP-level test: create → resume → autosave → submit → score → review, plus rollback-to-legacy for new sessions without moving existing target sessions. |
| A10 | Published item-versions fully immutable | `reject_content_version_update` freezes 15 columns but NOT `answer_kind`/`source_strand`/`source_topic`/`source_tags`/`min_words`/`max_words` (added in `20260814090000` without extending the trigger), and the projection updates them in place — so a published version's semantics can drift from its own `content_hash`, uncaught (external review #2). | **Open** | Freeze every content/answer/source-scope/taxonomy/accessibility/provenance column (whole-row minus explicitly operational). Test: publish a row, UPDATE every column individually, assert only documented operational fields mutate. |
| A11 | Canonical subject/offering authority in target selection | The target selector compares the raw config `subject` to `source_subject` with none of `SUBJECTS_BY_FILTER`'s mapping, so a `language` paper (bank `language_conventions`) selects **zero** items; and it does not reject invalid style/year at the offering boundary (external review #7). | **Open** | Resolve allocation through the canonical mapping/offering shared by TS and SQL; validate style/year/subject before bank readiness. Test: every valid offering incl `language`, and direct-RPC rejection of e.g. NAPLAN Year 4. |
| A12 | Exact source-revision preservation | `load-manifests.ts` `Math.max(1, revision)` rewrites the 195 revision-0 manifests (and 33 revision-0 review bindings) to 1, so runtime provenance no longer matches the source verbatim (external review #4). | **Open** | Preserve `source_revision` incl 0; if runtime needs 1-based, store a separate `runtime_revision`. Test: round-trip revision-0 manifests + bindings through projection without transformation. |
| A13 | Global privilege hardening (promoted from Downstream) | `authenticated` holds `TRUNCATE` on ~8 real public tables and CRUD on `essay_marks`; RLS does not cover `TRUNCATE` (external review #1, original audit #3). | **Open** | Revoke `TRUNCATE` + unneeded `DELETE`/`REFERENCES`/`TRIGGER` from every app table; grant only operations public paths use. Catalog test: `anon`/`authenticated` hold no `TRUNCATE` on any real table and no unapproved writes. |
| A14 | Manifest-gate reconciliation | The projection admits 1,005 curated questions as `curated_git_authored` with no manifest; §7/§9.7 say manifest-only (external review #3) — a deliberate ADR-002/003 choice the spec text doesn't bless. | **Open — product-owner decision** | Either bless dual-provenance in the spec, or put curated content through the manifest process and require an explicit published state. |
| A15 | Config-pin reproducibility | Session config pins are placeholder text (`phase2-unblueprinted.v1`, `phase2-untaxonomised.v1`) with no immutable referent until Phase 3 (external review #6). | **Open — product-owner decision** | Accept text pins for a canary with documentation, or build minimal immutable config-version rows/snapshots + hashes now. |

**Gate A is green only when A1–A6 and A9–A15 close** (A7/A8 already done). The external
STOP-AND-FIX review added A9–A15 and downgraded A6 to DB/service-only; until every one
closes, the cohort must not open. A9–A13 are correctness/security blockers; A14–A15 are
product-owner decisions.

### What A1–A3/A6 closing does and does not change

The three write paths exist, are server-authoritative, and compose. **The cohort is
still empty and the flag still ships off** — closing these items removes the reasons a
cohort *could not* be opened; it is not a decision to open one. A4 and A5 remain, both
product-owner-gated, and Gate A is not green until they close.

Three things were deliberately left where they were:

- **The legacy write path is untouched.** `create_exam_session`, `record_exam_attempt`
  and the `exam_responses` autosave are byte-for-byte as they were, and the marking
  route's legacy branch still upserts `essay_marks` against the attempt. Asserted, not
  claimed: `src/tests/unit/teacher-marking-route.test.ts` fails if a legacy sitting ever
  reaches the target function.
- **The guest flow is untouched.** It has no server session and none of this reaches it.
- **`/api/exam/session` still refuses to create a target sitting** (`503
  target_model_not_readable_yet`). That branch is the create route's own seam and is
  unreachable while the cohort is empty; wiring it is part of opening a cohort, not part
  of closing these items.

---

## Gate B — Close legacy writes (§12.7 step 9 — point of no easy return)

Only after Gate A is closed, a cohort is open, verified, and legacy is drained.

| # | Item | Why | Status |
| --- | --- | --- | --- |
| B1 | No active legacy session remains | Legacy sessions must complete on the legacy path; you cannot revoke writes under an in-flight sitting. | Open — gated on drain |
| B2 | Every app writer uses target RPCs | `create_exam_session` / `record_exam_attempt` / `exam_responses` writes revoked only once nothing writes them. | Open — legacy write paths intentionally unchanged through step 8 |
| B3 | Residual `essay_marks` TRUNCATE + DELETE closed | Inventory flagged `essay_marks` still holds TRUNCATE and DELETE for `authenticated`; step 9 closes it. | Open — deferred to step 9 |
| B4 | Rollback artifacts + observation window | Legacy tables kept read-only for a defined window; rollback routes only new sessions back to legacy, never migrates a live session. | Open — step 9 |

---

## Downstream / tracked (not cohort-open blockers)

| Item | When | Note |
| --- | --- | --- |
| Backfill promotion | Step 10 | Backfill copies are read by nothing today (route-by-origin). Making them authoritative is a dated migration; step 5 proved they match, which is not the same as making them the source. |
| Contract / drop legacy tables | Step 10 | Only behind its own ADR, after reconciliation passes, rollback artifacts exist, and retention is honored. |
| Text version-pins → FKs | Phase 3 | `assessment_sessions` pins framework/blueprint/profile versions as text because those tables don't exist yet; convert to FKs when Phase 3 lands them, or §5.3 "pinned" is text-only. |
| TRUNCATE on the remaining public tables | Independent security | Audit finding #3: `authenticated` holds TRUNCATE on ~14 public tables; new Phase 2 tables are clean, `essay_marks` closes at B3, the rest wants its own revoke migration. Not cutover-gated but real. |
| Test-run completeness guard | Ongoing | The `verify-test-run.mts` guard must stay active on every CI job — it is what makes a silently-skipped suite fail instead of false-passing. Do not remove. |
| Full `npm test` completion | Release blocker | The whole suite times out (~124s, ~304s); the guard fixed the *RLS* suite's silent-skip but the full run still does not complete. Must finish reliably before any cutover proof is trustworthy. |
| Speculative Phase 4 / outbox tables | Defer or own now | `assessment_session_stages`, `stage_transitions`, `outbox_events` were deployed empty ahead of Phase 4, which §19.3 / Appendix B reject ("no producer/consumer"). Drop until an accepted Phase 4 ADR + atomic producer/consumer exist, or assign lifecycle/retention/cleanup/owner now (external review #9). |
| Marker-visible rubric on the target model | Before a cohort with essay content | A teacher marking a **legacy** sitting sees the authored rubric, read from the compiled bank. A **target** sitting's rubric lives in `item_answer_versions`, which no application-callable path may read (§17.1, ADR-006 Amendments A and D2) — so `get_manual_review_response` returns the prompt, the child's answer and the marks available, and no rubric. The marking screen says so rather than showing an empty panel. Closing it means deciding where a *marker-visible* rubric belongs — it is not candidate content, so ADR-006 D3's "move it to `item_versions`" answer does not apply — and not widening the function. Not a blocker while the cohort is empty; a blocker for any cohort whose papers contain manual-review items. |
| Assignment `status` is never advanced | Whenever assignments ship | Nothing has written `assignment_students.status` after the teacher's initial INSERT since the table was created, on either model. `20260816110000` deliberately did not make the linkage a status writer (there is no target submit route to advance it to `submitted`, so it would strand every completed assignment at `in_progress`); the learner-facing read derives `submitted` from the linked sitting instead. The teacher-facing read still shows the stored column. Pre-existing, surfaced here because A3 is the first thing to look at it. |
| Automated per-category retention enforcement | Before production, per ADR-012 §7 | ADR-012 adopts the §17.5 schedule and makes the erasure-request row of it executable (A4), but does not build a runner for the other rows: autosave/checkpoint buffers older than 30 days past a terminal sitting, interaction telemetry past 12 months, application/security logs past 90 days, idempotency records past their 24h–30d window. No sweep exists for any of them today. Building one before the schedule is claimed as *enforced* rather than merely *adopted* is the follow-up; ADR-012 §7 is explicit that a published, unexecuted schedule is a commitment, not a control. |
| Legal hold mechanism | Before any hold is needed | No mechanism exists to place, check or honor a legal hold anywhere in the product; `process_due_erasures` has no hold check to consult (ADR-012 §8). Acceptable pre-production only because no hold has ever been asserted. Whoever builds it must add a third `erasure_requests` status — a hold *suspends* a pending erasure rather than cancelling it — and make the processor skip held requests rather than erase them. |

---

## Already closed (proven), for confidence

- Session schema (2a), create/serve + least-privilege scoring role + isolated scorer (2b).
- Backfill idempotent, identity classification honest (0 version-pinned / 2 legacy_unversioned), shadow-verify clean and repeatable (3–5).
- Cohort flag single-authoritative in the DB, boundary-proven un-bypassable, storage_model immutable, rollback proven not to touch live sessions (6).
- Read dispatch by origin, single source per sitting, sitter-only paper access, no client merge (7).
- Every dependent read consumer on one shared SQL rule with per-audience grants; six admin views resolution-aware and regression-identical; erasure mechanism across both models proven; single-source fence test (8).
- The false-green test-worker flake root-caused and fixed; run-completeness guard active.
- The three target-model write paths — resume state, marking, assignment linkage — each
  server-authoritative (SECURITY DEFINER, fixed `search_path`, actor from `auth.uid()`,
  no client-supplied correctness, ceiling or identity), each connect-as-role tested, and
  proven to compose on one sitting end to end **at the DB/service level** (A1–A3, A6) —
  not yet through the product HTTP routes (A9), and pending the immutability, revision,
  selector-authority and privilege fixes the external review raised (A10–A13).
- Erasure is admin-invokable for the two exam-data models, with immediate reversible
  access revocation, a 30-day recovery window, an idempotent processor that never
  widens `erase_student`'s grant, and a minimal two-part audit — connect-as-role tested
  (A4). ADR-012 is finalized: the §17.5 schedule adopted pending legal review, the
  admin-processed model and 30-day grace recorded as decisions, and what is not yet
  enforced named rather than implied (A5).

### A4/A5 close; Gate A as a whole does not (yet)

A4 and A5 are the two items this pass was asked to close, and both are closed with the
evidence above. **They are not the only open items on Gate A.** This checklist now also
carries A6 (downgraded to DB/service-only) and A9–A15, added by a review pass that ran
concurrently with this one and is outside what this pass covers — a real subject/offering
mapping bug (A11), an immutability-trigger gap (A10), a revision-truncation issue (A12),
privilege hardening (A13), and two product-owner decisions (A14, A15). Saying "Gate A is
green" against this file as it now stands would be false; it isn't, until those close too.
The cohort stays empty regardless of any of this — that is unaffected by which Gate A
items are open, and opening one remains a separate, explicit decision either way.
