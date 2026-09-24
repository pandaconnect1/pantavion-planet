# Pantavion Water — Recovered DWG forensic comparison

Date: 2026-09-24
Status: evidence-only comparison; no master replacement and no automatic merge.

## Sources

| Source | Bytes | SHA-256 | Header | Embedded author/save evidence |
|---|---:|---|---|---|
| Canonical Map B — MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg | 205,565,159 | 6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16 | AC1032 | author `gnkkm`; modified `2026-05-19T23:06:33`; AutoCAD 2026; additional embedded datetime `2026-01-18T21:35:13` |
| Legacy B/C — GEORGE_MAP_MASTER_B_C_FINAL.dwg | 205,877,448 | 0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9 | AC1032 | author `andreas.papadopoulos`; modified `2026-06-05T12:42:11`; AutoCAD LT 2025 |
| Older master — MASTER 2025_Μ_15.1.2025_ANDREASPAP.dwg 22-9-2025 | 218,850,248 | 9555d17904ceae39a14482db228c5d5fe3e0a961e7bb78b89418896d68eb3ebb | AC1032 | author `maria.isaia`; modified `2025-09-19T08:01:11`; AutoCAD LT 2025 |

## Binary identity findings

- All three are valid AC1032 DWG binaries.
- All three have different exact SHA-256 digests.
- No identical 1 MiB block was found between any pair in a position-independent block-set comparison.
- Therefore none of the three is a byte-identical copy of another.
- This does not by itself prove geometric independence because DWG section compression/serialization can change substantially between saves.

## Embedded preview evidence

Each master contains a genuine embedded AutoCAD preview image with visible cadastral/base geometry and coloured network/engineering lines.

- Canonical B: embedded previews include parcel/base geometry plus coloured engineering/network lines.
- GEORGE legacy B/C: embedded preview contains dense coloured engineering/network geometry and cadastral/base geometry.
- Older 2025 master: embedded previews contain cadastral/base geometry, coloured linear network geometry and a distinct segment/annotation view.

This confirms the three files are not empty wrappers and contain visible CAD drawing content.

## String / symbol evidence

Shared strings across all three include:
- `WATER P`
- `Pipe 6m`
- `ACAD_LAYERSTATES`
- `LMAN_AUXILIARY-LAYER`

Distinctive strings observed:

### Canonical B
- `SDB_PARCEL_PO_poly`
- `CONTOUR_ELEV`
- `ADMB_QR`
- `VILNM_`

### GEORGE legacy B/C
- `PAROXI`
- `G.V.- 2`
- `G.V - 1`
- `A.V.`
- `F.H`
- `SYNDE`
- `ENOSH F630`
- multiple `L=...m` engineering lengths
- `CONTOUR_arc`

These are strong evidence that this master contains detailed water/engineering annotation vocabulary. They are not enough to rename it as Map A.

### Older 2025 master
- `Limassol_Mosaic`
- `S.V`
- `Existing`
- `MAP_DISPLAY_MANAGEMEN...`
- `VIL_C`

The older master has clear Limassol/base-map context and water/engineering content, but its exact relationship to Map A is still unproven.

## Structural string similarity

Using unique UTF-16LE printable strings:

- Canonical B ↔ GEORGE: Jaccard ≈ 0.3488
- Canonical B ↔ older 2025: Jaccard ≈ 0.3689
- GEORGE ↔ older 2025: Jaccard ≈ 0.4104

Interpretation: the older 2025 master is textually/structurally closer to GEORGE than to canonical B, but this is only forensic evidence, not geometric equivalence.

## Decision

1. Keep all three masters immutable and isolated.
2. Do not label the older 2025 master as Map A yet.
3. Treat GEORGE as a richer water-annotation comparison source.
4. Generate derived, private, read-only viewport layers from each master when a verified DWG extraction/conversion engine is available.
5. Compare layer names, extents, entity counts, coordinates, and network topology before any relation/merge decision.
6. Map A remains VERIFIED only when its authentic source geometry is identified or reproduced from a source whose provenance is proven.

## Production boundary

The Railway MapServer deployment is live and fail-closed. This document does not claim that authentic Map A geometry bytes are restored.
