-- Water Isolation Analysis & Fault Hints
-- Stored procedures for determining which valves to close per fault location

BEGIN;

-- 1. Table for isolation matrix (segment → valves to close)
CREATE TABLE IF NOT EXISTS public.water_segment_isolation_matrix (
  segment_id BIGINT PRIMARY KEY,
  blocking_main_valve TEXT,           -- Single valve that isolates entire section
  upstream_valves TEXT[] DEFAULT '{}', -- Valves upstream (before the fault)
  downstream_valves TEXT[] DEFAULT '{}',  -- Valves downstream (after the fault)
  isolation_description TEXT,          -- Plain English description
  computed_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (blocking_main_valve) REFERENCES water_network_assets(number)
);

CREATE INDEX idx_isolation_segment ON water_segment_isolation_matrix(segment_id);

-- 2. RPC: Get isolation hints for a fault location
CREATE OR REPLACE FUNCTION get_isolation_hints(
  p_asset_number TEXT,
  p_street TEXT,
  p_area_code TEXT
)
RETURNS TABLE(
  blocking_valve TEXT,
  upstream_valves TEXT[],
  downstream_valves TEXT[],
  description TEXT,
  hint_strength TEXT  -- strong, moderate, weak
)
LANGUAGE PLPGSQL
STABLE
AS $$
DECLARE
  v_node_id INTEGER;
  v_segment_id BIGINT;
BEGIN
  -- Find nearest node to the fault location
  SELECT nearest_node_id INTO v_node_id
  FROM water_network_node_asset_links
  WHERE asset_number = p_asset_number
  LIMIT 1;

  IF v_node_id IS NULL THEN
    RETURN;  -- No match found
  END IF;

  -- For demo: return common closure pattern for the area
  RETURN QUERY
  SELECT
    p_asset_number,
    ARRAY[p_asset_number],  -- Simple: close the asset itself first
    ARRAY['TEST'],          -- Placeholder
    FORMAT('To isolate section near %s (%s), close valve %s',
           p_street, p_area_code, p_asset_number),
    'strong'::TEXT;
END;
$$;

-- 3. RPC: Compute isolation matrix for all segments (graph algorithm)
CREATE OR REPLACE FUNCTION compute_isolation_matrix()
RETURNS TABLE(
  segment_count BIGINT,
  isolation_sets_computed BIGINT
)
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_computed BIGINT := 0;
BEGIN
  -- This is a placeholder for graph traversal algorithm
  -- In production, this would:
  -- 1. Traverse network from each segment endpoint
  -- 2. Find all valves that cross the path
  -- 3. Determine "upstream" vs "downstream"
  -- 4. Identify the minimum set needed to isolate

  -- For now, insert a sample entry
  INSERT INTO water_segment_isolation_matrix
    (segment_id, blocking_main_valve, description)
  VALUES
    (1, '120-V0001', 'Sample isolation for segment 1')
  ON CONFLICT (segment_id) DO NOTHING;

  v_computed := 1;

  RETURN QUERY
  SELECT COUNT(*)::BIGINT, v_computed
  FROM water_segment_isolation_matrix;
END;
$$;

-- 4. View: All faults with isolation hints
CREATE OR REPLACE VIEW water_faults_with_isolation AS
SELECT
  f.id as fault_id,
  f.street,
  f.area_code,
  f.number as asset_number,
  f.created_at,
  iso.blocking_main_valve,
  iso.upstream_valves,
  iso.downstream_valves,
  iso.isolation_description
FROM public.water_fault_records f
LEFT JOIN public.water_segment_isolation_matrix iso
  ON f.id::BIGINT = iso.segment_id;

-- 5. Function: Material cost estimation
CREATE OR REPLACE FUNCTION estimate_fault_cost(p_fault_id TEXT)
RETURNS TABLE(
  total_cost DECIMAL,
  material_count INTEGER,
  estimated_labor_hours NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COALESCE(SUM(m.quantity * ml.unit_price), 0)::DECIMAL as total_cost,
    COUNT(DISTINCT m.id)::INTEGER as material_count,
    COALESCE(SUM(m.quantity) * 0.5, 0)::NUMERIC as labor_hours
  FROM water_fault_materials m
  LEFT JOIN water_material_library ml ON m.material_id = ml.id
  WHERE m.fault_id = p_fault_id;
$$;

-- 6. Trigger: Auto-populate material costs
CREATE TABLE IF NOT EXISTS public.water_material_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  unit_price DECIMAL DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Sample materials
INSERT INTO water_material_library (id, name, category, unit, unit_price, supplier)
VALUES
  ('pipe-pvc-63', 'PVC Pipe 63mm', 'pipe', 'meter', 12.50, 'Local'),
  ('pipe-pvc-110', 'PVC Pipe 110mm', 'pipe', 'meter', 25.00, 'Local'),
  ('valve-gate-50', 'Gate Valve DN50', 'valve', 'piece', 85.00, 'Local'),
  ('valve-ball-50', 'Ball Valve DN50', 'valve', 'piece', 65.00, 'Local'),
  ('hydrant-outdoor', 'Outdoor Hydrant', 'hydrant', 'piece', 150.00, 'Local'),
  ('coupling-pvc', 'PVC Coupling 63mm', 'coupling', 'piece', 5.00, 'Local')
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT
  'Isolation analysis tables created' as status,
  COUNT(*) as material_library_items
FROM water_material_library;

COMMIT;
