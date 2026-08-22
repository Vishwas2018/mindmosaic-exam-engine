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

**2026-08-21 overnight run:** closed A16 (new, additional hardening, does not
gate Gate A closure) and extended A4's whole-graph erasure proof. That run's
own config-version task was deliberately skipped rather than guessed at — a
genuine conflict between building `framework_versions`/`blueprint_versions`/
`assessment_profile_versions` now and ADR-006 §1's Phase-3 deferral — and
recorded two ways forward for a later pass to pick between (see
`OVERNIGHT-RUN-REPORT.md`'s Task 2). **A15 is now closed** (`20260822100000`)
via the second of those two: content-addressing the existing placeholder pin
strings themselves, which needed no product-owner call and does not build the
deferred tables. **A14 is now also closed** — spec v1.3 states the dual
content-provenance model ADR-002/003 Amendment A already decided and
implemented in Phase 1; see ADR-002 Amendment C. **Gate A is now
engineering-green: A1–A16 all carry closing evidence.**

---

## Gate A — Cohort-open readiness (before any real student on target)

| # | Item | Why it blocks cohort-open | Status | Closing evidence |
| --- | --- | --- | --- | --- |
| A1 | Resume UI state — `current_question_index` + `flagged_question_ids` | A resumed target sitting restores answers but lands on question one with no flags (ADR-005 A5; the resume migration's own comment). A child mid-exam loses their place. | **Done** (`20260816090000`) | `session_ui_state`, written by `commit_assessment_responses` and read by `get_assessment_session`; `tests/rls/assessment-session-resume-state.test.ts` (15 cases) — sit, flag, leave, resume → same index, same flags; plus stale-autosave, foreign-item, out-of-range, terminal-lock, privilege and erasure cases. |
| A2 | Marking write path for target sittings | Teachers can read a target sitting through the shared views, but the write records against `essay_marks.attempt_id`; a target sitting has no attempt, so a queued essay can't be cleared. | **Done** (`20260816100000`) | `record_manual_mark` + `get_manual_review_response`; the legacy-origin filter removed from the queue read; `tests/rls/manual-marks-write-path.test.ts` (19 cases) — a target essay is marked and clears the queue, teacher-of-another-student → MM217, anon → 42501, ceiling from the pinned item version, backfill copy refused. |
| A3 | Assignment linkage for target sittings | `assignments.attempt_id` has no target-model counterpart, so a target sitting cannot be linked to an assignment at all. | **Done** (`20260816110000`) | `assignment_students.session_id` + `link_assessment_session_to_assignment`; `tests/rls/assignment-target-linkage.test.ts` (13 cases) — assign → sit on target → score attributed once, legacy `attempt_id` scoring unchanged, and the double-count refused from both sides and against a backfill copy. |
| A4 | Erasure operational | `erase_student` exists and is proven, but is executable by nobody — §17.5 step 1 requester verification and an invocation path don't exist. A child on target could not actually be erased on request. | **Done** (`20260817090000`, `20260817100000`) — **for the two exam-data models named by `erase_student`; see the scope note below** | `erasure_requests` (admin-recorded, ticket-referenced) + `request_student_erasure`/`cancel_student_erasure` (admin-gated, immediate reversible revocation: `profiles.access_revoked_at`, `auth.users.banned_until`, live session/refresh-token rows deleted) + a 30-day window + `process_due_erasures`/`admin_trigger_due_erasures` (idempotent processor, `erase_student` still granted to nobody, reached only by ownership). `tests/rls/erasure-operational.test.ts` (24 cases, connect-as-role) — admin can request, non-admin/anon refused on all three functions incl. the worker directly, access revoked synchronously with the request, nothing erased before `execute_after`, a cancel inside the window restores access and the request is never executed, the processor is idempotent and touches only due requests, both-models erasure re-proven through this path, audit rows carry no person data. **Scope, honestly stated (external review #8's concern):** this closes the request/verification/invocation workflow and the two models `erase_student` already reaches. Telemetry, caches and exports are not built subsystems yet; logs and backup age-out are platform settings outside migration control; legal hold has no mechanism anywhere in the product. All four are named, not silently dropped — tracked as ADR-012 §7/§8 follow-ups and in Downstream below. **Whole-graph proof added (overnight run, no schema change):** `tests/rls/resolution-rule.test.ts` describe block 5 seeds a real row in every table external review #8 could plausibly mean and the original suite never checked directly — `assignment_students`, `class_students`, `manual_marks`, `essay_marks`, `session_ui_state`, `assessment_cutover_cohort` — then asserts all are empty (plus `assessment_session_stages`/`stage_transitions`/`outbox_events`, unused today but correctly cascade-wired) after `erase_student` runs, with a fixture self-check that fails loudly if any surface was accidentally seeded empty rather than genuinely proven cleared. A second, durable test queries `information_schema` for every live FK to `profiles(id)` and fails if a future migration adds one this suite does not yet classify as child-identity or actor — turning "we checked once" into "this cannot silently regress." A live source audit (`grep`, no `create table` match anywhere in `supabase/migrations/`) confirms telemetry/caches/exports/search-index tables genuinely do not exist yet, so there was nothing new to seed there; the backup-age-out and platform-log gaps remain exactly as stated above, unchanged and not newly claimed as closed. |
| A5 | Approved retention / data schedule (§17.5) | Production use of children's data on the new model requires a product-owner-approved retention & erasure schedule. "Retain forever" is not a default. | **Done** — ADR-012 finalized, status `accepted` | The §17.5 default schedule adopted verbatim, explicitly flagged "adopted 2026-08-15, pending legal review; reconcile the 90-day backup-aging window with the actual DR retention policy before production." Deletion-over-de-identification, the minimal two-part audit (`erasure_requests` + `erasure_audit`), the admin-processed verification model and the 30-day grace are all recorded as decisions, not left implicit. Privacy owner: `TODO(owner)` — named as a gap for the product owner to fill, not guessed. |
| A6 | End-to-end target sitting proven | Individual steps are green, but no single test runs create → serve → respond → submit → score → results/history on one target sitting. | **Done** (`tests/rls/target-sitting-end-to-end.test.ts` + A9's `755520c`) | `tests/rls/target-sitting-end-to-end.test.ts` (11 ordered steps) — create under a test cohort → serve → respond → resume mid-way → finish → score **through the real `mindmosaic_scoring` module** → once in history, once in `resolved_sittings`, once in the admin totals → the essay marked and cleared → attributed to an assignment → still one identity in one model; and the cohort left empty with the flag off. **Originally DB/service-only** — this suite runs at the DB/RPC + scoring-module level, not through the `/api/exam` HTTP routes, which were legacy-only at the time this closed. **HTTP gap closed by A9** (`755520c`): `tests/rls/target-http-lifecycle.test.ts` (14 cases) drives the real route handlers for create → resume → serve → autosave → submit → score → review on one target sitting, proving the same composition is reachable through the actual application surface a learner uses, not only through direct RPC calls. Between the two suites, the full flow this item names is proven both at the DB/service level (incl. history, `resolved_sittings`, admin totals, essay marking, assignment attribution) and over HTTP (incl. idempotent retry and no-migration-on-rollback). |
| A7 | Read dispatch + resolution rule | Reads must resolve one source per sitting, no client merge, no double-count of backfill copies. | **Done** (step 7/8) | Consistency test (history vs admin totals agree on identity), fence test (single source of the rule). |
| A8 | Cohort mechanism + boundary | The flag/predicate must be un-bypassable by a direct authenticated RPC call. | **Done** (step 6) | Boundary proof: out-of-cohort direct RPC → MM210, zero rows. |
| A9 | Target create/autosave/submit/score/review over HTTP | DB tests pass but a learner cannot complete a target sitting through the app: create returns `503 target_model_not_readable_yet`, autosave writes `exam_responses`, submit calls `record_exam_attempt`, and no production route imports the target scorer (external review #5). | **Done** (`755520c`) | Origin-aware `src/app/api/exam/session/**` routes dispatch by `content_identity` through `src/server/assessment/target-session-writes.ts` (public question ID ↔ immutable session-item ID mapping, served-item ledger loading, `ExamResult` reshaping); the legacy branch is untouched below the dispatch. `tests/rls/target-http-lifecycle.test.ts` (14 cases) drives the real route handlers against Postgres for create → resume → autosave → submit → score → review on one target sitting, plus rollback-to-legacy for new sessions without moving existing target sessions. **`pendingManualMarks` source fix:** the same commit corrects `answer-access.ts`'s `summarise()`, which summed `manualReview.length` (an item count) where legacy `ExamResult` has always summed `availableMarks` — `tests/rls/pending-manual-marks-consistency.test.ts` (4 cases) proves the scored summary, the stored `assessment_results` column, `resolved_sittings`' history read and the HTTP result all now agree with legacy for a manual item worth more than one mark, closed together with two dependent-fixture corrections in `tests/rls/backfill-legacy-sessions.test.ts` and `tests/rls/target-sitting.ts`'s shared `scoreAndSubmit` helper, whose own `pending_marks` SQL was count-shaped. |
| A10 | Published item-versions fully immutable | `reject_content_version_update` freezes 15 columns but NOT `answer_kind`/`source_strand`/`source_topic`/`source_tags`/`min_words`/`max_words` (added in `20260814090000` without extending the trigger), and the projection updates them in place — so a published version's semantics can drift from its own `content_hash`, uncaught (external review #2). | **Done** (`fbcb8a2`) | `reject_content_version_update` now computes the freeze as a whole-row diff (`to_jsonb(new) - array['projected_at'] is distinct from to_jsonb(old) - array['projected_at']`) rather than a named column list, so every content/answer/source-scope/taxonomy/accessibility/provenance column — and any future one — is frozen the moment it exists; the projection's in-place update of the six previously-uncovered columns is removed. `tests/rls/runtime-content.test.ts` (17 cases) publishes a row, UPDATEs every column individually, and asserts only `projected_at` mutates. |
| A11 | Canonical subject/offering authority in target selection | The target selector compares the raw config `subject` to `source_subject` with none of `SUBJECTS_BY_FILTER`'s mapping, so a `language` paper (bank `language_conventions`) selects **zero** items; and it does not reject invalid style/year at the offering boundary (external review #7). | **Done** (`83e51aa`) | `create_assessment_session` (`supabase/migrations/20260821090000_target_selector_canonical_offering.sql`) resolves subject through a SQL mirror of `REGISTRY_SUBJECT_BY_FILTER` and validates the (examStyle, yearLevel) pair against a SQL mirror of `EXAM_STYLE_YEAR_LEVELS`, so a `language` paper selects real rows and an invalid offering (e.g. NAPLAN Year 4) is refused by name (MM229) before any content query runs. `tests/rls/target-selector-offering.test.ts` (6 cases) proves every valid offering incl. `language`, and direct-RPC rejection of an invalid one. |
| A12 | Exact source-revision preservation | `load-manifests.ts` `Math.max(1, revision)` rewrites the 195 revision-0 manifests (and 33 revision-0 review bindings) to 1, so runtime provenance no longer matches the source verbatim (external review #4). | **Done** (`80e9b08`) | `load-manifests.ts` no longer floors `revision` before it reaches the projection plan; `publication_manifests.revision` preserves the source's own `0` verbatim for the 195 manifests (and 33 nested review bindings) that record it, while `project-question.ts` independently meets `item_versions.revision`'s 1-based runtime requirement without touching the source column. Three new cases in `src/tests/unit/content-projection.test.ts` round-trip revision-0 manifests and bindings through projection untransformed. **Build-time caveat found by the Gate-A-engineering-complete baseline (2026-08-16), now resolved (`66cce50`):** `80e9b08`'s own diff to `project-question.ts` also added `import { toCandidateQuestion } from ".../candidate-question"` and read `learnerQuestion.media` — a field that exists only in the concurrent, uncommitted capability-expansion stream's own edits to that same type file, not at this branch's HEAD. Confirmed by `git log -S 'learnerQuestion.media' -- src/features/content-projection/project-question.ts`, which names `80e9b08` and only `80e9b08` (not `fbcb8a2`/A10, which never touches this file). `vitest`/`tsx` don't type-check, so every unit and RLS suite passed regardless, but `npm run build`'s `tsc` step failed on committed `HEAD` alone. `66cce50` drops the read, the now-unused `learnerQuestion` local and the import — a corrective removal, not a feature change; Phase 2 does not project media, and the concurrent stream re-adds this line as part of its own work once its `media` type lands. Re-verified on committed `HEAD` + `66cce50` alone: `tsc --noEmit` and `next build` clean, unit 252/4,839 green, RLS 25/403 green (one worker-fork flake on first attempt, clean on immediate retry — the same known flake class `verify-test-run.mts` exists to catch, not a regression), `projection:apply`/`verify --live` clean. |
| A13 | Global privilege hardening (promoted from Downstream) | `authenticated` holds `TRUNCATE` on ~8 real public tables and CRUD on `essay_marks`; RLS does not cover `TRUNCATE` (external review #1, original audit #3). | **Done** (`17d1c08`) | `supabase/migrations/20260819100000_privilege_hardening_real_tables.sql` revokes `TRUNCATE` plus unused `DELETE`/`REFERENCES`/`TRIGGER` from `authenticated` on `classes`, `class_students`, `assignments`, `assignment_students`, `parent_children`, `profiles` and `subscriptions`, narrowed to exactly what a live RLS policy or session-scoped code path uses; `essay_marks` deliberately excluded (Gate B item B3). `tests/rls/privilege-hardening.test.ts` (7 cases) plus an updated `tests/rls/subscriptions.test.ts` assert `anon`/`authenticated` hold no `TRUNCATE` on any real table and no unapproved writes. |
| A14 | Manifest-gate reconciliation | The projection admits 1,005 curated questions as `curated_git_authored` with no manifest; §7/§9.7 say manifest-only (external review #3) — a deliberate ADR-002/003 choice the spec text doesn't bless. | **Done** — closed by blessing dual-provenance in the spec, one of the two options this row originally offered; the other (retrofitting curated content through the manifest process) was never viable, see ADR-002 Amendment C | Spec v1.3 (`docs/spec/scalable-assessment-platform-spec-v1.md`, §1.3) states the dual-provenance model ADR-002 Amendment A and ADR-003 Amendment A already decided and Phase 1 already implemented and tested: §7's sources-of-truth table now names two governed sources for published content (factory publication manifests; curated Git-authored content governed by `validate:questions` and immutably projected), with the single-governed-write-path rule restated as holding per source. §9.2 adds `provenance_class` to `item_versions`' required fields and states `publication_manifest_id`'s conditional nullability. §9.7 scopes the factory candidate-state mapping to `factory_manifest` content and restates the runtime-publication fact as reachable through either governed source. §21's Phase 1 exit gate and the §22 proof-obligation table are restated in terms of a governed *source*; §22 gains a row for the curated half citing the tests that already prove it (`src/tests/unit/content-projection.test.ts`: "ties provenance_class and manifest id together in both directions", "refuses a curated provenance that claims a manifest", "reports a factory question with no manifest", "reports a content-hash collision instead of dropping a row silently", "gives all 1,293 items a distinct hash"). **No schema, RPC, or application code changed** — `items_provenance_class_known` and `item_versions_manifest_matches_provenance` (`supabase/migrations/20260812090000_runtime_content_projection.sql`) already enforced exactly this model since Phase 1; this closure is spec/ADR text catching up to already-shipped, already-tested engineering. ADR-002 Amendment C records the closure and the reasoning for why the retrofit-manifests alternative (fabricating a review chain for 1,005 questions that never had one) was rejected, and notes curated content MAY later be migrated through the review pipeline as a content investment, which is not required for governance. |
| A15 | Config-pin reproducibility | Session config pins are placeholder text (`phase2-unblueprinted.v1`, `phase2-untaxonomised.v1`) with no immutable referent until Phase 3 (external review #6). | **Done** (`20260822100000`) — closed via option (b) below; option (a) remains a separate, still-open product decision | `public.config_pin_registry` (`supabase/migrations/20260822100000_config_pin_registry.sql`): one immutable, content-addressed row per distinct `(pin_kind, pin_value)` the session model actually writes — the six §12.3 pins' existing placeholder strings, seeded from `create_assessment_session`'s six `c_*` constants and `legacy_backfill_pin`'s `legacy:unpinned`/`legacy:exam-engine` literals (12 rows total, no more, no fewer). `content_hash` is a sha256 of the row's own `(pin_kind, pin_value, payload)`, enforced by a `CHECK` — the identity is derived from content, not assigned, and a mismatched hash cannot be inserted. `assessment_sessions`' six pin columns are unchanged in name, type and value; each gained a paired `STORED GENERATED` kind column and a composite `FOREIGN KEY` to the registry's `(pin_kind, pin_value)` unique key, so a session can only pin a value already known to the registry — enforced by Postgres, not by convention (spec §5.5). The registry row itself is append-only (`before update` trigger, `MM230`, blocks every role including the owner) and grants zero privilege to `anon`/`authenticated`. Neither `create_assessment_session` nor `backfill_legacy_terminal_sessions` needed to change: both already wrote exactly the seeded values, so the FK is satisfied by construction. `tests/rls/config-pin-registry.test.ts` (11 cases) proves the seeded set is exact; a forged content_hash is refused (`23514`); the registry is immutable for every role; `anon`/`authenticated` hold no privilege and cannot read it; a session's pins resolve to the same registry row across two independent reads; two sessions created under the same config share one registry row rather than duplicating it; a direct write with an unregistered pin value is refused by the FK (`23503`), not merely avoided by convention; and both existing write paths — native create and legacy backfill — still succeed unmodified and pin the expected identities. **What this deliberately does not do:** it does not build `framework_versions`/`blueprint_versions`/`assessment_profile_versions` or model what a pin *means* — ADR-006 §1 defers that to Phase 3 for a reason a text-value registry does not reopen (Phase 3's real tables assume a curated, blueprint-governed paper; Phase 2's actual `fixed_scope_seeded.v1` create path is an explicitly unblueprinted dynamic pool allocation with no blueprint shape on the record anywhere — see `OVERNIGHT-RUN-REPORT.md`'s Task 2 for the full reasoning). Option (a) — real, offering-scoped Phase 2 blueprints/profiles, which would require overriding ADR-006 §1 — remains open as a product decision, not a gap this migration leaves unaddressed. |
| A16 | Canonical programme-offering authority (proactive hardening, not external-review-mandated) | A11 closed the *bug* (wrong subject mapping, unchecked style/year) but left the *fix* as a hand-restated SQL mirror of `REGISTRY_SUBJECT_BY_FILTER`/`EXAM_STYLE_YEAR_LEVELS` inside `create_assessment_session` itself — kept honest only by a source-text test, not a shared source of truth (spec §6.2-6.4, §22; ADR-001 clause 6). Product-owner decision: build the reference-table authority now. | **Done** (`82680aa`) | `subjects`/`assessment_families`/`programmes`/`programme_offerings` (`supabase/migrations/20260822090000_programme_offering_authority.sql`), stable TEXT ids, `programme_offerings` unique on `(programme_id, subject_id, year_level, locale, region)`, seeded from `EXAM_STYLE_YEAR_LEVELS` × `SUBJECT_REGISTRY` for NAPLAN (Y3/5/7/9) and ICAS (Y2-12) — 99 rows. `create_assessment_session` now resolves the subject filter via `public.subjects` (id or `selection_filter_alias`, e.g. `language` → `language_conventions`) and checks the offering boundary via `programme_offerings` — no inline mapping remains in the RPC. The boundary is *strengthened* beyond A11: a real (style, year) with an unsupported subject (e.g. NAPLAN-style Science) now fails MM229 too, not just an invalid (style, year) pair. **Convergence:** designed as a superset of the isolated `feat/assessment-capability-expansion` branch's own `assessment_families`/`programmes`/`programme_offerings` (same six families, same six programmes, seeded verbatim under `on conflict do nothing`) plus a new `subjects` table that branch lacked — see the migration's own header for exactly what that branch drops at rebase time. `tests/rls/programme-offering-authority.test.ts` (17 cases) proves the seeded set matches the TS registries exactly, every valid offering incl. `language` still selects a paper, NAPLAN Year 4 and NAPLAN-style Science and ICAS Year 10 Digital Technologies are all rejected with MM229, an unrecognised subject filter still falls to the generic MM212, and all four reference tables are RLS-enabled with zero anon/authenticated privileges. A11's own registry checks were updated in place (they asserted the literal text this migration retires) and A11's own RLS suite (`target-selector-offering.test.ts`) is unchanged and still green. One follow-up fixture fix (`e1002c5`): `assessment-session-create.test.ts`'s "refuses a scope with no eligible content" test used `naplan_style` + `digital_technologies`, which A16's stricter boundary now correctly rejects with MM229 rather than the MM212 it was written to exercise — repointed at `language`, a real NAPLAN Year 5 offering this fixture genuinely has no content for. Verified: tsc, lint, full unit suite (4839/4839), full RLS suite (420/420), `next build`, fresh `supabase db reset`, migration-registry (35/35 ok), `graphify update`. |

**Gate A is green only when A1–A6 and A9–A15 close** (A7/A8 already done). The external
STOP-AND-FIX review added A9–A15 and downgraded A6 to DB/service-only; until every one
closes, the cohort must not open. A9–A13 are correctness/security blockers; A14–A15 were
raised as product-owner decisions. **A9–A13 are now closed** (`755520c`, `fbcb8a2`,
`83e51aa`, `80e9b08`, `17d1c08`), **A15 is now closed** (`20260822100000`) —
content-addressing the existing placeholder pins turned out to be pure engineering,
ADR-006 §1-compliant and requiring no product decision; see A15's own row for why the
originally-offered "accept text pins" alternative was unnecessary — and **A14 is now
closed** (spec v1.3, ADR-002 Amendment C) — the dual-provenance model it names was
already decided and implemented in ADR-002/003 Amendment A back in Phase 1, so closing
it turned out to be spec/ADR text catching up to shipped engineering rather than a live
product-owner call between two real options; see A14's own row. A6 also carries closing
evidence now: its original "not through HTTP" caveat is closed by A9's HTTP lifecycle
suite, so its status is corrected from "Partial" to Done alongside this pass — a
documentation catch-up, not new engineering, since A9 already did the work.
**Gate A is engineering-green: A1–A16 all carry closing evidence.** What remains is not
engineering — it is the operational decision to actually open a canary cohort
(`platform_flags.target_session_model`, still `enabled=false, cohort_mode='off'`) and,
separately, Gate B (steps 9–10, closing legacy writes), which by design only starts
after a cohort is open, verified, and legacy is drained.

**A16 is additional hardening, not one of the seven items Gate A's closure depends on.**
It was not raised by the external STOP-AND-FIX review and does not gate cohort-open by
itself (the cohort stays `enabled=false` throughout, unaffected). It closes now because
the product owner asked for A11's fix to be a real authority rather than a hand-mirrored
literal, and because a real, offering-scoped `assessment_profile_version`/
`framework_version`/`blueprint_version` row set — option (a) in A15's row above, still an
open product decision distinct from the content-addressing A15 itself closed with — will
want an offering to reference if it is ever built. Building the authority first is what
that later work converges onto, not scope creep against Gate A's own criteria.

**Update (2026-08-23): option (a) is no longer open.** ADR-004 is accepted —
option (a), a real offering-scoped `framework_version`/`blueprint_version`/
`assessment_profile_version` row set — and built (`20260823090000`,
`20260823100000`, `20260823110000`; `tests/rls/config-version-tables.test.ts`;
`scripts/verify-config-versions.mts`). `assessment_sessions.assessment_profile_version_id`
is the new FK a native session pins when its request resolves to exactly one
offering; the six `config_pin_registry`-enforced text pins A15 closed are
unchanged and still authoritative for `taxonomy_version`/
`engine_algorithm_version` and for any session this new FK is null on — see
ADR-004's "Decision" section for the coexist-vs-supersede reasoning. This is
still framework/blueprint/profile only: forms/form-versions (spec §10.4) and
the capacity simulator (spec §13.4) remain the next Phase 3 steps, not built
here. Gate A's own closure is unaffected — this was never one of its seven
items — and the cohort stays `enabled=false` throughout.

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
| B5 | Cross-workstream collision: `20260820090000` vs the A2/A13 cutover work | `20260820090000_assessment_capability_expansion` (untracked, concurrent — not part of this checklist's own commits) modifies Phase 2 tables the cutover stream also depends on. Two regressions: (1) it drops and recreates `manual_marks_item_key` with a new `(session_id, session_item_id, part_id) nulls not distinct` shape (`supabase/migrations/20260820090000_assessment_capability_expansion.sql:157-163`) without updating `record_manual_mark`'s `on conflict (session_id, session_item_id) where session_item_id is not null` (`supabase/migrations/20260816100000_manual_marks_write_path.sql:149`) — the conflict target no longer exists, so every mark write now fails with "no unique or exclusion constraint matching the ON CONFLICT specification", regressing A2 (proven by `tests/rls/manual-marks-write-path.test.ts` and `tests/rls/target-sitting-end-to-end.test.ts` step 8, both green with only A10/A12/A13/A11 applied and red with `20260820090000` also applied); (2) it grants `update (part_score_evidence) on public.session_responses to mindmosaic_scoring` (`supabase/migrations/20260820090000_assessment_capability_expansion.sql:165`), which is a real, load-bearing grant for its own feature but fails `scripts/migrations/registry.ts:768`'s "mindmosaic_scoring holds exactly its eight column-level UPDATE grants" allowlist check from A13's own migration (`20260812110000_scoring_role`) — a ninth grant the check does not yet know about. | Open — must be reconciled before either stream is trusted with the other applied. Not the cutover stream's to fix: A13 hardens privileges to an allowlist that predates this grant, and A10/A12/A11 do not touch `manual_marks` or `record_manual_mark` at all. Whoever owns `20260820090000` needs to restate `record_manual_mark`'s `ON CONFLICT` against the new index shape and extend the scoring-role registry check to the ninth grant. |

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
  proven to compose on one sitting end to end **at the DB/service level** (A1–A3, A6).
- Erasure is admin-invokable for the two exam-data models, with immediate reversible
  access revocation, a 30-day recovery window, an idempotent processor that never
  widens `erase_student`'s grant, and a minimal two-part audit — connect-as-role tested
  (A4). ADR-012 is finalized: the §17.5 schedule adopted pending legal review, the
  admin-processed model and 30-day grace recorded as decisions, and what is not yet
  enforced named rather than implied (A5).
- The same three write paths now also compose through the actual `/api/exam/session`
  HTTP routes, not only the DB/RPC layer — origin-aware create/autosave/submit/score/review,
  with the legacy path byte-for-byte unchanged beneath the dispatch — plus the
  immutability, revision, selector-authority and privilege gaps the external review raised
  are each closed and connect-as-role/whole-row tested (A9–A13).

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

### A1–A16 all close; Gate A is engineering-green

A9–A13 are closed with the evidence in the table above (`755520c`, `fbcb8a2`,
`83e51aa`, `80e9b08`, `17d1c08`). That closes every item on this checklist that is a
correctness or security *blocker* rather than a product-owner decision: A1–A6 and
A9–A13 all carry closing evidence. **A6's status is corrected here from "Partial" to
Done** — it was left "DB/service-level composition, now additionally reachable through
the HTTP routes A9 wires" when A9 shipped, which already closed its one open caveat;
that was a stale table cell, not open work, and this pass fixes it. **A15 closed**
(`20260822100000`) — content-addressing the placeholder pin strings closes A15's own
reproducibility concern without touching the config-semantics question ADR-006 §1
defers, so it needed no product-owner call after all; see A15's row for the reasoning.
**A14 closed** (spec v1.3, ADR-002 Amendment C) — the dual-provenance model A14 asked to
be blessed was already decided and implemented in ADR-002/003 Amendment A at Phase 1;
the "product-owner decision" this checklist originally filed it under turned out to
have only one live option once the retrofit-manifests alternative was examined (ADR-002
Amendment C explains why), so closing it was spec/ADR text reconciliation, not a
product call between two real paths.

**Gate A is engineering-green: A1–A16 all carry closing evidence.** What is not closed
is not engineering — it is the operational decision to open a real cohort
(`platform_flags.target_session_model` ships `enabled=false, cohort_mode='off'` and
stays that way until a product owner chooses to change it) and, once a cohort is open
and drained, Gate B (steps 9–10). Separately, Gate B item B5 — the
cross-workstream collision with the untracked, concurrent `20260820090000_assessment_capability_expansion`
migration — remains open and is **not** touched by this pass; A9–A13's own commits do not
modify `manual_marks`, `record_manual_mark`, or the scoring-role grant allowlist B5
describes, so closing A9–A13 neither fixes nor worsens B5.

**Baseline proof, run twice on 2026-08-16 to separate this branch's own engineering from
the unrelated concurrent stream:**

1. **Committed `HEAD` alone** (`755520c` and everything before it; the concurrent stream's
   two untracked migrations and every other untracked/uncommitted file set aside): fresh
   `supabase db reset` applies exactly the 34 committed migrations, nothing from the
   concurrent stream. `npm run test:ci` (unit, under the run-completeness guard) — **252
   files, 4,839 tests, all green.** `npm run test:rls:ci` (RLS, under the same guard) —
   **25 files, 403 tests, all green.** `npm run projection:apply` + `npm run
   projection:verify -- --live` against that same local database — clean on both the
   source-side and live-projected-row checks. **`npm run build`'s `tsc` step failed** on
   this first pass — the A12 caveat above, a real defect in this branch's own commits,
   not the concurrent stream's fault and not one of the 9 failures below. **Resolved the
   next day (`66cce50`, 2026-08-17):** re-run on committed `HEAD` (now including `66cce50`)
   with the concurrent stream stashed the same way — `tsc --noEmit` and `next build` both
   clean, unit 252/4,839 green, RLS 25/403 green (one worker-fork flake on the first
   attempt, clean on immediate retry), `projection:apply`/`verify --live` clean. This branch
   now builds standalone.
2. **Same database, concurrent stream's two migrations also applied** (`db reset` with the
   working tree back to its normal, ambient mixed state — the concurrent stream's files
   were never deleted, only set aside for step 1): RLS suite — **9 of 403 tests fail,
   3 of 25 files** (`assessment-scoring-role.test.ts` 1, `manual-marks-write-path.test.ts`
   6, `target-sitting-end-to-end.test.ts` 2), **all nine attributable to
   `20260820090000_assessment_capability_expansion`** — the seven `ON CONFLICT`
   failures and one downstream count mismatch are B5 §2.1 (`manual_marks_item_key`'s
   reshaped index vs. `record_manual_mark`'s unchanged conflict target); the one grant-list
   failure is B5 §2.2 (the ninth `part_score_evidence` grant vs. the scoring-role
   registry's still-eight-wide allowlist). No other test, in either run, failed for any
   other reason.

**Net: this branch's own engineering (A1–A13) is green, and now builds standalone.** The
only red in the tree once the concurrent stream is also applied is the 9 tests B5 already
named. Nothing in this baseline found a new correctness or security problem in A9–A13's
own logic; it found one build-time coupling defect (A12's own `80e9b08`, now fixed by
`66cce50`) and reconfirmed the two already-tracked B5 regressions, exactly as documented —
no more, no less.
