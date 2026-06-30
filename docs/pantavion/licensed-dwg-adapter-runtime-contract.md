# Pantavion PATCH 8K - Licensed DWG Adapter Runtime Contract

Status: internal foundation

This patch defines the runtime contract required before any licensed DWG adapter may render the Pantavion Water B/C original DWG.

Locked rules:

- No fake DWG render.
- No static screenshot, PDF, image, GeoJSON, Leaflet reconstruction, sampled tile, simplified map, or derivative may be presented as the original DWG.
- Original DWG file bytes must not be exposed to browser/client routes by this contract.
- The source DWG remains read-only, immutable, and source-truth protected.
- A runtime adapter must provide initialize, loadOriginalDwgReadOnly, renderEmbedded, and dispose methods.
- Founder approval, license proof, adapter package verification, sensitive vault check, CAD adapter matrix check, and source binding check are required.
- Production rendering remains disabled until a separate production approval gate exists.

Runtime surface:

- GET /api/kernel/licensed-dwg-adapter-runtime-contract
- POST /api/kernel/licensed-dwg-adapter-runtime-contract

POST body example:

{
  "adapterKind": "oda_inweb",
  "surface": "B",
  "founderApproved": false,
  "licenseAvailable": false,
  "adapterPackageAvailable": false,
  "verifiedMethods": []
}

Audit file:

data/kernel/licensed-dwg-adapter-runtime-contract-audit.jsonl
