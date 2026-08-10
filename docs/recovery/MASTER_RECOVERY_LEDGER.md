# Pantavion Master Recovery & Live Integration Ledger

Canonical repository: `pandaconnect1/pantavion-planet`
Working branch: `feature/social-core-runtime-v2`

## Locked operating rule

Every recovered item must move through:

`RECOVERED -> VERIFIED -> CLASSIFIED -> CANONICALIZED -> MERGED -> BACKEND_LIVE -> UI_LIVE -> TESTED -> DEPLOYED -> VERIFIED_LIVE`

No item is `DONE` before production verification.

## Verified repository inventory

The following Pantavion repositories are currently visible through GitHub repository search and are donor/recovery candidates unless otherwise marked:

- `pandaconnect1/pantavion-planet` — CANONICAL
- `pandaconnect1/pantavion-one-clean` — HIGH-VALUE DONOR
- `pandaconnect1/pantavion-one-clean-ui` — UI DONOR
- `pandaconnect1/pantavion-one` — LEGACY DONOR
- `pandaconnect1/pantavion-one-main` — RECOVERY CANDIDATE
- `pandaconnect1/pantavion-voice` — HIGH-VALUE VOICE DONOR
- `pandaconnect1/pantavion-voice-` — RECOVERY CANDIDATE
- `pandaconnect1/pantavion-socialhub` — SOCIAL RECOVERY CANDIDATE
- `pandaconnect1/pantavion-app.` — LEGACY/APP DONOR
- `pandaconnect1/pantavion.com` — LEGACY/DEPLOYMENT LINEAGE
- `pandaconnect1/pantavion` — EARLY LINEAGE

## Verified major recovery sources already found in canonical repo

- `PANTAVION_RECOVERY_SNAPSHOT_20260425-215458.txt`
- `data/pantavion-source-inventory/inventory.json`
- `data/runtime-reports/latest-founder-vision-ingestion.json`
- `data/runtime-reports/latest-unfinished-plan-ingestion.json`
- `core/recovery/donor-extraction-registry.ts`
- `core/recovery/project-fragment-registry.ts`
- `core/recovery/repository-triage-registry.ts`

## Verified recovered architecture / implementation

### Kernel / orchestration
- Historical `PANTAVION CORE — COMPACT KERNEL v1` recovered from `pantavion-one-clean` commit `35d28b1075389c884e71fa0a12c48bc7e120d9ea`.
- `core/kernel/kernel-foundation-lock.ts`
- `core/canonical/canonical-registry.ts`
- `core/registry/capability-registry.ts`
- Guardian/Builder/Internal AI OS foundations.
- Kernel API lifecycle historically included boot/account/intake/analyze/memory/run/complete/state/diagnostics/status.

### Continuity / memory
- `core/memory/thread-registry.ts`
- Thread continuation, parent-child relationships, merges, unresolved/resolved states, recall timestamps.
- Intended direction: Project -> Domain -> Thread -> Continuation -> Decisions -> Artifacts -> Implementation -> Status.

### Recovery / unfinished work
- Source inventory historically recorded ~939 filesystem entries.
- Founder vision ingestion: 696 files / 13,801 findings.
- Unfinished plan ingestion: 702 files / 11,360 findings.
- Recovery registries already define donor extraction, project fragments and repository triage.

### People / Social historical recovery
- Historical People directory deletion confirmed in `pantavion-one-clean` commit `bb8c9686eee0feab9e63ea52ec2efbd788787f3d`.
- Earlier People concept included global profiles, connections, communities and human discovery.
- Pulse historical concept included realtime events, alerts, trends, cities, systems and human movement, with graph/APIs/sensors/global sources.

