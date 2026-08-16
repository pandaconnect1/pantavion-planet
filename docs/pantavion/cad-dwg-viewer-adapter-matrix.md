# Pantavion PATCH 8C — Legal CAD/DWG Viewer Adapter Matrix

Status: internal foundation

This patch defines the canonical CAD/DWG viewer adapter matrix for Pantavion.

Locked rules:

- DWG original source truth must remain read-only and preserved.
- No layer, color, text, arrow, label, block, coordinate, or entity may be removed.
- No filtering, simplification, reconstruction, sampling, screenshot replacement, PDF replacement, tile replacement, or GeoJSON/Leaflet replacement may be presented as the original DWG.
- ODA inWEB is a licensed-adapter path, not a fake built-in capability.
- ODA MCP is future/requires-adapter only.
- Autodesk APS is a cloud-provider path and requires explicit founder approval before upload/translation.
- Static image/PDF/screenshot/Leaflet/GeoJSON as original is blocked.

Runtime surface:

- GET /api/kernel/cad-viewer-adapters
- POST /api/kernel/cad-viewer-adapters

POST body example:

{
  "adapterId": "oda_inweb_dwg_viewer",
  "sourceFormat": "dwg",
  "target": "embedded_viewer",
  "useCase": "Pantavion Water B original DWG viewer",
  "sourceTruth": true,
  "production": false,
  "founderApproved": false,
  "licenseAvailable": false
}

Audit file:

data/kernel/cad-viewer-adapters-audit.jsonl
