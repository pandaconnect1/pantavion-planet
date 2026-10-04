-- Forward-only compatibility migration from legacy map-scoped Water schemas.
-- ZERO DELETE: legacy columns/tables remain available for audit and rollback.
-- A-E are operational workspaces, never canonical network identities.

CREATE SCHEMA IF NOT EXISTS pantavion_water;

CREATE TABLE IF NOT EXISTS pantavion_water.network_revision (
  revision_id text PRIMARY KEY CHECK (length(trim(revision_id)) > 0),
  source_sha256 text NOT NULL CHECK (length(source_sha256)=64),
  status text NOT NULL DEFAULT 'VERIFIED'
    CHECK (status IN ('IMPORTED','REVIEWED','VERIFIED','PUBLISHED','SUPERSEDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL
);

CREATE TABLE IF NOT EXISTS pantavion_water.workspace_registry (
  workspace_id text PRIMARY KEY CHECK (workspace_id IN ('A','B','C','D','E')),
  display_name text NOT NULL,
  purpose text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

INSERT INTO pantavion_water.workspace_registry(workspace_id,display_name,purpose) VALUES
('A','Field Operations','Field work, faults, evidence and work orders'),
('B','Authentic Engineering Network','Verified engineering view of the canonical network'),
('C','Supervision and Approval','Review and approval workspace'),
('D','Engineering Intelligence','Hydraulic and engineering analysis workspace'),
('E','Historical Maps and Integration','Historical/source artifact comparison workspace')
ON CONFLICT (workspace_id) DO NOTHING;

-- Explicit compatibility map. It is intentionally empty until an authorized
-- migration records which legacy map/source belongs to which canonical revision.
CREATE TABLE IF NOT EXISTS pantavion_water.legacy_map_revision_mapping (
  legacy_map_id text PRIMARY KEY,
  revision_id text NOT NULL REFERENCES pantavion_water.network_revision(revision_id),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  mapped_by text NOT NULL,
  mapped_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF to_regclass('pantavion_water.network_feature') IS NOT NULL THEN
    ALTER TABLE pantavion_water.network_feature
      ADD COLUMN IF NOT EXISTS revision_id text;

    -- Never infer A/B/C/D/E => revision. Only migrate rows with explicit,
    -- reviewed compatibility evidence.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='pantavion_water'
        AND table_name='network_feature'
        AND column_name='map_id'
    ) THEN
      UPDATE pantavion_water.network_feature nf
      SET revision_id=m.revision_id
      FROM pantavion_water.legacy_map_revision_mapping m
      WHERE nf.revision_id IS NULL AND nf.map_id=m.legacy_map_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid='pantavion_water.network_feature'::regclass
        AND conname='network_feature_revision_fk'
    ) THEN
      ALTER TABLE pantavion_water.network_feature
        ADD CONSTRAINT network_feature_revision_fk
        FOREIGN KEY (revision_id) REFERENCES pantavion_water.network_revision(revision_id)
        NOT VALID;
    END IF;
  END IF;

  IF to_regclass('pantavion_water.hydraulic_scenario') IS NOT NULL THEN
    ALTER TABLE pantavion_water.hydraulic_scenario
      ADD COLUMN IF NOT EXISTS base_revision_id text;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='pantavion_water'
        AND table_name='hydraulic_scenario'
        AND column_name='base_map_id'
    ) THEN
      UPDATE pantavion_water.hydraulic_scenario hs
      SET base_revision_id=m.revision_id
      FROM pantavion_water.legacy_map_revision_mapping m
      WHERE hs.base_revision_id IS NULL AND hs.base_map_id=m.legacy_map_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid='pantavion_water.hydraulic_scenario'::regclass
        AND conname='hydraulic_scenario_revision_fk'
    ) THEN
      ALTER TABLE pantavion_water.hydraulic_scenario
        ADD CONSTRAINT hydraulic_scenario_revision_fk
        FOREIGN KEY (base_revision_id) REFERENCES pantavion_water.network_revision(revision_id)
        NOT VALID;
    END IF;
  END IF;

  IF to_regclass('pantavion_water.valve_field_confirmation') IS NOT NULL THEN
    ALTER TABLE pantavion_water.valve_field_confirmation
      ADD COLUMN IF NOT EXISTS fault_ref text;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='pantavion_water'
        AND table_name='valve_field_confirmation'
        AND column_name='fault_feature_id'
    ) THEN
      EXECUTE
        'UPDATE pantavion_water.valve_field_confirmation
         SET fault_ref=fault_feature_id::text
         WHERE fault_ref IS NULL AND fault_feature_id IS NOT NULL';
    END IF;

    CREATE INDEX IF NOT EXISTS water_valve_field_confirmation_fault_idx
      ON pantavion_water.valve_field_confirmation(fault_ref)
      WHERE fault_ref IS NOT NULL;
  END IF;
END $$;

COMMENT ON TABLE pantavion_water.workspace_registry IS
'A-E operational workspaces/views over one canonical versioned water-network truth.';
COMMENT ON TABLE pantavion_water.legacy_map_revision_mapping IS
'Explicit reviewed bridge from legacy map-scoped records to canonical network revisions. Never auto-infer.';
