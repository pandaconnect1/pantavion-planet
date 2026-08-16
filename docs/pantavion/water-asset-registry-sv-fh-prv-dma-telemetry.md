# Pantavion PATCH 8P - Water Asset Registry SV/FH/PRV/DMA/Telemetry

Status: internal foundation

This patch adds the canonical professional water asset registry.

## Asset types

SV / FH / PRV / DMA / PIPE / METER / PUMP / TANK / RESERVOIR / TELEMETRY

## Rules

- Original DWG is never mutated.
- Original colors, layers, entities, blocks, text and labels remain untouched.
- Asset records store metadata and source references only.
- Operational overlays are linked to assets but remain separate from original DWG styling.
- No physical valve control.
- No SCADA write.
- Telemetry is read/status binding only at this stage.
- Defective, replacement required, lost/covered and field verification workflows require audit.
- Work orders, photos and telemetry point ids are stored as references only.

## Runtime surface

- GET /api/kernel/water-asset-registry
- POST /api/kernel/water-asset-registry

## POST assess example

{
  "mode": "assess",
  "assetId": "SV-123",
  "kind": "SV",
  "condition": "lost_or_covered",
  "roadName": "Example Road",
  "sourceDwgBindingId": "water_master_b_c_original_dwg"
}

## POST register example

{
  "mode": "register",
  "assetId": "PRV-12",
  "kind": "PRV",
  "condition": "normal",
  "zoneId": "ZONE-3",
  "dmaId": "DMA-2",
  "telemetryPointIds": ["SCADA.PRV12.PRESSURE_IN", "SCADA.PRV12.PRESSURE_OUT"]
}

## State file

data/kernel/water-asset-registry-state.json

## Audit file

data/kernel/water-asset-registry-audit.jsonl

## Scope token

SV / FH / PRV / DMA / Telemetry
