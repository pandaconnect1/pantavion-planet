alter table public.personal_ai_threads
  add constraint personal_ai_threads_parent_owner_fk
  foreign key (parent_thread_id, user_id)
  references public.personal_ai_threads(id, user_id)
  on delete restrict;

drop policy if exists personal_ai_memories_insert_self on public.personal_ai_memories;
create policy personal_ai_memories_insert_self on public.personal_ai_memories
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and truth_state in ('KNOWN','INFERRED')
);

drop policy if exists personal_ai_action_audit_insert_self on public.personal_ai_action_audit;
create policy personal_ai_action_audit_insert_self on public.personal_ai_action_audit
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and truth_state in ('KNOWN','INFERRED','UNVERIFIED','PARTIAL','BLOCKED')
  and status in ('queued','running','completed','failed','blocked')
);
