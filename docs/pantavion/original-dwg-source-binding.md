# Pantavion PATCH 8I - Original DWG Source Binding

Status: internal foundation

This patch registers the Pantavion Water B/C original master DWG as a protected source-truth artifact.

Original artifact:

- filename: GEORGE_MAP_MASTER_B_C_FINAL.dwg
- size: 205877448 bytes
- sha256: 0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9

Locked rules:

- The original DWG is read-only, immutable, and source-truth protected.
- No PDF, image, screenshot, GeoJSON, Leaflet reconstruction, tile, sampling, simplification, filtering, or derivative may be presented as the original.
- B/C viewer requests must go through the sensitive artifact vault and CAD/DWG adapter matrix.
- Actual original rendering requires a real licensed CAD/DWG viewer adapter.
- Automatic render is blocked.
- Founder approval is required before original viewer execution.

Runtime surface:

- GET /api/kernel/original-dwg-source-binding
- POST /api/kernel/original-dwg-source-binding

POST metadata example:

{
  "observedFilename": "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "observedSizeBytes": 205877448,
  "observedSha256": "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  "requestedSurface": "B",
  "founderApproved": false
}

Audit file:

data/kernel/original-dwg-source-binding-audit.jsonl
