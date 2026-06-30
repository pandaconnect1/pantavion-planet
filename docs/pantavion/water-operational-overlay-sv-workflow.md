# Pantavion PATCH 8O - Water Operational Overlay / SV Workflow

Status: internal foundation

This patch adds operational overlay logic for water network assets, especially SV valves.

## Rules

- Original DWG is never mutated.
- Original colors, layers, entities, text, labels and blocks stay untouched.
- Surface B remains original-only.
- Surface C is the operational overlay surface.
- This is not remote physical valve control.
- This does not write to SCADA.
- Every operational change is audited.

## SV color/state workflow

- Blue: temporary closed for fault isolation or repair.
- Red: permanent / locked closed.
- Green: opened after repair or replacement pending verification.
- Orange/Amber: problem or field verification required.
- Purple: defective / inoperable / replacement required.
- Cyan dashed ring + white internal hatch lines / LOST symbol: SV lost, covered, buried, paved over, under premix/asphalt/sidewalk, loose, or not visible in the field.
- Natural: overlay cleared and original map style visible again.

## Runtime surface

- GET /api/kernel/water-operational-overlay
- POST /api/kernel/water-operational-overlay

## POST assess example

{
  "mode": "assess",
  "action": "mark_sv_lost_or_covered",
  "assetId": "SV-123",
  "assetKind": "SV",
  "surface": "C",
  "reason": "Covered by premix / sidewalk"
}

## POST apply example

{
  "mode": "apply",
  "action": "mark_sv_replacement_required",
  "assetId": "SV-123",
  "assetKind": "SV",
  "surface": "C",
  "workOrderId": "WO-1001",
  "reason": "SV defective and inoperable"
}

## State file

data/kernel/water-operational-overlay-state.json

## Audit file

data/kernel/water-operational-overlay-audit.jsonl


## Visual distinction rule

The lost/covered SV visual must be distinct from blue temporary closed SV.

- Temporary closed SV: solid blue operational marker.
- Lost/covered/loose SV: cyan dashed ring with white internal hatch lines or LOST symbol.
- Purpose: avoid field/operator confusion during fault isolation and repair.
