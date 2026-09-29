# Pantavion Sovereign Infrastructure Cluster

Status: CANONICAL ARCHITECTURE TARGET
Scope: Entire Pantavion ecosystem
Principle: Pantavion owns the truth; external providers are replaceable execution adapters.

## 1. Core rule

Pantavion must never make a third-party provider the canonical system of record for its architecture.

Cloudflare, MapTiler, Supabase, Railway, Floot, Vercel, AWS, Azure, Google Cloud and comparable services may be used as temporary or permanent execution adapters, acceleration layers, replicas, CDNs, managed databases, conversion engines, hosting surfaces or transport rails.

They are never the canonical identity of Pantavion data, architecture, permissions, lineage or product behavior.

The user-facing product talks to Pantavion-controlled APIs and Pantavion-owned contracts.

## 2. Sovereign target cluster

The long-term Pantavion-owned infrastructure cluster shall be self-hostable and provider-independent.

Canonical target components:

- PostgreSQL + PostGIS
  - application data
  - identity metadata
  - structured records
  - GIS metadata
  - spatial queries
  - permissions and audit metadata

- MinIO or compatible S3 implementation
  - immutable raw masters
  - user files
  - media
  - GIS source files
  - derived artifacts
  - backup objects
  - object versioning

- GeoServer / TileServer / Martin / compatible tile-serving layer
  - MVT/vector tiles
  - WMTS/WMS where needed
  - protected GIS delivery
  - PMTiles/MBTiles serving
  - provider-neutral map delivery

- Redis or compatible in-memory layer
  - cache
  - ephemeral state
  - rate limiting
  - locks
  - short-lived coordination

- Durable queues
  - background jobs
  - conversion jobs
  - ingest
  - indexing
  - notification jobs
  - AI jobs
  - retry/fencing/dead-letter handling

- Pantavion Auth
  - identity
  - sessions
  - roles
  - approvals
  - device trust
  - entitlement enforcement

- AI workers
  - provider routing
  - model execution
  - research
  - classification
  - memory pipelines
  - moderation
  - orchestration

- Backup and disaster recovery
  - encrypted off-site replicas
  - geographically separate copies
  - restore drills
  - checksums
  - immutable recovery manifests
  - provider-independent recovery procedures

## 3. Current transition architecture

Pantavion may use third parties now while building sovereign capability in parallel.

Examples:

- Cloudflare R2 may serve as current object storage.
- MapTiler may serve as current GIS conversion/tiles/CDN.
- Supabase may temporarily provide database/auth/realtime capabilities.
- Railway/Render/Floot may temporarily provide execution or hosting.
- Other providers may be introduced when technically justified.

Every such integration must sit behind a Pantavion-owned adapter contract.

Replacing a provider must not require changing Pantavion product semantics.

## 4. Storage sovereignty

Every critical object must have:

- canonical Pantavion identity
- content hash
- byte size
- source provenance
- immutable master designation where applicable
- provider-neutral object key
- replica registry
- verification timestamp
- restore status

A provider copy is a replica, never the canonical identity.

Critical raw masters are not considered resilient until at least two independently verified replicas exist.

Raw critical-infrastructure masters remain private and must never be exposed directly to public browsers.

## 5. GIS sovereignty

Pantavion GIS follows:

original master
→ immutable private storage
→ verified conversion job
→ derived GIS artifacts
→ vector tiles / PMTiles / MBTiles / MVT
→ protected Pantavion map APIs
→ MapLibre or equivalent renderer

Original DWG/KMZ/GPKG/KML source bytes must remain unchanged.

A derived artifact must always retain lineage back to the original source hash.

Current external tools such as MapTiler or QGIS may perform conversion, but the conversion manifest, source identity, derived-artifact identity and access policy belong to Pantavion.

## 6. Database sovereignty

Pantavion application code must target provider-neutral PostgreSQL/PostGIS contracts.

Managed PostgreSQL providers are replaceable.

No provider-specific database feature may become mandatory without an explicit portable fallback.

Schema migrations, audit rules, backups and restore procedures are Pantavion-owned artifacts.

## 7. Runtime sovereignty

Pantavion runtime services must be containerizable and deployable to Pantavion-controlled infrastructure.

Required properties:

- stateless APIs where practical
- durable state outside application containers
- health checks
- observability
- deterministic configuration
- secret injection
- horizontal scaling
- graceful failover
- reproducible deployment
- no hidden provider-only runtime dependency

## 8. Queue and worker sovereignty

All long-running/background work must use durable execution semantics.

Required:

- idempotency
- retry policy
- worker fencing
- checkpoints
- dead-letter handling
- execution evidence
- no fire-and-forget claims
- replay capability

## 9. AI sovereignty

Pantavion AI is an orchestration layer, not a single model vendor.

Pantavion owns:

- routing policy
- prompts/contracts
- memory architecture
- safety rules
- evaluation
- audit
- provider selection
- fallback order

External models remain replaceable.

Self-hosted models may be added progressively without redesigning product flows.

## 10. Security

Non-negotiable:

- least privilege
- private-by-default storage
- no secrets in source control
- no secrets in browser code
- no raw critical-infrastructure master exposure
- encryption in transit
- encryption at rest where available
- access logging
- device/session controls
- signed short-lived delivery URLs where required
- security boundaries enforced by Pantavion APIs

## 11. Parallel build rule

Every new external integration must answer two questions:

1. What immediate Pantavion capability does this provider enable?
2. What is the self-hosted Pantavion replacement path?

A feature is not considered strategically complete until the replacement path is documented and the data remains exportable.

## 12. Migration stages

Stage 1 — External acceleration
Use managed providers to get Pantavion live quickly.

Stage 2 — Pantavion contracts
Hide providers behind Pantavion storage, data, GIS, queue, auth and AI interfaces.

Stage 3 — Dual-run
Operate external provider and Pantavion-owned replacement in parallel.

Stage 4 — Verified failover
Prove restore, replication, serving and runtime continuity from Pantavion-owned infrastructure.

Stage 5 — Sovereign operation
External providers become optional capacity, CDN, disaster-recovery or burst layers.

## 13. Completion rule

Pantavion may describe a capability as provider-independent only when:

- canonical data identity is Pantavion-owned
- export is proven
- at least one replacement implementation exists or is operationally reproducible
- failover has been tested
- secrets and configuration are portable
- no provider-specific irreversible dependency remains

## 14. Water GIS application

For Pantavion Water specifically:

- A/B/C originals remain untouched.
- Original masters are stored privately with hashes and replica verification.
- Current fast path may use Cloudflare R2 + MapTiler.
- Production browser delivery uses derived viewport/tile output only.
- MapLibre is the renderer.
- Long-term replacement path is Pantavion object storage + Pantavion conversion workers + PostGIS + GeoServer/TileServer/PMTiles.
- B uses a road-network background.
- C uses elevation/topographic background.
- GPS must report actual device position or a truthful error.
- No map is labelled LIVE or authentic without source verification and visual end-to-end verification.

## 15. Final principle

Pantavion is the platform.
Providers are components.

Pantavion must be able to replace any component without losing its data, identity, history, security model or product continuity.
