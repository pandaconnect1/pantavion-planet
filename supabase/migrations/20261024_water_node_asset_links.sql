-- Migration: Water network node-asset spatial links and isolation matrix
-- Phase 1: Tables and indexes
-- Phase 2: Stored procedures for efficient linking

BEGIN;

-- 1. Node-Asset Link Table
CREATE TABLE IF NOT EXISTS public.water_network_node_asset_links (
  asset_number TEXT PRIMARY KEY,
  nearest_node_id INTEGER NOT NULL,
  distance_meters REAL NOT NULL,
  linked_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (asset_number) REFERENCES public.water_network_assets(number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wn_asset_links_node
  ON water_network_node_asset_links(nearest_node_id);

-- 2. Segment Isolation Sets (per-segment valve closure requirements)
CREATE TABLE IF NOT EXISTS public.water_segment_isolation (
  segment_id BIGINT PRIMARY KEY,
  isolation_valves TEXT[] DEFAULT '{}',
  upstream_valves TEXT[] DEFAULT '{}',
  downstream_valves TEXT[] DEFAULT '{}',
  blocking_valve_main TEXT,
  note TEXT,
  computed_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_segment_isolation_segment
  ON water_segment_isolation(segment_id);

-- 3. RPC: Find nearest node to asset
CREATE OR REPLACE FUNCTION find_nearest_node_to_asset(
  asset_x FLOAT,
  asset_y FLOAT,
  radius_degrees FLOAT DEFAULT 0.002
)
RETURNS TABLE(
  node_id INTEGER,
  distance_m REAL
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    n.node_id,
    ST_Distance(
      ST_Point(asset_x, asset_y)::geography,
      n.geom::geography
    )::REAL as distance_m
  FROM pantavion_water_stage.node_v3 n
  WHERE ST_DWithin(
    ST_Point(asset_x, asset_y)::geography,
    n.geom::geography,
    100  -- 100 meters
  )
  ORDER BY distance_m
  LIMIT 1;
$$;

-- 4. RPC: Count and analyze node-asset link coverage
CREATE OR REPLACE FUNCTION count_node_asset_links()
RETURNS TABLE(
  total_assets BIGINT,
  linked_count BIGINT,
  coverage_pct NUMERIC,
  within_20m BIGINT,
  within_50m BIGINT,
  within_100m BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.water_network_assets)::BIGINT,
    COUNT(*)::BIGINT,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.water_network_assets), 1)::NUMERIC,
    COUNT(*) FILTER (WHERE distance_meters < 20)::BIGINT,
    COUNT(*) FILTER (WHERE distance_meters < 50)::BIGINT,
    COUNT(*) FILTER (WHERE distance_meters < 100)::BIGINT
  FROM public.water_network_node_asset_links;
$$;

-- 5. RPC: Get valve isolation set for a segment
CREATE OR REPLACE FUNCTION get_segment_isolation_valves(
  p_segment_id BIGINT
)
RETURNS TABLE(
  valve_numbers TEXT[],
  blocking_main_valve TEXT,
  note TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    isolation_valves,
    blocking_valve_main,
    note
  FROM public.water_segment_isolation
  WHERE segment_id = p_segment_id;
$$;

-- 6. RPC: Link assets to nodes (batch operation)
CREATE OR REPLACE FUNCTION link_nodes_batch(
  p_asset_numbers TEXT[],
  p_node_ids INTEGER[],
  p_distances REAL[]
)
RETURNS TABLE(
  success BOOLEAN,
  linked_count INTEGER
)
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  FOR i IN 1..array_length(p_asset_numbers, 1) LOOP
    INSERT INTO public.water_network_node_asset_links
      (asset_number, nearest_node_id, distance_meters)
    VALUES
      (p_asset_numbers[i], p_node_ids[i], p_distances[i])
    ON CONFLICT (asset_number)
    DO UPDATE SET
      nearest_node_id = EXCLUDED.nearest_node_id,
      distance_meters = EXCLUDED.distance_meters,
      linked_at = now();

    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT true::BOOLEAN, v_count::INTEGER;
END;
$$;

-- 7. Summary stats (can be called to verify linking progress)
SELECT
  (SELECT COUNT(*) FROM water_network_assets) as total_assets,
  (SELECT COUNT(*) FROM water_network_node_asset_links) as linked_so_far,
  (SELECT COUNT(*) FROM water_segment_isolation) as isolation_sets_computed
AS job_status;

COMMIT;
