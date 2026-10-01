# Pantavion Water GIS Pipeline — Canonical Implementation Contract

Status: implementation
Date: 2026-10-01

## Canonical flow

```
immutable Map A / DWG master
  -> Pantavion GIS ingest
  -> deterministic preprocessing
  -> PostGIS
  -> Map / Feature Service
  -> cached MVT vector tiles
  -> Pantavion-controlled API boundary
  -> Pantavion Water Map Viewer
```

## Source formats

The ingestion boundary accepts these source families:

- DWG
- DXF
- KML
- KMZ
- Shapefile
- GeoPackage
- GeoTIFF

A source upload never becomes browser-serving truth directly.

## Map A invariant

The canonical Map A binary is immutable. Its current Pantavion identity remains the existing
`core/water/legacy-map-bc-source.ts` identity. Preprocessing MUST create derived artifacts;
it MUST NOT rewrite, rename as a substitute for identity, simplify, or mutate the source bytes.

Every derived artifact records:

- canonical source artifact id
- source SHA-256
- source byte size
- pipeline id and version
- output SHA-256
- output byte size
- coordinate reference system
- processing timestamp
- layer/entity counts
- validation state

## Spatial model

PostGIS is the operational spatial store. Network entities are represented independently from
the immutable CAD source and retain provenance back to the source entity/layer.

Minimum operational classes:

- pipes
- valves
- devices
- junctions
- zones
- labels
- reference features

Every geometry table MUST have a primary key and spatial index.

## Serving model

The browser MUST NOT receive the raw DWG/KMZ master.

Pantavion APIs may serve:

- authorized viewport/bbox features
- authorized Feature API responses
- protected MVT tiles
- authorized raster/reference tiles

MVT is the default production rendering format for vector network layers.

Tile requests are zoom/viewport dependent. Full-network pushes to mobile are prohibited.

## Utility-network semantics

The operational graph preserves:

- connectivity
- direction where meaningful
- junction/device relationships
- zone membership
- traceable topology
- source provenance

Topology/trace results are operational derived data and never alter the master CAD source.

## Basemap/reference policy

DLS/cadastral/topographic services may be used only through authorized/official access.
Reference/basemap data remains independent from Pantavion water-network geometry.

## Provider neutrality

PostGIS, tile servers, object storage, and hosting are execution adapters beneath Pantavion.
No provider-specific URL, object id, credential, or database identity is canonical application truth.

The viewer talks to Pantavion-controlled endpoints.

## Verification gate

No LIVE/DONE/SUCCESS state is valid until all of these are evidenced in production:

1. Map A master hash/size identity verified.
2. Derived GIS lineage verified.
3. PostGIS import completed with entity/layer counts.
4. Spatial indexes present.
5. Map/Feature service responds through Pantavion boundary.
6. MVT tile response verified.
7. Pantavion Water Viewer renders real network geometry.
8. Authorized user can inspect permitted features.
9. Mobile viewport/zoom loading verified.
10. GPS overlay verified independently of network geometry.
11. Raw master is not publicly exposed.
12. Restore/rebuild from immutable master is reproducible.

Any failed item keeps the overall state UNVERIFIED.
