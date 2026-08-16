# Pantavion PATCH 8Q - Work Order / Field Verification Registry

Status: internal foundation

This patch adds the work order and field verification registry for Pantavion Water.

## Scope

Work Order / Field Verification Registry

Supported workflow types:

- fault
- repair
- replacement
- inspection
- lost_covered_investigation
- telemetry_check
- hydraulic_check
- as_built_verification

## Rules

- Original DWG is never mutated.
- Work orders reference source DWG and asset records only.
- No physical valve control.
- No SCADA write.
- Telemetry is read/status binding only at this stage.
- Repair, replacement, lost/covered investigation and as-built verification require photo references or field evidence.
- Closing workflows requires field verification where applicable.
- Replacement and final closure require supervisor review.
- Every assessment and registration is audited.

## Linked entities

- SV / FH / PRV / DMA / PIPE / METER / PUMP / TANK / RESERVOIR / TELEMETRY
- assetId
- faultId
- crewId
- assignedTo
- photo references
- material references
- telemetryPointIds
- relatedWorkOrderIds
- roadName / zoneId / dmaId
- sourceDwgBindingId

## Runtime surface

- GET /api/kernel/water-work-order-registry
- POST /api/kernel/water-work-order-registry

## POST assess example

{
  "mode": "assess",
  "workOrderId": "WO-1001",
  "assetId": "SV-123",
  "assetKind": "SV",
  "kind": "lost_covered_investigation",
  "status": "open",
  "priority": "high",
  "reason": "SV covered by premix / sidewalk"
}

## POST register example

{
  "mode": "register",
  "workOrderId": "WO-1002",
  "assetId": "PRV-12",
  "assetKind": "PRV",
  "kind": "telemetry_check",
  "status": "assigned",
  "priority": "normal",
  "telemetryPointIds": ["SCADA.PRV12.PRESSURE_IN", "SCADA.PRV12.PRESSURE_OUT"]
}

## State file

data/kernel/water-work-order-registry-state.json

## Audit file

data/kernel/water-work-order-registry-audit.jsonl
