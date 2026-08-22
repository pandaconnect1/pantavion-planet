create or replace function public.pantavion_leave_interpreter_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  is_member boolean;
begin
  if actor is null then
    return jsonb_build_object('ok', false, 'error', 'authentication_required');
  end if;

  select exists (
    select 1
    from public.interpreter_session_members m
    where m.session_id = p_session_id
      and m.user_id = actor
      and m.left_at is null
  ) into is_member;

  if not is_member then
    return jsonb_build_object('ok', false, 'error', 'session_membership_required');
  end if;

  update public.interpreter_sessions
  set status = 'closed',
      closed_at = coalesce(closed_at, now()),
      pairing_code_hash = null,
      updated_at = now()
  where id = p_session_id
    and status in ('pairing','active');

  update public.interpreter_session_members
  set left_at = coalesce(left_at, now())
  where session_id = p_session_id
    and left_at is null;

  return jsonb_build_object('ok', true, 'sessionId', p_session_id);
end;
$$;

revoke all on function public.pantavion_leave_interpreter_session(uuid) from public, anon;
grant execute on function public.pantavion_leave_interpreter_session(uuid) to authenticated;
