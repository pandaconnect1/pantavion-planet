# Pantavion PATCH 8L - Universal Artifact Intake / Upload Source Registry

Status: internal foundation

This patch defines how DWG, CAD, GIS, documents, and archive artifacts enter Pantavion.

Locked rules:

- Large/source-truth artifacts must not be committed to Git.
- Large/source-truth artifacts must not be placed in public folders.
- DWG source truth requires private storage, SHA256 verification, vault check, CAD adapter check, and founder approval.
- GeoJSON/PDF/image/screenshot/tile derivatives must never be presented as original DWG.
- Intake route assesses file metadata, format, risk, storage strategy, and binding eligibility.
- This patch does not fake upload bytes. Private storage adapter is required before real upload.

Supported intake formats:

- DWG
- DXF
- DGN
- RVT
- IFC
- KML
- KMZ
- SHP
- GPKG
- GeoJSON
- PDF
- ZIP / 7Z / TAR / GZ

Runtime surface:

- GET /api/kernel/artifact-intake-registry
- POST /api/kernel/artifact-intake-registry

POST example:

{
  "filename": "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "sizeBytes": 205877448,
  "sha256": "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  "storageProvider": "vercel_blob_private",
  "requestedSurface": "B",
  "sourceTruth": true,
  "founderApproved": false
}

Audit file:

data/kernel/artifact-intake-registry-audit.jsonl
