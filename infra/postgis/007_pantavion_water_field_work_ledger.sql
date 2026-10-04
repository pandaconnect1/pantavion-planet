-- Pantavion-owned field work ledger.
-- Append-only operational evidence; canonical network geometry changes remain proposals.

CREATE SCHEMA IF NOT EXISTS pantavion_water;

CREATE TABLE IF NOT EXISTS pantavion_water.field_work_event (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id text NOT NULL CHECK (length(trim(work_order_id)) > 0),
  stage text NOT NULL CHECK (stage IN (
    'FAULT','LOCATE','SITE_SAFETY','EXCAVATION','NETWORK_REPAIR',
    'TEST','BACKFILL','SURFACE_RESTORATION','CLOSURE'
  )),
  street_registry_id text,
  target_feature_id text,
  fault_ref text,
  payload jsonb NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  captured_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  actor_ref text NOT NULL CHECK (length(trim(actor_ref)) > 0)
);

CREATE INDEX IF NOT EXISTS water_field_work_order_time_idx
  ON pantavion_water.field_work_event(work_order_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS water_field_work_fault_idx
  ON pantavion_water.field_work_event(fault_ref)
  WHERE fault_ref IS NOT NULL;

CREATE OR REPLACE FUNCTION pantavion_water.prevent_field_work_event_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'field_work_event_is_append_only';
END;
$$;

DROP TRIGGER IF EXISTS water_field_work_event_immutable
  ON pantavion_water.field_work_event;
CREATE TRIGGER water_field_work_event_immutable
BEFORE UPDATE OR DELETE ON pantavion_water.field_work_event
FOR EACH ROW EXECUTE FUNCTION pantavion_water.prevent_field_work_event_mutation();

COMMENT ON TABLE pantavion_water.field_work_event IS
'Append-only worker/technician operational evidence. Does not directly mutate canonical water-network truth.';
