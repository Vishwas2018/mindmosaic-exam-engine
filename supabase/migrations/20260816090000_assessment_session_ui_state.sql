-- Gate A item A1: the half ADR-005 Amendment A5 left open.
--
-- 20260814100000 made a target sitting resumable as far as its ANSWERS go, and
-- said in its own header what it could not do: the legacy `exam_responses` row
-- also carries `current_question_index` and `flagged_question_ids`, and the
-- normalized model has nowhere to put them. ADR-006 modelled responses; nothing
-- modelled the UI state around them. So a resumed target sitting restores every
-- answer and lands on question one with no flags — a real regression against the
-- legacy path, harmless only because the cohort is empty.
--
-- WHERE IT GOES, AND WHY NOT ON assessment_sessions. ADR-005 A5 offered two
-- shapes: "two columns on assessment_sessions or a small state row beside it".
-- This is the state row, for two reasons the columns do not give.
--
--   1. `assessment_sessions` is the SNAPSHOT (§12.3, ADR-006 §1): pinned
--      versions, seed, form id, lifecycle. Every column on it is either fixed at
--      creation or moved by a lifecycle transition, and the transition trigger
--      exists to police exactly that. A cursor the client moves forty times a
--      sitting is not a snapshot fact, and putting it there would mean the
--      optimistic-lock `version` advancing on every autosave — the lock would
--      stop meaning "the session changed" and start meaning "the learner
--      scrolled".
--
--   2. §17.5 gives this data its own retention class. "Response autosave /
--      checkpoint buffers | Delete within 30 days after a terminal submission,
--      abandonment, or expiry once the durable response/result exists." That is
--      a per-row deletion, and it is expressible against a table of its own and
--      not against two columns of a row that must survive as history. A
--      retention schedule that cannot be executed is a retention schedule that
--      will not be.
--
-- WHAT IS RECORDED, AND IN WHOSE IDENTITY. The flags are `uuid[]` of
-- `assessment_session_items.id`, not bare question ids. §12.5's rule for
-- responses — reference the exact served session item — is the same rule here
-- for the same reason: the served-item row is an identity this session can
-- verify, and a bare content-bank id is precisely the identifier whose binding
-- cannot be proved (ADR-005 §4). Every id is checked against THIS session's
-- ledger before it is stored, so a flag naming another sitting's item, or an
-- item that was never served, is rejected rather than kept as a dangling
-- reference the reader would later have to ignore. The mapping back to the
-- client's `flaggedQuestionIds` happens in the read dispatcher, from the paper
-- it already holds.
--
-- WHAT A CALLER STILL CANNOT SEND. Nothing here changes §12.5's posture: the
-- commit function gains a cursor and a flag list, both of which are the
-- learner's own UI state and neither of which is correctness, a score, marks or
-- an item identity the server did not itself allocate. The two new parameters
-- are validated against the session's own ledger, not trusted.
--
-- ERROR CODES, continuing the series:
--
--   MM215  a flagged id is not a served item of this session (same meaning the
--          response path already gives that code — reused deliberately, because
--          it is the same rejection)
--   MM216  the question index is outside this session's served paper
--
-- Additive. No legacy table, policy, grant or write path is touched.

-- ---------------------------------------------------------------------------
-- session_ui_state — one row per session, the UI state around the responses
-- ---------------------------------------------------------------------------
create table public.session_ui_state (
  session_id               uuid        primary key
                                       references public.assessment_sessions (id) on delete cascade,

  -- Position in the SERVED order (assessment_session_items.global_ordinal - 1),
  -- which is the order the paper was allocated in and the order the client
  -- renders. Zero-based, matching the client contract's currentQuestionIndex.
  current_question_index   integer     not null default 0,

  -- The learner's own "come back to this" marks. Session item ids, checked
  -- against this session's ledger on write.
  flagged_session_item_ids uuid[]      not null default array[]::uuid[],

  -- The same monotonic autosave counter session_responses carries (ADR-006 §3),
  -- and for the same reason: a late or replayed autosave must not move the
  -- cursor backwards over a newer one. Compared, never trusted as a value.
  client_sequence          bigint      not null default 0,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint session_ui_state_index_nonnegative check (current_question_index >= 0),
  constraint session_ui_state_client_sequence_nonnegative check (client_sequence >= 0),
  -- A null element would be a flag pointing at nothing; the write path cannot
  -- produce one, and this makes that a property of the table.
  constraint session_ui_state_flags_not_null check (array_position(flagged_session_item_ids, null) is null)
);

