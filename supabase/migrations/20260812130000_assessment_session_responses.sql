-- Phase 2 step 2b, part 3: recording a learner's answers against the ledger
-- (spec §12.5, §12.8, §17.2, §18; ADR-006 §3).
--
-- WHY THIS IS A SEPARATE MIGRATION FROM THE SCORING ROLE. 20260812110000 grants
-- the scoring role SELECT on session_responses and a column-level UPDATE of the
-- five derived-outcome columns — and deliberately no INSERT. So the credential
-- that reads answer keys cannot bring a response into existence: it can only
-- mark one that a learner actually submitted. That is a real separation, and it
-- means the response write needs a path of its own. This is it.
--
-- THE SHAPE OF THE PARAMETER IS THE POINT. p_responses is keyed by
-- assessment_session_items.id, not by question id. §12.5 requires each response
-- to reference "the exact served session item", and a bare question id cannot:
-- it is precisely the identifier whose binding to a revision cannot be proved,
-- which is why ADR-005 §4 has to label backfilled legacy sittings
-- `legacy_unversioned`. Keying by ledger row makes the requirement structural —
-- a response that does not name a served item of this session is rejected
-- rather than stored against a guess.
--
-- WHAT A CALLER CANNOT SEND. There is no correctness parameter, no score
-- parameter, no marks parameter and no item-identity parameter, because §12.5
-- says client-provided values for all of those MUST be ignored and a parameter
-- that is documented as ignored is one refactor from being read. The columns do
-- not exist on the request and the function does not write them; only
-- src/server/scoring/answer-access.ts ever does, under the scoring role.
--
-- ERROR CODES, continuing the series:
--
--   MM001  no authenticated caller
--   MM003  session absent or not the caller's
--   MM004  session past expires_at
--   MM214  session is terminal — responses cannot be changed
--   MM215  a response names something that is not a served item of this session

create or replace function public.commit_assessment_responses(
  p_session_id uuid,
  p_responses jsonb,
  p_client_sequence bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student  uuid := auth.uid();
  v_session  public.assessment_sessions%rowtype;
  v_applied  integer;
  v_offered  integer;
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
  -- The table trigger (20260812100000) enforces this for every role including
  -- the owner; this raise exists so the route gets a code it can map to 409
  -- rather than a trigger's message text.
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
    'sessionVersion', v_session.version
  );
end;
$$;

revoke all on function public.commit_assessment_responses(uuid, jsonb, bigint) from public, anon;
grant execute on function public.commit_assessment_responses(uuid, jsonb, bigint) to authenticated;

comment on function public.commit_assessment_responses(uuid, jsonb, bigint) is
  'Records a learner''s answers against the served-item ledger (spec §12.5). Keyed by assessment_session_items.id so a response cannot reference anything but an exact served item. Carries no correctness, score or marks parameter by construction — those are written only by the scoring module under the §9.3.1 role. Stale autosaves are discarded by the monotonic client_sequence guard (ADR-006 §3).';
