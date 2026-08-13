-- Phase 2 step 6: cut over NEW sessions only, through one authoritative
-- database flag (spec §12.7 step 6; ADR-005 §1 and §2-as-superseded; ADR-006
-- Amendment C).
--
-- WHAT THIS DOES NOT DO. It enables nothing. The flag ships disabled, the cohort
-- mode ships 'off' and the cohort table ships empty, so after applying this
-- migration every new session is created on the legacy model exactly as before.
-- It wires and proves the mechanism; ADR-006 Amendment C5 records why a real
-- cohort waits for step 7 — a target-model sitting is not fully readable until
-- the transition-period read dispatch exists, and routing a learner onto it
-- before then would strand them.
--
-- It also touches no legacy path. `create_exam_session`, `exam_responses` and
-- `record_exam_attempt` are unchanged, and an in-cohort learner who calls the
-- legacy RPC directly still gets a legacy session — which is safe, because a
-- session created legacy stays legacy and that is the invariant, not "the
-- cohort is obeyed by every caller".
--
-- WHY THE GATE MOVES INTO THE DATABASE. ADR-005 §2 originally put the cohort in
-- an environment variable and said the flag is "deliberately not a database
-- table". That cannot hold: `create_assessment_session` is granted to
-- `authenticated` because the application calls it with the learner's own JWT,
-- so PostgREST exposes it to every signed-in client directly. A cohort in the
-- Next server's environment governs our routes and says nothing about a caller
-- who never passes through them. Only a flag the function itself reads can
-- decide the routing for every caller — which is what this migration builds, and
-- what ADR-006 Amendment C1 records as superseding ADR-005 §2.

-- ---------------------------------------------------------------------------
-- The cohort, attached to the flag that already exists
-- ---------------------------------------------------------------------------
-- `platform_flags.target_session_model` (20260812120000) stays THE flag. This
-- adds the cohort dimension to it rather than introducing a second switch:
-- three names for one flag was the failure this step exists to end, so there is
-- one row, one predicate, and one kill switch.
--
-- `enabled` remains the master switch and keeps its meaning exactly: false means
-- legacy for everyone, whatever the cohort says. That is deliberate — a rollback
-- must be one unambiguous action, not "set the mode to off, and also remember to
-- empty the table".
alter table public.platform_flags
  add column cohort_mode text not null default 'off';

alter table public.platform_flags
  add constraint platform_flags_cohort_mode_known
    check (cohort_mode in ('off', 'student_ids', 'all'));

comment on column public.platform_flags.cohort_mode is
  'Scope of a flag that is enabled: off = nobody, student_ids = the rows in assessment_cutover_cohort, all = everyone. Ignored entirely when enabled is false, so a rollback is one action (spec §12.7 step 6, ADR-006 Amendment C2).';

-- The named-student cohort. A table rather than a list in a column so that
-- adding one student is an INSERT that can be audited and reverted, not a
-- rewrite of a delimited string that has to be parsed correctly by whoever
-- reads it next.
create table public.assessment_cutover_cohort (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  added_at   timestamptz not null default now(),
  -- Who decided, and why. A cohort membership is a decision about a real child's
  -- sitting; it should not be possible to find a row here and be unable to say
  -- where it came from.
  note       text
);

alter table public.assessment_cutover_cohort enable row level security;
revoke all on public.assessment_cutover_cohort from anon, authenticated;
-- No policy, deliberately, exactly as for platform_flags: with RLS on and no
-- policy the table is invisible to every role that does not bypass RLS, and the
-- only readers that need it are the SECURITY DEFINER predicates below. A learner
-- cannot discover whether they — or anyone else — are in the cohort.

comment on table public.assessment_cutover_cohort is
  'Named students routed to the version-pinned model when platform_flags.target_session_model is enabled with cohort_mode = student_ids (spec §12.7 step 6). Empty on ship. RLS on, no policy, no learner privileges.';

