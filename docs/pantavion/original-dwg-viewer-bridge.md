# Pantavion PATCH 8J - B/C Original DWG Viewer Bridge

Status: internal foundation

This patch connects the Pantavion Water B and C pages to the protected original DWG source binding.

Locked rules:

- B and C are bound to GEORGE_MAP_MASTER_B_C_FINAL.dwg.
- B is original-only.
- C is original plus future derivative overlays, only after the original DWG adapter is verified.
- No PDF, image, screenshot, GeoJSON, Leaflet reconstruction, sampled tile, simplified map, or derivative may be presented as original.
- The bridge does not expose file bytes.
- Actual embedded rendering requires a real licensed CAD/DWG viewer adapter.
- Automatic rendering remains blocked until approval, vault, adapter, and license checks pass.

Runtime surface:

- GET /api/kernel/original-dwg-viewer-bridge?surface=B
- GET /api/kernel/original-dwg-viewer-bridge?surface=C
- POST /api/kernel/original-dwg-viewer-bridge
- /professional/infrastructure/water/b
- /professional/infrastructure/water/c

Audit file:

data/kernel/original-dwg-viewer-bridge-audit.jsonl
