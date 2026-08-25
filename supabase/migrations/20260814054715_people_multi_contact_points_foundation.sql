create table if not exists public.user_contact_points (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('email','phone')),
 normalized_value text not null,
 label text,
 verification_state text not null default 'unverified' check (verification_state in ('unverified','pending','verified','revoked')),
 verified_at timestamptz,
 is_primary boolean not null default false,
 visibility_scope text not null default 'private' check (visibility_scope in ('private','connections','selected_people','public')),
 discoverability_enabled boolean not null default false,
 contact_matching_enabled boolean not null default false,
 login_enabled boolean not null default false,
 recovery_enabled boolean not null default false,
 source text not null default 'user',
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,kind,normalized_value)
);
create unique index if not exists user_contact_points_primary_kind_idx on public.user_contact_points(user_id,kind) where is_primary and verification_state<>'revoked';
create index if not exists user_contact_points_matching_idx on public.user_contact_points(kind,normalized_value) where verification_state='verified' and contact_matching_enabled;
alter table public.user_contact_points enable row level security;
revoke all on public.user_contact_points from anon;
revoke all on public.user_contact_points from authenticated;
grant select on public.user_contact_points to authenticated;
drop policy if exists user_contact_points_owner_read on public.user_contact_points;
create policy user_contact_points_owner_read on public.user_contact_points for select to authenticated using (user_id=auth.uid());

create or replace function public.pantavion_upsert_contact_point(p_kind text,p_value text,p_label text default null,p_visibility text default 'private',p_discoverable boolean default false,p_contact_matching boolean default false,p_login boolean default false,p_recovery boolean default false)
returns uuid language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); normalized text; point_id uuid;
begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_kind not in ('email','phone') then raise exception 'unsupported contact point kind'; end if;
 normalized:=case when p_kind='email' then lower(btrim(coalesce(p_value,''))) else regexp_replace(coalesce(p_value,''),'[^0-9+]','','g') end;
 if normalized='' or char_length(normalized)>320 then raise exception 'invalid contact point'; end if;
 if p_visibility not in ('private','connections','selected_people','public') then raise exception 'invalid visibility'; end if;
 insert into public.user_contact_points(user_id,kind,normalized_value,label,visibility_scope,discoverability_enabled,contact_matching_enabled,login_enabled,recovery_enabled)
 values(actor,p_kind,normalized,nullif(btrim(coalesce(p_label,'')),''),p_visibility,p_discoverable,p_contact_matching,p_login,p_recovery)
 on conflict(user_id,kind,normalized_value) do update set label=excluded.label,visibility_scope=excluded.visibility_scope,discoverability_enabled=excluded.discoverability_enabled,contact_matching_enabled=excluded.contact_matching_enabled,login_enabled=excluded.login_enabled,recovery_enabled=excluded.recovery_enabled,updated_at=now()
 returning id into point_id;
 return point_id;
end $$;
revoke all on function public.pantavion_upsert_contact_point(text,text,text,text,boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.pantavion_upsert_contact_point(text,text,text,text,boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.pantavion_remove_contact_point(p_contact_point_id uuid)
returns boolean language plpgsql security definer set search_path='public','pg_temp' as $$
declare actor uuid:=auth.uid(); affected integer;
begin
 if actor is null then raise exception 'authentication required'; end if;
 update public.user_contact_points set verification_state='revoked',discoverability_enabled=false,contact_matching_enabled=false,login_enabled=false,recovery_enabled=false,updated_at=now() where id=p_contact_point_id and user_id=actor;
 get diagnostics affected=row_count;
 return affected=1;
end $$;
revoke all on function public.pantavion_remove_contact_point(uuid) from public,anon;
grant execute on function public.pantavion_remove_contact_point(uuid) to authenticated;
