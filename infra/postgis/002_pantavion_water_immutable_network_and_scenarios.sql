-- Founder directive: authentic water network is immutable.
-- Corrections or future surveyed states are new immutable snapshots, never in-place edits.

CREATE OR REPLACE FUNCTION pantavion_water.forbid_authentic_network_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'water_authentic_network_is_immutable';
END $$;

DROP TRIGGER IF EXISTS water_network_forbid_update_delete
  ON pantavion_water.network_feature;
CREATE TRIGGER water_network_forbid_update_delete
BEFORE UPDATE OR DELETE ON pantavion_water.network_feature
FOR EACH ROW EXECUTE FUNCTION pantavion_water.forbid_authentic_network_mutation();

CREATE TABLE IF NOT EXISTS pantavion_water.hydraulic_scenario (
  scenario_id uuid PRIMARY KEY,
  name text NOT NULL,
  base_revision_id text NOT NULL REFERENCES pantavion_water.network_revision(revision_id),
  base_source_sha256 text NOT NULL CHECK (length(base_source_sha256)=64),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','RUNNING','COMPLETED','ARCHIVED')),
  purpose text NOT NULL,
  CONSTRAINT hydraulic_scenario_never_is_master CHECK (status <> 'MASTER')
);

CREATE TABLE IF NOT EXISTS pantavion_water.hydraulic_scenario_override (
  scenario_id uuid NOT NULL REFERENCES pantavion_water.hydraulic_scenario(scenario_id),
  authentic_feature_id uuid,
  scenario_feature_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('ADD','SIMULATE_CHANGE','SIMULATE_CLOSURE','SIMULATE_FAILURE')),
  proposed_properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed_geom geometry(Geometry,6312),
  PRIMARY KEY (scenario_id,scenario_feature_id)
);

COMMENT ON TABLE pantavion_water.network_feature IS
'IMMUTABLE authentic/derived-faithful water-network snapshot. No UPDATE/DELETE. Never a simulation workspace.';
COMMENT ON TABLE pantavion_water.hydraulic_scenario_override IS
'Separate engineering scenario only. Cannot overwrite authentic network.';
