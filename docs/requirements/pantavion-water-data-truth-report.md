# Pantavion Water Module — Data Truth Report v1

## Status

This document defines the current truth state for the Pantavion Water Module.

It is not a map patch.
It is not a data conversion.
It is not a production data replacement.
It does not modify the water network.

## Reference Truth

The Google Earth KMZ file is the reference truth for the Pantavion Water Module.

Reference source:

- `diktio_idreusis (1)_1.kmz`
- Opens correctly in Google Earth.
- Must be treated as the visual and data reference.
- Must remain intact.

## Non-Negotiable Data Rule

The water network must remain intact.

The following must not be removed, reduced, replaced, sampled, or treated as disposable:

- Placemark
- LineString
- coordinate
- style
- color
- folder
- layer
- source metadata

## Current Protected Local Files

The following local protected files exist and must not be deleted or exposed publicly:

- `data/water-network-private/processed/water-network.geojson`
- `data/water-network-private/mobile/water-network-mobile.geojson`

The processed file is protected local water-network data.

The mobile file is allowed only as temporary preview/diagnostic material.

## Temporary Production State

The current private production blob with approximately 5000 features is temporary.

It is not final truth.
It is not the complete network.
It is not allowed to replace the full reference network.
It must not be described as complete, full, master, or final.

## Invalid Final Approaches

The following are invalid as final Pantavion Water solutions:

- mobile preview as final
- 5000-feature subset as final
- reduced GeoJSON as final
- sampled network as final
- guessed asset classifications
- public KMZ/KML/GeoJSON exposure
- raw full network committed to GitHub
- UI renderer changes before source truth is protected

## Required Final Architecture Direction

The correct final direction is:

1. Full private master source from the reference KMZ.
2. No data loss.
3. Preserve styles, colors, folders, layers, and source metadata where technically possible.
4. Serve the network through bbox, vector tiles, PMTiles, MBTiles, PostGIS, or equivalent spatial serving.
5. The browser must load only the visible area/zoom.
6. The master source remains complete.
7. The map should support satellite/hybrid base map, user location, address search, and field-worker identify tools.
8. Every production change must pass Water Kernel Gate, build, TypeScript, and founder approval where required.

## Kernel Gate Requirement

Before any future water map/data work, the following gates must pass:

- `npm run audit:water`
- `npm run build`
- `npx tsc --noEmit`

No `git add .`.

No production claim without proof.

No data pipeline change without founder approval.

## Founder Rule

If there is any conflict between performance and data integrity, data integrity wins.

Performance must be solved through spatial serving, not by deleting or reducing the source network.
