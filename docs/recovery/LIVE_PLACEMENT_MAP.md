# Pantavion Live Placement Map

This map records where recovered capabilities must land and what must become real before a surface is marked live.

## Status model

Recovery: `FOUND -> VERIFIED -> CLASSIFIED -> CANONICALIZED -> MERGED`
Live: `SPEC_ONLY -> UI_ONLY -> BACKEND_PARTIAL -> BACKEND_LIVE -> CONNECTED -> TESTED -> DEPLOYED -> VERIFIED_LIVE`

## Kernel / Control Plane
Canonical targets:
- `core/kernel/*`
- `core/canonical/*`
- `core/registry/*`
- `core/security/*`
- `core/protocol/*`
- `core/runtime/*`
- `core/guardian/*`
- `core/intelligence/*`

Must become live:
- real durable queue/worker/checkpoint resume
- provider health/failover
- policy/identity/delegation admission
- auditable agent execution
- Guardian/Build/Repo health surfaced in Founder Control Room

## Identity / Profiles / Trust
Canonical targets:
- `lib/supabase/*`
- `app/auth/*`
- `app/profile/*`
- `core/identity/*`

Must become live:
- signup/login/logout/session
- canonical profile persistence
- RLS/policy verification
- trust/role/age posture
- consent and delegation records

## People / Social
Public family: People & Social Universe
Expected surfaces:
- People
- Profile
- Contacts
- Relationships
- Communities
- Feed/Stories
- Nearby/Match
- Dating/Meet People

Must become live in dependency order:
`Identity -> Profile -> Consent -> Contacts -> Relationship Graph -> Social Graph -> Discovery -> Communities -> Match/Dating safety lanes`

## Messaging / Communication
Public family: Universal Communication
Expected surfaces:
- Messages
- Chat
- Voice
- Video
- Rooms/Channels
- Private/Elite secure scopes

Must become live:
- conversation/message schema
- realtime transport
- recipient consent/request states
- moderation/abuse controls
- media/file persistence
- delivery/read state
- translation per message
- cross-device continuity

## Language / Translation / Interpreter
Canonical targets:
- `core/translation/*`
- `core/kernel/language/*`
- `core/runtime/voice-runtime.ts`
- translation APIs/surfaces

Must become live:
`Provider Registry -> STT -> language detection -> translation -> subtitles -> TTS -> bidirectional session -> terminology memory -> offline packs -> critical-context quality guards`

Public truth:
- 250+ starter locale choices may be visible.
- 7000+ is long-term language scope, not a claim of full live provider coverage.

## SOS / Crisis / Resilience
Canonical targets:
- `core/emergency/*`
- resilience runtime
- SOS APIs/surfaces

Must become live:
- trusted contacts persistence
- consent
- local queue/offline event handling
- truthful delivery states
- provider-backed SMS/push where configured
- emergency translation lane
- clear non-authority/non-guarantee boundaries

## Work / Services / Marketplace / Ads
Expected surfaces:
- Work
- Services
- Marketplace/Listings
- Business
- Ads Center

Must become live:
- identity/business profile
- listing persistence
- moderation
- search/discovery
- payment/provider gates before checkout/publishing claims
- invoices/tax/webhooks where applicable

## Knowledge / Mind / Research / Learning
Canonical direction:
- dedicated memory/knowledge layer instead of routing everything through Kernel
- source-grounded research workspace
- citations/provenance
- thread/project continuity
- canonical promotion rules

## Maps / Infrastructure / Water
Protected operational domain.
Must preserve:
- network/pipes/assets
- users/permissions
- DWG/map data
- incident/zone/service-impact history

Migration rule:
No destructive movement without backup, checksum/record-count checks, route verification, and rollback path.

## Founder/Admin Control Room
One internal surface should show, per module:
- Recovery State
- Live State
- source provenance
- current canonical path
- backend health
- provider health
- tests/build status
- blockers
- next action
- deploy status
- last production verification

Example Voice row:
`Historical donor ✓ | Canonical runtime ✓ | Provider pending | Mic partial | STT pending | Translation partial | TTS pending | Mobile test pending | Production not verified`

## Completion rule
A route or feature is not DONE because a page exists. DONE requires:
`canonical code + real backend/provider as required + connected UI + tests + deployment + production verification`.
