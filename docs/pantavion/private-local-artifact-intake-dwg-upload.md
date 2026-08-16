# Pantavion PATCH 8T - Private Local Artifact Intake / DWG Upload

Status: internal ready

This patch adds real local private artifact intake for Pantavion.

## Purpose

Private Local Artifact Intake allows Pantavion to ingest large files from a local/USB path into private storage.

## Supported artifacts

- DWG / DXF / DGN
- KML / KMZ / SHP / GPKG / GeoJSON
- PDF / ZIP
- Excel / CSV
- Word / DOCX
- images
- JSON

## Locked rules

- Original DWG is never mutated.
- Original artifacts are never edited.
- No Git storage.
- No public folder.
- No public access.
- Private storage only.
- Source-truth/CAD files require founder approval.
- Large/source-truth/CAD files require SHA256.
- B/C requested surface is stored as metadata.
- Processing remains sidecar-only.

## Runtime surface

- GET /api/kernel/private-local-artifact-intake
- POST /api/kernel/private-local-artifact-intake

## POST ingest example

{
  "mode": "ingest",
  "sourcePath": "E:\\GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "expectedSha256": "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  "sourceTruth": true,
  "requestedSurface": "B",
  "founderApproved": true,
  "actor": "founder:george"
}

## State file

data/kernel/private-local-artifact-intake-state.json

## Audit file

data/kernel/private-local-artifact-intake-audit.jsonl

## Private artifact folder

data/private-artifacts/originals/
