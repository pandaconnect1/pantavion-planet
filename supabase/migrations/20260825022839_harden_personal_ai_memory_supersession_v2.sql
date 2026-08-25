alter table public.personal_ai_memories
  add constraint personal_ai_memories_id_user_unique unique (id, user_id);

alter table public.personal_ai_memories
  drop constraint personal_ai_memories_supersedes_memory_id_fkey;

alter table public.personal_ai_memories
  add constraint personal_ai_memories_supersedes_owner_fk
  foreign key (supersedes_memory_id, user_id)
  references public.personal_ai_memories(id, user_id)
  on delete restrict;
