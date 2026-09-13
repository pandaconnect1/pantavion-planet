# Pantavion One — Complete Project Handoff

Date: 2026-08-16
Canonical repository: `pandaconnect1/pantavion-planet`
Canonical branch: `main`
Handoff branch: `docs/complete-handoff-20260816`

## 1. Purpose

This document is the canonical handoff baseline for any implementation agent working on Pantavion One. It exists to prevent parallel prototypes, repeated redesigns, lost recovery findings, false completion claims, and destructive wholesale merges.

Pantavion One is a global human network + knowledge infrastructure + AI orchestration + operational platform. The product must remain one coherent user experience while preserving strict technical ownership boundaries between kernels.

## 2. Locked architecture

Three layers:
1. Experience — web/mobile/PWA/desktop shells, accessibility, low-data/offline UX.
2. Knowledge / Graph / AI / Memory / Trust / Protocol — identity graph, policy, translation orchestration, trust, evidence, AI routing, continuity.
3. Infrastructure / Security / Data / Observability — services, PostgreSQL/Supabase, queues/events, storage, cryptography, audit, telemetry, recovery, deployment.

Shared spine:
`Identity -> Graph -> Policy -> Entitlement/Billing -> Audit -> Observability`

Authoritative writes:
`Command -> Validation -> Authorization/Policy Decision -> Canonical Write -> Outbox/Event Emission`

Hard module boundaries:
- People != Social
- Chat != Social
- Voice != Interpreter
- Pulse != Audio != Media
- Business != Ads Center
- Compass != Maps
- Mind != AI Router
- PantaLearn != Mind
- Institutional != Business
- SOS != generic Chat

Private Chat content must never become Social/search/public graph/training data without an explicit user command plus policy decision. SOS owns verified emergency truth.

## 3. DONE truth gate

A capability is not DONE because a spec, UI, route, migration, PR, preview or build exists.

Final state:
`RECOVERED -> CANONICALIZED -> MERGED -> BACKEND_LIVE -> UI_LIVE -> TESTED -> DEPLOYED -> VERIFIED_LIVE`

Intermediate states must remain explicit.

## 4. Recovery truth

Two major historical report families currently account for at least:
- Founder Vision: 13,801 detected findings.
- Unfinished Plans: 11,360 detected findings.

Older persisted reports were truncated, so they are not the full corpus. Issue #215 defines the canonical recovery method. PR #216 implements the first excavation infrastructure unit.

Do not deduplicate first. For every finding preserve provenance and classify semantic relation before merge decisions. Relations include:
`EXTENDS | EVOLVES | IMPLEMENTS | DEPENDS_ON | SUPERSEDES | CONFLICTS_WITH | RELATED_TO | DUPLICATE_EXACT`.

Batching rule: deterministic 1,499-record batches with checkpoints, stable record IDs and cross-batch links.

Rule: merge the common; preserve every innovation delta.

## 5. Canonical product families

1. People & Social
2. Communication / Chat
3. Interpreter & Languages
4. Personal Space / Profile / Contacts
5. Identity / Trust / Security
6. Business / Listings / Marketplace / Ads boundaries
7. Media / News / Knowledge / Creator
8. World / Countries / Maps / Infrastructure / Water
9. Safety / SOS / Resilience
10. PantaAI / Kernel / Continuity / Recovery

Additional distinct kernels/capabilities recovered from historical work must be retained under their correct owners, including Voice, Video, Pulse, Audio/Radio, Sports, Compass, Mind, PantaLearn, Institutional, Dating, Elite, Communities, Events, Music/Voice Studio, Creator/Studio and humanitarian/crisis workflows.

## 6. Current implementation lanes

### Merged foundations
- #207 Global Connect: 249-country registry + truthful readiness API.
- #208 canonical Interpreter route consolidation.
- #194 Interpreter language detection + server transcription runtime.
- #195 Interpreter provider health endpoint.
- #196 production readiness gate for Interpreter.
- #191 Owner / Trust & Safety control plane.
- #212 recovery capability allocation + personalized sections.
- #213 truth-first language coverage matrix; 7,000 remains a target, not a live-support claim.
- #176-#190 contain production sync, Supabase, Social, security, health and Guardian foundations.

