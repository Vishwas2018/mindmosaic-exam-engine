-- Phase 2 step 2b, part 2: the version-pinned create + serve path for a fixed
-- signed-in session (spec §12.3, §12.4, §17.1, §17.2, §18; ADR-006, ADR-007).
--
-- 20260812100000 built the tables and wrote in its own header that "the RPCs
-- that will drive the target path arrive in the next migration". This is that
-- migration, and it is deliberately only two functions: one that creates a
-- session and pins everything it is sitting, and one that hands the learner
-- back the candidate content for a session they own. Nothing here submits,
-- scores or marks — scoring is the isolated module of §9.3.1, and it holds a
-- credential this migration never mentions.
--
-- THE ONE THING THIS PATH DOES DIFFERENTLY FROM THE LEGACY ONE. On the legacy
-- path (20260811090000) the route selects the paper in TypeScript and passes
-- `p_selected_question_ids` into `create_exam_session`, which stores it
-- unexamined. That function is granted to `authenticated`, so PostgREST will
-- accept the same call from a learner's own JWT: the array that decides which
-- questions they sit is a request parameter. The route is the only thing
-- choosing the paper, and the database cannot tell the route's array from a
-- forged one.
--
-- Spec §17.2 says client-provided item IDs and allocation metadata MUST NOT be
-- trusted, so this function takes no item list at all. It selects the paper
-- itself, from the projected bank, under a seed it generates. There is no
-- parameter a caller could fill in to influence *which* items are served —
-- only the scope (year/style/subject/count) the learner legitimately chooses,
-- exactly as they do in the configurator.
--
-- WHY A NEW SELECTION ALGORITHM RATHER THAN THE EXISTING ONE. The TypeScript
-- selector (src/features/exam-engine/selection) stays where it is: it serves
-- the legacy path and the guest path, and restating it in SQL would repeat the
-- mistake ADR-006 Amendment A declined to make for the scorer. So this is not a
-- translation of it — it is a smaller, different algorithm, named
-- `fixed_scope_seeded.v1` and pinned as such on every session it creates, whose
-- whole definition is "every non-retired, currently-published, scoreable item
-- in scope, ordered by a server-chosen seed, first N". It is blueprint-blind
-- because blueprints are Phase 3 (spec §21). When Phase 3 lands, form-driven
-- selection replaces this and pins a different engine_algorithm_version; the
-- sessions this created stay interpretable because they carry the name of the
-- algorithm that actually produced them.
--
-- ERROR CODES, continuing the series 20260811090000 and 20260812100000 use:
--
--   MM001  no authenticated caller
--   MM002  caller is not a student
--   MM003  session absent or not the caller's
--   MM210  target session model disabled by the cutover flag
--   MM211  idempotency key replayed with a different request
--   MM212  no eligible content for the requested scope
--   MM213  idempotency record exists but carries no stored response