-- ---------------------------------------------------------------------------
-- The single routing predicate
-- ---------------------------------------------------------------------------
-- One function answers "which storage model does a NEW session for this student
-- use". Everything else — the create RPC, the application, the tests — asks this
-- and nothing asks anything else, so the app and the database cannot disagree
-- about the answer. That is the point of collapsing to one source: not tidiness,
-- but the absence of a second opinion.
--
-- SECURITY DEFINER because it reads platform_flags and assessment_cutover_cohort,
-- which have RLS on and no policies. It takes the student as a parameter rather
-- than reading auth.uid() itself so the backfill, tests and operational scripts
-- can ask about a specific learner — and for exactly that reason it is NOT
-- granted to `authenticated`: a learner able to call it with an arbitrary uuid
-- could probe who is in the cohort. Learners get the caller-scoped wrapper below.
create or replace function public.session_storage_model_for(p_student uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    /* No caller, no target path. Fails closed. */
    when p_student is null then 'legacy'
    when not exists (
      select 1 from public.platform_flags f
      where f.key = 'target_session_model' and f.enabled
    ) then 'legacy'
    when exists (
      select 1 from public.platform_flags f
      where f.key = 'target_session_model' and f.enabled and f.cohort_mode = 'all'
    ) then 'version_pinned'
    when exists (
      select 1 from public.platform_flags f
      where f.key = 'target_session_model' and f.enabled and f.cohort_mode = 'student_ids'
    ) and exists (
      select 1 from public.assessment_cutover_cohort c where c.student_id = p_student
    ) then 'version_pinned'
    /* Includes cohort_mode = 'off' and any unrecognised state: legacy. Every
       branch that is not an explicit yes is a no. */
    else 'legacy'
  end;
$$;

-- What the application asks. Scoped to auth.uid() so it answers only about the
-- caller, and therefore safe to grant to `authenticated`.
create or replace function public.session_storage_model_for_caller()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.session_storage_model_for(auth.uid());
$$;

revoke all on function public.session_storage_model_for(uuid) from public, anon, authenticated;
revoke all on function public.session_storage_model_for_caller() from public, anon;
grant execute on function public.session_storage_model_for_caller() to authenticated;

comment on function public.session_storage_model_for(uuid) is
  'The single routing predicate for spec §12.7 step 6: which storage model a NEW session for this student uses. Not granted to authenticated — an arbitrary-uuid caller could probe cohort membership; learners use session_storage_model_for_caller().';

-- ---------------------------------------------------------------------------
-- The routing decision, recorded on the session and frozen there
-- ---------------------------------------------------------------------------
-- ADR-005 §1 argued that presence is the discriminator and a storage_model
-- column is unnecessary. That is still true as an inference, and the column is
-- still added, for the reason ADR-006 Amendment C4 records: it gives §12.7's
-- "once created, a session never changes storage model" something to bind to.
-- An inference cannot be made immutable; a column with a check constraint and a
-- trigger can.
--
-- On this table it can only ever hold 'version_pinned' — the check says so — and
-- that redundancy is accepted deliberately. A column that can hold one value and
-- cannot be changed is an enforcement point, not a record.
alter table public.assessment_sessions
  add column storage_model text not null default 'version_pinned';

alter table public.assessment_sessions
  add constraint assessment_sessions_storage_model_is_target
    check (storage_model = 'version_pinned');

comment on column public.assessment_sessions.storage_model is
  'The storage model chosen at creation (spec §12.7 step 6). Always version_pinned on this table — a legacy sitting is an exam_sessions row instead — and immutable: assessment_sessions_transition_guard refuses any change, which is where ADR-005 §1''s "a session never changes storage model" is actually enforced.';

-- The transition guard gains one clause. Everything else about it is unchanged;
-- it is restated in full because that is what `create or replace` requires, and
-- restating it is safer than a second trigger whose ordering relative to this
-- one would then matter.
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

  -- §12.7 step 6: "Once created, a session never changes storage model." The
  -- check constraint already limits this column to one value on this table, so
  -- this clause is what would fire if that constraint were ever widened —
  -- which is precisely when the invariant would otherwise quietly stop holding.
  if new.storage_model is distinct from old.storage_model then
    raise exception 'storage_model is fixed at creation; a session never changes storage model'
      using errcode = 'MM207';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_assessment_session, gated on the predicate rather than the bare flag
-- ---------------------------------------------------------------------------
-- Restated in full because `create or replace` requires it. Exactly two things
-- changed from 20260812120000: the gate now asks session_storage_model_for()
-- instead of reading platform_flags.enabled directly, so the cohort is honoured
-- for every caller; and the row records its own storage_model. Everything else —
-- the pins, the allocation, the idempotency handling, the ledger write — is
-- unchanged, and 20260812120000 remains the place to read about it.
create or replace function public.create_assessment_session(
  p_config jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_endpoint      constant text := 'assessment.sessions.create';
  /* The Phase 2 fixed-delivery pins (§12.3). Constants rather than parameters:
     a version a caller can choose is not a pin. They are text literals rather
     than lookups because framework_versions, blueprint_versions and
     assessment_profile_versions are Phase 3 tables that do not exist yet
     (ADR-006 §1) — Phase 3 replaces each of these with a real reference, and
     the sessions created before then stay honest because they name the
     placeholder they were actually created under rather than a version that
     was never consulted. */
  c_profile_version  constant text := 'phase2-fixed-profile.v1';
  c_framework_version constant text := 'phase2-fixed-framework.v1';
  c_blueprint_version constant text := 'phase2-unblueprinted.v1';
  c_taxonomy_version  constant text := 'phase2-untaxonomised.v1';
  c_engine_version    constant text := 'fixed_scope_seeded.v1';
  /* The one pin that must be right today (§14.2, and 20260812100000's header):
     the scoring module refuses a version it does not implement rather than
     scoring with an algorithm the session was never sat under. */
  c_scoring_version   constant text := 'question-scorers.v1';
  /* Spec §18's upper bound on a paper, matching examSelectionConfigSchema's
     `questionCount` max so the two cannot disagree about what is pathological. */
  c_max_items     constant integer := 200;
  /* An untimed sitting still has to expire — an unbounded session is a row that
     can never be reconciled or reaped (§17.5). */
  c_untimed_ttl   constant interval := interval '24 hours';
  /* The same shape of grace window the legacy timed path uses (TIMED_GRACE_SECONDS). */
  c_timed_grace   constant integer := 300;

  v_student       uuid := auth.uid();
  v_request_hash  text;
  v_stored        public.idempotency_keys%rowtype;
  v_seed          text;
  v_year_level    smallint;
  v_exam_style    text;
  v_subject       text;
  v_limit         integer;
  v_timed         boolean;
  v_version_ids   uuid[];
  v_estimated     integer;
  v_content_build text;
  v_session_id    uuid;
  v_expires_at    timestamptz;
  v_response      jsonb;
begin
  if v_student is null then
    raise exception 'create_assessment_session requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = v_student and p.role = 'student'
  ) then
    raise exception 'only a student may create an assessment session'
      using errcode = 'MM002';
  end if;

  /* THE ROUTING GATE, and the reason it lives here rather than in the route.
     This function is granted to `authenticated`, so PostgREST exposes it to
     every signed-in client. A cohort held in the application's environment
     decides what our routes do and says nothing about what happens when a
     learner calls this directly. So the decision is taken here, from the
     database's own flag, and an out-of-cohort caller gets MM210 no matter how
     the request was shaped (ADR-006 Amendment C1). */
  if public.session_storage_model_for(v_student) <> 'version_pinned' then
    raise exception 'the version-pinned session model is not enabled for this student'
      using errcode = 'MM210';
  end if;

  -- §18: "Write endpoints that can be safely retried MUST accept an idempotency
  -- key. Reusing a key with a different request hash MUST fail." jsonb is
  -- already canonical — Postgres normalises key order and whitespace on input —
  -- so md5 over its text form is a stable hash of the request rather than of
  -- however the client happened to serialise it.
  v_request_hash := md5(p_config::text);

  insert into public.idempotency_keys (actor_id, endpoint, key, request_hash)
  values (v_student, c_endpoint, p_idempotency_key, v_request_hash)
  on conflict (actor_id, endpoint, key) do nothing;

  if not found then
    /* Either a genuine replay, or a concurrent first call that has already
       committed. A concurrent call still IN FLIGHT blocks the insert above on
       the primary key until it commits or rolls back, so by the time control
       reaches here the winner's row is visible with its response. */
    select * into v_stored from public.idempotency_keys
    where actor_id = v_student and endpoint = c_endpoint and key = p_idempotency_key;

    if v_stored.request_hash is distinct from v_request_hash then
      raise exception 'idempotency key % was used with a different request', p_idempotency_key
        using errcode = 'MM211';
    end if;

    if v_stored.response_body is null then
      /* The first attempt claimed the key and then failed after committing the
         claim, which this function's single transaction should make impossible.
         Raising beats returning null: a caller that retried into this state
         needs a new key, not a session it cannot identify. */
      raise exception 'idempotency key % has no stored response', p_idempotency_key
        using errcode = 'MM213';
    end if;

    return v_stored.response_body;
  end if;

  -- Server-chosen and unpredictable. This is the property that stops a learner
  -- predicting their own paper even though they choose its scope; a seed that
  -- came from the request would make the selection below reproducible by the
  -- person being examined.
  v_seed := gen_random_uuid()::text;

  /* 'mixed' means "do not filter on this axis", matching
     examSelectionConfigSchema. An unrecognised value is not rejected here: it
     simply matches nothing and falls out as MM212 below, which is the
     fail-closed direction. */
  v_year_level := nullif(p_config->>'yearLevel', 'mixed')::smallint;
  v_exam_style := nullif(p_config->>'examStyle', 'mixed');
  v_subject    := nullif(p_config->>'subject', 'mixed');
  v_limit      := least(coalesce(nullif(p_config->>'questionCount', 'full')::integer, c_max_items),
                        c_max_items);
  v_timed      := coalesce(p_config->>'timing', 'timed') = 'timed';

  if v_limit < 1 then
    raise exception 'a session must contain at least one item'
      using errcode = 'MM212';
  end if;

  /* THE ALLOCATION. Three properties are worth naming because each is load-
     bearing rather than incidental:

       * `distinct on (item_id) ... order by revision desc` serves the current
         revision of each item and never two revisions of the same question —
         which assessment_session_items_item_once_per_session would reject
         anyway, but as an error rather than as a paper.
       * the join to item_answer_versions is not decoration: an item with no
         answer row cannot be scored, and allocating one would produce a
         sitting that can be sat and not marked. Unscoreable content is not
         eligible content.
       * ordering by md5(seed || content_hash) is deterministic given the seed,
         so the same seed reproduces the same paper — which is what makes the
         allocation replayable from the ledger rather than merely recorded in
         it. content_hash breaks ties so the order is total. */
  with latest as (
    select distinct on (iv.item_id)
           iv.id, iv.item_id, iv.content_hash, iv.estimated_time_seconds
    from public.item_versions iv
    join public.items i on i.id = iv.item_id
    where i.retired_at is null
      and (v_year_level is null or iv.source_year_level = v_year_level)
      and (v_exam_style is null or iv.source_exam_style = v_exam_style)
      and (v_subject    is null or iv.source_subject    = v_subject)
    order by iv.item_id, iv.revision desc
  ),
  eligible as (
    select l.id, l.content_hash, l.estimated_time_seconds
    from latest l
    join public.item_answer_versions a on a.item_version_id = l.id
    order by md5(v_seed || l.content_hash), l.content_hash
    limit v_limit
  ),
  ordered as (
    select e.id, e.estimated_time_seconds,
           row_number() over (order by md5(v_seed || e.content_hash), e.content_hash) as ord
    from eligible e
  )
  select array_agg(o.id order by o.ord), coalesce(sum(o.estimated_time_seconds), 0)
  into v_version_ids, v_estimated
  from ordered o;

  if v_version_ids is null or cardinality(v_version_ids) = 0 then
    raise exception 'no eligible published content for the requested scope'
      using errcode = 'MM212';
  end if;

  /* §12.3's "content publication/build version". Phase 1 records no build
     identity — the projection stamps rows, not builds — so the honest pin is a
     digest of what is actually projected right now, computed the same way for
     every session so two sessions created against the same bank agree. It is a
     full scan of item_versions' hashes; at the current ~1.3k rows that is
     negligible, and Phase 3 should replace it with a recorded build id rather
     than let it grow into a per-create table scan. */
  select md5(string_agg(iv.content_hash, ',' order by iv.content_hash))
  into v_content_build
  from public.item_versions iv;

  /* Timed sittings expire on the content's own estimated time plus the same
     grace the legacy path allows; untimed ones still expire, just generously.
     Phase 3's assessment profile version owns durations properly — this is the
     interim rule, and it is derived from pinned content rather than from a
     request parameter a learner could inflate. */
  v_expires_at := now() + case
    when v_timed then make_interval(secs => v_estimated + c_timed_grace)
    else c_untimed_ttl
  end;

  insert into public.assessment_sessions (
    student_id, assessment_profile_version, framework_version, blueprint_version,
    taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
    content_build_version, delivery_mode, seed, config, expires_at, storage_model
  ) values (
    v_student, c_profile_version, c_framework_version, c_blueprint_version,
    c_taxonomy_version, c_engine_version, c_scoring_version,
    v_content_build, 'fixed', v_seed, p_config, v_expires_at,
    /* Stated, not inferred (ADR-006 Amendment C4). The transition guard refuses
       to change it afterwards, which is what makes "a session never changes
       storage model" a schema fact rather than a claim. */
    'version_pinned'
  )
  returning id into v_session_id;

  -- §12.4's ledger. Written in the same transaction as the session, which is
  -- what makes assessment_sessions_unversioned_only_from_legacy true by
  -- construction: a natively created session cannot exist without its pins.
  insert into public.assessment_session_items (
    session_id, global_ordinal, stage_number, within_stage_ordinal,
    item_id, item_version_id, content_hash, stimulus_id, stimulus_version_id,
    allocation_reason, allocation_decision, seed
  )
  select
    v_session_id, o.ord, 1, o.ord,
    iv.item_id, iv.id, iv.content_hash, sv.stimulus_id, iv.stimulus_version_id,
    'fixed_blueprint_selection',
    jsonb_build_object(
      'engineAlgorithmVersion', c_engine_version,
      'requestedCount', v_limit,
      'scope', jsonb_build_object(
        'yearLevel', v_year_level, 'examStyle', v_exam_style, 'subject', v_subject
      )
    ),
    v_seed
  from unnest(v_version_ids) with ordinality as o(version_id, ord)
  join public.item_versions iv on iv.id = o.version_id
  left join public.stimulus_versions sv on sv.id = iv.stimulus_version_id;

  v_response := jsonb_build_object(
    'sessionId', v_session_id,
    'status', 'created',
    'version', 1,
    'itemCount', cardinality(v_version_ids),
    'expiresAt', v_expires_at,
    'storageModel', 'version_pinned',
    'scoringAlgorithmVersion', c_scoring_version,
    'engineAlgorithmVersion', c_engine_version,
    'contentBuildVersion', v_content_build
  );

  update public.idempotency_keys
  set response_status = 201, response_body = v_response
  where actor_id = v_student and endpoint = c_endpoint and key = p_idempotency_key;

  return v_response;
end;
$$;
