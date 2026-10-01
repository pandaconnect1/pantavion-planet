-- Preserve authentic Map A source styling in protected bbox/MVT derivatives.
-- This migration changes only derived-serving metadata. It never mutates the
-- authentic DWG/KMZ master or source geometry.

create or replace function public.pantavion_water_features_bbox_internal_v1(
  p_map_id text,
  p_min_lng double precision,
  p_min_lat double precision,
  p_max_lng double precision,
  p_max_lat double precision,
  p_max_features integer default 2000
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_limit integer;
  v_bbox extensions.geometry;
  v_features jsonb;
  v_count integer;
  v_truncated boolean;
begin
  if p_min_lng is null or p_min_lat is null
     or p_max_lng is null or p_max_lat is null
     or p_min_lng >= p_max_lng or p_min_lat >= p_max_lat
     or p_min_lng < -180 or p_max_lng > 180
     or p_min_lat < -90 or p_max_lat > 90 then
    raise exception 'invalid_bbox';
  end if;

  v_limit := greatest(1, least(coalesce(p_max_features,2000),5000));
  v_bbox := extensions.st_makeenvelope(
    p_min_lng,p_min_lat,p_max_lng,p_max_lat,4326
  );

  with matched as (
    select
      f.feature_id,
      f.object_class,
      f.layer_name,
      f.name,
      f.style_url,
      f.source_feature_id,
      s.color_css as source_color_css,
      s.opacity as source_opacity,
      s.width as source_line_width,
      f.geom
    from public.water_gis_features f
    left join public.water_map_a_kml_styles s
      on s.style_url = f.style_url
    where f.map_id = upper(trim(p_map_id))
      and extensions.st_intersects(f.geom, v_bbox)
    order by f.feature_id
    limit v_limit + 1
  ),
  limited as (
    select * from matched limit v_limit
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'type','Feature',
          'id',feature_id,
          'geometry',extensions.st_asgeojson(geom)::jsonb,
          'properties',jsonb_strip_nulls(jsonb_build_object(
            'featureId',feature_id,
            'sourceFeatureId',source_feature_id,
            'objectClass',object_class,
            'layerName',layer_name,
            'name',name,
            'styleUrl',style_url,
            'sourceColorCss',source_color_css,
            'sourceOpacity',source_opacity,
            'sourceLineWidth',source_line_width
          ))
        )
        order by feature_id
      ),
      '[]'::jsonb
    ),
    (select count(*) from matched),
    (select count(*) > v_limit from matched)
  into v_features, v_count, v_truncated
  from limited;

  return jsonb_build_object(
    'status','segment_ready',
    'segment',jsonb_build_object(
      'type','FeatureCollection',
      'features',coalesce(v_features,'[]'::jsonb)
    ),
    'segmentCount',least(coalesce(v_count,0),v_limit),
    'segmentTruncated',coalesce(v_truncated,false),
    'dataReturned',true,
    'segmentReturned',true,
    'completeNetworkReturned',false,
    'rawMasterReturned',false,
    'browserFullNetworkLoaded',false,
    'source','pantavion-postgis-v1',
    'sourceStyleMetadataPreserved',true
  );
end;
$function$;

create or replace function public.pantavion_water_mvt_tile_internal_v1(
  p_map_id text,
  p_z integer,
  p_x integer,
  p_y integer
)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_tile extensions.geometry;
  v_bbox4326 extensions.geometry;
  v_limit integer;
  v_mvt bytea;
begin
  if p_z is null or p_x is null or p_y is null
     or p_z < 0 or p_z > 22
     or p_x < 0 or p_y < 0
     or p_x >= (1::bigint << p_z)
     or p_y >= (1::bigint << p_z) then
    raise exception 'invalid_tile';
  end if;

  if p_z < 12 then
    return '';
  end if;

  v_limit := case
    when p_z <= 12 then 2500
    when p_z <= 14 then 6000
    when p_z <= 16 then 12000
    else 24000
  end;

  v_tile := extensions.st_tileenvelope(p_z,p_x,p_y);
  v_bbox4326 := extensions.st_transform(v_tile,4326);

  with tile_rows as (
    select
      f.feature_id::bigint as id,
      f.object_class,
      f.layer_name,
      f.name,
      f.style_url,
      f.source_feature_id,
      s.color_css as source_color_css,
      s.opacity::double precision as source_opacity,
      s.width::double precision as source_line_width,
      extensions.st_asmvtgeom(
        extensions.st_transform(f.geom,3857),
        v_tile,
        4096,
        64,
        true
      ) as geom
    from public.water_gis_features f
    left join public.water_map_a_kml_styles s
      on s.style_url = f.style_url
    where f.map_id = upper(trim(p_map_id))
      and extensions.st_intersects(f.geom,v_bbox4326)
    order by f.feature_id
    limit v_limit
  )
  select extensions.st_asmvt(tile_rows,'water',4096,'geom','id')
  into v_mvt
  from tile_rows
  where geom is not null;

  return encode(coalesce(v_mvt,''::bytea),'base64');
end;
$function$;

revoke all on function public.pantavion_water_features_bbox_internal_v1(
  text,double precision,double precision,double precision,double precision,integer
) from public, anon, authenticated;

revoke all on function public.pantavion_water_mvt_tile_internal_v1(
  text,integer,integer,integer
) from public, anon, authenticated;

grant execute on function public.pantavion_water_features_bbox_internal_v1(
  text,double precision,double precision,double precision,double precision,integer
) to service_role;

grant execute on function public.pantavion_water_mvt_tile_internal_v1(
  text,integer,integer,integer
) to service_role;
