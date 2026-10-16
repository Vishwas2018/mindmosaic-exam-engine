-- Beta hardening: a parent can request erasure of their own child's data.
--
-- request_student_erasure (20260817090000) is is_admin()-gated, and its
-- requester is auth.uid(), so it cannot be handed to a parent as-is. Until now
-- the only parent-reachable "delete" was DELETE /api/parent/children/[id],
-- which removes the parent_children link and leaves the child's auth user and
-- whole exam history in place — an archive, not erasure.
--
-- parent_request_child_erasure(p_child) is the parent-gated door onto the same
-- workflow. It performs the same two steps request_student_erasure performs —
-- record a pending erasure_requests row due in 30 days, then revoke the
-- child's access NOW (profiles.access_revoked_at, the GoTrue ban, live
-- sessions and refresh tokens) — and nothing else. It deletes nothing itself:
-- the existing processor (process_due_erasures, pg_cron or
-- admin_trigger_due_erasures) runs erase_student when the window closes, and
-- an operator can still cancel inside the window with cancel_student_erasure.
-- erase_student remains granted to nobody.
--
-- The gate, in order, all inside one SECURITY DEFINER body (a parent has no
-- RLS reach to erasure_requests or to a child's profile row):
--   1. caller is signed in and their profile role is 'parent';
--   2. a parent_children row links THIS caller to THIS child — the check is on
--      auth.uid(), never on a parameter, so a parent cannot name someone
--      else's child by guessing a UUID;
--   3. the child is a 'student' profile.
-- Failures raise a generic message and reveal nothing about whether a child id
-- exists to a caller who is not linked to it.
--
-- Idempotent: a second call while a request is pending returns the existing
-- request rather than erroring, so a double-click or a retry is safe.
--
-- ticket_ref records provenance: 'parent-self-service:<parent uuid>'. The
-- constraint on that column allows up to 200 characters.

create or replace function public.parent_request_child_erasure(p_child uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent        uuid := auth.uid();
  v_request_id    uuid;
  v_execute_after timestamptz;
  v_existing      public.erasure_requests%rowtype;
begin
  if v_parent is null
     or not exists (select 1 from public.profiles where id = v_parent and role = 'parent') then
    raise exception 'parent_request_child_erasure requires a parent caller'
      using errcode = 'MM250';
  end if;

  if p_child is null
     or not exists (
       select 1 from public.parent_children
       where parent_id = v_parent and child_id = p_child
     ) then
    raise exception 'child not found'
      using errcode = 'MM251';
  end if;

  /* Locked so two concurrent calls cannot both pass the pending check. */
  perform 1
  from public.profiles
  where id = p_child and role = 'student'
  for update;

  if not found then
    raise exception 'child not found'
      using errcode = 'MM251';
  end if;

  select * into v_existing
  from public.erasure_requests
  where student_id = p_child and status = 'pending';

  if found then
    return jsonb_build_object(
      'requestId', v_existing.id,
      'studentId', p_child,
      'executeAfter', v_existing.execute_after,
      'alreadyRequested', true
    );
  end if;

  v_execute_after := now() + interval '30 days';

  insert into public.erasure_requests (student_id, ticket_ref, requested_by, execute_after)
  values (p_child, 'parent-self-service:' || v_parent::text, v_parent, v_execute_after)
  returning id into v_request_id;

  -- THE REVOCATION, identical to request_student_erasure.
  update public.profiles set access_revoked_at = now() where id = p_child;
  update auth.users set banned_until = v_execute_after where id = p_child;
  delete from auth.sessions where user_id = p_child;
  delete from auth.refresh_tokens where user_id = p_child::text;

  return jsonb_build_object(
    'requestId', v_request_id,
    'studentId', p_child,
    'executeAfter', v_execute_after,
    'alreadyRequested', false
  );
end;
$$;

revoke all on function public.parent_request_child_erasure(uuid) from public, anon;
grant execute on function public.parent_request_child_erasure(uuid) to authenticated;

comment on function public.parent_request_child_erasure(uuid) is
  'Parent-gated erasure request for one linked child: records a pending erasure_requests row due in 30 days and revokes the child''s access immediately. Deletes nothing itself — process_due_erasures runs erase_student when the window closes. Caller must be a parent linked to p_child via parent_children.';
