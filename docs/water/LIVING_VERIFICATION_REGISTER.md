# Pantavion Water — Living verification and gap register

Status: **OPEN / NOT VERIFIED LIVE** until independently evidenced. This is a safety and execution contract, not a claim of deployed functionality.

## Non-negotiable gates
1. Inventory actual immutable source objects, SHA-256, DWG/GIS revisions and verified backups before modifying any map.
2. Preserve authentic Map A network geometry independently of basemap and derived Maps B–E. Never overwrite or delete canonical assets.
3. Assign stable IDs to every known pipe, valve, junction, hydrant, pump, reservoir and meter; record provenance, position accuracy, inspection date and unknown fields explicitly.
4. Validate CRS, topology, connectivity, duplicate IDs, geometry, source hashes, revision lineage and area-level completeness.
5. Create proposed improvements separately from installed assets. AI suggestions are never treated as field-verified network facts.
6. Require authorized engineering approval for topology, valve installation, pipe sizing, isolation and hydraulic changes.
7. Run regression, access-control, mobile, GIS and hydraulic tests; verify the exact production revision and real authenticated views before marking DONE.
8. On failure: fail closed, preserve prior revision, record evidence and rollback path; keep issue OPEN.
9. Re-run downstream validation after every approved source/map change; continuously monitor drift and failures.

## Ordered work register
| ID | Priority | Deliverable | Acceptance evidence | State |
| --- | --- | --- | --- | --- |
| WATER-001 | P0 | Canonical source + backups + exact production revision inventory | Verified hashes, storage evidence, restore procedure | OPEN |
| WATER-002 | P0 | Founder/worker access and stable authentic Map A overlay | Real-device authenticated production tests | OPEN |
| WATER-003 | P0 | Map B/C ingest and derived generation | Verified source markers, manifest, actual live map | OPEN |
| WATER-004 | P1 | Full georeferenced valve and pipe inventory | Unique IDs, area coverage, field verification, uncertainty | OPEN |
| WATER-005 | P1 | Per-area gap and completeness dashboard | Measured denominator, missing attributes and survey queue | OPEN |
| WATER-006 | P2 | Maps A–E synchronization, GPS, navigation and multilingual street search | Mobile regression and production checks | OPEN |
| WATER-007 | P3 | Network topology, isolation and hydraulic model calibration | Reviewed simulations vs measured pressures/flows | OPEN |
| WATER-008 | P4 | AI network weakness assessment and proposed improvements | Explainable proposals, engineering review, no automatic source edits | OPEN |
| WATER-009 | P5 | Licensed telemetry/IoT integration and digital twin | Data provenance, sensor health, alarms and safety tests | OPEN |
| WATER-010 | P6 | Continuous source revision detection, revalidation, rollout and monitoring | Automated tests plus production verification on each approved revision | OPEN |

## Findings from repository code review (2026-10-09)
- The network-lock workflow runs a scheduled hourly integrity check and a production guardian; this does not prove its latest run passed.
- The DWG derived worker is scheduled every 10 minutes but requires configured Supabase management credentials and verified source markers before generation. It uses explicit B/C source hashes; newly added source revisions require intentional support.
- The engineering worker workflow runs Python/EPANET/WNTR smoke tests on relevant pull requests; its push trigger is scoped to a feature branch, not all main-branch changes.
- Engineering readiness API reports NOT READY if its worker URL/token is absent, and does not authorize writes to the authentic network.

## Evidence policy
Every item remains OPEN until there is a link to passing CI, matching source hashes, a verified production revision, actual map/data behavior and—where relevant—field or engineer signoff. Record failures without hiding them. Never assume storage availability or full network coverage from source-code paths alone.
