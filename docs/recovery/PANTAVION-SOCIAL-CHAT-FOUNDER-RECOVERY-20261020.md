# Pantavion ONE Social + Chat FREE — founder recovery scope (2026-10-20)

Status: RECOVERY_SCOPE / NOT VERIFIED_LIVE. This document records founder requirements and maps them to existing recovery sources; it does not claim deployed features.

## Founder requirements

- One seamless personal + global social experience covering seven continents, without forcing users to choose between separate local/global apps.
- A distinctive, accessible Pantavion environment for social connections, communities, ages and social contexts; equality and inclusion, with age-appropriate safeguarding and no discriminatory profiling.
- Pantavion Chat FREE as a first-party messaging product, not a wrapper around WhatsApp or Viber: direct/group text, media, voice notes, internet voice/video calls, multilingual translation, blocks and abuse reporting. Cryptographic E2EE is a separate audited release gate, never a marketing assumption.
- A unified communications inbox for first-party chat plus opt-in email, phone contacts and supported third-party provider messages/call records, each labelled with provenance and permissions. Provider integration requires supported APIs/platform rights; consent alone does not bypass platform restrictions or third-party privacy rights.
- Explicit, granular, revocable user consent for each contact import or external account link; purpose limitation, retention/deletion, auditability, no silent sensitive-trait imports. Distinguish contact imports from external friendship graphs and encrypted message archives.
- Public launch only after actual registration and end-to-end two-account user journeys pass production VERIFIED_LIVE gates. No premature public homepage promotion.
- Internal kernels/agents remain invisible to ordinary users. Protect existing Water Maps A–E and production systems.

## Verified historical source locations (repository main)

- `docs/recovery/social-people-chat-full-excavation-20260815.md`: existing database inventory, People/Chat/Social recovery, donor PRs #138, #174, #184/#211, #146, #173, #166, #175–#189, #188/#197 and remaining work.
- `docs/recovery/SOCIAL_GLOBAL_001_20260717.md`: seven-continent research, language/country packs, inclusion, privacy, feed, accessibility, age safety and global acceptance suite.
- `app/social/social-home-client.tsx`, `app/social/map/social-map-client.tsx`: current social and location UX.
- Historical donor repository: `pandaconnect1/pantavion-socialhub` (requires full file/commit-level inspection).

## Recovery and implementation order

1. Inventory historical repositories, donor branches, PRs and documents; classify each unique feature CANONICALIZED, SUPERSEDED, ARCHIVED or BLOCKED_WITH_REASON with source link.
2. Verify current authentication, profile, People, Social, Chat and realtime capabilities against live schema, not inferred from source files.
3. Test two distinct user accounts: register, verify, log in, discover/contact, exchange direct messages, receive/read, block, create/react/comment posts and translate.
4. Build first-party group chat, media, reliable notifications and real-time delivery with security/rate-limit/abuse gates.
5. Design and review voice/video signalling, WebRTC TURN costs, permissions and operational reliability; add E2EE only with independently reviewed cryptographic implementation.
6. Build opt-in contacts import and unified inbox through provider-specific supported connectors, with granular scopes, revoke/delete and data-provenance UI. Never claim unsupported WhatsApp/Viber/Signal inbox integration.
7. Apply country/age/language accessibility policies and validate representative seven-continent journeys; protect minors and sensitive categories.
8. Release only verified functions; defer new homepage and any unsupported claims until founder-approved launch gate.

## Release evidence required per capability

Source commit + tests + reviewed access controls + deployed environment + live two-account screenshots/logs + failure/revocation checks + founder sign-off. Documentation, green CI or a working UI alone do not constitute VERIFIED_LIVE.
