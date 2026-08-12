-- Phase 2 step 2 (EXPAND) of docs/spec/scalable-assessment-platform-spec-v1.md:
-- the normalized, version-pinned session model (§12.2–§12.6), decided in
-- ADR-005 and ADR-006. Schema only. **No legacy traffic changes in this
-- migration** — nothing reads or writes these tables yet, the legacy
-- exam_*/essay_marks path remains authoritative for every live session, and
-- the RPCs that will drive the target path arrive in the next migration.
--
-- WHY THESE TABLES EXIST. exam_sessions.selected_question_ids is a text[] of
-- bare question ids, resolved at scoring time against whichever compiled bank
-- the running deployment happens to have
-- (src/app/api/exam/session/[id]/submit/route.ts:99-107). Edit a question and
-- every historical attempt that used it silently re-means. Phase 1 built the
-- immutable content those sessions should have been pinned to
-- (20260812090000); this migration builds the session model that pins it.
--
-- THE ONE INVARIANT EVERYTHING HERE PROTECTS (§12.7, ADR-005 §1): a session has
-- either an exam_sessions row or an assessment_sessions row, never both, and it
-- never moves between them. Nothing below writes the legacy tables, and
-- assessment_sessions.legacy_session_id — the only link between the two models
-- — is unique, nullable, and settable only by the backfill, never by the create
-- RPC. Two authoritative records for one sitting is the failure mode this whole
-- sequence exists to avoid; it is not a risk to be managed but a state to be
-- made unrepresentable.
--
-- SECURITY POSTURE. Every table below is created with RLS enabled and with
-- **zero INSERT/UPDATE/DELETE/TRUNCATE privileges for anon and authenticated**.
-- Six of the nine get no privileges at all and no policies, exactly like the
-- Phase 1 content tables: they are reached only through SECURITY DEFINER
-- functions with a fixed search_path. Three (assessment_sessions,
-- assessment_results, manual_marks) grant SELECT, because the existing
-- results/history, parent-dashboard, teacher and analytics readers query
-- through the caller's own JWT and RLS is the right control for a read.
--
-- The `revoke all` statements are load-bearing, not decoration. This project's
-- legacy api.auto_expose_new_tables default grants the full privilege set on
-- every new public table — that is exactly how `authenticated` came to hold
-- TRUNCATE on all 17 pre-existing public tables, which 20260811093000 fixed for
-- three of them and docs/adr/phase0-legacy-session-inventory.md §7 recorded as
-- outstanding for the rest (essay_marks still holds TRUNCATE *and* DELETE
-- today; step 9 closes it). RLS does not apply to TRUNCATE at all — there is no
-- per-row filter to apply — so for these nine tables the grant is the only
-- control, and it is removed at creation rather than left for a later cleanup.
-- tests/rls/assessment-session-model.test.ts asserts it per table.
--
-- WHAT IS DELIBERATELY NOT HERE. assessment_session_stages and
-- stage_transitions are created with the shape §12.6/ADR-008 will need and
-- **no code path writes them**: fixed delivery records stage_number = 1 on its
-- ledger rows and creates no stage row. Adaptive sealing, band selection and
-- routing are Phase 4. They are created now rather than later because the stage
-- columns belong to assessment_session_items from the start — adding them after
-- real sessions exist means inventing a value for rows nobody staged
-- (ADR-006 §7).

