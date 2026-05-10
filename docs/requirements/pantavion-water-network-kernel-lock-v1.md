# Pantavion Water Network Kernel Lock v1

This document locks the current working Pantavion water network architecture.

## Protected checkpoint

Git tag:

water-network-live-v1

## Locked counts

- Source features: 122857
- Renderable map features: 120552
- Non-renderable but preserved source features: 2305

## Core rule

The authentic water network source must remain protected and immutable.

User work records, valves, service connections, repairs, leaks, inspections, photos, notes, and future field updates must be stored as separate overlay layers.

They must not mutate, overwrite, simplify, recolor, delete, or replace the original source network.

## Future map versions

New maps and future official versions must be imported as new version records.

Old versions must remain recoverable.

## Browser rule

The browser must never receive the complete private master network.

The browser may receive only controlled visible map segments.

## User annotation rule

Users may create overlays for:

- works completed
- valves
- network additions
- service connections
- repairs
- leaks
- inspections
- photos
- notes
- future survey observations

These are operational overlays, not changes to the protected base network.
