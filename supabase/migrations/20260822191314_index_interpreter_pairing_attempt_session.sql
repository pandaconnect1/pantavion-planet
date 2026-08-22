create index if not exists interpreter_pairing_attempts_session_idx
  on public.interpreter_pairing_attempts(session_id)
  where session_id is not null;
