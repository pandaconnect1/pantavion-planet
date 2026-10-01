-- Railway-safe protected PostGIS serving.
-- These SECURITY DEFINER wrappers expose no raw master and validate the exact
-- approved Water device + token hash before calling server-only GIS primitives.

create or replace function public.pantavion_water_features_bbox_device_v1(
  p_device_id text,
  p_token_hash text,
  p_map_id text,
  p_min_lng double precision,
  p_min_lat double precision,
  p_max_lng double precision,
  p_max_lat double precision,
  p_max_features integer default 2000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_approved boolean;
  v_payload jsonb;
begin
  if coalesce(length(trim(p_device_id)),0) < 8
     or coalesce(length(trim(p_token_hash)),0) < 64 then
    return jsonb_build_object(
      'status','access_denied',
      'error','access_not_approved',
      'dataReturned',false,
      'segmentReturned',false,
      'rawMasterReturned',false
    );
  end if;

  select exists(
    select 1
    from public.water_approved_devices d
    where d.device_id = p_device_id
      and d.token_hash = p_token_hash
      and d.status = 'approved'
      and coalesce(d.revoked,false) = false
  ) into v_approved;

  if not v_approved then
    return jsonb_build_object(
      'status','access_denied',
      'error','access_not_approved',
      'dataReturned',false,
      'segmentReturned',false,
      'rawMasterReturned',false
    );
  end if;

  v_payload := public.pantavion_water_features_bbox_internal_v1(
    p_map_id,
    p_min_lng,
    p_min_lat,
    p_max_lng,
    p_max_lat,
    p_max_features
  );

  return v_payload || jsonb_build_object(
    'source','pantavion-postgis-device-v1',
    'accessMode','approved-device'
  );
end;
$function$;

create or replace function public.pantavion_water_mvt_tile_device_v1(
  p_device_id text,
  p_token_hash text,
  p_map_id text,
  p_z integer,
  p_x integer,
  p_y integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_approved boolean;
  v_tile text;
begin
  if coalesce(length(trim(p_device_id)),0) < 8
     or coalesce(length(trim(p_token_hash)),0) < 64 then
    return jsonb_build_object(
      'status','access_denied',
      'error','access_not_approved',
      'tileReturned',false,
      'rawMasterReturned',false
    );
  end if;

  select exists(
    select 1
    from public.water_approved_devices d
    where d.device_id = p_device_id
      and d.token_hash = p_token_hash
      and d.status = 'approved'
      and coalesce(d.revoked,false) = false
  ) into v_approved;

  if not v_approved then
    return jsonb_build_object(
      'status','access_denied',
      'error','access_not_approved',
      'tileReturned',false,
      'rawMasterReturned',false
    );
  end if;

  v_tile := public.pantavion_water_mvt_tile_internal_v1(
    p_map_id,p_z,p_x,p_y
  );

  return jsonb_build_object(
    'status','tile_ready',
    'tileBase64',coalesce(v_tile,''),
    'tileReturned',true,
    'rawMasterReturned',false,
    'source','pantavion-postgis-mvt-device-v1',
    'accessMode','approved-device'
  );
end;
$function$;

revoke all on function public.pantavion_water_features_bbox_device_v1(
  text,text,text,double precision,double precision,double precision,double precision,integer
) from public;

revoke all on function public.pantavion_water_mvt_tile_device_v1(
  text,text,text,integer,integer,integer
) from public;

grant execute on function public.pantavion_water_features_bbox_device_v1(
  text,text,text,double precision,double precision,double precision,double precision,integer
) to anon, authenticated;

grant execute on function public.pantavion_water_mvt_tile_device_v1(
  text,text,text,integer,integer,integer
) to anon, authenticated;
