# Pantavion — Master Recovery Ledger

Status: ACTIVE RECOVERY LEDGER
Canonical repository: `pandaconnect1/pantavion-planet`
Recovery branch: `recovery/master-ledger-20260816`

## Truth rules

- No recovered source is deleted merely because it is old, duplicated, superseded, partially absorbed, or historically deleted.
- `DONE` is reserved for capabilities that are backend-live, UI-connected, tested, deployed, and verified-live.
- Historical source, idea/spec, UI-only, partial backend, and live implementation are recorded separately.
- Deduplication links ancestors/duplicates to one canonical target; it does not erase provenance.
- Sensitive/private infrastructure data is never copied into a public surface during recovery.

## State vocabulary

Recovery State: `COMPLETE` | `PARTIAL` | `SKELETON` | `IDEA-SPEC` | `DELETED-HISTORICAL`

Decision: `KEEP` | `MERGE` | `EVOLVE` | `REBUILD` | `ARCHIVE` | `INVESTIGATE`

Live State: `SPEC_ONLY` | `UI_ONLY` | `BACKEND_PARTIAL` | `BACKEND_LIVE` | `CONNECTED` | `TESTED` | `DEPLOYED` | `VERIFIED_LIVE`

## Ledger

| Capability family | Earliest / notable recovered provenance | Recovery State | Live State | Decision | Canonical target | Unique recovered value | Current blocker / next action |
|---|---|---|---|---|---|---|---|
| Identity / Auth / Profile | `pantavion-app.` early signup/i18n lineage; later `feature/identity-trust-security-core`; `recovery/identity-registration-current-main` | PARTIAL | BACKEND_LIVE | MERGE | Shared Identity/Auth core | Early age/role UX, later Supabase identity/profile and security evolution | Reconcile unique security-core deltas with newer registration/owner-safety lineage; verify production auth/profile end-to-end |
| People / Relationship Graph | `pantavion-one-clean` 2025 People page; historical People graph wording; later Social/People work | PARTIAL | BACKEND_PARTIAL | EVOLVE | People + Relationship Graph | Global people graph concept: profiles, connections, roles, journeys | Map historical graph concepts to canonical schema and live discovery/profile flows |
| Chat / Communities | `pantavion-one-clean` 2025 Chat page; `pantavion-one-clean-ui` unified conversation UX | PARTIAL | BACKEND_PARTIAL | MERGE | Messaging / Realtime Chat | Global multilingual conversations, communities, private/group channels | Verify realtime path, requests/blocks, persistence, moderation and production UI |
| Translation / Interpreter / Voice | `pantavion-voice` 2025 real prototype; historical Voice pages; later interpreter/provider work | PARTIAL | BACKEND_PARTIAL | EVOLVE | Language Kernel + Interpreter + Voice | Language/dialect mapping, STT UX, bidirectional voice-call concept, provider abstraction | Production provider configuration, continuous-session flow, live two-way verification |
| Pulse | `pantavion-one-clean` 2025 real historical Pulse; later live-feed variants | IDEA-SPEC | UI_ONLY | EVOLVE | Pulse / News / Signals | Real-time events, alerts, trends, city/system/human signals; graph/API/sensor vision | Define canonical data contracts, source trust model, backend ingestion and moderation |
| Compass | `pantavion-one-clean` 2025 Compass page | IDEA-SPEC | UI_ONLY | EVOLVE | Compass / Discovery / Maps | World regions, countries, cities, travel, ports, climate, culture, health, education, business, sports, embassies | Split discovery taxonomy from operational maps; connect to canonical Place/POI/Service graph |
| Mind | `pantavion-one-clean` 2025 Mind page; 2026 Global State Engine | IDEA-SPEC | UI_ONLY | MERGE | Memory / Continuity / Knowledge | Personal knowledge workspace, notes, research, goals, AI organization; project memory ancestor | Define canonical memory scopes, privacy controls, persistence and retrieval contracts |
| Create | `pantavion-one-clean` 2025 Create page; 2026 Compact Kernel app-builder concepts | IDEA-SPEC | UI_ONLY | EVOLVE | App / Service Engine + PantaStudio | Ideas→projects→content→media→tools→sharing; app-builder/workflow ancestor | Separate user creation UX from execution/runtime engine; add durable jobs and provenance |
| Elite / Royal | `pantavion-one-clean` 2025 Elite and Royal pages | IDEA-SPEC | UI_ONLY | EVOLVE | High-Trust Profiles / Institutional Workspaces | High-assurance private communication, strategic dashboards, humanitarian/institutional coordination | Replace legacy tier wording with trust/verification/security policy and governed access |
| SOS / LifeShield | `pantavion-planet` 2026 SOS+Interpreter foundation through trusted contacts/protected-user lineage | PARTIAL | BACKEND_PARTIAL | KEEP | SOS / Crisis / Humanitarian | Emergency Interpreter, offline identity pack, Emergency Circle, fallback states, protected users, institutional-alert concept | Complete offline schema, provider/legal labeling, real dispatch integrations only where lawful/contracted; verify live fallbacks |
| Water / Infrastructure / DWG | `pantavion-planet` Water branches and May 2026 AI map intelligence lineage | PARTIAL | BACKEND_PARTIAL | MERGE | Maps / Infrastructure / Water Operations | Authentic source handling, private map access, asset graph, AI suggestion engine, human master-approval boundary | Reconcile diverged Water branches; secure private storage; canonicalize DWG/source identity; live verification without exposing private assets |
| Marketplace / Listings / Business | `pantavion-planet` 2026 database-backed listings surface | PARTIAL | CONNECTED | KEEP | Exchange / Listings / Business | Governed listings for classified/service/job/business/event/property/marketplace; moderated published-only reads | Verify schema deployed in production, create/mine flows, moderation queue and end-to-end publish lifecycle |
| Billing / Entitlements / Revenue | `pantavion-planet` 2026 billing/entitlements/revenue migration | PARTIAL | BACKEND_PARTIAL | KEEP | Shared Billing / Entitlements core | Provider-neutral billing model, entitlements, webhook events, revenue attribution incl. institutional/public-good classes | Verify migration applied, server webhook adapter, idempotency, entitlement enforcement, live payment-provider integration |
| Moderation / Governance / Institutional Roles | `pantavion-planet` 2026 platform roles + moderation audit; founder moderation queue lineage | PARTIAL | BACKEND_PARTIAL | KEEP | Trust / Safety / Governance control plane | Founder/admin/moderator/editor/finance/support/institutional_operator roles, scoped grants, moderation audit with evidence | Reconcile with Owner Safety control plane; verify atomic transitions, least privilege, production role assignment and audit UI |
| Trust / Owner Safety | trusted contacts/device lineage; PR #191 Owner Trust & Safety control plane and later recovery evolution | PARTIAL | BACKEND_PARTIAL | MERGE | Owner / Trust & Safety Control Plane | High-assurance owner review, trusted-device/access concepts, audited case control | Reconcile identity/security branch deltas, AAL2/passkey/security-key enforcement, case review and production verification |
| Kernel / AI Router / Execution | `pantavion-one-clean` 2026 Compact Kernel; later execution-engine/runtime/recovery branches | PARTIAL | BACKEND_PARTIAL | MERGE | AI Router + Agent Router + Execution Bus | Taxonomy, provider abstraction, recipes/orchestration, capability routing, execution lineage | Replace stubs with durable execution, checkpoints, retries, policy/risk routing, production workers and observability |
| Memory / Project State | `pantavion-one-clean` 2026 Global State Engine; later runtime memory/continuity work | PARTIAL | BACKEND_PARTIAL | MERGE | Memory / Continuity core | Navigation/workspace/project memory and persistence ancestor | Canonical server-side persistence, session/user/module scopes, retention/privacy rules, live continuity verification |
| Music / Voice Studio | `docs/requirements/PANTAVION_MUSIC_VOICE_STUDIO.md` adopted 2026-08-12 | IDEA-SPEC | SPEC_ONLY | KEEP | Audio / Voice ecosystem | Voice Match, Emotional Match, story→lyrics→composition, rehearsal/recording, privacy/rights/provenance | Build data contracts, provider interfaces, voice profile, recommendation UI, recording flow, tests and live deployment |
| Health | Recovered mainly through Compass/domain taxonomy; no standalone mature implementation confirmed in first pass | IDEA-SPEC | SPEC_ONLY | INVESTIGATE | Health domain / service discovery | Health/hospitals domain placement and possible institutional integration | Deeper file/history recovery before implementation claims; define scope and safety/compliance boundaries |
| Education | Recovered mainly through Compass/domain taxonomy; no standalone mature implementation confirmed in first pass | IDEA-SPEC | SPEC_ONLY | INVESTIGATE | PantaLearn / Education | Education/universities domain placement | Deeper file/history recovery; map to PantaLearn canonical requirements and data model |
| Minors / Age Safety | Early signup age-role concept plus later age-role/safety requirements; no standalone production minors backend confirmed in first pass | PARTIAL | SPEC_ONLY | EVOLVE | Identity + Safety + Minors policy | Age-banded access concept and stronger privacy/discoverability rules | Locate all age/minors schema/policy traces; implement age-aware auth, privacy, messaging and ads restrictions with jurisdictional review |

## Deduplication policy

1. Preserve every source pointer and date.
2. Mark an item as `ancestor_of`, `duplicate_of`, `absorbed_by`, or `diverged_from` instead of deleting it.
3. Prefer the newest safe/live implementation only when it contains all required behavior; otherwise merge capability-level deltas.
4. Never merge security-sensitive or infrastructure-sensitive branches blindly.
5. Every canonicalization decision must name the evidence, target path, blocker, and rollback source.

## Immediate next pass

1. Expand each family into source-level rows for the 74 unique branch deltas.
2. Add exact branch/commit/path provenance and chronology.
3. Record `ancestor_of / duplicate_of / absorbed_by / diverged_from` relations.
4. Identify missing production migrations, provider configuration, tests, deploy evidence, and live-verification evidence.
5. Produce the canonical-placement queue in dependency order: Identity/Auth/Profile → Consent/Contacts → Relationship Graph → Messaging → Translation/Voice → Social/Pulse/Compass → SOS → Marketplace/Billing → Governance → Execution/Memory → domain modules.