comment on table public.session_ui_state is
  'The UI state around a sitting''s responses: where the learner is up to and what they flagged to revisit (ADR-005 Amendment A5, closing Gate A item A1). Child data, purpose "resume an in-progress sitting", retention class "response autosave/checkpoint buffer" (§17.5): deletable within 30 days of a terminal submission, abandonment or expiry, and erased with the session it hangs off by ON DELETE CASCADE. Not evidence — the durable record of what the learner answered is session_responses, and nothing here is read by scoring.';

comment on column public.session_ui_state.flagged_session_item_ids is
  'assessment_session_items.id values, never bare question ids. Every element is verified against this session''s own served-item ledger by commit_assessment_responses before it is stored (§12.5, §17.2).';

-- ---------------------------------------------------------------------------
-- Privileges: the same posture as session_responses
-- ---------------------------------------------------------------------------
-- RLS on, `revoke all` (which covers TRUNCATE, the one RLS cannot reach), and
-- NO POLICY. A table with RLS on and no policy is readable and writable by
-- nobody but roles that bypass it, which is the Phase 1/Phase 2 posture for
-- every table whose sanctioned access path is a SECURITY DEFINER function.
--
-- The learner therefore holds no privilege on their own resume state, exactly as
-- they hold none on their own responses: it is written by
-- commit_assessment_responses and read by get_assessment_session, both of which
-- derive the actor from auth.uid() and re-check ownership themselves.
alter table public.session_ui_state enable row level security;
revoke all on public.session_ui_state from anon, authenticated;

-- The scoring role is deliberately given NOTHING here. It reads answer keys; it
-- has no business knowing which questions a child found hard enough to flag, and
-- a credential's blast radius is the set of things it can read.

-- §12.8's terminal lock, reproduced for this table at the same strength
-- session_responses has it (20260812100000): refused for every role including
-- the owner, so a privileged job cannot move a submitted sitting's cursor
-- either. The message and the code are its own — a shared trigger function
-- would report "responses cannot be changed" for a write that is not a response.
create or replace function public.reject_terminal_session_ui_state_write()
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
    raise exception 'session % is terminal; resume state cannot be changed', new.session_id
      using errcode = 'MM202';
  end if;

  return new;
end;
$$;

create trigger session_ui_state_terminal_lock
  before insert or update on public.session_ui_state
  for each row execute function public.reject_terminal_session_ui_state_write();

-- ---------------------------------------------------------------------------
-- The write path: the response commit carries the state it belongs to
-- ---------------------------------------------------------------------------
-- ONE ROUND TRIP, NOT TWO. The client's autosave already sends answers, cursor
-- and flags together on the legacy path (the `exam_responses` upsert in
-- api/exam/session/[id]/responses), and they are one debounced snapshot of one
-- moment. Splitting them across two calls would let the two halves land out of
-- order and put the cursor on a question whose answer had not arrived — which is
-- precisely the interleaving the `client_sequence` guard exists to prevent, made
-- unpreventable by the interface.
--
-- The two parameters DEFAULT TO NULL and null means "unchanged", so the existing
-- three-argument call still resolves and still means exactly what it meant. The
-- old three-argument function is dropped rather than left beside the new one: two
-- overloads of a write path is an ambiguity a caller resolves by accident.
drop function if exists public.commit_assessment_responses(uuid, jsonb, bigint);

