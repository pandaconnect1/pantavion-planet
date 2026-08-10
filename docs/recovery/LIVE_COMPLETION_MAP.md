# PANTAVION — LIVE COMPLETION MAP

Updated: 2026-08-10

This file answers one question for every recovered capability: **where does it belong, what is live now, and what must happen before it can be called DONE?**

## Shared completion states

`SPEC_ONLY → UI_ONLY → BACKEND_PARTIAL → BACKEND_LIVE → CONNECTED → TESTED → DEPLOYED → VERIFIED_LIVE`

A feature is DONE only at `VERIFIED_LIVE`.

## 1. Human Identity Core

Canonical areas:
- `lib/supabase/*`
- `app/auth/*`
- `app/profile/*`
- `core/identity/*`

Current verified foundations:
- sign up / sign in / sign out
- auth callback
- protected profile route
- profile read/write
- identity/trust/scopes model
- delegation model

Next live chain:
1. verify production Supabase/session behavior
2. verify profile persistence and RLS
3. connect consent/permission records
4. connect age/safety posture
5. expose status in Founder Control Room

## 2. Contacts / Consent

Target family: People & Social

Required before live:
- authenticated user
- explicit opt-in consent
- official export/API/device source
- normalized contact store
- revocation/deletion rules
- provenance of imported source

No scraping and no third-party password collection.

## 3. Relationship Graph

Target: People Core

Required entities/states:
- follow
- friend/connect
- request
- block
- mute
- introduction/match
- privacy/visibility scopes
- age/safety restrictions

This is the dependency for People discovery, Social, Communities and Dating.

## 4. Messaging / Realtime Chat

Canonical target: Communication Core

Current truth: guarded send API exists but refuses false live behavior.

Required path:
1. conversation schema
2. message schema
3. sender/recipient identity
4. recipient consent/request model
5. abuse/rate controls
6. database persistence
7. realtime transport
8. delivery/read states
9. moderation hooks
10. translation bridge
11. mobile/runtime tests
12. deploy + live verification

## 5. Translation

Canonical target:
- `core/translation/*`
- Language Kernel

Current truth: provider router and normalization/fallback architecture exist; production provider-backed routing remains incomplete.

Required path:
1. provider registry
2. language support matrix per provider
3. secret/env boundary
4. cost/rate controls
5. health checks
6. fallback selection
7. quality/confidence output
8. critical-context warnings/human review lanes
9. connect to chat/social/SOS
10. production verification

## 6. Voice Interpreter

Target: Communication → Voice / Interpreter

Required sequence recovered from existing completion ledger:
1. Provider Router v1
2. Speech Provider Adapter v1
3. Conversation Session Runtime
4. Terminology Memory Store
5. Offline Phrase Pack Runtime
6. Subtitle Stream Runtime

Full completion means:
mic → language detect → streaming STT → translation → subtitles → TTS → reverse turn → terminology memory → offline fallback.

## 7. People & Social

Visible family should contain:
- People
- Profile
- Contacts
- Relationships
- Feed/Posts
- Stories/Reels-style media surfaces
- Communities/Channels/Servers
- Nearby
- Match/Introductions/Dating modes

Do not present these as complete before Human Identity, Contacts, Relationship Graph and Messaging are real.

## 8. Pulse / World Awareness

Recovered intent:
- realtime events
- alerts
- trends
- city/system/human movement
- graph + APIs + sensors + global data sources

Canonical direction: Intelligence/Event Fabric, not a static news page.

## 9. Kernel / PantaAI / Guardian

Primarily internal control plane, not homepage clutter.

Must converge into Founder/Admin Control Room showing:
- capability health
- recovery state
- live state
- agent/work queues
- providers
- build/typecheck status
- blockers
- approvals
- deployment status
- live verification

## 10. Durable Execution

Current truth: execution/checkpoint model exists; runner remains partial.

Required:
- persistent queue
- worker runtime
- idempotency
- retries
- pause/resume
- checkpoints
- failure recovery
- audit/provenance

Without this, long-running agents cannot reliably work continuously.

## 11. Memory / Continuity

Target evolution:
User → Project → Domain → Thread → Continuation → Decision → Artifact → Implementation → Verification

Use existing thread registry concepts for parent/continuation/merge/recall/resolution.

## 12. Safety / Minors / Age

Age-aware posture must be wired into:
- discovery
- stranger contact
- messaging
- media visibility
- matching/dating eligibility
- ads
- guardian flows
- emergency flows

## 13. SOS / Resilience / Off-grid

Only truthful capability claims.

Progressively implement:
- local/offline emergency data
- queued sync
- trusted contacts
- SMS/push provider integrations
- weak-network handling
- later certified/partner satellite or institutional integrations

Never display authority/responder delivery unless actually acknowledged.

## 14. Work / Business / Ads / Marketplace

Public self-service must remain gated until real:
- identity
- business/account model
- database
- payments
- invoicing/tax boundaries
- webhooks
- moderation
- publishing workflow

Ads rule: no intrusive external ad network behavior inside private communication, SOS or minors surfaces.

## 15. Maps / Infrastructure / Water

Treat existing Water/Maps assets as protected production-adjacent data.

Recovery work must never destroy or overwrite:
- pipe/network data
- DWG-derived assets
- users/permissions
- incidents/tasks
- historical operational data

Keep Water isolated while general Pantavion consolidation proceeds.

## Public navigation principle

Use major families instead of hundreds of top-level links:
- People & Social
- Communication
- Work & Business
- Knowledge & Creation
- Maps & World
- Safety & Life

Submodules live inside these families. User-specific entry can later personalize which family opens first.

## Integration order

1. Identity/Auth/Profile
2. Consent/Contacts
3. Relationship Graph
4. Messaging/Realtime Chat
5. Translation in Chat
6. Voice Interpreter
7. Communities/Social surfaces
8. Nearby/Match
9. Work/Business/Marketplace
10. broader Pulse/Knowledge/Creation expansion

Infrastructure work runs in parallel:
Kernel → capability registry → policy/delegation → provider routing → durable execution → memory/continuity → Guardian/audit → resilience.

## Final rule

No recovered feature is allowed to stop at documentation or a static page. Every recovery item must have a canonical target and a next action that moves it toward `VERIFIED_LIVE`.
