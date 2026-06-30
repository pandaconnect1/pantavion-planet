# Pantavion PATCH 8N - Device Geo Status / Current Position Viewport Runtime

Status: internal foundation

This patch adds real browser/device geolocation status for Pantavion Water.

## Runtime surfaces

- GET /api/kernel/device-geo-status
- POST /api/kernel/device-geo-status
- /professional/infrastructure/water/geo-status

## Locked rules

- Location requires explicit browser/device permission.
- Precise coordinates are not persisted by default.
- Audit records use rounded coordinates.
- No continuous tracking.
- No background tracking.
- Current position is used to calculate viewport/bbox.
- Pantavion opens only the requested/current area, not the full map/DWG.
- DWG rendering still requires source binding, viewer bridge, licensed adapter contract and future viewport adapter.

## Next required patch

PATCH 8O - Road / Zone / Area Search Index Registry
