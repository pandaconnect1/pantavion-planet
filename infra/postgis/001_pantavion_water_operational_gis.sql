-- Pantavion Water operational GIS foundation v1
-- Derived operational representation only. Authentic A/B/C masters remain immutable.

CREATE EXTENSION IF NOT EXISTS postgis;

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

CREATE TABLE IF NOT EXISTS pantavion_water.network_feature (
  feature_id uuid PRIMARY KEY,
  map_id text NOT NULL REFERENCES pantavion_water.map_registry(map_id),
  feature_type text NOT NULL CHECK (feature_type IN ('pipe','valve','junction','device','zone','label','reference')),
  source_sha256 text NOT NULL CHECK (length(source_sha256)=64),
  source_entity_ref text,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom geometry(Geometry,6312) NOT NULL,
  version bigint NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL
);

CREATE INDEX IF NOT EXISTS water_network_feature_geom_gix
  ON pantavion_water.network_feature USING gist (geom);
CREATE INDEX IF NOT EXISTS water_network_feature_map_type_idx
  ON pantavion_water.network_feature (map_id,feature_type);

CREATE TABLE IF NOT EXISTS pantavion_water.feature_audit (
  audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feature_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  actor_ref text NOT NULL,
  expected_version bigint,
  previous_record jsonb,
  next_record jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION pantavion_water.validate_network_geometry()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ST_SRID(NEW.geom) <> 6312 THEN
    RAISE EXCEPTION 'water_geometry_must_be_epsg_6312';
  END IF;
  IF NOT ST_IsValid(NEW.geom) THEN
    RAISE EXCEPTION 'water_geometry_invalid: %', ST_IsValidReason(NEW.geom);
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.version <> OLD.version + 1 THEN
      RAISE EXCEPTION 'water_feature_version_conflict';
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS water_network_geometry_gate ON pantavion_water.network_feature;
CREATE TRIGGER water_network_geometry_gate
BEFORE INSERT OR UPDATE ON pantavion_water.network_feature
FOR EACH ROW EXECUTE FUNCTION pantavion_water.validate_network_geometry();

CREATE OR REPLACE FUNCTION pantavion_water.audit_network_feature()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pantavion_water.feature_audit(
    feature_id,operation,actor_ref,expected_version,previous_record,next_record
  ) VALUES (
    COALESCE(NEW.feature_id,OLD.feature_id),
    TG_OP,
    COALESCE(NEW.updated_by,OLD.updated_by),
    CASE WHEN TG_OP='UPDATE' THEN OLD.version ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW,OLD);
END $$;

DROP TRIGGER IF EXISTS water_network_audit ON pantavion_water.network_feature;
CREATE TRIGGER water_network_audit
AFTER INSERT OR UPDATE OR DELETE ON pantavion_water.network_feature
FOR EACH ROW EXECUTE FUNCTION pantavion_water.audit_network_feature();
