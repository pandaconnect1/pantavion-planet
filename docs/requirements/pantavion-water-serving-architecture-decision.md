# Pantavion Water Module — Sovereign Serving Architecture Decision v2

## Purpose

Pantavion owns the canonical GIS truth. External infrastructure providers are execution adapters only.

This decision protects the Water system from provider lock-in, accidental loss, and architecture drift while keeping current cloud services usable when they add value.

## Non-Negotiable Ownership

Pantavion owns:

- canonical map identity
- original source hash and byte size
- immutable-master manifest
- map registry
- access policy
- conversion lineage
- derived-artifact lineage
- audit trail
- provider-replica inventory
- recovery and migration rules

No storage provider, tile provider, conversion provider, database provider, or hosting provider may become source truth.

## Original Master Policy

The authentic A/B/C master files remain unchanged.

For every raw master Pantavion records:

- stable artifact id
- map id
- original format
- SHA-256
- exact byte size
- immutable flag
- creation/ingest timestamp
- verified replica locations

A raw master is not considered resilient until there are at least two independently verified replicas.

A provider copy is a replica, never the canonical identity.

## Provider Adapter Model

Supported execution adapters may include:

- Pantavion self-hosted object storage
- Cloudflare R2
- AWS S3
- any compatible private S3 implementation
- MapTiler Cloud for derived tile publication
- a Pantavion self-hosted tile service

Provider-specific ids, URLs, object keys, credentials, bucket names, and account ids stay server-side.

The browser must not depend on provider-specific object identity.

## Self-Hosted Exit Path

Pantavion must always preserve a path to operate without third-party GIS infrastructure.

The self-hosted target may use:

- S3-compatible object storage such as MinIO or equivalent
- PostGIS or equivalent spatial database
- protected MVT/PMTiles/MBTiles serving
- Pantavion-owned conversion workers
- MapLibre as the renderer

Replacing R2, MapTiler, Railway, Supabase, Render, or any other provider must not require a change to canonical map identity or a rewrite of the user-facing viewer.

## Processing and Lineage

Processing happens outside the browser.

Derived GIS artifacts must record:

- source artifact id
- source SHA-256
- processing pipeline id
- pipeline version
- optional deterministic parameters hash
- output SHA-256 and byte size

Derived artifacts are reproducible serving products, never source truth.

## Production Serving Boundary

The browser talks to Pantavion-controlled APIs only.

The browser may receive:

- authorized bbox features
- protected vector tiles
- authorized raster tiles
- protected PMTiles/MVT ranges through a Pantavion boundary

The browser may never receive:

- raw DWG master
- raw KMZ master
- full unfiltered network export
- provider credentials
- provider-specific private object URLs as canonical application state

## Basemap Policy

Reference backgrounds are independent from authentic network geometry.

Current intended display:

- Map A: authentic A master, unchanged
- Map B: authentic B master over road-network background
- Map C: authentic C master over elevation/topographic background

Changing a basemap must never modify the authentic master.

## Replication and Recovery

For every critical master:

1. ingest and hash locally
2. record canonical manifest in Pantavion
3. store primary private replica
4. store independent backup replica
5. verify exact byte size and SHA-256 on each replica
6. test restore
7. only then mark resilient

ZERO DELETE applies until independent verified recovery exists.

Provider cleanup must never delete the canonical Pantavion manifest or the last verified replica.

## Third-Party Role

Cloud providers may accelerate Pantavion but must not own Pantavion.

Examples:

- R2 may store a private replica
- MapTiler may publish derived tiles
- a hosted PostgreSQL service may execute spatial queries
- a CDN may cache authorized tiles

Every one of these must have a documented replacement path.

## Runtime Enforcement

Pantavion exposes a protected sovereignty status API.

The runtime contract must report, without exposing secrets:

- current storage adapter type
- whether object storage is configured
- canonical authority
- provider-neutrality guarantees
- self-hosted support
- minimum replica policy
- browser raw-master prohibition

## Acceptance Criteria

The GIS architecture is sovereign-ready only when:

1. canonical manifest exists in Pantavion
2. raw master SHA-256 is verified
3. at least two verified master replicas exist
4. derived lineage is recorded
5. provider implementations are behind Pantavion adapters
6. MapLibre/client is provider-neutral
7. backup restore is tested
8. self-hosted exit path is defined and tested
9. no raw master is publicly exposed
10. provider removal does not change map identity or require viewer rewrite

## Final Rule

Pantavion is the system.

R2, MapTiler, Supabase, Railway, Render, Floot, AWS, or any future provider are replaceable infrastructure components beneath Pantavion.
