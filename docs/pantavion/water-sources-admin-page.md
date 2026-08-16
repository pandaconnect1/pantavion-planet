# Pantavion PATCH 8M - Water Sources Admin Page

Status: internal foundation

This patch adds the admin page for Pantavion Water artifact intake.

## Runtime surface

- /professional/infrastructure/water/sources

## Rules

- This page uses the real artifact intake registry from PATCH 8L.
- It does not fake upload bytes.
- It does not place source-truth artifacts in Git or public folders.
- DWG source truth remains private, SHA256-verified, read-only, approval-gated and adapter-gated.
- GeoJSON is shown only as derivative overlay intake, never as original DWG.
- Real upload requires a private storage adapter in a later patch.

## Next required patch

PATCH 8N - Private Storage Upload Session Contract