create or replace function public.commit_assessment_responses(
  p_session_id uuid,
  p_responses jsonb,
  p_client_sequence bigint,
  p_current_question_index integer default null,
  p_flagged_session_item_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student   uuid := auth.uid();
  v_session   public.assessment_sessions%rowtype;
  v_applied   integer;
  v_offered   integer;
  v_ui_rows   integer := 0;
  v_ui_sent   boolean := p_current_question_index is not null
                      or p_flagged_session_item_ids is not null;
  v_item_count integer;
begin
  if v_student is null then
    raise exception 'commit_assessment_responses requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  -- Ownership re-derived rather than taken on trust (§17.2). Locked, so a
  -- concurrent commit and the scoring module's status flip cannot interleave
  -- into a response written against a session that has just gone terminal.
  select * into v_session
  from public.assessment_sessions s
  where s.id = p_session_id and s.student_id = v_student
  for update;

  if not found then
    raise exception 'no such assessment session for this caller'
      using errcode = 'MM003';
  end if;

  -- §12.8: submitted, processed and abandoned are terminal for learner writes.
  -- The table triggers (20260812100000 for responses, this migration for
  -- resume state) enforce this for every role including the owner; this raise
  -- exists so the route gets a code it can map to 409 rather than a trigger's
  -- message text.
  if v_session.status in ('submitted', 'processed', 'abandoned') then
    raise exception 'session % is terminal', p_session_id
      using errcode = 'MM214';
  end if;

  -- expires_at already carries the grace window create_assessment_session added
  -- (§18), so this is the same deadline the route enforces rather than a
  -- stricter one: a late submission inside grace still lands.
  if now() > v_session.expires_at then
    raise exception 'assessment session has expired'
      using errcode = 'MM004';
  end if;

  if jsonb_typeof(p_responses) is distinct from 'object' then
    raise exception 'responses must be a JSON object keyed by session item id'
      using errcode = 'MM215';
  end if;

  /* Every key must be a served item OF THIS SESSION. Checked before anything is
     written, and as a whole rather than per key, so a request that names one
     foreign item writes none of its responses instead of a partial paper. The
     uuid cast is guarded by the format test because an unparseable key would
     otherwise surface as 22P02, which reads like a server fault rather than a
     rejected request. */
  select count(*) into v_offered from jsonb_object_keys(p_responses) as k;

  if exists (
    select 1 from jsonb_object_keys(p_responses) as k
    where k !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) then
    raise exception 'a response key is not a session item id'
      using errcode = 'MM215';
  end if;

  if exists (
    select 1 from jsonb_object_keys(p_responses) as k
    where not exists (
      select 1 from public.assessment_session_items si
      where si.id = k::uuid and si.session_id = p_session_id
    )
  ) then
    raise exception 'a response names an item that was not served in this session'
      using errcode = 'MM215';
  end if;

  /* THE UI STATE IS VALIDATED THE SAME WAY THE RESPONSES ARE, and before any of
     it is written. A cursor past the end of the paper, or a flag naming an item
     this session never served, is a rejected request — not a value stored and
     silently ignored on read. §17.2: client-supplied item identities are not
     trusted, and "not trusted" means checked against the server's own ledger. */
  if v_ui_sent then
    select count(*) into v_item_count
    from public.assessment_session_items si
    where si.session_id = p_session_id;

    if p_current_question_index is not null
       and (p_current_question_index < 0 or p_current_question_index >= v_item_count) then
      raise exception 'question index % is outside the % served items of session %',
        p_current_question_index, v_item_count, p_session_id
        using errcode = 'MM216';
    end if;

    if p_flagged_session_item_ids is not null and exists (
      select 1
      from unnest(p_flagged_session_item_ids) as f(id)
      where f.id is null
         or not exists (
           select 1 from public.assessment_session_items si
           where si.id = f.id and si.session_id = p_session_id
         )
    ) then
      raise exception 'a flagged id is not a served item of this session'
        using errcode = 'MM215';
    end if;
  end if;

  /* ADR-006 §3's monotonic autosave counter, as a WHERE on the upsert rather
     than as a read-then-write: a late or replayed autosave loses the comparison
     and is discarded. The single upserted exam_responses document on the legacy
     path cannot do this — there, one stale autosave arriving late overwrites
     every newer answer in the session at once. */
  insert into public.session_responses as sr
    (session_id, session_item_id, response_value, client_sequence,
     first_answered_at, answered_at)
  select p_session_id, e.key::uuid, e.value, p_client_sequence, now(), now()
  from jsonb_each(p_responses) as e
  on conflict (session_id, session_item_id) where session_item_id is not null
  do update set
    response_value    = excluded.response_value,
    client_sequence   = excluded.client_sequence,
    answered_at       = excluded.answered_at,
    /* Set once, never moved: "when did they first answer this" must survive a
       later change. */
    first_answered_at = coalesce(sr.first_answered_at, excluded.first_answered_at),
    updated_at        = now()
  where excluded.client_sequence >= sr.client_sequence;

  get diagnostics v_applied = row_count;

  /* The same guard, on the same counter, for the state around those answers —
     so a stale autosave that loses the race for the answers loses it for the
     cursor too. Each half of the pair is written only when it was sent; a
     request carrying a cursor and no flags does not clear the flags. */
  if v_ui_sent then
    insert into public.session_ui_state as sui
      (session_id, current_question_index, flagged_session_item_ids, client_sequence, updated_at)
    values (
      p_session_id,
      coalesce(p_current_question_index, 0),
      coalesce(p_flagged_session_item_ids, array[]::uuid[]),
      p_client_sequence,
      now()
    )
    on conflict (session_id) do update set
      current_question_index   = coalesce(p_current_question_index, sui.current_question_index),
      flagged_session_item_ids = coalesce(p_flagged_session_item_ids, sui.flagged_session_item_ids),
      client_sequence          = excluded.client_sequence,
      updated_at               = now()
    where excluded.client_sequence >= sui.client_sequence;

    get diagnostics v_ui_rows = row_count;
  end if;

  -- §12.8's first legal transition. Done here rather than in a separate "start"
  -- call because the first answer IS the session becoming active, and a
  -- lifecycle step that depends on the client remembering to announce it is a
  -- lifecycle step that will sometimes be skipped.
  if v_session.status = 'created' then
    update public.assessment_sessions
    set status = 'active', started_at = coalesce(started_at, now()), version = version + 1
    where id = p_session_id;
    v_session.version := v_session.version + 1;
  end if;

  return jsonb_build_object(
    'sessionId', p_session_id,
    'offered', v_offered,
    'applied', v_applied,
    /* offered - applied is the number discarded as stale, which a client needs
       in order to know its autosave lost a race rather than succeeded. */
    'discardedAsStale', v_offered - v_applied,
    /* Reported separately, because the two halves can disagree: a request whose
       answers were all stale may still be the newest cursor the server has seen,
       and a client that could not tell would have to guess. */
    'uiStateApplied', v_ui_sent and v_ui_rows > 0,
    'sessionVersion', v_session.version
  );
end;
$$;

revoke all on function public.commit_assessment_responses(uuid, jsonb, bigint, integer, uuid[]) from public, anon;
grant execute on function public.commit_assessment_responses(uuid, jsonb, bigint, integer, uuid[]) to authenticated;

comment on function public.commit_assessment_responses(uuid, jsonb, bigint, integer, uuid[]) is
  'Records a learner''s answers against the served-item ledger, and the UI state around them (spec §12.5; ADR-005 Amendment A5). Keyed by assessment_session_items.id so neither a response nor a flag can reference anything but an exact served item. Carries no correctness, score or marks parameter by construction — those are written only by the scoring module under the §9.3.1 role. Stale autosaves are discarded by the monotonic client_sequence guard on both halves (ADR-006 §3).';

-- ---------------------------------------------------------------------------
-- The read path: the sitter gets back what they saved
-- ---------------------------------------------------------------------------
-- NOT A NEW READ BOUNDARY. `get_assessment_session` is already the sanctioned
-- reader for this session and already narrower than the session row's own read
-- policies: a parent or teacher can see that a session exists, and only the
-- sitter gets its paper and their working. The cursor and the flags are the
-- sitter's own UI state, and they join the working on the same side of that
-- line. Nothing here widens who may call the function or what a non-sitter sees.
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
  v_ui        public.session_ui_state%rowtype;
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

  /* The state around that working (ADR-005 Amendment A5). A session that has
     never autosaved has no row, and the defaults below are then the honest
     answer rather than a restore: a sitting nobody has moved through IS on
     question one with nothing flagged. That is a different claim from the one
     this function used to make, which was those same numbers for a sitting the
     learner had worked through for forty minutes. */
  select * into v_ui
  from public.session_ui_state u
  where u.session_id = p_session_id;

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
    'savedAt', v_saved_at,
    'currentQuestionIndex', coalesce(v_ui.current_question_index, 0),
    /* Served-item ids, as they were stored. The dispatcher maps them to the
       client's question ids against the paper it has just been handed above —
       one place, holding both halves of the mapping, rather than a second
       identity travelling in the payload. */
    'flaggedSessionItemIds',
      to_jsonb(coalesce(v_ui.flagged_session_item_ids, array[]::uuid[]))
  );
end;
$$;

comment on function public.get_assessment_session(uuid) is
  'The sitter''s view of their own version-pinned session: candidate content, their own saved responses, and the resume state around them — never an answer key, a private explanation or a score (spec §17.1). Refuses an allocation with incomplete candidate metadata (ADR-006 Amendment D). Not gated on the cutover flag — a session already on the target model must stay readable after a rollback (§12.7).';
