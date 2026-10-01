-- Full-network topology graph for Pantavion Water.
-- This graph references an immutable network revision and never mutates source geometry.

CREATE TABLE IF NOT EXISTS pantavion_water.topology_node (
  node_id uuid PRIMARY KEY,
  revision_id uuid NOT NULL REFERENCES pantavion_water.network_revision(revision_id),
  node_kind text NOT NULL CHECK (node_kind IN (
    'JUNCTION','RESERVOIR','TANK','PUMP_ENDPOINT','VALVE_ENDPOINT','SOURCE','BOUNDARY'
  )),
  geom geometry(Point,6312) NOT NULL,
  connectivity_evidence text NOT NULL CHECK (connectivity_evidence IN (
    'EXPLICIT_SOURCE_TOPOLOGY',
    'SURVEYED_CONNECTION',
    'VALIDATED_SHARED_ENDPOINT',
    'MANUALLY_VERIFIED'
  )),
  source_ref text NOT NULL
);

CREATE INDEX IF NOT EXISTS water_topology_node_geom_gix
  ON pantavion_water.topology_node USING gist (geom);
CREATE INDEX IF NOT EXISTS water_topology_node_revision_idx
  ON pantavion_water.topology_node(revision_id);

CREATE TABLE IF NOT EXISTS pantavion_water.topology_link (
  link_id uuid PRIMARY KEY,
  revision_id uuid NOT NULL REFERENCES pantavion_water.network_revision(revision_id),
  authentic_feature_id uuid NOT NULL REFERENCES pantavion_water.network_feature(feature_id),
  link_kind text NOT NULL CHECK (link_kind IN ('PIPE','PUMP','VALVE','CONTROL_DEVICE')),
  node_a uuid NOT NULL REFERENCES pantavion_water.topology_node(node_id),
  node_b uuid NOT NULL REFERENCES pantavion_water.topology_node(node_id),
  connectivity_evidence text NOT NULL CHECK (connectivity_evidence IN (
    'EXPLICIT_SOURCE_TOPOLOGY',
    'SURVEYED_CONNECTION',
    'VALIDATED_SHARED_ENDPOINT',
    'MANUALLY_VERIFIED'
  )),
  orientation_semantics text NOT NULL DEFAULT 'STORAGE_ONLY_NOT_FLOW_DIRECTION'
    CHECK (orientation_semantics='STORAGE_ONLY_NOT_FLOW_DIRECTION'),
  CHECK (node_a <> node_b)
);

CREATE INDEX IF NOT EXISTS water_topology_link_revision_idx
  ON pantavion_water.topology_link(revision_id);
CREATE INDEX IF NOT EXISTS water_topology_link_node_a_idx
  ON pantavion_water.topology_link(node_a);
CREATE INDEX IF NOT EXISTS water_topology_link_node_b_idx
  ON pantavion_water.topology_link(node_b);
CREATE INDEX IF NOT EXISTS water_topology_link_feature_idx
  ON pantavion_water.topology_link(authentic_feature_id);

CREATE OR REPLACE FUNCTION pantavion_water.forbid_topology_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'water_topology_revision_is_immutable';
END $$;

DROP TRIGGER IF EXISTS water_topology_node_forbid_update_delete
  ON pantavion_water.topology_node;
CREATE TRIGGER water_topology_node_forbid_update_delete
BEFORE UPDATE OR DELETE ON pantavion_water.topology_node
FOR EACH ROW EXECUTE FUNCTION pantavion_water.forbid_topology_mutation();

DROP TRIGGER IF EXISTS water_topology_link_forbid_update_delete
  ON pantavion_water.topology_link;
CREATE TRIGGER water_topology_link_forbid_update_delete
BEFORE UPDATE OR DELETE ON pantavion_water.topology_link
FOR EACH ROW EXECUTE FUNCTION pantavion_water.forbid_topology_mutation();

CREATE OR REPLACE FUNCTION pantavion_water.trace_connected_network(
  p_revision_id uuid,
  p_start_node_ids uuid[],
  p_blocked_feature_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS TABLE(node_id uuid, feature_id uuid)
LANGUAGE sql
STABLE
AS $$
WITH RECURSIVE walk AS (
  SELECT unnest(p_start_node_ids) AS node_id, NULL::uuid AS feature_id
  UNION
  SELECT
    CASE WHEN l.node_a=w.node_id THEN l.node_b ELSE l.node_a END AS node_id,
    l.authentic_feature_id
  FROM walk w
  JOIN pantavion_water.topology_link l
    ON l.revision_id=p_revision_id
   AND (l.node_a=w.node_id OR l.node_b=w.node_id)
   AND NOT (l.authentic_feature_id = ANY(p_blocked_feature_ids))
)
SELECT DISTINCT node_id,feature_id FROM walk;
$$;

COMMENT ON FUNCTION pantavion_water.trace_connected_network IS
'Physical connectivity trace only. It does not infer hydraulic flow direction. Flow direction is scenario-solver output.';
