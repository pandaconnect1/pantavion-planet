-- Append-only field-observed valve state history for Pantavion Water.
-- A simulation MUST NOT write here. Only authenticated field-confirmation workflows may append events.

CREATE TABLE IF NOT EXISTS pantavion_water.valve_field_confirmation (
  confirmation_id uuid PRIMARY KEY,
  revision_id uuid NOT NULL
    REFERENCES pantavion_water.network_revision(revision_id),
  valve_feature_id uuid NOT NULL
    REFERENCES pantavion_water.network_feature(feature_id),
  action text NOT NULL CHECK (action IN (
    'CONFIRM_OPEN','CONFIRM_CLOSED','CONFIRM_PARTIAL'
  )),
  observed_state text NOT NULL CHECK (observed_state IN (
    'OPEN','CLOSED','PARTIALLY_OPEN'
  )),
  confirmed_by_actor_id text NOT NULL CHECK (length(trim(confirmed_by_actor_id)) > 0),
  confirmed_at timestamptz NOT NULL,
  position geometry(Point,4326),
  position_accuracy_m double precision
    CHECK (position_accuracy_m IS NULL OR position_accuracy_m >= 0),
  position_captured_at timestamptz,
  fault_ref text,
  work_order_id text,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  source text NOT NULL DEFAULT 'FIELD_CONFIRMATION'
    CHECK (source='FIELD_CONFIRMATION'),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (action='CONFIRM_OPEN' AND observed_state='OPEN') OR
    (action='CONFIRM_CLOSED' AND observed_state='CLOSED') OR
    (action='CONFIRM_PARTIAL' AND observed_state='PARTIALLY_OPEN')
  ),
  CHECK (
    (position IS NULL AND position_accuracy_m IS NULL AND position_captured_at IS NULL)
    OR
    (position IS NOT NULL AND position_captured_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS water_valve_field_confirmation_lookup_idx
  ON pantavion_water.valve_field_confirmation(
    revision_id, valve_feature_id, confirmed_at DESC
  );

CREATE INDEX IF NOT EXISTS water_valve_field_confirmation_fault_idx
  ON pantavion_water.valve_field_confirmation(fault_ref)
  WHERE fault_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS water_valve_field_confirmation_position_gix
  ON pantavion_water.valve_field_confirmation USING gist(position);

CREATE OR REPLACE FUNCTION pantavion_water.validate_valve_field_confirmation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_feature_type text;
  v_feature_revision uuid;
BEGIN
  SELECT feature_type, revision_id
    INTO v_feature_type, v_feature_revision
  FROM pantavion_water.network_feature
  WHERE feature_id=NEW.valve_feature_id;

  IF v_feature_type IS DISTINCT FROM 'valve' THEN
    RAISE EXCEPTION 'water_valve_confirmation_requires_valve_feature';
  END IF;

  IF v_feature_revision IS DISTINCT FROM NEW.revision_id THEN
    RAISE EXCEPTION 'water_valve_confirmation_revision_mismatch';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS water_valve_field_confirmation_validate
  ON pantavion_water.valve_field_confirmation;
CREATE TRIGGER water_valve_field_confirmation_validate
BEFORE INSERT ON pantavion_water.valve_field_confirmation
FOR EACH ROW EXECUTE FUNCTION pantavion_water.validate_valve_field_confirmation();

CREATE OR REPLACE FUNCTION pantavion_water.forbid_valve_field_confirmation_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'water_valve_field_confirmation_is_append_only';
END $$;

DROP TRIGGER IF EXISTS water_valve_field_confirmation_forbid_update_delete
  ON pantavion_water.valve_field_confirmation;
CREATE TRIGGER water_valve_field_confirmation_forbid_update_delete
BEFORE UPDATE OR DELETE ON pantavion_water.valve_field_confirmation
FOR EACH ROW EXECUTE FUNCTION pantavion_water.forbid_valve_field_confirmation_mutation();

COMMENT ON TABLE pantavion_water.valve_field_confirmation IS
'Append-only human field observations of real valve position. Simulation/proposed isolation never changes observed state.';
