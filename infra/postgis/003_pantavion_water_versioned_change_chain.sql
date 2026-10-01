-- Versioned, auditable Water network updates.
-- Historical authentic states are never overwritten.

CREATE TABLE IF NOT EXISTS pantavion_water.change_request (
  request_id uuid PRIMARY KEY,
  change_kind text NOT NULL CHECK (change_kind IN (
    'REPLACE_MAP_SOURCE',
    'ADD_MAP_SUPPLEMENT',
    'ADD_NETWORK_EXTENSION',
    'UPDATE_NETWORK_AFTER_FIELD_WORK',
    'CORRECT_SURVEYED_NETWORK',
    'UPDATE_REFERENCE_ROADS_OR_BASEMAP'
  )),
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  source_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_map_ids text[] NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED','VALIDATED','APPROVED','APPLIED','REJECTED')),
  approved_by text,
  approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS pantavion_water.network_revision (
  revision_id uuid PRIMARY KEY,
  parent_revision_id uuid REFERENCES pantavion_water.network_revision(revision_id),
  request_id uuid NOT NULL REFERENCES pantavion_water.change_request(request_id),
  source_sha256 text NOT NULL CHECK (length(source_sha256)=64),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','VERIFIED','PUBLISHED','SUPERSEDED')),
  verification_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz
);

ALTER TABLE pantavion_water.network_feature
  ADD COLUMN IF NOT EXISTS revision_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='water_network_feature_revision_fk'
  ) THEN
    ALTER TABLE pantavion_water.network_feature
      ADD CONSTRAINT water_network_feature_revision_fk
      FOREIGN KEY (revision_id)
      REFERENCES pantavion_water.network_revision(revision_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS water_network_feature_revision_idx
  ON pantavion_water.network_feature(revision_id);

CREATE OR REPLACE FUNCTION pantavion_water.require_network_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.revision_id IS NULL THEN
    RAISE EXCEPTION 'water_network_revision_required';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS water_network_require_revision
  ON pantavion_water.network_feature;
CREATE TRIGGER water_network_require_revision
BEFORE INSERT ON pantavion_water.network_feature
FOR EACH ROW EXECUTE FUNCTION pantavion_water.require_network_revision();

COMMENT ON TABLE pantavion_water.network_revision IS
'Immutable chain of authentic network states. Every accepted real-world update creates a new revision; prior revisions remain preserved.';
