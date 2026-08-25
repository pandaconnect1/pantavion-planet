-- Every lookup of a potentially suspicious profile is an accountable,
-- AAL2-gated operation. The search result itself remains limited to public
-- profile fields; deeper data can only be opened through a case dossier.
create table if not exists public.trust_safety_search_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  query_text text not null check (char_length(query_text) between 2 and 100),
  result_count integer not null check (result_count between 0 and 20),
  created_at timestamptz not null default now()
);

alter table public.trust_safety_search_audit enable row level security;

drop policy if exists "trust safety search audit founder read" on public.trust_safety_search_audit;
create policy "trust safety search audit founder read"
  on public.trust_safety_search_audit
  for select
  to authenticated
  using (public.pantavion_is_active_founder() and public.pantavion_has_aal2());

revoke all on table public.trust_safety_search_audit from public, anon;
grant select on table public.trust_safety_search_audit to authenticated;

create or replace function public.pantavion_search_profiles_for_trust_safety(p_query text)
returns table(id uuid, username text, display_name text, country text, region text, publication_state text)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_query text := btrim(coalesce(p_query, ''));
  v_result_count integer;
begin
  if v_actor_id is null or not public.pantavion_is_active_trust_safety_operator() or not public.pantavion_has_aal2() then
    raise exception 'Trust & Safety operator with AAL2 is required';
  end if;

  if char_length(v_query) < 2 or char_length(v_query) > 100 or position('%' in v_query) > 0 or position('_' in v_query) > 0 or position(chr(92) in v_query) > 0 then
    raise exception 'A plain profile search of 2 to 100 characters is required';
  end if;

  select count(*)
    into v_result_count
  from (
    select 1
    from public.profiles p
    where coalesce(p.username, '') ilike '%' || v_query || '%'
       or coalesce(p.display_name, '') ilike '%' || v_query || '%'
    limit 20
  ) as matches;

  insert into public.trust_safety_search_audit(actor_id, query_text, result_count)
  values (v_actor_id, v_query, v_result_count);

  return query
  select p.id, p.username, p.display_name, p.country, p.region, p.publication_state
  from public.profiles p
  where coalesce(p.username, '') ilike '%' || v_query || '%'
     or coalesce(p.display_name, '') ilike '%' || v_query || '%'
  order by p.updated_at desc
  limit 20;
end;
$$;

revoke all on function public.pantavion_search_profiles_for_trust_safety(text) from public, anon;
grant execute on function public.pantavion_search_profiles_for_trust_safety(text) to authenticated;
