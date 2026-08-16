# Pantavion PATCH 8S - Private Storage Upload Session / Multipart Contract

Status: internal contract foundation

## Scope

DWG / DXF / DGN / KML / KMZ / SHP / GPKG / GeoJSON / PDF / ZIP / Excel / CSV / Word / DOCX / images / JSON

## Locked rules

- This patch does not upload bytes yet.
- Private storage only.
- No Git storage.
- No public folder.
- No public access.
- Original DWG is never mutated.
- Original artifacts are never edited.
- Source-truth artifacts require founder approval.
- Source-truth and large files require SHA256 gates.
- Files above 100MB require multipart/chunked upload with resume and retry in later patches.
- Finalize route and SHA256 verification are required in later patches.
- Processing is sidecar-only through approved workers.

## Runtime surface

- GET /api/kernel/private-upload-session
- POST /api/kernel/private-upload-session
