# Pantavion Production Private Water Network Cloud Bridge

Locked requirement:
Pantavion.com must serve the real water network to approved users over 4G/5G without requiring users to own any cloud account.

Correct production model:
- User uses mobile/tablet/PC only.
- User connects to Pantavion.com.
- Pantavion authenticates identity, role, device, area and approval.
- Pantavion reads the private processed water layer from cloud/private storage.
- Pantavion returns only a capped/mobile-light map preview or future viewport/vector tile response.
- Raw KMZ/KML must not be placed in GitHub or public folders.

Current Phase 1H bridge:
- Local development can still read data/water-network-private/processed/water-network.geojson.
- Production can read PANTAVION_WATER_NETWORK_GEOJSON_URL.
- Optional PANTAVION_WATER_NETWORK_GEOJSON_BEARER_TOKEN supports protected cloud reads.
- Status endpoint: /api/professional/infrastructure/water/network/status
- Network endpoint: /api/professional/infrastructure/water/network?limit=5200

Production next step:
- Add real private object storage provider.
- Add admin-only upload and conversion pipeline.
- Add database/audit log.
- Add viewport/vector tile API so mobile never receives the full dataset.

Markers:
PANTAVION_WATER_PRODUCTION_CLOUD_BRIDGE_PHASE_1H
PANTAVION_WATER_NO_USER_CLOUD_REQUIRED
PANTAVION_WATER_RAW_KMZ_NOT_PUBLIC