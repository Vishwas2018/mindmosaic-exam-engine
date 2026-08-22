-- Phase 3 step 1, part 3: wire a NEW session's pin to a real
-- assessment_profile_version by FK (spec §12.3), additively.
--
-- `assessment_sessions.assessment_profile_version` (the placeholder text
-- column, FK-constrained to config_pin_registry by 20260822100000) is
-- UNCHANGED: same name, same type, same value
-- ('phase2-fixed-profile.v1'), still written on every insert. Nothing reads
-- or writes it differently. This migration ADDS
-- `assessment_profile_version_id`, a nullable FK to the real
-- `assessment_profile_versions` row 20260823100000 seeded for the offering
-- the session actually matched. Additive means additive: every existing row
-- keeps its text pin exactly as before; every legacy-backfilled row leaves
-- the new column null (the backfill function is not touched by this
-- migration); a native session created under a request that does not
-- resolve to exactly one concrete (examStyle, yearLevel, subject) offering
-- -- 'mixed' on any axis, or an exam_style outside the two seeded families
-- -- also leaves it null, honestly, rather than guessing which of several
-- possible offerings it meant.
--
-- Once resolved, the FK transitively pins framework + blueprint + offering:
-- assessment_profile_versions.framework_version_id and .blueprint_version_id
-- are themselves FKs to immutable rows (20260823090000), and
-- .programme_offering_id is the FK to the exact programme_offerings row
-- (A16) that request matched. One column, four things pinned.
--
-- WHY THE TEXT PIN STAYS AUTHORITATIVE FOR EVERYTHING ELSE. taxonomy_version
-- and engine_algorithm_version have no Phase 3 table yet (this pass is
-- scoped to framework/blueprint/profile only -- forms and the capacity
-- simulator, spec §10.4/§13.4, are the next steps). Rewiring only the one
-- pin this pass actually built real tables for, and leaving the rest on
-- config_pin_registry, is what "additive" means in practice: nothing about
-- the other five pins changes here.
--
-- HOW THE OFFERING RESOLVES TO A PROFILE. create_assessment_session already
-- computes the canonical subject id and checks the (examStyle, yearLevel,
-- subject) triple against programme_offerings (20260822090000, Gate A item
-- A16). This migration's only change to that function is capturing WHICH
-- offering row matched (previously only existence was checked) and, when
-- one did, looking up the single non-withdrawn assessment_profile_versions
-- row for it -- `assessment_profile_versions_current_per_offering`
-- (20260823090000) guarantees at most one, so this is a plain lookup, never
-- a tie-break rule invented here.

alter table public.assessment_sessions
  add column assessment_profile_version_id uuid
    references public.assessment_profile_versions (id) on delete restrict;

comment on column public.assessment_sessions.assessment_profile_version_id is
  'Spec §12.3 pin, real FK (ADR-004 accepted, option 1). Transitively pins framework_version_id, blueprint_version_id and programme_offering_id via assessment_profile_versions. Nullable: null for every legacy-backfilled session and for a native session whose request did not resolve to exactly one concrete offering. The text assessment_profile_version column is unchanged and still authoritative for every session this column is null on.';

