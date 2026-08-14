-- Phase 2 step 7, the content half: the answer key's DISCRIMINANT is candidate
-- metadata, and belongs in the candidate row (ADR-006 Amendment D).
--
-- WHY THIS EXISTS. Step 7 returns one DTO for both storage models, and §12.7
-- requires the legacy path to be unchanged for legacy sessions — so the target
-- model has to produce the DTO the legacy path already produces, which is
-- `CandidateQuestion`. That type carries `answerKind`: the answer key's kind,
-- `single_option` / `manual` / `text` and ten others. The legacy path reads it
-- off the compiled bank. The target path reads `item_versions`, and Phase 1's
-- projection filed the discriminant with the answers and never copied it across.
--
-- It is not derivable from `question_type`. `question.schema.ts`'s own
-- `compatibleAnswerKinds` map says `short_answer` admits `text` OR `manual` and
-- `reading_comprehension` admits four kinds — and the short-answer case is the
-- one that decides whether a learner is shown the "reviewed by a marker" notice,
-- i.e. whether they are told their answer is not scored yet.
--
-- WHAT THIS DELIBERATELY DOES NOT DO: have `get_assessment_session` read
-- `item_answer_versions` for the kind. ADR-006 Amendment A moved scoring into
-- its own least-privilege role so that no application-callable function reads
-- answer rows, and stated the boundary as "the role and the module, not the
-- function signature". A `SECURITY DEFINER` function granted to `authenticated`
-- that touches the answer table is a third path to answer data however narrow
-- its select list is, and the next edit to it would start from a function that
-- already has that table in scope.
--
-- Read-side and additive. No legacy table, policy, grant or write path is
-- touched; the cutover flag is not read here and stays off.

-- THE SAME ARGUMENT COVERS FOUR MORE FIELDS. `CandidateQuestion` also carries
-- `metadata.strand`, `metadata.topic`, `metadata.tags` and — for a manual answer
-- key — the `minWords`/`maxWords` word guidance. All are candidate-visible, all
-- are shipped to browsers by the legacy path today, and none were projected. A
-- target session cannot produce the DTO without them, and it must not invent
-- them: fabricated taxonomy on a served paper is the same class of mistake as a
-- fabricated exposure ledger (ADR-005 §4).
--
-- `status` and `origin` need no column. A row is projected only when published,
-- so `status = 'published'` is a fact about any served item, and `origin` is
-- already on `public.items`.
--
-- These join `source_year_level` / `source_exam_style` / `source_subject` /
-- `source_skill`, the family ADR-002 Amendment B labels unresolved Phase 1b
-- input that Phase 3 replaces with the real scope model. They are deliberately
-- added to that family rather than beside it, so they migrate and die together.

-- ---------------------------------------------------------------------------
-- The columns
-- ---------------------------------------------------------------------------
-- All nullable on purpose. The schema permits an `item_version` with no
-- `item_answer_versions` row — such an item is unscoreable and already
-- ineligible for allocation, because create_assessment_session joins the answer
-- table — so a NOT NULL here would fail a deploy on a row that can never be
-- served. The read path refuses the null instead (see the raise below), which
-- puts the failure where it can be acted on.
alter table public.item_versions
  add column answer_kind   text,
  add column source_strand text,
  add column source_topic  text,
  add column source_tags   text[],
  -- Word guidance from a `manual` answer key. Null on every other kind, which
  -- is why they are not covered by the completeness check below.
  add column min_words     integer,
  add column max_words     integer;

-- The twelve kinds in `answerKeySchema`. Listed rather than left open: a value
-- outside this set means the projection and the schema have diverged, and the
-- moment to find that out is the write, not the render.
alter table public.item_versions
  add constraint item_versions_answer_kind_known
    check (answer_kind is null or answer_kind in (
      'single_option', 'multiple_options', 'number', 'text', 'fill_blank',
      'dropdown', 'boolean', 'matching', 'ordering', 'manual', 'hotspot',
      'drag_drop'
    ));

