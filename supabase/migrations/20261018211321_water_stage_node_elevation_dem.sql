-- Ground elevation for every node of the staged Map A network (node_v3),
-- sampled from an open DEM by the hydraulic-model workflow. Applied to
-- production as version 20261018211321. Service role only.
create table if not exists pantavion_water_stage.node_elevation_dem (
  node_id integer primary key,
  elevation_m real not null,
  source text not null,
  sampled_at timestamptz not null default now()
);
alter table pantavion_water_stage.node_elevation_dem enable row level security;

create or replace function public.pantavion_water_stage_nodes_lonlat(p_after integer, p_limit integer)
returns table (node_id integer, lon double precision, lat double precision)
language sql stable security definer set search_path = public, pantavion_water_stage, extensions as $$
  select n.node_id, st_x(p), st_y(p)
  from pantavion_water_stage.node_v3 n, lateral (select st_transform(n.geom, 4326) p) t
  where n.node_id > p_after order by n.node_id limit least(p_limit, 10000);
$$;

create or replace function public.pantavion_water_stage_set_node_elevations(p_rows jsonb, p_source text)
returns integer
language plpgsql security definer set search_path = public, pantavion_water_stage as $$
declare n integer;
begin
  insert into pantavion_water_stage.node_elevation_dem (node_id, elevation_m, source, sampled_at)
  select (r->>'node_id')::int, (r->>'z')::real, p_source, now()
  from jsonb_array_elements(p_rows) r
  where (r->>'z') is not null
  on conflict (node_id) do update set elevation_m = excluded.elevation_m, source = excluded.source, sampled_at = excluded.sampled_at;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.pantavion_water_stage_nodes_lonlat(integer, integer) from public, anon, authenticated;
revoke all on function public.pantavion_water_stage_set_node_elevations(jsonb, text) from public, anon, authenticated;
grant execute on function public.pantavion_water_stage_nodes_lonlat(integer, integer) to service_role;
grant execute on function public.pantavion_water_stage_set_node_elevations(jsonb, text) to service_role;