### Voice / Translation
- `pandaconnect1/pantavion-voice` contains a real historical voice/translation implementation donor.
- `core/translation/pantavion-translation-provider-router.ts`
- `core/translation/pantavion-voice-translation-completion-ledger.ts`
- `core/kernel/language/pantavion-language-kernel.ts`
- Modes include text, speech, camera, subtitle, same-phone, two-device, social, SOS and elder.
- Provider routing criteria include language pair, latency, cost, jurisdiction, accessibility, emergency context and provider availability.
- Live completion requires mic, auto-language detection, streaming STT, translation, subtitles, TTS, bidirectional sessions, terminology memory, offline packs and provider configuration.

### Identity / Auth / Delegation
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `app/auth/actions.ts`
- `app/auth/callback/route.ts`
- `app/profile/page.tsx`
- `app/profile/ProfileClient.tsx`
- `core/identity/identity-model.ts`
- `core/identity/delegation-model.ts`
- Current profile fields include username, display name, avatar, bio, country and language.

### Messaging
- `app/api/messages/send/route.ts` currently truthfully guarded.
- Required gates: auth, identity, recipient consent, abuse protection and database persistence.

### Guardian / autonomy
- Guardian 365 workflow exists and audits periodically.
- Guardian doctrine: observe, collect, compare, diagnose, research, design, propose, approval, patch, build, audit, deploy gate, report, learn.
- No autonomous destructive deploy/billing/DB/secret exposure claims.

### Resilience / emergency
- Live continuity foundation documents modular isolation, multi-provider resilience, offline-first critical flows, truthful delivery states and multi-path communication roadmap.

### Age / protected users
- `core/identity/age-role-engine.ts` exists with child/teen/adult/elder-aware safety modes.

## Canonical live placement map

### People & Social
People, profiles, contacts, relationships, chat, communities, stories/feed, nearby/matching, dating/meet-people.

### Communication
Messages, Voice, Video, Interpreter, Languages, Rooms, secure/private communication.

### Work & Business
Jobs, services, listings, marketplace, business accounts, Ads Center, income tools.

### Knowledge & Creation
PantaLearn, Mind, libraries, research, media/create, cultural knowledge.

### Maps & World
Compass, Maps, Travel, Infrastructure, Water, City Intelligence.

### Safety & Life
SOS, Crisis, trusted contacts, minors/guardian protection, identity/trust, resilience/off-grid.

### Internal Control Plane
PantaAI, Kernel, Agents, Guardian, Provider Router, Recovery Engine, Build/Repo Guardian, Control Room.

## First source-grounded completion dependencies

1. Identity/Auth/Session
2. Canonical Profile
3. Consent/Permissions
4. Contacts import/sync
5. Relationship Graph
6. Messaging persistence
7. Realtime Chat
8. Translation bridge
9. Voice/Video
10. Communities/Social surfaces
11. Nearby/Match/Dating

Infrastructure chain in parallel:

1. Kernel
2. Capability Registry
3. Policy / Delegation
4. Provider Router
5. Durable Execution
6. Memory / Continuity
7. Guardian / Audit
8. Failover / Resilience

## Known truth gaps

- `core/runtime/durable-execution.ts` has useful data model/checkpoints but runtime methods are still compatibility stubs and must not be treated as production.
- Capability metadata must be reconciled with real implementation; no `production/ok` claim for stubbed runtime.
- Translation provider routing exists as foundation but production provider configuration is incomplete.
- Messaging send route remains guarded until backend gates are complete.

## Donor migration rule

For every donor artifact:

`source repo + source commit + source path + recovered idea + recovered code + canonical target + merge decision + test evidence + production verification`

Never overwrite canonical code blindly. Preserve provenance and compare first.

## Next excavation queue

- Full commit/file recovery from all 11 visible Pantavion repositories.
- Deleted files and parent commits in `pantavion-one-clean`.
- Voice donor deep extraction.
- SocialHub and clean UI donor extraction.
- Legacy route/brand/product-copy extraction.
- Historical backups and recovery snapshots.
- Kernel runtime/provider/memory/social dependency audit.
- Consolidated Completion Matrix generation.
