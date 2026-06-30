# Pantavion PATCH 8B — Conversion Format Matrix

Status: internal foundation

This patch defines the first canonical conversion capability matrix for Pantavion.

Rules:

- No fake/static/UI-only conversion capability.
- Every conversion direction must declare status, risk zone, provider/adapter status, source-truth policy, and approval requirement.
- DWG/CAD/GIS/source-truth artifacts require founder approval before production, data-changing, or user-facing execution.
- Derivatives must never be presented as original source truth.
- Original artifacts must remain preserved unless the founder explicitly approves a separate destructive action.

Runtime surface:

- GET /api/kernel/conversion-matrix
- POST /api/kernel/conversion-matrix

POST body example:

{
  "sourceFormat": "dwg",
  "targetFormat": "embedded_viewer",
  "useCase": "Pantavion Water B original DWG viewer",
  "sourceTruth": true
}

The route returns a real conversion assessment and appends audit events to:

data/kernel/conversion-matrix-audit.jsonl
