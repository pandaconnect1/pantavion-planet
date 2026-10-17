# Pantavion Global Knowledge Vault — Architecture v0.1

Status: IMPLEMENTATION FOUNDATION / NOT LIVE
Inherits: Pantavion Academic Evidence Standard (PAES)

## Mission
Build a durable, Pantavion-controlled knowledge infrastructure spanning ancient, historical, modern and live knowledge, while minimizing dependence on any single AI/search/content provider and preserving lawful provenance and rights for every collection.

Principle: **Knowledge is durable Pantavion infrastructure. AI is a replaceable reasoning layer.**

## Core layers
1. **Knowledge Vault** — legally storable source objects, metadata, datasets and archival derivatives.
2. **Evidence & Provenance Ledger** — source identity, lineage, evidence quality, licensing/rights, versions and corrections.
3. **Temporal Knowledge Graph** — entities, claims, relationships and how knowledge changes over time.
4. **Search & Index Layer** — keyword, metadata, full-text, semantic and graph retrieval without requiring one external AI provider.
5. **Live Research Engine** — current international retrieval, contradiction search and comparison against canonical stored knowledge.
6. **Rights & Access Engine** — machine-enforced per-resource permissions for view/search/copy/download/print/export/AI-processing/sharing.

## Time coverage
Support explicit temporal classification:
`ANCIENT -> HISTORICAL -> MODERN -> CURRENT -> LIVE`

Historical source claims are preserved as claims made by that source/time, not silently promoted to current scientific fact.

## Source classes
- scholarly/academic
- books/manuscripts/archives
- public/government records
- diplomatic/declassified records
- legislation/regulation/court records
- historical and current news
- maps/geospatial records
- scientific/technical datasets
- standards/specifications
- audiovisual/photographic collections
- cultural/oral/Indigenous records with appropriate provenance and authority
- Pantavion-created research and verified derived knowledge

## Rights state
Every ingested resource MUST have an explicit rights state before canonical storage/use:
- `PUBLIC_DOMAIN`
- `OPEN_LICENSE`
- `LICENSED`
- `PANTAVION_OWNED`
- `REFERENCE_ONLY`
- `RESTRICTED`
- `UNKNOWN_REVIEW_REQUIRED`

`UNKNOWN_REVIEW_REQUIRED` fails closed for copying, redistribution, bulk retention and commercial reuse until reviewed.

## Rights capabilities
Rights are capabilities, not one boolean. Per resource/collection:
- `can_view`
- `can_search_metadata`
- `can_fulltext_index`
- `can_ai_process`
- `can_quote`
- `can_copy`
- `can_download`
- `can_print`
- `can_export`
- `can_share`
- `can_create_derivatives`
- `can_commercial_use`
- territory constraints
- expiry/review date
- attribution requirements

Public accessibility never automatically implies permission to copy, ingest, redistribute or commercially exploit.

## Protected viewer
For rights-limited material, Pantavion can provide a protected viewer policy:
- disable application copy/paste where required
- disable Pantavion download/export/print where prohibited
- request platform screenshot/screen-recording protection where technically available
- visible or forensic session/user watermarking where lawful and appropriate
- short-lived signed access URLs/tokens
- server-side authorization on every protected object request
- audit events for access/export/print attempts

Anti-screenshot is defense-in-depth, not DRM certainty: an external camera can capture a screen. Legal rights, access control, watermarking and auditing remain primary controls.

## Researcher experience
Users should be able to search directly rather than only ask an AI:
- keywords and exact phrases
- person/entity/organization
- date/range/era
- geography/jurisdiction
- source/archive/collection
- language
- subject/domain
- document type
- rights/access state
- evidence quality

Result actions are dynamically rights-aware: `View`, `View Original`, `Cite`, `Copy`, `Download`, `Print`, `Export`, `Share`. Forbidden actions are not merely hidden in UI; they are rejected server-side.

## Citation support
Where metadata permits, generate stable scholarly citations with title, creator/issuing body, date, edition, archive/catalogue reference, persistent identifier and provenance. Citation permission does not imply permission to reproduce the full work.

## Historical/news verification
News and archival documents are evidence of what was reported/recorded, not automatic proof that every assertion was true. Research can compare contemporaneous reporting, diplomatic records, government records, declassified material, later historiography and modern scholarship.

## Ingestion gate
`Discover -> Identify Source -> Rights Check -> Licence/Terms Capture -> Integrity/Authenticity Check -> Metadata Normalize -> Evidence Rank -> Store/Reference Decision -> Index Allowed Fields -> Graph/Claim Extraction -> Audit`

No bulk ingestion bypasses the Rights Check.

## Provider independence
- canonical source metadata and rights records use Pantavion-owned schemas
- source files use durable/exportable formats where legally permitted
- indexes are rebuildable from canonical records
- embeddings are disposable derived indexes, never the sole representation of knowledge
- AI providers are adapters behind capability interfaces
- live-search providers are replaceable
- backups are versioned and geographically resilient as infrastructure matures

## Minimum canonical entities
### KnowledgeResource
`id, sourceType, title, creators, issuedAt, temporalClass, languages, jurisdictions, canonicalLocator, integrityHash, rightsRecordId, provenanceRecordId, storageState, createdAt, updatedAt`

### RightsRecord
`id, status, licenseId, rightsHolder, capabilities, territories, attribution, expiresAt, reviewedAt, evidenceRefs`

### ProvenanceRecord
`id, resourceId, discoveredFrom, originalLocator, acquisitionMethod, acquiredAt, transformations, parentResourceIds, integrityEvidence`

### KnowledgeClaim
`id, resourceId, claimText/structuredClaim, claimType, temporalValidity, evidenceStrength, confidence, contradictingClaimIds, supersedesClaimIds`

### AccessAuditEvent
`id, userId, resourceId, action, allowed, policyReason, occurredAt`

## First backend contracts
Architecture targets, not claims of live endpoints:
- `GET /api/knowledge/search`
- `GET /api/knowledge/resources/:id`
- `GET /api/knowledge/resources/:id/access`
- `POST /api/knowledge/resources/:id/citation`
- `POST /api/knowledge/resources/:id/export`
- `POST /api/knowledge/ingest/preflight`
- `POST /api/knowledge/research`

## Security invariants
- authorization is server-side
- deny by default for unknown rights
- no client flag can elevate a rights capability
- signed access is short-lived and scoped
- audit sensitive rights actions
- do not expose storage/provider secrets

## Definition of DONE
Documentation or a static library page is not DONE.

`CANONICAL SCHEMA -> RIGHTS ENGINE -> PERSISTENCE -> SEARCH/INDEX -> INGESTION GATE -> PROTECTED VIEWER -> LIVE RESEARCH -> TESTS -> DEPLOY -> VERIFIED LIVE`

Until all relevant gates are implemented and verified, status remains PARTIAL / NOT LIVE.
