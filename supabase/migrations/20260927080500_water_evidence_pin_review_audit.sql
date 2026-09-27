alter table public.water_map_evidence_pins
  add column if not exists review_note text;

create table if not exists public.water_map_evidence_pin_revisions (
  revision_id bigint generated always as identity primary key,
  pin_id uuid not null,
  revision_action text not null check (revision_action in ('update','delete')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  recorded_at timestamptz not null default now()
);

create index if not exists water_map_evidence_pin_revisions_pin_idx
  on public.water_map_evidence_pin_revisions (pin_id, revision_id desc);

alter table public.water_map_evidence_pin_revisions enable row level security;
alter table public.water_map_evidence_pin_revisions force row level security;

revoke all on table public.water_map_evidence_pin_revisions from public, anon, authenticated;
grant select, insert on table public.water_map_evidence_pin_revisions to service_role;
revoke update, delete, truncate on table public.water_map_evidence_pin_revisions from service_role;

create or replace function public.pantavion_water_capture_evidence_pin_revision()
returns trigger
language plpgsql
as $$
begin
  insert into public.water_map_evidence_pin_revisions (pin_id, revision_action, snapshot)
  values (
    old.pin_id,
    case when tg_op = 'DELETE' then 'delete' else 'update' end,
    to_jsonb(old)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.pantavion_water_capture_evidence_pin_revision()
  from public, anon, authenticated;

drop trigger if exists water_map_evidence_pins_capture_revision
  on public.water_map_evidence_pins;

create trigger water_map_evidence_pins_capture_revision
before update or delete on public.water_map_evidence_pins
for each row execute function public.pantavion_water_capture_evidence_pin_revision();
