begin;

create table if not exists public.profile_security_posture (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_class text not null default 'personal' check (account_class in ('personal','professional','business','public_figure','elite','protected','institutional')),
  security_level text not null default 'standard' check (security_level in ('standard','enhanced','maximum','protected_maximum')),
  assisted_setup boolean not null default false,
  phishing_resistant_auth_required boolean not null default false,
  hardware_key_required boolean not null default false,
  minimum_registered_hardware_keys smallint not null default 0 check (minimum_registered_hardware_keys between 0 and 10),
  sms_recovery_allowed boolean not null default true,
  critical_change_review_required boolean not null default false,
  emergency_lock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_security_posture enable row level security;

drop policy if exists profile_security_posture_owner_read on public.profile_security_posture;
create policy profile_security_posture_owner_read
on public.profile_security_posture
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.public_registration_gate (
  singleton boolean primary key default true check (singleton),
  public_registration_enabled boolean not null default false,
  required_launch_state text not null default 'VERIFIED_LIVE',
  reason text not null default 'Critical People/Social/Chat/Translation/Voice/Dating/Safety modules are not yet VERIFIED_LIVE',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.public_registration_gate(singleton, public_registration_enabled)
values (true, false)
on conflict (singleton) do update
set public_registration_enabled = false,
    reason = excluded.reason,
    updated_at = now();

alter table public.public_registration_gate enable row level security;

create or replace function public.is_public_registration_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select public_registration_enabled from public.public_registration_gate where singleton = true), false);
$$;

revoke all on function public.is_public_registration_enabled() from public;
grant execute on function public.is_public_registration_enabled() to anon, authenticated;

comment on table public.profile_security_posture is 'Pantavion account security posture. Protected tiers are controlled by privileged workflows, not self-service downgrade.';
comment on table public.public_registration_gate is 'Fail-closed public registration launch gate. Keep disabled until critical modules are tested, deployed and VERIFIED_LIVE.';
comment on function public.is_public_registration_enabled() is 'Returns the fail-closed public registration state without exposing gate administration.';

commit;
