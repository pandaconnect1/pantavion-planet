alter table public.water_map_alignments
  add column if not exists transform_parameters jsonb not null default '{}'::jsonb
  check (jsonb_typeof(transform_parameters) = 'object');
