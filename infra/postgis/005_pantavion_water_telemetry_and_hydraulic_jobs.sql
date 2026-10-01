-- Provider-neutral telemetry + hydraulic execution queue.
-- Authentic network remains read-only. Telemetry is append-only. Simulation outputs are separate artifacts.

CREATE TABLE IF NOT EXISTS pantavion_water.telemetry_sensor (
  sensor_id text PRIMARY KEY,
  sensor_kind text NOT NULL,
  feature_ref text,
  source_system text NOT NULL,
  unit text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pantavion_water.telemetry_observation (
  observation_id uuid PRIMARY KEY,
  sensor_id text NOT NULL REFERENCES pantavion_water.telemetry_sensor(sensor_id),
  feature_ref text,
  metric text NOT NULL,
  numeric_value double precision,
  text_value text,
  boolean_value boolean,
  observed_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  quality text NOT NULL CHECK (quality IN ('VALIDATED','RAW','SUSPECT','BAD','MISSING')),
  unit text NOT NULL,
  source_system text NOT NULL,
  provenance_ref text NOT NULL,
  CHECK (
    (numeric_value IS NOT NULL)::int +
    (text_value IS NOT NULL)::int +
    (boolean_value IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS water_telemetry_sensor_time_idx
  ON pantavion_water.telemetry_observation(sensor_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS water_telemetry_feature_time_idx
  ON pantavion_water.telemetry_observation(feature_ref, observed_at DESC);
CREATE INDEX IF NOT EXISTS water_telemetry_metric_time_idx
  ON pantavion_water.telemetry_observation(metric, observed_at DESC);

CREATE OR REPLACE FUNCTION pantavion_water.forbid_telemetry_observation_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'water_telemetry_observation_is_append_only';
END $$;

DROP TRIGGER IF EXISTS water_telemetry_observation_forbid_update_delete
  ON pantavion_water.telemetry_observation;
CREATE TRIGGER water_telemetry_observation_forbid_update_delete
BEFORE UPDATE OR DELETE ON pantavion_water.telemetry_observation
FOR EACH ROW EXECUTE FUNCTION pantavion_water.forbid_telemetry_observation_mutation();

CREATE TABLE IF NOT EXISTS pantavion_water.hydraulic_job (
  job_id uuid PRIMARY KEY,
  network_revision_id uuid NOT NULL REFERENCES pantavion_water.network_revision(revision_id),
  scenario_id uuid REFERENCES pantavion_water.hydraulic_scenario(scenario_id),
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  purpose text NOT NULL,
  engine_requested text NOT NULL CHECK (engine_requested IN ('EPANET_2_2','WNTR')),
  analysis_scope text NOT NULL CHECK (analysis_scope IN ('HYDRAULIC_INFLUENCE_GRAPH','FULL_NETWORK_MODEL')),
  input_fingerprint_sha256 text NOT NULL CHECK (length(input_fingerprint_sha256)=64),
  input_manifest jsonb NOT NULL,
  status text NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','CLAIMED','RUNNING','SUCCEEDED','FAILED','BLOCKED')),
  claimed_by text,
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  failure_code text,
  failure_detail text
);

CREATE UNIQUE INDEX IF NOT EXISTS water_hydraulic_job_dedupe_idx
  ON pantavion_water.hydraulic_job(network_revision_id,input_fingerprint_sha256)
  WHERE status IN ('QUEUED','CLAIMED','RUNNING','SUCCEEDED');

CREATE INDEX IF NOT EXISTS water_hydraulic_job_status_requested_idx
  ON pantavion_water.hydraulic_job(status,requested_at);

CREATE TABLE IF NOT EXISTS pantavion_water.hydraulic_result (
  result_id uuid PRIMARY KEY,
  job_id uuid NOT NULL UNIQUE REFERENCES pantavion_water.hydraulic_job(job_id),
  engine_used text NOT NULL,
  engine_version text NOT NULL,
  network_revision_id uuid NOT NULL REFERENCES pantavion_water.network_revision(revision_id),
  input_fingerprint_sha256 text NOT NULL CHECK (length(input_fingerprint_sha256)=64),
  result_manifest jsonb NOT NULL,
  summary jsonb NOT NULL,
  artifact_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hydraulic_result_job_revision_consistency UNIQUE(job_id,network_revision_id)
);

CREATE OR REPLACE FUNCTION pantavion_water.forbid_hydraulic_result_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'water_hydraulic_result_is_immutable';
END $$;

DROP TRIGGER IF EXISTS water_hydraulic_result_forbid_update_delete
  ON pantavion_water.hydraulic_result;
CREATE TRIGGER water_hydraulic_result_forbid_update_delete
BEFORE UPDATE OR DELETE ON pantavion_water.hydraulic_result
FOR EACH ROW EXECUTE FUNCTION pantavion_water.forbid_hydraulic_result_mutation();

COMMENT ON TABLE pantavion_water.hydraulic_job IS
'Durable simulation queue. Jobs pin a network revision and never write hydraulic outputs back into the authentic network.';
COMMENT ON TABLE pantavion_water.telemetry_observation IS
'Append-only operational telemetry evidence for pressure, flow, levels, valve/pump state and water-quality measurements.';
