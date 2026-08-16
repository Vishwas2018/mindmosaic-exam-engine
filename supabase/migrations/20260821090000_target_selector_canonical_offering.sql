-- Gate A item A11 (docs/phase2-cutover-readiness-checklist.md; external
-- review #7): the target selector compared the raw config `subject` filter
-- straight against `item_versions.source_subject`, with none of
-- `SUBJECTS_BY_FILTER`'s mapping (src/features/exam-engine/selection/
-- select-questions.ts) applied — so a `language` paper, whose bank subject is
-- `language_conventions`, matched zero rows and fell through to the generic
-- "no eligible content" refusal. It also never checked whether the requested
-- (examStyle, yearLevel) pair is a real sitting at all — NAPLAN Year 4 fell
-- through to the exact same generic refusal a genuine coverage gap would, so
-- the two were indistinguishable from the caller's side.
--
-- Restated in full because `create or replace` requires it. Two things
-- changed from 20260812160000: the subject filter is resolved through a
-- canonical mapping before it reaches the content query, mirroring
-- `REGISTRY_SUBJECT_BY_FILTER` (src/features/exam-engine/selection/
-- selection-config.ts) — the one place TypeScript states "language" means
-- `language_conventions`; and an (examStyle, yearLevel) pair that is not a
-- real sitting is refused explicitly, before the allocation query runs,
-- mirroring `EXAM_STYLE_YEAR_LEVELS` (src/features/taxonomy/year-registry.ts)
-- — NAPLAN sits Years 3/5/7/9 only, ICAS sits Years 2-12. Everything else —
-- the pins, the idempotency handling, the ledger write, the cohort gate — is
-- unchanged, and 20260812120000/20260812160000 remain the place to read
-- about those.
--
-- SHARED WITH TS, NOT IMPORTED FROM IT. Postgres cannot import a TypeScript
-- module, so both tables are restated here as literal SQL and the two are
-- kept honest by src/tests/unit/target-selector-offering.test.ts, which reads
-- `REGISTRY_SUBJECT_BY_FILTER` and `EXAM_STYLE_YEAR_LEVELS` at test time and
-- asserts every entry this function hard-codes still agrees with them — so a
-- change to either TS source without a matching edit here fails the fast
-- suite instead of drifting silently.
--
-- New error code, continuing the series this migration's predecessors use:
--
--   MM229  requested (examStyle, yearLevel) is not a real sitting
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

  v_student        uuid := auth.uid();
  v_request_hash   text;
  v_stored         public.idempotency_keys%rowtype;
  v_seed           text;
  v_year_level     smallint;
  v_exam_style     text;
  v_subject_filter text;
  v_subject        text;
  v_limit          integer;
  v_timed          boolean;
  v_version_ids    uuid[];
  v_estimated      integer;
  v_content_build  text;
  v_session_id     uuid;
  v_expires_at     timestamptz;
  v_response       jsonb;
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
     examSelectionConfigSchema. */
  v_year_level     := nullif(p_config->>'yearLevel', 'mixed')::smallint;
  v_exam_style     := nullif(p_config->>'examStyle', 'mixed');
  v_subject_filter := nullif(p_config->>'subject', 'mixed');
  v_limit          := least(coalesce(nullif(p_config->>'questionCount', 'full')::integer, c_max_items),
                        c_max_items);
  v_timed          := coalesce(p_config->>'timing', 'timed') = 'timed';

  if v_limit < 1 then
    raise exception 'a session must contain at least one item'
      using errcode = 'MM212';
  end if;

  /* THE OFFERING BOUNDARY (Gate A item A11), checked before any content is
     queried. Mirrors EXAM_STYLE_YEAR_LEVELS verbatim
     (src/features/taxonomy/year-registry.ts): NAPLAN sits Years 3/5/7/9 only,
     ICAS sits Years 2-12. A pinned year outside the pinned style's list is not
     a sitting that exists, so it is refused by name (MM229) rather than left
     to fall through to MM212's generic "no eligible content", which a real
     coverage gap would raise identically — collapsing "this offering does not
     exist" into "we have no content for it yet" is exactly what external
     review #7 flagged.

     Only the two known real styles are validated against the matrix. An
     exam_style outside {naplan_style, icas_style} — including 'mixed', which
     nullif already turned into NULL above — is not part of
     EXAM_STYLE_YEAR_LEVELS at all, so there is nothing in that table to check
     it against, and it falls through to the content query exactly as before.
     `source_exam_style` is free text, not an enum, and this column has a
     legitimate non-app caller: the RLS harness scopes its content to a style
     no real bank data uses, to isolate fixtures without touching the shared
     bank (tests/rls/target-sitting-end-to-end.test.ts) — the same posture the
     subject mapping below takes for a filter value it doesn't recognise,
     except subject routes an unrecognised value to a sentinel that matches
     nothing, where an unrecognised style simply skips the pre-check. */
  if v_exam_style = 'naplan_style' and v_year_level is not null and v_year_level not in (3, 5, 7, 9) then
    raise exception '% is not sat at year %', v_exam_style, v_year_level
      using errcode = 'MM229';
  elsif v_exam_style = 'icas_style' and v_year_level is not null and v_year_level not between 2 and 12 then
    raise exception '% is not sat at year %', v_exam_style, v_year_level
      using errcode = 'MM229';
  end if;

  /* THE CANONICAL SUBJECT MAPPING (Gate A item A11). Mirrors
     REGISTRY_SUBJECT_BY_FILTER verbatim (src/features/exam-engine/selection/
     selection-config.ts): the filter is called "language" but the bank's
     subject is `language_conventions`, and the two vocabularies need a
     stated mapping rather than a cast — exactly as the TS comment for that
     constant says. A filter value outside the six known ones (and not
     'mixed', already handled above) maps to a sentinel no real
     source_subject can ever equal, which keeps the existing fail-closed
     behaviour: an unrecognised subject matches nothing and falls out as
     MM212, the same way it always has. */
  -- A searched CASE, deliberately: a simple `case v_subject_filter when ...`
  -- can never match a `when null` branch (`NULL = anything` is never true in
  -- SQL), so 'mixed' would fall through to the unrecognised-value sentinel
  -- below instead of staying NULL — turning "no filter" into "match nothing".
  v_subject := case
    when v_subject_filter is null           then null
    when v_subject_filter = 'numeracy'             then 'numeracy'
    when v_subject_filter = 'reading'               then 'reading'
    when v_subject_filter = 'language'              then 'language_conventions'
    when v_subject_filter = 'science'                then 'science'
    when v_subject_filter = 'digital_technologies'  then 'digital_technologies'
    when v_subject_filter = 'spelling'               then 'spelling'
    else '__mm_a11_unrecognised_subject_filter__'
  end;

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

comment on function public.create_assessment_session(jsonb, text) is
  'Version-pinned session create (spec §12.3-§12.5, §17.2, §18; ADR-006/007). Gated on session_storage_model_for() (20260812160000) rather than the bare cutover flag, so the cohort predicate applies to every caller. Resolves the subject filter through the canonical mapping and refuses an (examStyle, yearLevel) pair that is not a real sitting before it queries content (Gate A item A11, 20260821090000). See that migration for the offering boundary and 20260812120000 for the allocation/idempotency mechanics.';
