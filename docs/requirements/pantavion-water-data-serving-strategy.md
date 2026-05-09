# Pantavion Water Module — Data Serving Strategy v1

## Purpose

Defines how the complete Pantavion Water master network may be served safely and efficiently.

This document does not modify the water network.
It does not convert the KMZ.
It does not create tiles.
It does not activate a production renderer.

## Dependency Order

This strategy depends on:

1. Water Kernel Constitution
2. Water Data Truth Report
3. Full Master Strategy

No renderer work may proceed before data serving strategy is locked.

## Core Rule

The full master source must remain complete.

Performance must be solved through spatial serving, indexing, permissions, and controlled delivery — not by deleting, sampling, guessing, or reducing the source network.

## Required Serving Model

The browser must not load the entire raw water network at once.

The client may receive only the data needed for:

- current visible map area
- current zoom level
- current authorized access level
- current permitted network zone

## Allowed Serving Patterns

Allowed future serving patterns include:

- bbox API
- vector tiles
- PMTiles
- MBTiles
- PostGIS
- protected tile service
- equivalent spatial-indexed serving

No single serving pattern is final until founder/admin approval.

## Controlled Access

Water network serving must be controlled infrastructure access.

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

The serving layer must respect access level and status.

## No Public Raw Export

The serving system must not expose raw KMZ, KML, full GeoJSON, or complete network exports publicly.

Raw export requires founder/admin approval.

## Data Integrity

The serving layer must preserve source truth.

It must not:

- invent hydrants
- invent fittings
- invent categories
- invent symbols
- treat mobile preview as final
- treat 5000-feature output as final
- treat sampled data as final
- remove network geometry to improve performance

## Recommended Direction

The recommended direction is a staged controlled-serving architecture:

1. Keep full master source protected.
2. Build a private spatial index.
3. Serve only visible bbox or tile data.
4. Apply access-level filtering.
5. Keep renderer separate from master source.
6. Add audit logs for access and export.
7. Require founder/admin approval before production activation.

## Acceptance Criteria

Before renderer work continues:

1. Full Master Strategy exists.
2. Data Truth Report exists.
3. Data Serving Strategy exists.
4. Water Kernel Gate enforces required strategy documents.
5. No raw public geodata exposure exists.
6. No mobile/preview/sample/subset file is treated as production truth.
7. Founder/admin approval is required before production serving implementation.
