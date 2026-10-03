-- Forward-only compatibility migration for existing Pantavion Water databases.
-- Additive/idempotent: preserves existing rows and does not drop legacy columns.

CREATE SCHEMA IF NOT EXISTS pantavion_water;

CREATE TABLE IF NOT EXISTS pantavion_water.map_registry (
  map_id text PRIMARY KEY CHECK (length(trim(map_id)) > 0),
  display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  source_kind text NOT NULL DEFAULT 'AUTHENTIC_MASTER',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO pantavion_water.map_registry(map_id,display_name)
VALUES ('A','Map A'),('B','Map B'),('C','Map C'),('D','Map D'),('E','Map E')
ON CONFLICT (map_id) DO NOTHING;

DO $$
DECLARE
  constraint_record record;
BEGIN
  IF to_regclass('pantavion_water.network_feature') IS NOT NULL THEN
    FOR constraint_record IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='pantavion_water'
        AND t.relname='network_feature'
        AND c.contype='c'
        AND pg_get_constraintdef(c.oid) ILIKE '%map_id%'
    LOOP
      EXECUTE format(
        'ALTER TABLE pantavion_water.network_feature DROP CONSTRAINT %I',
        constraint_record.conname
      );
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid='pantavion_water.network_feature'::regclass
        AND contype='f'
        AND confrelid='pantavion_water.map_registry'::regclass
    ) THEN
      ALTER TABLE pantavion_water.network_feature
        ADD CONSTRAINT network_feature_map_registry_fk
        FOREIGN KEY (map_id) REFERENCES pantavion_water.map_registry(map_id)
        NOT VALID;
      ALTER TABLE pantavion_water.network_feature
        VALIDATE CONSTRAINT network_feature_map_registry_fk;
    END IF;
  END IF;

  IF to_regclass('pantavion_water.hydraulic_scenario') IS NOT NULL THEN
    FOR constraint_record IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='pantavion_water'
        AND t.relname='hydraulic_scenario'
        AND c.contype='c'
        AND pg_get_constraintdef(c.oid) ILIKE '%base_map_id%'
    LOOP
      EXECUTE format(
        'ALTER TABLE pantavion_water.hydraulic_scenario DROP CONSTRAINT %I',
        constraint_record.conname
      );
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid='pantavion_water.hydraulic_scenario'::regclass
        AND contype='f'
        AND confrelid='pantavion_water.map_registry'::regclass
    ) THEN
      ALTER TABLE pantavion_water.hydraulic_scenario
        ADD CONSTRAINT hydraulic_scenario_map_registry_fk
        FOREIGN KEY (base_map_id) REFERENCES pantavion_water.map_registry(map_id)
        NOT VALID;
      ALTER TABLE pantavion_water.hydraulic_scenario
        VALIDATE CONSTRAINT hydraulic_scenario_map_registry_fk;
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