-- ---------------------------------------------------------------------------
-- assessment_sessions — the session snapshot (§12.3)
-- ---------------------------------------------------------------------------
-- Every version §12.3 names is pinned as its own column rather than inferred at
-- read time. They are text version identifiers, not foreign keys, because
-- framework_versions / blueprint_versions / assessment_profile_versions are
-- Phase 3 tables that do not exist yet (ADR-006 §1). This is the same choice
-- ADR-002 Amendment B made for source_* scope on item_versions and for the same
-- reason: a foreign key to an absent table is either a stub table — a second
-- independently-maintained answer to a question that already has one — or a
-- nullable column that records nothing. A text pin is a true record now, and
-- Phase 3 adds the referential integrity when the referents exist.
--
-- scoring_algorithm_version is the pin that must be right today, because
-- §14.2's determinism guarantee is stated in terms of it: same pinned content,
-- same responses, same framework version, same scoring algorithm version ->
-- same result. The scoring function refuses a version it does not implement
-- rather than silently scoring with a newer algorithm.
create table public.assessment_sessions (
  id                          uuid primary key default gen_random_uuid(),
  student_id                  uuid        not null references public.profiles (id) on delete cascade,

  -- §12.3 "organization/context where applicable". No FK: organizations are
  -- Phase 6 (ADR-013). Null for every session this phase creates.
  organization_id             uuid,

  -- Pinned versions (§12.3).
  assessment_profile_version  text        not null,
  framework_version           text        not null,
  blueprint_version           text        not null,
  taxonomy_version            text        not null,
  engine_algorithm_version    text        not null,
  scoring_algorithm_version   text        not null,
  content_build_version       text        not null,

  delivery_mode               text        not null default 'fixed',
  -- Server-chosen, never client-supplied — the property that stops a learner
  -- predicting or picking their own paper (20260811090000's header note).
  seed                        text        not null,
  form_id                     text,

  -- The ExamSelectionConfig the sitting was assembled from, kept in the same
  -- shape exam_sessions.config uses so the assignment seam
  -- (src/features/teacher/assignment-contract.ts) does not fork.
  config                      jsonb       not null,

  status                      text        not null default 'created',
  -- Optimistic lock (§12.3). Bumped by the server-owned functions; the
  -- transition trigger below refuses an update that does not advance it.
  version                     integer     not null default 1,

  -- ADR-005 §4. 'version_pinned' means every served item is recorded in
  -- assessment_session_items against an exact item_version_id and content hash.
  -- 'legacy_unversioned' means the sitting predates that evidence and MUST NOT
  -- be presented as reproducible or ever recomputed.
  content_identity            text        not null default 'version_pinned',

  -- The backfill's idempotency key (§12.7 step 3). Unique, so a re-run inserts
  -- nothing. Null for every natively created session: the create RPC has no
  -- parameter for it, which is what makes "a live session never acquires a
  -- legacy twin" a property of the interface rather than a rule to remember.
  legacy_session_id           uuid unique references public.exam_sessions (id) on delete restrict,

  created_at                  timestamptz not null default now(),
  started_at                  timestamptz,
  expires_at                  timestamptz not null,
  submitted_at                timestamptz,

  constraint assessment_sessions_delivery_mode_known
    check (delivery_mode in ('fixed', 'adaptive_mst')),
  -- §12.8's lifecycle. The set is closed here; the legal transitions between
  -- members are enforced by the trigger below, because a check constraint
  -- cannot see the previous value.
  constraint assessment_sessions_status_known
    check (status in ('created', 'active', 'interrupted', 'submitted', 'processed', 'abandoned')),
  constraint assessment_sessions_content_identity_known
    check (content_identity in ('version_pinned', 'legacy_unversioned')),
  -- Only backfilled data can be unversioned. A session created on the target
  -- path is version-pinned by construction — the create RPC writes the ledger
  -- in the same transaction — so an unversioned row with no legacy source would
  -- mean the ledger write was skipped.
  constraint assessment_sessions_unversioned_only_from_legacy
    check (content_identity = 'version_pinned' or legacy_session_id is not null),
  constraint assessment_sessions_version_positive check (version >= 1),
  constraint assessment_sessions_submitted_at_matches_status check (
    (status in ('submitted', 'processed') and submitted_at is not null)
    or (status not in ('submitted', 'processed') and submitted_at is null)
  )
);

-- §20.2: "active session by student". The resume lookup
-- (api/exam/session/active) is the hottest query on the legacy model and will
-- be the hottest here.
create index assessment_sessions_student_status_idx
  on public.assessment_sessions (student_id, status);
-- History, newest first — results/history-fetch.ts, the student dashboard and
-- the parent dashboard all read in this order.
create index assessment_sessions_student_created_idx
  on public.assessment_sessions (student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- assessment_session_stages — created, unused (§12.6, ADR-006 §7)
-- ---------------------------------------------------------------------------
-- Phase 4 owns sealing. Nothing in Phase 2 inserts here.
create table public.assessment_session_stages (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid        not null references public.assessment_sessions (id) on delete cascade,
  stage_number   smallint    not null,
  target_band    text,
  routing_form_id text,
  status         text        not null default 'allocated',
  sealed_at      timestamptz,
  -- The sealed stage score routing reads (§12.6 steps 4-5). Immutable once
  -- sealed; the sealing RPC that will enforce that is Phase 4.
  sealed_score   numeric,
  created_at     timestamptz not null default now(),
  constraint assessment_session_stages_number_positive check (stage_number >= 1),
  constraint assessment_session_stages_status_known
    check (status in ('allocated', 'active', 'sealed')),
  constraint assessment_session_stages_sealed_has_timestamp
    check ((status = 'sealed') = (sealed_at is not null)),
  constraint assessment_session_stages_unique_per_session unique (session_id, stage_number)
);

-- ---------------------------------------------------------------------------
-- assessment_session_items — the served-item ledger (§12.4)
-- ---------------------------------------------------------------------------
-- "This is the served-order record and the authoritative exposure ledger."
-- Append-only: written once at allocation, never updated by any role (see the
-- trigger below). An authoritative ledger that can be edited afterwards is not
-- one.
--
-- content_hash duplicates item_versions.content_hash on purpose. The ledger
-- must stay independently verifiable if a content row is ever archived, and a
-- replay check that compares the two proves nothing if it reads one column
-- twice.
create table public.assessment_session_items (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid        not null references public.assessment_sessions (id) on delete cascade,

  global_ordinal        integer     not null,
  stage_number          smallint    not null default 1,
  within_stage_ordinal  integer     not null,

  -- The pin. item_version_id is what makes a sitting replayable: it is
  -- immutable (20260812090000's trigger), so a later revision of the same item
  -- is a different row that this ledger does not point at.
  item_id               uuid        not null references public.items (id) on delete restrict,
  item_version_id       uuid        not null references public.item_versions (id) on delete restrict,
  content_hash          text        not null,
  stimulus_id           uuid        references public.stimuli (id) on delete restrict,
  stimulus_version_id   uuid        references public.stimulus_versions (id) on delete restrict,

  -- §12.4's remaining ledger fields. Nullable because fixed delivery has no
  -- value for them yet: item families and blueprint cells are Phase 3
  -- normalization, bands are an adaptive concept (ADR-007), and the exposure
  -- window is Phase 4 (ADR-009). Columns now rather than a later `alter table`
  -- because §12.4 lists them as part of what the ledger IS, and backfilling a
  -- ledger column after sessions exist means inventing values nobody recorded.
  item_family_id        text,
  blueprint_cell_id     text,
  target_band           text,
  exposure_window_depth integer,

  -- The routing/allocation decision (§12.4). For fixed delivery this records
  -- the deterministic selection that produced the paper; for adaptive it will
  -- record the routing inputs. Never learner-supplied.
  allocation_reason     text        not null default 'fixed_blueprint_selection',
  allocation_decision   jsonb       not null default '{}'::jsonb,
  forced_reuse_reason   text,

  seed                  text        not null,
  form_id               text,
  served_at             timestamptz not null default now(),

  constraint assessment_session_items_global_ordinal_positive check (global_ordinal >= 1),
  constraint assessment_session_items_stage_positive check (stage_number >= 1),
  constraint assessment_session_items_within_stage_positive check (within_stage_ordinal >= 1),
  constraint assessment_session_items_content_hash_format
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint assessment_session_items_allocation_reason_known
    check (allocation_reason in ('fixed_blueprint_selection', 'adaptive_routing', 'forced_reuse')),
  -- §13.2: "Forced reuse MUST select the oldest eligible exposure first and
  -- record why reuse was necessary." Recorded means recorded — the reason is
  -- required exactly when reuse was forced, and forbidden otherwise so it
  -- cannot become a free-text field that means nothing.
  constraint assessment_session_items_forced_reuse_explained
    check ((allocation_reason = 'forced_reuse') = (forced_reuse_reason is not null)),
  -- Served order is unique per session; so is position within a stage.
  constraint assessment_session_items_ordinal_key unique (session_id, global_ordinal),
  constraint assessment_session_items_stage_ordinal_key
    unique (session_id, stage_number, within_stage_ordinal),
  -- No item appears twice in one sitting. Enforced on item_id, not
  -- item_version_id: two revisions of the same item are still the same question.
  constraint assessment_session_items_item_once_per_session unique (session_id, item_id)
);

-- §20.2 "session items by session and ordinal" — the serve/resume read.
create index assessment_session_items_session_ordinal_idx
  on public.assessment_session_items (session_id, global_ordinal);
-- §20.2 "exposure by student, programme/subject, and served time". The student
-- and subject sit on assessment_sessions / item_versions, so exposure queries
-- join from here; this index is the item-side entry point.
create index assessment_session_items_item_served_idx
  on public.assessment_session_items (item_id, served_at desc);
create index assessment_session_items_item_version_idx
  on public.assessment_session_items (item_version_id);

-- ---------------------------------------------------------------------------
-- session_responses — one row per served item (§12.5)
-- ---------------------------------------------------------------------------
-- The served item IS the response's identity. §12.5 requires each response to
-- reference the exact served session item; the partial unique index below is
-- what makes that structural rather than conventional.
--
-- THERE IS NO CLIENT-WRITABLE CORRECTNESS COLUMN. §12.5 says client-provided
-- correctness, score, difficulty, skill and content identity must be ignored. A
-- column that exists and is documented as ignored is one refactor away from
-- being read, so the columns simply are not here. is_correct/awarded_marks/
-- score_status are written by the scoring function only, at submission, and are
-- null until then.
--
-- TWO IDENTITY BRANCHES. A natively created session's response points at its
-- ledger row. A backfilled legacy_unversioned session has no ledger (ADR-005 §4
-- — the evidence to build one honestly does not exist), so its responses carry
-- the bare legacy question id instead. Exactly one branch is populated, and
-- each has its own partial unique index; a row with both or neither would be a
-- response whose identity is ambiguous.
create table public.session_responses (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid        not null references public.assessment_sessions (id) on delete cascade,
  session_item_id   uuid        references public.assessment_session_items (id) on delete cascade,
  -- Legacy branch only: the bare content-bank question id, preserved as
  -- history. Not a foreign key — it is precisely the identifier whose binding
  -- to an item revision cannot be proved.
  legacy_question_id text,

  -- The learner's answer, exactly as submitted. Null means never answered.
  response_value    jsonb,

  -- Monotonic autosave counter (ADR-006 §3). The commit RPC applies a write
  -- only when the incoming sequence is at least the stored one, so a late or
  -- replayed autosave is discarded rather than applied. The single upserted
  -- exam_responses document cannot do this: today a stale autosave arriving
  -- late overwrites every newer answer in the session at once.
  client_sequence   bigint      not null default 0,

  -- Set once, never moved, so "when did they first answer this" survives a
  -- later change; answered_at tracks the current value.
  first_answered_at timestamptz,
  answered_at       timestamptz,

  -- Derived at submission by public.score_assessment_session only.
  score_status      text,
  is_correct        boolean,
  awarded_marks     integer,
  available_marks   integer,
  scored_at         timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint session_responses_one_identity_branch check (
    (session_item_id is not null and legacy_question_id is null)
    or (session_item_id is null and legacy_question_id is not null)
  ),
  constraint session_responses_client_sequence_nonnegative check (client_sequence >= 0),
  constraint session_responses_score_status_known
    check (score_status is null or score_status in ('correct', 'incorrect', 'manual_review', 'unanswered')),
  -- §14.3, as a constraint rather than a convention: a manual-review response
  -- is stored WITHOUT fabricated correctness. Not false, not zero — null.
  -- This is the specific bug src/tests/unit/blank-sitting-aggregates.test.ts
  -- exists to prevent on the legacy path.
  constraint session_responses_manual_review_has_no_correctness check (
    score_status is distinct from 'manual_review'
    or (is_correct is null and awarded_marks is null)
  ),
  constraint session_responses_awarded_within_available check (
    awarded_marks is null or available_marks is null or awarded_marks <= available_marks
  ),
  constraint session_responses_awarded_nonnegative
    check (awarded_marks is null or awarded_marks >= 0)
);

create unique index session_responses_item_key
  on public.session_responses (session_id, session_item_id)
  where session_item_id is not null;
create unique index session_responses_legacy_question_key
  on public.session_responses (session_id, legacy_question_id)
  where legacy_question_id is not null;
-- §20.2 "responses by session item".
create index session_responses_session_idx on public.session_responses (session_id);

-- ---------------------------------------------------------------------------
-- stage_transitions — created, unused (§12.6, ADR-008)
-- ---------------------------------------------------------------------------
-- The two uniqueness guarantees §22 requires of adaptive routing are declared
-- now so Phase 4 inherits them rather than negotiating them: a stage routes
-- exactly once, and replaying an idempotency key returns the stored response
-- instead of selecting again.
create table public.stage_transitions (
  id                        uuid primary key default gen_random_uuid(),
  session_id                uuid        not null references public.assessment_sessions (id) on delete cascade,
  from_stage                smallint    not null,
  to_stage                  smallint,
  idempotency_key           text        not null,
  routing_inputs            jsonb       not null default '{}'::jsonb,
  routing_algorithm_version text        not null,
  routing_decision          jsonb       not null default '{}'::jsonb,
  -- The exact response body returned to the client, so a retry replays it
  -- verbatim (§18) rather than recomputing an allocation.
  response_body             jsonb,
  created_at                timestamptz not null default now(),
  constraint stage_transitions_from_stage_positive check (from_stage >= 1),
  -- "A stage routes exactly once" (§22). Concurrent transitions lose this race
  -- rather than allocating a second next stage (§12.6).
  constraint stage_transitions_once_per_stage unique (session_id, from_stage),
  constraint stage_transitions_idempotency_key unique (session_id, idempotency_key)
);

-- ---------------------------------------------------------------------------
-- assessment_results — one row per submitted session (§14)
-- ---------------------------------------------------------------------------
-- session_id is unique, which is the target model's equivalent of
-- exam_attempts_session_id_key (20260722100000) and works the same way: the
-- submit RPC deliberately does not catch 23505, so a lost double-submit race
-- surfaces as an idempotent 409 rather than a 500 (MM-SEC-02).
--
-- The columns are a faithful normalization of the legacy ExamResult
-- (src/features/exam-engine/scoring/exam-report.ts) minus two parts:
-- questionDetails, which is now one session_responses row per item, and
-- breakdowns, which are derivable by joining item_versions and so are computed
-- on read rather than frozen into a second copy that can disagree.
create table public.assessment_results (
  id                        uuid primary key default gen_random_uuid(),
  session_id                uuid        not null unique references public.assessment_sessions (id) on delete cascade,
  student_id                uuid        not null references public.profiles (id) on delete cascade,

  -- Which algorithm actually produced these numbers (§14.2). Pinned on the
  -- session too; recorded again here because a result must be interpretable
  -- without its session row.
  scoring_algorithm_version text        not null,

  total_items               integer     not null,
  attempted_items           integer     not null,
  auto_marked_items         integer     not null,
  manual_review_items       integer     not null,
  correct_count             integer     not null,
  incorrect_count           integer     not null,
  unanswered_count          integer     not null,

  objective_awarded_marks   integer     not null,
  objective_available_marks integer     not null,
  -- Whole-number percentage, matching the legacy ExamResult contract exactly so
  -- history renders identically across both models. §14.3: manual-review items
  -- are excluded from this denominator until marked.
  objective_percentage      integer     not null,
  pending_manual_marks      integer     not null default 0,

  time_taken_seconds        integer     not null,
  started_at                timestamptz not null,
  submitted_at              timestamptz not null,
  submission_reason         text        not null,

  -- §12.7 step 3's idempotency key for the results backfill.
  legacy_attempt_id         uuid unique references public.exam_attempts (id) on delete restrict,
  -- The original ExamResult jsonb, preserved verbatim for legacy_unversioned
  -- history (§12.7 step 4: "may preserve the original JSON result for history
  -- but MUST NOT be recomputed"). Null for natively scored sessions, whose
  -- numbers are the columns above.
  legacy_result             jsonb,

  created_at                timestamptz not null default now(),

  constraint assessment_results_submission_reason_known
    check (submission_reason in ('user_submitted', 'timer_expired')),
  constraint assessment_results_counts_nonnegative check (
    total_items >= 0 and attempted_items >= 0 and auto_marked_items >= 0
    and manual_review_items >= 0 and correct_count >= 0 and incorrect_count >= 0
    and unanswered_count >= 0 and pending_manual_marks >= 0
    and objective_awarded_marks >= 0 and objective_available_marks >= 0
    and time_taken_seconds >= 0
  ),
  constraint assessment_results_percentage_range
    check (objective_percentage between 0 and 100),
  constraint assessment_results_awarded_within_available
    check (objective_awarded_marks <= objective_available_marks),
  -- The legacy pair travels together: a preserved result blob without its
  -- source attempt id is unattributable, and a backfilled row without the blob
  -- has thrown away the only record of what the learner was actually told.
  constraint assessment_results_legacy_pair_complete
    check ((legacy_attempt_id is null) = (legacy_result is null))
);

create index assessment_results_student_submitted_idx
  on public.assessment_results (student_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- manual_marks — teacher marks against a submitted session (§14.3)
-- ---------------------------------------------------------------------------
-- The target-model successor to essay_marks, with the same shape and the same
-- meaning: "pending" is not a stored status, it is the absence of a row for an
-- item the scorer flagged manual_review. numeric marks match essay_marks so the
-- backfill is lossless.
--
-- Same two identity branches as session_responses, for the same reason.
create table public.manual_marks (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid        not null references public.assessment_sessions (id) on delete cascade,
  session_item_id      uuid        references public.assessment_session_items (id) on delete cascade,
  legacy_question_id   text,
  marked_by            uuid        not null references public.profiles (id) on delete cascade,
  awarded_marks        numeric     not null,
  -- Captured at mark time from the pinned item version's marks_available, so a
  -- mark stays interpretable independently of later content.
  max_marks            numeric     not null,
  feedback             text,
  marked_at            timestamptz not null default now(),
  legacy_essay_mark_id uuid unique references public.essay_marks (id) on delete restrict,
  constraint manual_marks_one_identity_branch check (
    (session_item_id is not null and legacy_question_id is null)
    or (session_item_id is null and legacy_question_id is not null)
  ),
  constraint manual_marks_awarded_nonnegative check (awarded_marks >= 0),
  constraint manual_marks_max_nonnegative check (max_marks >= 0),
  constraint manual_marks_awarded_within_max check (awarded_marks <= max_marks)
);

create unique index manual_marks_item_key
  on public.manual_marks (session_id, session_item_id)
  where session_item_id is not null;
create unique index manual_marks_legacy_question_key
  on public.manual_marks (session_id, legacy_question_id)
  where legacy_question_id is not null;
create index manual_marks_session_idx on public.manual_marks (session_id);

-- ---------------------------------------------------------------------------
-- outbox_events — created, unwritten (§15.2, §19.3)
-- ---------------------------------------------------------------------------
-- §19.3 is explicit that an outbox should arrive with a real asynchronous
-- consumer, and Appendix B rejects deploying queues with no producer and no
-- consumer. This table therefore ships with NO worker, NO schedule and NO
-- producer: fixed delivery writes nothing to it. It exists because §12.6 step 8
-- makes an outbox write part of the stage-transition contract Phase 4 must
-- implement atomically, and adding the table in the same transaction as that
-- RPC is worse than having it ready. If Phase 4 does not need it, ADR-006 §7
-- says drop it rather than keep it.
--
-- §15.2: large duplicated payloads and private answer data MUST NOT be copied
-- into events. Nothing here has a column for them.
create table public.outbox_events (
  id           bigint generated always as identity primary key,
  event_type   text        not null,
  session_id   uuid        references public.assessment_sessions (id) on delete cascade,
  payload      jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

-- Partial: the only query an outbox worker makes is "what is unpublished".
create index outbox_events_unpublished_idx
  on public.outbox_events (created_at)
  where published_at is null;

-- ---------------------------------------------------------------------------
-- idempotency_keys — retryable write endpoints (§18)
-- ---------------------------------------------------------------------------
-- "Write endpoints that can be safely retried MUST accept an idempotency key.
-- Reusing a key with a different request hash MUST fail." request_hash is what
-- makes the second half enforceable: a replay with the same hash returns the
-- stored response, a replay with a different one is a conflict.
--
-- expires_at implements ADR-012 / §17.5's "idempotency records ... delete after
-- their retry/audit window, normally 24 hours to 30 days". 24 hours is the
-- retry window for these endpoints; the row is not useful after it and holding
-- a learner's response body longer than needed is exactly what that schedule
-- exists to prevent. The reaper is operational, not scheduled here — see the
-- §19.3 note above on not deploying no-op jobs.
create table public.idempotency_keys (
  actor_id        uuid        not null references public.profiles (id) on delete cascade,
  endpoint        text        not null,
  key             text        not null,
  request_hash    text        not null,
  response_status integer,
  response_body   jsonb,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '24 hours',
  primary key (actor_id, endpoint, key)
);

create index idempotency_keys_expires_idx on public.idempotency_keys (expires_at);

-- ---------------------------------------------------------------------------
-- Append-only and lifecycle enforcement, for every role including the owner
-- ---------------------------------------------------------------------------
-- Revoking learner privileges is not sufficient here, for the same reason it
-- was not sufficient in Phase 1 (20260812090000's immutability note): the
-- server-side jobs that write these tables connect as a privileged role and
-- could otherwise edit submitted evidence in place. §5.3 calls that evidence
-- immutable; these triggers are what makes the word mean something.

-- The served-item ledger is written once at allocation. §12.4 calls it "the
-- authoritative exposure ledger", and an authoritative ledger that can be
-- amended afterwards is a draft.
--
-- All three triggers below cover UPDATE and **not** DELETE, deliberately. A
-- before-delete trigger fires on cascade deletes too, so blocking DELETE here
-- would block `profiles -> assessment_sessions -> ...` from ever cascading —
-- and §17.5/ADR-012 require a child's records to be deletable on a verified
-- erasure request. Immutability means "cannot be edited into different values
-- while retained" (§17.5: erasure "deletes it or irreversibly severs identity
-- rather than editing answers or scores into different values"). DELETE is
-- controlled by privilege instead: no role but the owner and service_role holds
-- it, and the erasure workflow is the only sanctioned user.
create or replace function public.reject_session_item_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'assessment_session_items is append-only; allocate a new row instead'
    using errcode = 'MM201';
end;
$$;

create trigger assessment_session_items_append_only
  before update on public.assessment_session_items
  for each row execute function public.reject_session_item_mutation();

-- A submitted, processed or abandoned session is terminal for learner writes
-- (§12.8). This reproduces the guarantee 20260811092000 gives on the legacy
-- path via session_has_attempt(), one level stronger: there it was an RLS
-- policy, so it bound only the caller's own JWT; here it binds every role.
--
-- There is no exemption, and none is needed, because both writers reach a
-- submitted session's responses while it is still open:
--
--   * The submit RPC scores and stamps derived correctness FIRST and flips the
--     status to 'submitted' LAST, all in one transaction.
--   * The backfill inserts a legacy session as 'created', writes its responses,
--     and then transitions it to 'submitted' — the same lifecycle a live
--     sitting follows, rather than a privileged shortcut around it.
--
-- An exemption flag would be a hole that has to be trusted; an ordering is a
-- hole that does not exist.
create or replace function public.reject_terminal_session_response_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  select s.status into v_status
  from public.assessment_sessions s
  where s.id = new.session_id;

  if v_status in ('submitted', 'processed', 'abandoned') then
    raise exception 'session % is terminal; responses cannot be changed', new.session_id
      using errcode = 'MM202';
  end if;

  return new;
end;
$$;

create trigger session_responses_terminal_lock
  before insert or update on public.session_responses
  for each row execute function public.reject_terminal_session_response_write();

-- §12.8: "Allowed transitions MUST be enforced by server-owned functions."
-- Enforced here as well as in the functions, so the closed set is a property of
-- the table rather than of every caller remembering it.
create or replace function public.enforce_assessment_session_transition()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'created'     and new.status in ('active', 'submitted', 'abandoned'))
      or (old.status = 'active'      and new.status in ('interrupted', 'submitted', 'abandoned'))
      or (old.status = 'interrupted' and new.status in ('active', 'submitted', 'abandoned'))
      or (old.status = 'submitted'   and new.status = 'processed')
    ) then
      raise exception 'illegal session transition % -> %', old.status, new.status
        using errcode = 'MM207';
    end if;
  end if;

  -- The optimistic lock (§12.3) only works if every update advances it.
  if new.version <= old.version then
    raise exception 'assessment_sessions.version must advance on update'
      using errcode = 'MM207';
  end if;

  -- The storage-model boundary (ADR-005 §1). Re-pointing a session at a legacy
  -- source after creation is how a live session would acquire a second
  -- authoritative record.
  if new.legacy_session_id is distinct from old.legacy_session_id then
    raise exception 'legacy_session_id is fixed at creation'
      using errcode = 'MM207';
  end if;

  return new;
end;
$$;

create trigger assessment_sessions_transition_guard
  before update on public.assessment_sessions
  for each row execute function public.enforce_assessment_session_transition();

-- A result is immutable once written, exactly as exam_attempts.result is. A
-- teacher's manual mark is a new manual_marks row, never an edit to the score
-- the learner was shown.
create or replace function public.reject_assessment_result_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'assessment_results is immutable; record manual marks separately'
    using errcode = 'MM201';
end;
$$;

create trigger assessment_results_immutable
  before update on public.assessment_results
  for each row execute function public.reject_assessment_result_mutation();

-- ---------------------------------------------------------------------------
-- RLS and privileges (§17.1–§17.3)
-- ---------------------------------------------------------------------------
alter table public.assessment_sessions       enable row level security;
alter table public.assessment_session_stages enable row level security;
alter table public.assessment_session_items  enable row level security;
alter table public.session_responses         enable row level security;
alter table public.stage_transitions         enable row level security;
alter table public.assessment_results        enable row level security;
alter table public.manual_marks              enable row level security;
alter table public.outbox_events             enable row level security;
alter table public.idempotency_keys          enable row level security;

-- Everything off first. `revoke all` covers SELECT/INSERT/UPDATE/DELETE **and
-- TRUNCATE**, the one RLS cannot reach. SELECT is granted back below to the
-- three tables that have application readers, and to nothing else.
revoke all on public.assessment_sessions       from anon, authenticated;
revoke all on public.assessment_session_stages from anon, authenticated;
revoke all on public.assessment_session_items  from anon, authenticated;
revoke all on public.session_responses         from anon, authenticated;
revoke all on public.stage_transitions         from anon, authenticated;
revoke all on public.assessment_results        from anon, authenticated;
revoke all on public.manual_marks              from anon, authenticated;
revoke all on public.outbox_events             from anon, authenticated;
revoke all on public.idempotency_keys          from anon, authenticated;

-- The six with no privileges get no policies either — the Phase 1 posture, and
-- for the same reason: RLS is default-deny, so a table with RLS on and no
-- policy is readable by nobody except roles that bypass it. Their sanctioned
-- access path is a SECURITY DEFINER function with a fixed search_path, which
-- authorises the caller and returns sanitized rows. A policy appearing on any
-- of them later would mean a direct learner path was built.
--
-- assessment_session_items in particular MUST NOT become learner-readable by
-- accident: it is the exposure ledger, and §17.1 permits a learner only the
-- candidate content allocated to their session — served through the definer
-- reader, never by querying the ledger.

-- assessment_sessions: read-only, three complete predicates.
--
-- §17.3: "Each policy MUST contain a complete authorization predicate. A broad
-- tenant policy MUST NOT be combined with narrower ownership policies under
-- permissive OR semantics." These mirror the legacy exam_sessions policies
-- one-for-one — same three relationships, same SECURITY DEFINER helpers — so
-- the transition does not also change who can see what.
--
-- The helpers are SECURITY DEFINER for a reason Phase 2 must preserve: a policy
-- sub-querying another table directly would have that subquery evaluated under
-- the caller's own RLS, making the guard depend on the caller's read policies
-- rather than on the fact being asked about.
grant select on public.assessment_sessions to authenticated;

create policy "assessment_sessions: student reads own" on public.assessment_sessions
  for select to authenticated
  using (student_id = auth.uid());

create policy "assessment_sessions: parent reads linked children" on public.assessment_sessions
  for select to authenticated
  using (public.is_parent_of(student_id));

create policy "assessment_sessions: teacher reads own class students" on public.assessment_sessions
  for select to authenticated
  using (public.is_teacher_of_student(student_id));

-- assessment_results: same three relationships. The learner-facing result and
-- history screens, the parent dashboard and the teacher class views all read
-- this table directly through the caller's JWT.
grant select on public.assessment_results to authenticated;

create policy "assessment_results: student reads own" on public.assessment_results
  for select to authenticated
  using (student_id = auth.uid());

create policy "assessment_results: parent reads linked children" on public.assessment_results
  for select to authenticated
  using (public.is_parent_of(student_id));

create policy "assessment_results: teacher reads own class students" on public.assessment_results
  for select to authenticated
  using (public.is_teacher_of_student(student_id));

-- manual_marks: teacher read only, matching essay_marks exactly. There is
-- deliberately no student or parent policy — per-question marks are not exposed
-- to them directly on the legacy path either, and widening that here would be a
-- product change smuggled in as a migration.
--
-- Writes go through a SECURITY DEFINER RPC (next migration), not a policy: the
-- integrity property that matters is "max_marks came from the pinned item
-- version, not from the request", which is a property of how the row was
-- produced and therefore not something a WITH CHECK can express. That is the
-- same reasoning 20260811090000 applied to exam_attempts.result.
grant select on public.manual_marks to authenticated;

create policy "manual_marks: teacher reads own class students' marks" on public.manual_marks
  for select to authenticated
  using (
    exists (
      select 1
      from public.assessment_sessions s
      where s.id = session_id
        and public.is_teacher_of_student(s.student_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Documentation carried in the catalogue, where a future reader will find it
-- ---------------------------------------------------------------------------
comment on table public.assessment_sessions is
  'Version-pinned session snapshot (spec §12.3, ADR-006). A sitting has EITHER this row or an exam_sessions row, never both, and never moves between them (ADR-005 §1). legacy_session_id is set only by the backfill.';

comment on column public.assessment_sessions.content_identity is
  'version_pinned = every served item is recorded in assessment_session_items against an exact item_version_id. legacy_unversioned = backfilled from exam_sessions, whose bare question ids carry no evidence of the revision served; such a sitting MUST NOT be recomputed or presented as reproducible (ADR-005 §4).';

comment on table public.assessment_session_items is
  'The served-order record and authoritative exposure ledger (spec §12.4). Append-only for every role. Not learner-readable: candidate content reaches a learner only through the SECURITY DEFINER reader, never by querying this table.';

comment on table public.session_responses is
  'One row per served item (spec §12.5). No client-writable correctness, score, difficulty, skill or content-identity column exists — derived outcomes are written by public.score_assessment_session only.';

comment on table public.outbox_events is
  'Created for the Phase 4 stage-transition contract (spec §12.6 step 8). NO producer, NO consumer and NO scheduled worker in Phase 2 — if Phase 4 does not need it, drop it rather than keep it (spec §19.3, ADR-006 §7).';

comment on table public.assessment_session_stages is
  'Phase 4 (adaptive sealing). Created with the shape §12.6 needs; deliberately unused by fixed delivery, which records stage_number = 1 on its ledger rows and creates no stage row.';
