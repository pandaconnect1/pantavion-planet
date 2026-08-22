revoke all on public.interpreter_sessions from anon;
revoke all on public.interpreter_session_members from anon;
revoke all on public.interpreter_pairing_attempts from anon;
revoke all on public.interpreter_sessions from public;
revoke all on public.interpreter_session_members from public;
revoke all on public.interpreter_pairing_attempts from public;

grant select on public.interpreter_sessions to authenticated;
grant select on public.interpreter_session_members to authenticated;

revoke all on function public.pantavion_create_interpreter_session(text, text) from public, anon;
revoke all on function public.pantavion_join_interpreter_session(text) from public, anon;
revoke all on function public.pantavion_close_interpreter_session(uuid) from public, anon;

grant execute on function public.pantavion_create_interpreter_session(text, text) to authenticated;
grant execute on function public.pantavion_join_interpreter_session(text) to authenticated;
grant execute on function public.pantavion_close_interpreter_session(uuid) to authenticated;