### Open / unfinished lanes
- #216 full-corpus recovery/excavation infrastructure.
- #214 People -> Chat -> Translation -> Social integration and two-account acceptance journey.
- #210 Interpreter full-turn audio capture after Greek<->Nepali live failure.
- #197 registration recovery on current production identity model.
- #188 advanced Identity/Trust/Protected Account donor; selective recovery only.
- #179 Global Knowledge Vault foundation.

### Important donor/evolution lanes
- #174 Social flagship: media posts, Social Map, emergency contacts, communities/events, Dating/romantic context, recommendations, importers, multi-email inbox and global personal shell.
- #138 Global Social Core: Family, Friends, Communities, Professional, Business, Learning, Dating, Elite Society relationship layers.
- #146 shared translation service for Social, Chat, Voice, Video, Business, SOS.
- #143 Interpreter one-mic UX, automatic counterpart-language handling, conversation history and script-first detection.
- #184 realtime Chat + in-message translation lineage.

Do not wholesale-merge stale donors over current `main`. Recover selectively after semantic and contract comparison.

## 7. Immediate product truth / visible gaps

The live product must not be described as complete. Known visible gaps include:
- registration is not yet exposed as a finished, verified live journey;
- current landing/auth presentation does not yet match the intended polished Pantavion One UI target;
- People -> relationship -> Chat -> translation -> Social still requires real two-account acceptance testing;
- Interpreter still requires full-turn live mobile regression verification;
- many recovered capabilities remain foundation/building rather than live;
- broad country/language targets must remain evidence-gated.

## 8. UI target rule

Do not invent a new fourth design. Preserve the recovered target direction:
- Pantavion One global landing with clear `Join Pantavion One` and sign-in;
- integrated Social workspace with People, Chat, discovery/global context and real capabilities;
- integrated operational surfaces may show Social, Chat, Interpreter and Water together, but kernel truth remains separated underneath.

Only real routes/actions are clickable. Foundation-only work must not appear as fake live buttons.

## 9. First completion sequence

Priority vertical journey:
1. Home / Join Pantavion One
2. Register
3. Login
4. Identity/Profile
5. People discovery
6. Relationship request/accept
7. Chat realtime send/receive
8. Message translation preserving original
9. Social post/reaction/comment
10. Communities/Notifications where production schema is verified
11. Mobile/live verification

Parallel lane:
Interpreter text -> STT -> translation -> TTS -> full-turn -> multi-language mobile regression.

Recovery lane continues independently via #215/#216 and must feed canonical modules without blocking every bounded implementation increment.

## 10. Rules for any external coding agent

Before changing code:
- inspect current `main`, open PRs, migrations, CI, Supabase/Vercel boundaries and existing routes;
- never rebuild Pantavion from scratch;
- never reset history, force-push, delete recovered artifacts or overwrite current canonical work;
- never infer duplicate from similar title/theme;
- preserve provenance and innovation deltas;
- never commit secrets or paste production credentials into prompts;
- do not create a second database/auth/translation architecture if a canonical one exists;
- make bounded reviewable changes on isolated branches;
- show exact tests and failures;
- never claim DONE without VERIFIED_LIVE evidence.

## 11. External-agent first task recommendation

Use a second coding agent only after confirming it can operate on the existing repository rather than generating a new standalone prototype.

First safe task:
- inspect #197, #214 and current `main`;
- produce a non-destructive gap report for the complete `Home -> Register -> Profile -> People -> Chat -> Translation -> Social` journey;
- do not change production or secrets;
- propose the smallest branch/diff that closes the first verified blocker;
- compare its plan with this handoff before implementation.

## 12. Handoff maintenance

This document is a baseline, not permission to freeze recovery. As #216 classifies the corpus, every new innovation delta must be linked into the correct canonical family and reflected here only when its provenance and current state are known.

No orphan rule: every recovered item receives provenance, relation, decision, canonical target, live state, blocker and next action.
