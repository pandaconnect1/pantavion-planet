# Pantavion Water — implementation and verification specification

Status: implementation plan; **not a claim that features are deployed**.
Safety: preserve canonical DWG, Map A/B/C/D/E and existing water-network data; no destructive migrations; do not alter authorization without tests.

## Release gate
Every change must pass lint, typecheck, unit/integration tests, build, security checks, staging smoke tests, and documented rollback. Keep independent features behind feature flags. Record evidence for mobile Android/iOS and founder/admin and field roles.

## P0: restore fault administration
- Investigate GET /api/professional/infrastructure/water/admin/faults (HTTP 500 observed 2026-10-18 20:58:34Z).
- Verify @vercel/blob credentials/storage access on Render; do not migrate/delete records before backup and reconciliation.
- Keep server-side authorization and redaction; add integration tests for 403, successful list, missing credentials, malformed blob, upstream outage.
- Return safe structured errors and emit correlation IDs, never credentials or personal information in logs.

## P1: Interpreter readiness
- /api/pantavion/interpreter/health returned repeated 503 responses.
- Independently probe translation and speech-to-text providers, expose non-secret diagnostics, avoid costly probes every 15 seconds, configure alert threshold and fallback policy.
- Distinguish partial degradation from total application outage.

## Water asset registry / network topology
- Immutable source provenance; separate canonical GIS and derived display tiles.
- Stable asset IDs, geometries, attributes, connectivity, pressure zones, inspection history and audit trail.
- Validate coordinate reference system, topology, duplicate IDs, geometry errors and permissions.
- Support tracing affected segments/valves only on verified connectivity; require human approval for physical isolation.

## Field operations
- Fault intake -> triage -> dispatch -> arrival -> work -> evidence -> supervisor approval -> closure.
- Role-based access, offline draft/queue, idempotent sync, conflict resolution, audit history, GPS accuracy indicator.
- No automatic publication of field edits to canonical water network without review.

## Addressing / GIS search
- Greek, Latin and transliterated street search, municipality/community, house number, parcel where licensed, geocoding confidence and source.
- Incremental updates and provenance; distinguish official vs community supplied roads.

## Hydraulic simulation
- Evaluate EPANET integration using validated model and calibration; pressure, flow, isolation and outage impact are simulations, not operational facts.
- No automatic valve actuation or safety-critical decisions.

## Reliability and scalability
- Health per dependency, SLOs, alerting, backups with restore drills, disaster recovery, caching/vector tiles, load tests for thousands of users, accessibility and localization.
- Measure p95 map tile latency, API latency, error rates, auth success, sync conflicts and data completeness.

## Acceptance
For each feature attach commit, CI run, deployment ID, screenshots or API tests, data integrity checks, rollback and operator sign-off. Never label feature 'live verified' based solely on merge or HTTP 200.
