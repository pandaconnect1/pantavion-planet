-- Counts per area and kind for the register library (service role only).
create or replace function public.pantavion_water_register_counts()
returns table (area_code text, kind text, n bigint, streets bigint)
language sql stable security definer set search_path = public as $$
  select area_code, kind, count(*)::bigint, count(distinct street)::bigint
  from public.water_network_assets group by area_code, kind order by area_code nulls last, kind;
$$;
revoke all on function public.pantavion_water_register_counts() from public, anon, authenticated;
grant execute on function public.pantavion_water_register_counts() to service_role;
