# Pantavion Donor Repository Consolidation — 2026-08-19

Canonical repository: `pandaconnect1/pantavion-planet`

## Rule
All further product development belongs in `pantavion-planet`. Legacy Pantavion repositories are recovery/donor sources only. Nothing is copied blindly: every item is inventoried, compared to current canonical code, classified, placed, tested and only then accepted.

## Donor inventory discovered
The connected GitHub installation currently exposes these Pantavion repositories in addition to the canonical repository: `pantavion`, `pantavion.com`, `pantavion-app.`, `pantavion-one`, `pantavion-one-main`, `pantavion-one-clean`, `pantavion-one-clean-ui`, `pantavion-socialhub`, `pantavion-voice`, and `pantavion-voice-`.

## Audit 1 — `pantavion-one-clean-ui`
Root inspection confirms a real Next.js application. Its `app/` directory contains explicit historical surfaces for Chat, Compass, Create, Mind, People, Pulse and Voice.

These are not treated as finished features. They are canonical recovery inputs for the corresponding `pantavion-planet` modules. Each surface is compared file-by-file against current backend/UI/runtime before any donor code is retained.

### Batch 1A — Chat
Source: `pantavion-one-clean-ui/app/chat/page.tsx`.

Recovered intent:
- unified conversations for personal, professional and service communication;
- contacts/groups/services conversation list;
- central chat window;
- Voice/Interpreter integration;
- per-conversation AI assistant.

Recovery State: `SKELETON`.
Decision: `ARCHIVE_UI + MERGE_REQUIREMENTS`.
Reason: the donor file explicitly says it is a demo layout. Canonical `pantavion-planet` already has the real messaging surface under `app/messages`, including conversation page/client, conversation APIs and send route. The donor page must not be copied as a second chat stack.
Canonical target: `app/messages`, messaging/realtime core, People/Relationship Graph, Translation/Voice and Personal PantaAI conversation capability.
Next action: compare each recovered requirement against current messages backend/UI and implement only missing real behavior.

### Batch 1B — Compass
Source: `pantavion-one-clean-ui/app/compass/page.tsx`.

Recovered intent:
- personal life navigation;
- places, roles, needs and services;
- maps + data + priorities + AI recommendations;
- four early lanes: daily life, work/career, health/safety, city/services;
- future GIS, city services, alerts and route integration.

Recovery State: `SKELETON`.
Decision: `EVOLVE_REQUIREMENTS`.
Reason: donor UI is explicitly placeholder-only, while canonical code already contains Compass as a kernel/constitution capability but no canonical `app/compass` surface was found in this audit.
Canonical target: Compass/Discovery domain backed by existing kernel capability, Maps/City Intelligence, Search/Discovery, Personal PantaAI and governed alerts.
Next action: recover deeper Compass history/specs before creating a UI so the canonical surface represents the full concept rather than this early placeholder.

### Batch 1C — Mind
Source: `pantavion-one-clean-ui/app/mind/page.tsx`.

Recovered intent:
- Pantavion knowledge/idea brain;
- graph relationships among people, roles and concepts;
- personal mind space per user;
- research hubs for health, education and cities;
- AI agents that read and recommend knowledge.

Recovery State: `SKELETON`.
Decision: `EVOLVE_REQUIREMENTS`.
Reason: donor page explicitly describes itself as a future frame. No canonical `app/mind` surface was found, but canonical Pantavion already contains memory, continuity and intelligence subsystems that must be reused rather than bypassed.
Canonical target: Mind + Knowledge Infrastructure + governed personal memory + graph/retrieval + PantaAI agents.
Next action: crosswalk Mind requirements against canonical memory, knowledge, RAG/retrieval and agent layers before implementation.

### Batch 1D — People
Source: `pantavion-one-clean-ui/app/people/page.tsx`.

Recovered intent:
- global profiles and identities;
- name, photo, role, location/timezone, plan/level and bio;
- contact sync;
- friends/family/professional relationship categories;
- special identities for services, health and education;
- trust levels/card concept.

Recovery State: `SKELETON/PARTIAL_SPEC`.
Decision: `ARCHIVE_UI + MERGE_REQUIREMENTS`.
Reason: canonical `pantavion-planet/app/people` is already materially larger and includes `people-client.tsx` plus block handling. The early donor template must not overwrite it.
Canonical target: `app/people`, Identity/Profile, Consent/Contacts, Relationship Graph, Trust/Verification.
Next action: create a requirement-by-requirement delta against current People UI/backend and implement only missing canonical behaviors.