-- ---------------------------------------------------------------------------
-- platform_flags — the server-side cutover switch (§12.7 step 6)
-- ---------------------------------------------------------------------------
-- §12.7 step 6 requires a *server-side* feature flag to choose the storage
-- model for a newly created session. An environment variable read by the Next
-- server would satisfy the letter of that and not the substance: this function
-- must be granted to `authenticated` for the application to call it at all (the
-- app connects with the learner's own JWT), and PostgREST therefore exposes it
-- to every signed-in client directly. A flag that lives only in application
-- code would leave "the target model is switched off" true of our routes and
-- false of the database.
--
-- So the switch lives here, where the function itself reads it, and the
-- TypeScript flag in src/server/assessment/storage-model.ts is the second of
-- two gates rather than the only one. Disabling either stops new target-model
-- sessions; this one stops them for every caller, including a hand-rolled
-- PostgREST request.
--
-- Rollback (spec §25.9) is `update public.platform_flags set enabled = false
-- where key = 'target_session_model'`. It affects new sessions only: §12.7 is
-- explicit that a session never changes storage model, so sessions already
-- created here keep running — which is why the read function below is
-- deliberately NOT gated on this flag.
create table public.platform_flags (
  key         text        primary key,
  enabled     boolean     not null default false,
  description text        not null,
  updated_at  timestamptz not null default now()
);

insert into public.platform_flags (key, enabled, description) values
  ('target_session_model', false,
   'Spec §12.7 step 6. When true, public.create_assessment_session may create version-pinned sessions on the target model. Off until the Phase 2 cutover; flipping it back to false stops new target-model sessions and leaves existing ones running.');

alter table public.platform_flags enable row level security;
revoke all on public.platform_flags from anon, authenticated;
-- No policy, deliberately: with RLS on and no policy the table is invisible to
-- every role that does not bypass RLS, and the only reader that needs it is the
-- SECURITY DEFINER function below, which runs as the owner. A learner cannot
-- read the flag, let alone set it.

-- ---------------------------------------------------------------------------
-- create_assessment_session — allocate, pin, and record (§12.3, §12.4)
-- ---------------------------------------------------------------------------
-- student_id is not a parameter, for the same reason it is not one on
-- create_exam_session: it comes from auth.uid() inside the function, so a
-- caller cannot name anybody but themselves however the request is shaped.
--
-- Returns the response body as jsonb rather than a bare uuid so that a replayed
-- idempotency key can return the *same body* (§18) instead of a value the
-- caller has to re-derive. The body deliberately does not contain the candidate
-- items: they are fetched with get_assessment_session below. Storing a paper's
-- worth of content in idempotency_keys.response_body would put learner-facing
-- content in a second place with its own 24-hour lifetime (§17.5), to no end —
-- replaying the key returns the same session id, and the same session id
-- returns the same items.
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

  if not exists (
    select 1 from public.platform_flags f
    where f.key = 'target_session_model' and f.enabled
  ) then
    raise exception 'the version-pinned session model is not enabled'
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
    content_build_version, delivery_mode, seed, config, expires_at
  ) values (
    v_student, c_profile_version, c_framework_version, c_blueprint_version,
    c_taxonomy_version, c_engine_version, c_scoring_version,
    v_content_build, 'fixed', v_seed, p_config, v_expires_at
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

-- ---------------------------------------------------------------------------
-- get_assessment_session — the sanitized candidate allocation (§17.1, §18)
-- ---------------------------------------------------------------------------
-- §17.1: a learner "MAY fetch only candidate content allocated to their
-- accessible session", and 20260812100000 left assessment_session_items with no
-- learner privileges precisely so that this is the only way to reach it.
--
-- NOT gated on the cutover flag, deliberately. §12.7's rollback rule is that a
-- session never changes storage model and sessions already created on the
-- target model complete there; a read that switched off with the flag would
-- strand exactly the sittings the rule exists to protect.
--
-- THE COLUMNS ARE LISTED, NEVER SPREAD. `to_jsonb(iv.*)` here would be one
-- future `alter table` away from shipping an answer column to a learner, and
-- §18 requires candidate DTOs to *structurally* omit private fields. item_versions
-- holds no answer today (§9.3 put them in another table) and this query still
-- names its columns, because "the other table has them" is an argument about
-- the schema as it currently stands and this is a boundary that has to hold
-- against the schema as it will be.
create or replace function public.get_assessment_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_student uuid := auth.uid();
  v_session public.assessment_sessions%rowtype;
  v_items   jsonb;
begin
  if v_student is null then
    raise exception 'get_assessment_session requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  -- Ownership re-derived here rather than taken on trust. Parents and teachers
  -- read *results* through RLS on assessment_sessions/assessment_results; the
  -- candidate paper is the sitter's alone, so this is deliberately narrower
  -- than the read policies on the session row.
  select * into v_session
  from public.assessment_sessions s
  where s.id = p_session_id and s.student_id = v_student;

  if not found then
    raise exception 'no such assessment session for this caller'
      using errcode = 'MM003';
  end if;

  select coalesce(jsonb_agg(item order by ordinal), '[]'::jsonb)
  into v_items
  from (
    select
      si.global_ordinal as ordinal,
      jsonb_build_object(
        'sessionItemId', si.id,
        'ordinal', si.global_ordinal,
        'itemCode', i.item_code,
        'questionType', iv.question_type,
        'prompt', iv.prompt,
        'candidateContent', iv.candidate_content,
        'visuals', iv.visuals,
        'accessibility', iv.accessibility,
        'marksAvailable', iv.marks_available,
        'estimatedTimeSeconds', iv.estimated_time_seconds,
        'stimulus', sv.content
      ) as item
    from public.assessment_session_items si
    join public.item_versions iv on iv.id = si.item_version_id
    join public.items i on i.id = si.item_id
    left join public.stimulus_versions sv on sv.id = si.stimulus_version_id
    where si.session_id = p_session_id
  ) allocated;

  return jsonb_build_object(
    'sessionId', v_session.id,
    'status', v_session.status,
    'version', v_session.version,
    'config', v_session.config,
    'createdAt', v_session.created_at,
    'expiresAt', v_session.expires_at,
    'scoringAlgorithmVersion', v_session.scoring_algorithm_version,
    'items', v_items
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Both are called by the signed-in student through the route handlers, so
-- `authenticated` keeps EXECUTE and anon/PUBLIC are stripped — the same
-- posture, and the same anon-is-named-explicitly caveat, as 20260811090000:
-- EXECUTE is granted to PUBLIC by default on a new function and this project's
-- local stack additionally grants it per-role via ALTER DEFAULT PRIVILEGES, so
-- `revoke ... from public` alone would not remove it.
--
-- Granting create to `authenticated` is safe in a way create_exam_session is
-- not, because it takes no item list: the worst a hand-rolled PostgREST call
-- can do is create a session for the caller themselves, in a scope they could
-- have chosen in the UI, from a paper the server picked — and only while the
-- cutover flag is on.
revoke all on function public.create_assessment_session(jsonb, text) from public, anon;
grant execute on function public.create_assessment_session(jsonb, text) to authenticated;

revoke all on function public.get_assessment_session(uuid) from public, anon;
grant execute on function public.get_assessment_session(uuid) to authenticated;

comment on function public.create_assessment_session(jsonb, text) is
  'Creates a version-pinned fixed session (spec §12.3/§12.4). Takes no item list: the paper is selected here under a server-generated seed, so no caller can choose or predict it (§17.2). Gated by platform_flags.target_session_model (§12.7 step 6). Idempotent per (actor, endpoint, key) (§18).';

comment on function public.get_assessment_session(uuid) is
  'The sanitized candidate allocation for a session the caller owns (spec §17.1, §18). Columns are listed explicitly and never spread, so no answer field can ever ride along. Deliberately not gated on the cutover flag: a rolled-back flag must not strand sessions already created on the target model.';

comment on table public.platform_flags is
  'Server-side cutover switches (spec §12.7 step 6). RLS on, no policy, no anon/authenticated privileges: read only by SECURITY DEFINER functions. Setting target_session_model to false stops new target-model sessions and leaves existing ones running.';