-- Restated in full because `create or replace` requires it. The only
-- functional change from 20260822090000: v_offering_id is captured from the
-- subject-scoped existence check (previously discarded), and when it
-- resolves, v_profile_version_id is looked up and inserted alongside the six
-- existing text pins. Nothing else -- the pins, idempotency handling,
-- ledger write, cohort gate, allocation query -- changes.
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
     a version a caller can choose is not a pin. taxonomy_version and
     engine_algorithm_version stay text literals -- no Phase 3 table for
     either yet, this pass being scoped to framework/blueprint/profile only. */
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
  /* Only the two families that currently have any seeded programme_offerings
     rows are checked against the offering boundary below -- see the note at
     the original IF branches this replaces (20260821090000) on why an
     exam_style outside this pair (including the RLS harness's isolation
     fixture style, and 'mixed', already NULL by this point) is left to fall
     through to the content query untouched: there is nothing in
     programme_offerings for those styles to check it against, so treating
     their absence as invalid would be wrong, not merely unchecked. */
  c_offering_families constant text[] := array['naplan_style', 'icas_style'];
  c_unrecognised_subject constant text := '__mm_a16_unrecognised_subject_filter__';

  v_student        uuid := auth.uid();
  v_request_hash   text;
  v_stored         public.idempotency_keys%rowtype;
  v_seed           text;
  v_year_level     smallint;
  v_exam_style     text;
  v_subject_filter text;
  v_subject        text;
  v_offering_id    uuid;
  v_profile_version_id uuid;
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

  /* THE CANONICAL SUBJECT MAPPING (Gate A item A16), now sourced from
     public.subjects instead of a hardcoded CASE. A filter that matches
     neither a subjects.id nor a selection_filter_alias maps to a sentinel no
     real source_subject can ever equal, preserving the existing fail-closed
     behaviour: an unrecognised subject matches nothing and falls out as
     MM212, the same way it always has. */
  select s.id into v_subject
  from public.subjects s
  where v_subject_filter is not null
    and (s.id = v_subject_filter or s.selection_filter_alias = v_subject_filter);

  if v_subject_filter is not null and v_subject is null then
    v_subject := c_unrecognised_subject;
  end if;

  /* THE OFFERING BOUNDARY (Gate A item A16), checked before any content is
     queried. Two checks, subject-agnostic then subject-scoped, so the two
     failure modes stay distinguishable at the same errcode a caller already
     handles (MM229). The subject-scoped check now also CAPTURES the matched
     row's id (v_offering_id) rather than only checking existence -- the one
     behavioural addition this migration makes, feeding the profile-version
     resolution below. */
  if v_exam_style = any (c_offering_families) and v_year_level is not null then
    /* (1) Is (examStyle, yearLevel) a real sitting at all -- the A11 check,
       now read from programme_offerings instead of a hardcoded year list.
       True the moment ANY subject is offered at that (family, year), which
       is exactly what EXAM_STYLE_YEAR_LEVELS asserts once every real sitting
       has at least one seeded subject (numeracy, for both families). */
    if not exists (
      select 1
      from public.programme_offerings po
      join public.programmes pr on pr.id = po.programme_id
      where pr.assessment_family_id = v_exam_style
        and po.year_level = v_year_level
    ) then
      raise exception '% is not sat at year %', v_exam_style, v_year_level
        using errcode = 'MM229';
    end if;

    /* (2) Given a RECOGNISED subject (not the sentinel above, not the NULL
       'mixed' means-every-subject case), is THIS (examStyle, yearLevel,
       subject) triple a real sitting? NAPLAN-style Science is the case A11
       could not catch: a real style, a real year, a real subject id, but not
       a paper NAPLAN sets -- previously indistinguishable from an empty
       pool (MM212); now named explicitly (MM229). */
    if v_subject is not null and v_subject <> c_unrecognised_subject then
      select po.id into v_offering_id
      from public.programme_offerings po
      join public.programmes pr on pr.id = po.programme_id
      where pr.assessment_family_id = v_exam_style
        and po.year_level = v_year_level
        and po.subject_id = v_subject;

      if v_offering_id is null then
        raise exception '% subject % is not offered at year %', v_exam_style, v_subject, v_year_level
          using errcode = 'MM229';
      end if;
    end if;
  end if;

  /* THE PROFILE-VERSION PIN (spec §12.3, ADR-004 accepted). Resolved only
     when the request named exactly one concrete offering above -- 'mixed'
     on any axis, or a style outside the two seeded families, leaves this
     null honestly rather than guessing which of several possible offerings
     was meant. assessment_profile_versions_current_per_offering
     (20260823090000) guarantees at most one non-withdrawn row per offering,
     so this is a plain lookup, not a tie-break this function invents. A
     concrete offering with no seeded profile (should not happen: every
     active programme_offerings row was seeded one) also leaves this null
     rather than failing the session -- absence of a Phase 3 profile must
     never block a Phase 2 session from being created. */
  if v_offering_id is not null then
    select apv.id into v_profile_version_id
    from public.assessment_profile_versions apv
    where apv.programme_offering_id = v_offering_id
      and apv.availability = 'available';
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
    assessment_profile_version_id,
    content_build_version, delivery_mode, seed, config, expires_at, storage_model
  ) values (
    v_student, c_profile_version, c_framework_version, c_blueprint_version,
    c_taxonomy_version, c_engine_version, c_scoring_version,
    v_profile_version_id,
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
    'contentBuildVersion', v_content_build,
    'assessmentProfileVersionId', v_profile_version_id
  );

  update public.idempotency_keys
  set response_status = 201, response_body = v_response
  where actor_id = v_student and endpoint = c_endpoint and key = p_idempotency_key;

  return v_response;
end;
$$;

comment on function public.create_assessment_session(jsonb, text) is
  'Version-pinned session create (spec §12.3-§12.5, §17.2, §18; ADR-004/006/007). Gated on session_storage_model_for() (20260812160000). Resolves the (examStyle, yearLevel, subject) offering boundary through public.programme_offerings/public.subjects (Gate A item A16, 20260822090000) and, when it resolves to exactly one offering, pins assessment_profile_version_id to that offering''s real assessment_profile_versions row (20260823110000, ADR-004 accepted) -- null otherwise, additively, alongside the unchanged text pins. See 20260812120000 for the allocation/idempotency mechanics.';