comment on column public.item_versions.answer_kind is
  'The answer key''s discriminant, which is candidate-visible metadata and not answer data: knowing a question is multiple-choice does not reveal which option is correct, and the legacy path has shipped this field to browsers since v1. Here rather than on item_answer_versions so that no application-callable function needs to read the answer table (ADR-006 Amendment D).';

comment on column public.item_versions.source_strand is
  'Unresolved source taxonomy, same family and same fate as source_subject (ADR-002 Amendment B): Phase 1b input that Phase 3 replaces with item_scopes/item_skills. Carried because CandidateQuestion.metadata.strand is candidate-visible and a served paper must not invent it.';

-- ---------------------------------------------------------------------------
-- Backfill: what the database already knows
-- ---------------------------------------------------------------------------
-- The answer key's own fields come from the answer rows, so no re-projection is
-- needed for them and no content hash moves. `contentHashOf` hashes the
-- AUTHORED question, not the projected row, and the projection inserts
-- `on conflict (content_hash) do nothing` — so re-running it would never have
-- updated an existing row. This is the only thing that can fill these.
--
-- The taxonomy columns are NOT filled here: `strand`, `topic` and `tags` exist
-- nowhere in the database, only in the authoring bank. `npm run projection:apply`
-- gains an update pass for them, which is the one place that already reads the
-- bank and already proves what it wrote (`npm run projection:verify`).
update public.item_versions v
set answer_kind = a.answer_key->>'kind',
    min_words   = nullif(a.answer_key->>'minWords', '')::integer,
    max_words   = nullif(a.answer_key->>'maxWords', '')::integer
from public.item_answer_versions a
where a.item_version_id = v.id
  and v.answer_kind is null;

-- A projected item that has an answer row must now have a kind. If this fires,
-- an answer key is carrying a `kind` the schema does not list, and the check
-- constraint above would have rejected it — so this reports the count rather
-- than leaving it to be discovered later as a null.
do $$
declare
  v_unfilled integer;
begin
  select count(*) into v_unfilled
  from public.item_versions v
  where v.answer_kind is null
    and exists (select 1 from public.item_answer_versions a where a.item_version_id = v.id);

  if v_unfilled > 0 then
    raise exception 'answer_kind backfill left % answer-bearing item_versions unfilled', v_unfilled;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_assessment_session — the same function, plus the discriminant
-- ---------------------------------------------------------------------------
-- Restated in full because `create or replace` requires it. Exactly two things
-- changed from 20260812120000: each item now carries `answerKind`, read from
-- the candidate row; and an allocation containing an item with no projected kind
-- is refused rather than served.
--
-- THE COLUMNS ARE STILL LISTED, NEVER SPREAD, for the reason 20260812120000
-- gives: `to_jsonb(iv.*)` would be one future `alter table` away from shipping
-- an answer column to a learner. This migration adds a column to that table,
-- which is exactly the event that rule exists to survive.
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

  /* Fail closed on an incomplete paper. An item whose answer kind was never
     projected would reach the client with the field missing, and the renderer
     that dispatches on it would fall through to a default — a silently wrong
     question rather than an absent one. The taxonomy is the same story one step
     further out: the DTO promises it, and the alternative to refusing is
     inventing it. Refusing is loud, and the condition is actionable: project
     the item again. */
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

  return jsonb_build_object(
    'sessionId', v_session.id,
    'status', v_session.status,
    'version', v_session.version,
    'config', v_session.config,
    'createdAt', v_session.created_at,
    'startedAt', v_session.started_at,
    'expiresAt', v_session.expires_at,
    'scoringAlgorithmVersion', v_session.scoring_algorithm_version,
    'items', v_items
  );
end;
$$;

comment on function public.get_assessment_session(uuid) is
  'The sanitized candidate allocation for the sitter (spec §17.1). Returns candidate content only — no answer key, no private explanation — and refuses an allocation containing an item with no projected answer kind (ADR-006 Amendment D). Not gated on the cutover flag: a session already on the target model must stay readable after a rollback (§12.7).';
