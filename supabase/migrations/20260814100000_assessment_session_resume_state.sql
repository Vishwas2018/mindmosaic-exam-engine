-- Phase 2 step 7: a version-pinned sitting has to be resumable, which means the
-- sitter must be able to read back what they have already answered.
--
-- `session_responses` has RLS on, no policy, and no `anon`/`authenticated`
-- privileges (20260812100000), deliberately: writes go through
-- `commit_assessment_responses` so that correctness and scores can never be
-- client-supplied. Nothing was ever built to read them back, because until step
-- 7 nothing read a target-model sitting at all.
--
-- So `get_assessment_session` gains the sitter's own saved answers. It is
-- already the sanctioned reader for this session, already re-derives ownership
-- from `auth.uid()`, and is already narrower than the session row's read
-- policies — a parent or teacher can see that a session exists; only the sitter
-- gets its paper, and now only the sitter gets their working. That is the same
-- boundary, not a new one.
--
-- WHAT IS NOT HERE, and is a real gap rather than an oversight: the legacy
-- `exam_responses` row also stores `current_question_index` and
-- `flagged_question_ids`, and the normalized model has nowhere to put them —
-- ADR-006 modelled responses, not the UI state around them. A resumed
-- target-model sitting therefore restores every answer but lands on the first
-- question with no flags. Recorded in ADR-005 Amendment A5; it must be closed
-- before a cohort is opened, and it cannot strand anyone today because the
-- cohort is empty.
--
-- Read-side and additive. No table, policy, grant or write path changes.

create or replace function public.get_assessment_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_student   uuid := auth.uid();
  v_session   public.assessment_sessions%rowtype;
  v_items     jsonb;
  v_responses jsonb;
  v_saved_at  timestamptz;
begin
  if v_student is null then
    raise exception 'get_assessment_session requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  -- Ownership re-derived here rather than taken on trust. Parents and teachers
  -- read *results* through RLS on assessment_sessions/assessment_results; the
  -- candidate paper and the working are the sitter's alone, so this is
  -- deliberately narrower than the read policies on the session row.
  select * into v_session
  from public.assessment_sessions s
  where s.id = p_session_id and s.student_id = v_student;

  if not found then
    raise exception 'no such assessment session for this caller'
      using errcode = 'MM003';
  end if;

  /* Fail closed on an incomplete paper (ADR-006 Amendment D). An item whose
     answer kind or taxonomy was never projected would reach the client with
     fields missing, and the renderer that dispatches on them would fall through
     to a default — a silently wrong question rather than an absent one. */
  if exists (
    select 1
    from public.assessment_session_items si
    join public.item_versions iv on iv.id = si.item_version_id
    where si.session_id = p_session_id
      and (iv.answer_kind is null or iv.source_strand is null or iv.source_topic is null)
  ) then
    raise exception 'session % has an allocated item with incomplete candidate metadata', p_session_id
      using errcode = 'MM214';
  end if;

  -- THE COLUMNS ARE LISTED, NEVER SPREAD (20260812120000's rule, and
  -- 20260814090000 was exactly the `alter table` it exists to survive).
  select coalesce(jsonb_agg(item order by ordinal), '[]'::jsonb)
  into v_items
  from (
    select
      si.global_ordinal as ordinal,
      jsonb_build_object(
        'sessionItemId', si.id,
        'ordinal', si.global_ordinal,
        'itemCode', i.item_code,
        'origin', i.origin,
        'questionType', iv.question_type,
        'answerKind', iv.answer_kind,
        'minWords', iv.min_words,
        'maxWords', iv.max_words,
        'prompt', iv.prompt,
        'candidateContent', iv.candidate_content,
        'visuals', iv.visuals,
        'accessibility', iv.accessibility,
        'marksAvailable', iv.marks_available,
        'estimatedTimeSeconds', iv.estimated_time_seconds,
        'authoredDifficulty', iv.authored_difficulty,
        'locale', iv.locale,
        'contentSchemaVersion', iv.content_schema_version,
        'sourceYearLevel', iv.source_year_level,
        'sourceExamStyle', iv.source_exam_style,
        'sourceSubject', iv.source_subject,
        'sourceSkill', iv.source_skill,
        'sourceStrand', iv.source_strand,
        'sourceTopic', iv.source_topic,
        'sourceTags', coalesce(iv.source_tags, array[]::text[]),
        'stimulus', sv.content
      ) as item
    from public.assessment_session_items si
    join public.item_versions iv on iv.id = si.item_version_id
    join public.items i on i.id = si.item_id
    left join public.stimulus_versions sv on sv.id = si.stimulus_version_id
    where si.session_id = p_session_id
  ) allocated;

  /* The sitter's own working, keyed by served item so the client can restore it
     against the paper above without a second identity to reconcile.
     `response_value` and nothing else: the scorer's own output columns live on
     this same row, and a sitting in progress must not be able to read those
     back (§17.1, §14.2). Their absence is asserted against the function's own
     text by the migration registry, which is why they are not named here. */
  select
    coalesce(jsonb_object_agg(r.session_item_id, r.response_value)
             filter (where r.session_item_id is not null and r.response_value is not null),
             '{}'::jsonb),
    max(r.updated_at)
  into v_responses, v_saved_at
  from public.session_responses r
  where r.session_id = p_session_id;

  return jsonb_build_object(
    'sessionId', v_session.id,
    'status', v_session.status,
    'version', v_session.version,
    'config', v_session.config,
    'createdAt', v_session.created_at,
    'startedAt', v_session.started_at,
    'expiresAt', v_session.expires_at,
    'scoringAlgorithmVersion', v_session.scoring_algorithm_version,
    'items', v_items,
    'responses', v_responses,
    'savedAt', v_saved_at
  );
end;
$$;

comment on function public.get_assessment_session(uuid) is
  'The sitter''s view of their own version-pinned session: candidate content and their own saved responses, never an answer key, a private explanation or a score (spec §17.1). Refuses an allocation with incomplete candidate metadata (ADR-006 Amendment D). Not gated on the cutover flag — a session already on the target model must stay readable after a rollback (§12.7).';
