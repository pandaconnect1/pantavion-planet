# Pantavion Social / People / Chat — Full Excavation Inventory (2026-08-15)

## Truth rule
This document is a no-orphan recovery ledger. A historical PR/branch is provenance, not proof of live capability. Recovery is selective against current `main`; stale branches are never wholesale-merged. A capability is only VERIFIED_LIVE after production backend + UI + real user journey pass.

## Current production facts verified on Supabase
Present now: `profiles`, `relationships`, `conversations`, `conversation_members`, `messages`, `message_receipts`, `contacts`, `contact_sources`, `contact_discovery_tokens`, `user_blocks`, `social_posts`, `social_comments`, `social_reactions`, `social_post_media`, `social_location_shares`.

Not present in production at this checkpoint: `communities`, `community_members`, `notifications`.

## Canonical recovery already ported in PR #214
- People: search/filter, requests, accept/decline, Nearby, block/unblock, conversation open.
- Chat: realtime messages, truthful delivery/read handling, original-language persistence, manual/automatic per-message translation through `/api/pantavion/translate`, profile-language handoff.
- Social: realtime posts/reactions/comments, media-aware and capability-aware UI.

## Donor families that must be exhausted, deduplicated and classified

### PR #138 — Social Core runtime (49 commits)
Recover selectively:
- Social Core contracts/capability registry
- age/policy engine
- Family/Friends/Communities/Professional/Business/Learning/Dating/Elite contexts
- cultural bridge
- contact sync
- context handoff
- secure-chat readiness policy
- Social chat and communities surfaces
- notifications surface
- advertising policy boundary
Do not claim provider-backed Voice/Video/E2EE live merely because foundation code exists.

### PR #174 — Social flagship (17 commits)
Recover/select against current main:
- consent-based Social Map
- approximate/precise friend visibility controls
- pause/revoke/expiry
- Emergency Location/last-known-position
- explicit emergency contacts
- media attachment UX where not already canonical
Do not treat its own NOT-YET-COMPLETE items as implementations.

### PR #184 / #211 — Chat translation lineage
Recovered into #214:
- realtime subscription state
- original language preservation
- per-message translation
- automatic recipient-language translation
Remaining donor concept from #146: group multi-language fanout.

### PR #146 — shared translation service
Recover only non-overlapping platform concepts:
- one translation engine across Social/Chat/Voice/Video/groups/Business/SOS
- original message preservation
- group-room multi-target fanout
Do not overwrite the newer canonical translation route/provider runtime.

### PR #173 — Personal space
Already merged lineage; verify and retain:
- profile hub
- contacts + consent/source provenance
- private personal media
- links Profile -> Contacts -> People -> Messages -> Media

### PR #172 / #182 — public/canonical integration
Already merged lineage; retain route integration and Social as the unified consumer entry.

### PR #166 — Human + Communication backend
Already merged/hardened lineage; production schema is source of truth for privacy, relationships, blocks, conversations, messages and receipts.

### PR #175–#189 — Social production hardening
Already merged lineage; retain capability-level health, RLS/Data API hardening, production sync verification and auth-aware health semantics.

### PR #143 / #194 / #195 / #196 / #208 / #210 — Interpreter lineage relevant to Chat/Social
Keep only capabilities that strengthen human communication without replacing newer canonical implementations: language detection, transcription, runtime health, production readiness gate, canonical route, full-turn anti-stall flow.

### PR #188 / #197 — Identity/registration relevant to People
Selective recovery only onto current production identity model: profile/registration metadata, age/country/language, consent, security levels and review gates. Do not replay obsolete migrations.

### Historical Social branches
Inventory includes:
- `agent/canonical-social-flagship-wave`
- `agent/social-production-hardening`
- `feat/revenue-social-foundation`
- `feat/social-business-listings-shell`
- `feat/social-flagship`
- `feature/social-core-foundation`
- `feature/social-core-runtime-v2`
- `fix/social-health-auth-aware`
- `fix/social-health-diagnostics`
- `fix/social-live-backend-gate`
- `agent/realtime-chat-translation`
Every unique artifact in these branches must end as KEEP/MERGE/EVOLVE/REBUILD/ARCHIVE with provenance.

## Next implementation batches
1. Finish PR #214 CI/preview; real two-account People -> Chat -> translation -> Social test.
2. Communities: design a current-main migration with non-recursive RLS; apply only after review; then recover UI/actions and verify create/join/read.
3. Contacts/Discovery: verify imported contacts, contact discovery tokens and consent boundaries in real sessions; connect to People without confusing contacts with Pantavion accounts.
4. Notifications: recover UI concept, build canonical notification schema/runtime instead of blindly replaying donor SQL, then verify real event delivery.
5. Social Map/Location: recover #174 unique controls onto existing production `social_location_shares`; verify permission, expiry, revoke, approximate visibility and no unintended precise disclosure.
6. Context worlds: Communities/Professional/Business/Learning/Dating/Elite use shared relationship graph with age/privacy/trust policy; only expose routes after backend and policy tests pass.
7. Group Chat: add current-schema group conversations + per-recipient language fanout from #146 concept; verify 3+ users with different profile languages.
8. Secure/Elite messaging: preserve readiness/policy only until real cryptographic design and verification exist; never label E2EE/forward secrecy live without proof.
9. Close superseded donor PRs only after their unique value is accounted for in this ledger or canonical code.

## Completion rule
No donor is considered exhausted until every changed file/unique capability has one outcome: CANONICALIZED, SUPERSEDED, ARCHIVED, or BLOCKED_WITH_REASON. No capability is DONE until backend-live, UI-connected, tested, deployed and VERIFIED_LIVE.