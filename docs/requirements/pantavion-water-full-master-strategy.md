# Pantavion Water Module — Full Master Strategy v1

## Purpose

Defines the strategy required before any production map, data-serving, or renderer work continues.

This document does not modify the water network.
It does not convert the KMZ.
It does not replace production data.
It does not activate a map renderer.

## Required Order

1. Full Master Strategy
2. Data Serving
3. Renderer / Map

No production renderer may proceed before the full-master strategy is locked.

## Reference Truth

The Google Earth KMZ remains the reference truth:

- `diktio_idreusis (1)_1.kmz`
- must remain intact
- must not be reduced
- must not be sampled
- must not be replaced by preview/mobile output

## Full Controlled Protected Master

The final source must be a full controlled protected master.

It must preserve, where technically available from the source:

- all Placemarks
- all LineStrings
- all coordinates
- all styles
- all colors
- all folders
- all layers
- all source metadata
- source identity/version/checksum records

No mobile, preview, sample, subset, or 5000-feature file may be treated as master truth.

## Controlled Authorized Access

The water network is not public.

It is controlled infrastructure data for authorized people only.

Minimum authorized person record:

- first name
- last name
- title
- access level
- status

Status values:

- active
- inactive
- revoked

No raw KMZ/KML/GeoJSON export is allowed without founder/admin approval.

## Serving Strategy

The browser must not load the entire raw network at once.

Performance must be solved through spatial serving, not by deleting network data.

Allowed serving approaches:

- bbox API
- vector tiles
- PMTiles
- MBTiles
- PostGIS
- protected tile service
- equivalent spatial-indexed serving

The master source remains complete.

The client receives only what is needed for the current visible area and zoom level.

## Hybrid Best-Of-All Direction

Pantavion Water may combine the best legal and technical patterns from established GIS/map systems.

Parked options:

- PostGIS bbox API
- MVT vector tiles
- PMTiles / MBTiles
- protected tile service
- Google-grade search/geolocation/base-map provider
- MapLibre-style renderer option
- QGIS-style validation workflow

No provider choice is final until founder approval.

## Renderer Block

A production renderer is blocked until:

- this strategy exists
- the Water Kernel Gate enforces this strategy
- data serving strategy is selected
- founder approval exists for data-pipeline changes

## Invalid Final Approaches

Invalid as final solutions:

- loading the full raw network directly into the browser
- mobile preview as final
- 5000-feature subset as final
- sampled network as final
- guessed asset classifications
- public KMZ/KML/GeoJSON exposure
- renderer-first development before full master strategy

## Founder Approval

Founder/admin approval is required for changes affecting:

- source truth
- production geodata
- data pipeline
- storage
- serving architecture
- provider strategy
- raw export

## Acceptance Criteria

Before production map work continues:

1. Water Kernel Gate passes.
2. Full Master Strategy is present.
3. Data Truth Report is present.
4. No final-truth claim exists for mobile/preview/sample/subset/5000 data.
5. No public geodata exposure exists.
6. Founder approval is required before implementation of full data serving.
