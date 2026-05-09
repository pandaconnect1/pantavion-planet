# Pantavion Water Module — Serving Architecture Decision v1

## Purpose

This document locks the selected architecture direction for serving the Pantavion Water network after the Full Master Strategy and Data Serving Strategy.

This document does not modify the water network.
It does not convert the KMZ.
It does not create tiles.
It does not activate a production renderer.

## Decision Summary

Pantavion Water will use a controlled hybrid spatial-serving architecture.

The full master source remains protected and complete.

The browser must never load the full raw water network directly.

The client receives only authorized spatial slices for the current area and zoom.

## Selected Direction

The selected architecture direction is:

1. Protected full master source
2. Private processing pipeline
3. Private spatial index
4. Controlled serving API
5. Renderer receives only permitted bbox/tile data
6. Access and export are audited
7. Founder/admin approval required before production activation

## Full Master Layer

The master source remains the full protected reference network.

The master layer must preserve:

- all source features
- all geometry
- all folders/layers
- all available styles and colors
- all source metadata where technically available
- source checksum/version records

The master source must not be replaced by:

- mobile preview
- 5000-feature file
- sampled data
- reduced GeoJSON
- guessed classifications
- public export

## Storage Direction

The master source must be stored in controlled infrastructure storage.

Allowed future storage options include:

- private object storage
- protected cloud bucket
- private server storage
- controlled database storage
- equivalent restricted storage

The final provider is not locked in this document.

Provider selection requires founder/admin approval.

## Processing Direction

Processing must happen outside the browser.

The processing pipeline may create derived serving artifacts only if the master source remains intact.

Allowed derived artifacts include:

- spatial index
- bbox-ready database table
- vector tile cache
- MBTiles
- PMTiles for controlled/non-public use
- MVT tiles
- equivalent spatial-serving artifact

Derived artifacts are serving artifacts, not source truth.

## Recommended Production Direction

For production-scale controlled infrastructure data, the recommended long-term direction is:

- PostGIS or equivalent spatial database
- protected bbox API
- protected vector tile service
- role/access filtering
- audit logging
- no raw public export

This is the preferred controlled production path because it allows permission-aware serving without exposing the entire raw network file.

## Prototype / Diagnostic Direction

For non-final diagnostic or internal prototype use only, Pantavion may evaluate:

- MBTiles
- PMTiles
- local vector tile output
- bbox GeoJSON response

These are not final truth.

They must not be exposed publicly unless founder/admin approval and access controls exist.

## Renderer Boundary

The renderer is downstream only.

The renderer must not define source truth.

The renderer must not force data reduction.

The renderer must not load the full raw network.

The renderer must request only the authorized spatial area needed for the current viewport.

## Access Model

Water network access is controlled infrastructure access.

Authorized person record remains simple:

- first name
- last name
- title
- access level
- status

Status values:

- active
- inactive
- revoked

The serving layer must reject inactive or revoked access.

## Export Control

Raw KMZ, KML, full GeoJSON, full database dump, full tile archive, or complete network export is not allowed without founder/admin approval.

Export actions must be logged.

## Architecture Order

Implementation order is:

1. Protect full master source.
2. Confirm full-master preservation pipeline.
3. Select storage provider.
4. Build private processing pipeline.
5. Build spatial index or tile artifact.
6. Build controlled API.
7. Add access enforcement.
8. Add audit logging.
9. Only then connect renderer.

## Current Decision

Pantavion will not proceed with renderer-first development.

Pantavion will first prepare controlled data serving with full-master preservation.

The best current path is:

- production target: PostGIS / protected bbox API / protected vector tile service
- internal diagnostic option: MBTiles or PMTiles only as derived non-final serving artifact
- renderer: later, after serving and access controls are ready

## Acceptance Criteria

Before production renderer work continues:

1. Water Kernel Constitution exists.
2. Data Truth Report exists.
3. Full Master Strategy exists.
4. Data Serving Strategy exists.
5. Serving Architecture Decision exists.
6. Water Kernel Gate enforces required strategy documents.
7. No full raw network is loaded into the browser.
8. No mobile/preview/sample/subset file is treated as production truth.
9. No public raw geodata export exists.
10. Founder/admin approval exists before production serving activation.
