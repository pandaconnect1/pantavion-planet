create table if not exists public.owner_decision_queue (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('security','privacy','legal','deployment','agent','data','product','moderation','billing','infrastructure','other')),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  title text not null check (char_length(title) between 1 and 240),
  summary text not null check (char_length(summary) between 1 and 4000),
  details jsonb not null default '{}'::jsonb,
  source text not null default 'pantavion',
  recommended_action text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint owner_decision_final_state check (
    (status = 'pending' and decided_at is null) or
    (status in ('approved','rejected') and decided_at is not null)
  )
);

create index if not exists owner_decision_queue_owner_status_created_idx
  on public.owner_decision_queue(owner_user_id, status, created_at desc);

alter table public.owner_decision_queue enable row level security;

revoke all on table public.owner_decision_queue from anon;
revoke all on table public.owner_decision_queue from authenticated;
grant select on table public.owner_decision_queue to authenticated;
grant update (status, decision_note, decided_at, updated_at) on table public.owner_decision_queue to authenticated;
grant select, insert, update, delete on table public.owner_decision_queue to service_role;

drop policy if exists "owner reads own decision queue" on public.owner_decision_queue;
create policy "owner reads own decision queue"
  on public.owner_decision_queue
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_user_id);

drop policy if exists "owner decides own pending item once" on public.owner_decision_queue;
create policy "owner decides own pending item once"
  on public.owner_decision_queue
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_user_id and status = 'pending')
  with check ((select auth.uid()) = owner_user_id and status in ('approved','rejected') and decided_at is not null);