### Batch 1E — Pulse
Source: `pantavion-one-clean-ui/app/pulse/page.tsx`.

Recovered intent:
- world activity/pulse stream;
- global news signals;
- local city updates;
- emergency channel;
- events from people, services, AI/sensors and systems.

Recovery State: `SKELETON`.
Decision: `EVOLVE_REQUIREMENTS`.
Reason: donor page is explicitly demo cards and no canonical `app/pulse` surface was found in this audit. Pulse must be connected to the existing Social/Event/Signal/SOS architecture, not revived as static cards.
Canonical target: Social/Pulse/Event fabric + News/Public Awareness + City Intelligence + SOS/Crisis + Trust/Verification.
Next action: recover deeper Pulse ranking/event-signal history and map it to real event ingestion, trust and delivery states before UI creation.

### Batch 1F — Voice
Handled in Audit 2 below. The donor implementation contains real browser STT/TTS/translation behavior and broad language coverage, but canonical Translation/Interpreter is newer and must remain authoritative.

### Batch 1 current conclusion
The first donor UI repository contains valuable product intent but most of its visible module pages are early skeletons/placeholders. Therefore the migration strategy is **requirements recovery into the stronger canonical systems**, not copy-pasting pages. Chat and People already have stronger canonical surfaces. Compass, Mind and Pulse require deeper historical recovery plus backend-first canonical implementation before exposing new UI.

## Audit 2 — `pantavion-voice`
The legacy Voice repository contains a dedicated `app/voice/page.tsx` (~13 KB) with a broad language/dialect list, browser speech recognition, translation API routing and speech synthesis behavior.

Comparison with current canonical `app/translate/page.tsx` shows that `pantavion-planet` already has a materially more advanced Interpreter/Translation implementation: explicit microphone permission handling, browser and server recording paths, speech normalization, speech-to-text API use, bidirectional translation, device-voice selection and richer error/status handling.

Therefore the legacy Voice page must **not** overwrite canonical Translation/Interpreter. Its language/dialect coverage and any UI behaviors not represented in the current global language registry are recovery candidates.

Initial decision:
- legacy Voice page shell: `ARCHIVE/SUPERSEDED` unless a unique interaction is found;
- language/dialect coverage: `INVESTIGATE -> MERGE` into canonical language registry if missing;
- browser speech/translation behavior: `COMPARE`, because current canonical implementation appears newer;
- any unique API route beneath legacy `app/api`: `INVESTIGATE` separately.

## Canonical placement map
- Chat donor material -> canonical `app/messages` + messaging/realtime core + relationship graph; do not create a duplicate chat stack.
- Compass donor material -> canonical Compass/Discovery module using existing kernel capability plus Maps/Search/PantaAI.
- Mind donor material -> canonical Mind/Knowledge module and governed personal-memory/intelligence links.
- People donor material -> `app/people` + Profiles/Consent/Relationship Graph/Trust.
- Pulse donor material -> Social/Pulse/Event fabric + News/City/SOS signals.
- Voice donor material -> Interpreter/Translation/Voice runtime, not a disconnected second Voice stack.
- Legacy homepage/layout assets -> compare against current Pantavion shell; retain only unique value.

## Required record for every recovered item
For every file/capability recovered from a donor repository record:

`source repository -> source path -> source commit/ref -> recovered capability -> canonical module -> current canonical counterpart -> Recovery State -> Decision -> Live State -> differences -> blockers -> tests/evidence -> next action`.

## Next execution order
1. Finish `pantavion-one-clean-ui` remaining Create/Voice details and requirement deltas.
2. Finish `pantavion-voice`, including legacy API routes and language coverage.
3. Inspect `pantavion-one-clean` and compare its UI/components against both the clean-ui donor and canonical code.
4. Inspect smaller/non-empty legacy repositories.
5. Inspect zero-size repositories for historical branches/commits before deciding they contain nothing useful.
6. Only after donor extraction is complete may legacy repositories be considered archival.

## Truth gate
`DONOR_DISCOVERED` is not `MIGRATED`. `MIGRATED` requires canonical code/data placement plus tests. `VERIFIED_LIVE` requires deployed, real end-to-end behavior on the production surface.
