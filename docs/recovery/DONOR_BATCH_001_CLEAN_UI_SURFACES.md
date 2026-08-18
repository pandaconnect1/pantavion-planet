# Donor Batch 001 — pantavion-one-clean-ui surfaces

Source repository: `pandaconnect1/pantavion-one-clean-ui`
Canonical destination: `pandaconnect1/pantavion-planet`
Batch status: `RECOVERED_AND_CLASSIFIED`

This batch records the first complete visible surface pass of the clean-ui donor. It preserves product intent while explicitly rejecting placeholder UI as canonical implementation.

| # | Donor path | Recovered intent | Recovery State | Decision | Canonical target | Live State |
|---|---|---|---|---|---|---|
| 1 | `app/chat/page.tsx` | Unified conversations; contacts/groups/services; central chat; Voice/Interpreter integration; per-conversation AI | SKELETON | ARCHIVE_UI + MERGE_REQUIREMENTS | `app/messages`, messaging/realtime, People graph, Translation/Voice, Personal PantaAI | SPEC_ONLY for donor; canonical messaging exists separately |
| 2 | `app/compass/page.tsx` | Life navigation across places/roles/needs/services; maps/data/priorities/AI; daily life/work/health/city lanes | SKELETON | EVOLVE_REQUIREMENTS | Compass/Discovery + Maps/City + Search + Personal PantaAI | SPEC_ONLY |
| 3 | `app/create/page.tsx` | Projects from idea to execution; personal/family/business project spaces; tasks/deadlines/reminders; calendar/AI/collaboration | SKELETON | EVOLVE_REQUIREMENTS | App/Service Engine + Workflows + PantaAI + reminders/calendar/collaboration | SPEC_ONLY |
| 4 | `app/mind/page.tsx` | Knowledge/ideas brain; graphs; personal mind space; research hubs; AI knowledge agents | SKELETON | EVOLVE_REQUIREMENTS | Mind + Knowledge Infrastructure + Memory + Graph/RAG + PantaAI | SPEC_ONLY |
| 5 | `app/people/page.tsx` | Global profiles; identity/location/role/plan/bio; contact sync; relationship categories; trust levels | SKELETON/PARTIAL_SPEC | ARCHIVE_UI + MERGE_REQUIREMENTS | `app/people`, Identity/Profile, Consent/Contacts, Relationship Graph, Trust | canonical People is more advanced; donor not live |
| 6 | `app/pulse/page.tsx` | World activity; global news; local city; emergency; events from people/services/AI/sensors | SKELETON | EVOLVE_REQUIREMENTS | Social/Pulse/Event fabric + News + City + SOS + Trust | SPEC_ONLY |
| 7 | `app/voice/page.tsx` | Voice/STT/TTS/translation and language coverage | PARTIAL | ARCHIVE_SUPERSEDED + MERGE_UNIQUE | canonical Interpreter/Translation/Voice runtime | canonical implementation is newer; donor not live |

## Evidence-based decisions

### Chat
The donor source explicitly labels itself a demo layout. Canonical Pantavion already contains a real messaging surface under `app/messages`, including conversation pages/client and conversation/send APIs. Therefore creating `app/chat` from the donor would be a regression and duplicate stack. Recovered requirements remain valid and must be delta-checked against canonical messaging.

### Compass
The donor source is placeholder UI but preserves an important four-lane concept: daily life, work/career, health/safety, and city/services, tied to GIS, alerts and AI recommendations. Canonical Pantavion already recognizes Compass in kernel/constitution artifacts, so implementation must evolve from the deeper recovered Compass concept rather than this page shell.

### Create
The donor source defines a project-making layer from idea to implementation across personal, family/social and business contexts, with tasks, deadlines, reminders, calendar, AI and collaboration. The page is a placeholder; the concept should feed the canonical App/Service Engine and workflow system rather than become an isolated static `/create` page.

### Mind
The donor source records graph-based knowledge, a per-user personal mind space, research hubs, and AI knowledge agents. This should be merged into existing canonical memory/intelligence/knowledge layers and later exposed through a real backed Mind surface.

### People
The donor page is a profile template, while canonical `app/people` already has a larger page plus `people-client.tsx` and blocking support. Requirements such as contact sync, relationship categories, special identities and trust levels are retained for delta review; donor UI is superseded.

### Pulse
The donor source is demo cards, but its intent is not trivial: a unified event/signal stream joining global news, local city signals and emergency channels from people, services, AI/sensors and systems. This belongs in the canonical event/signal/social/SOS fabric with provenance and trust, not as static cards.

### Voice
Legacy Voice includes meaningful code and broad language coverage, but canonical Translation/Interpreter already has stronger microphone permission handling, server recording, speech normalization, speech-to-text, bidirectional translation and device-voice selection. Only unique language/dialect or interaction capabilities should migrate.

## Batch gate
No item in this batch is marked `MIGRATED` solely because its intent has been recovered. Migration requires a canonical delta, actual code/data placement, tests, and deployment. `VERIFIED_LIVE` requires production end-to-end evidence.
