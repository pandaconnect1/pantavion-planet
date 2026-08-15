# Pantavion One — Global Social Research & Unification Pack

**Pack ID:** SOCIAL-GLOBAL-001  
**Research cut-off:** 17 July 2026  
**Decision state:** Research synthesis completed; implementation specification ready for review  
**Original production state:** No deployment, merge, purchase, subscription, or production modification performed by the original sandbox research environment.

## Canonical recovery status

This document was recovered into the canonical `pantavion-planet` implementation branch on 2026-08-15. Recovery does **not** convert research claims into VERIFIED_LIVE claims. Each capability must still pass canonical implementation, production data/schema, policy, security, UI, test, deployment, and live verification gates.

## Architecture decision

Pantavion Social is one coherent global experience built from:

- one Pantavion identity and relationship graph;
- one consistent application shell;
- one country/language/policy configuration system;
- separate Social, People, Chat, Voice, Pulse, Media, Business and SOS kernels;
- shared policy, trust, billing, audit and observability spines;
- deterministic `Command → Validation → Canonical Write → Event Emission` for authoritative changes.

The design must absorb human needs revealed by existing social and messaging systems without copying their branded UI, provider lock-in, privacy ambiguity, brittle economics or unsafe boundary mixing.

## Seven-continent requirements

- **Africa:** low-data text mode, compression, offline queue, voice-assisted UX, language packs, anti-scam controls, carrier-neutral access.
- **Asia:** script-aware search, provider-neutral service registry, translation labels, country policy packs, disaster-safe channels.
- **Europe:** GDPR/DSA policy packs, ActivityPub-compatible interoperability edge, chronological feed, optional explainable personalization, WCAG 2.2 AA.
- **North America:** bounded community governance, family/teen safety, ranking explanations, appeals, multilingual and remote modes.
- **South America:** low-data community publishing, transparent creator support, regional language/culture packs, provider independence.
- **Oceania:** store-and-forward, local cache, emergency-safe mode, community stewards, language-preservation workflows.
- **Antarctica:** operational community pack, asynchronous sync, strict priority queues, compact media, verified station roles; no fictional consumer-country model.

## Universal release requirements

1. Low-data and degraded operation: text-first rendering, quality controls, resumable uploads, offline drafts, store-and-forward, compact audio, visible sync state.
2. Multilingual and multi-script equality: local scripts, transliteration, Universal Acceptance, original-content preservation.
3. Safety by design: age-adaptive defaults, limited discovery, message requests, anti-grooming / anti-sextortion controls, guardian support with appropriate autonomy, escalation and appeals.
4. Accessibility: WCAG 2.2 AA, captions, transcripts, screen-reader semantics, keyboard operation, contrast, reduced motion, scalable text, cognitive simplicity.
5. Privacy truth: E2EE private chat, managed institutional messaging and public social content must remain distinct and truthfully labelled.
6. User-controlled discovery: chronological/neutral public default; personalization optional, explainable and resettable.
7. Community governance with platform accountability: local rules may not override law, security, identity, billing or trust truth.
8. Anti-scam/authenticity: new-contact friction, verified organization roles, suspicious-link warnings, impersonation response and recovery.
9. Crisis separation: Social may distribute verified Pulse/SOS signals but does not own emergency truth.
10. Economic sustainability without pay-to-truth.

## Interoperability decisions

### Adopt as provider-neutral patterns

- ActivityPub interoperability boundary.
- Matrix federated/realtime concepts and compliance testing references.
- AT Protocol portability / signed-repository / relay / labeler concepts only after isolated tests.
- Signal-style message requests, minimal metadata and verifiable E2EE patterns subject to legal/cryptographic review.
- Carrier-neutral low-data mode inspired by zero-rated/reverse-billed access patterns.
- QR connection, service discovery, trusted organization channels and creator surfaces as provider-neutral capabilities.
- Layered community moderation and delegated roles subordinate to Pantavion global policy and law.

### Test in isolation

Mastodon/ActivityPub implementation, AT Protocol reference implementation, Session/Jami/Delta Chat protocol or UX ideas. No dependency becomes canonical until moderation, deletion, jurisdiction, security and operating-cost tests pass.

### Avoid strategic dependency

Patterns from services that are proprietary, closing, maintenance-only or discontinued may be retained as lessons, but not adopted as Pantavion core dependencies.

## Kernel ownership boundaries

### Social owns

Posts, comments, reactions, reshares, circles, communities, memberships, community roles, public/follower visibility, social discovery, feed candidates, community governance, reports, moderation cases, creator publishing, sponsorship labels, provenance, revisions, deletion tombstones and appeal state.

### Social does not own

- identity / relationship truth — People/Identity;
- private message encryption or message truth — Chat;
- calls / realtime media sessions — Voice;
- verified awareness/emergency truth — Pulse/SOS;
- licensed editorial packages — Media;
- business catalogs/payments/entitlements — Business/Billing;
- translation truth — Interpreter/Bridge.

Private Chat messages must never become Social entities. Social may store only an opaque permitted reference when a user explicitly shares content.

## CountryPack contract

Every country/territory is configuration, never a forked product. Canonical contract:

```text
CountryPack
  country_code, subdivision_codes, effective_from, version
  official_and_supported_languages[], scripts[], direction
  local_date_time_rules, transliteration_rules
  connectivity_profile, low_data_defaults, offline_policy
  age_bands, consent_rules, guardian_rules
  privacy_and_residency_rules, retention_overrides
  illegal_content_categories, notice_and_appeal_routes
  emergency_authorities[], verified_institution_types[]
  ranking_constraints, civic_content_guarantees
  advertising_constraints, political_ad_rules
  accessibility_requirements
  source_and_reviewer_provenance[]
  status = draft | reviewed | approved | suspended
```

Country packs are signed/versioned/reviewed. They may configure lawful behaviour but may not weaken global security invariants, fabricate political status, disable audit or make payment change verified truth.

## Canonical Social entities

`SocialSpace`, `Community`, `CommunityRuleSet`, `Membership`, `CommunityRole`, `Post`, `PostRevision`, `Comment`, `Reaction`, `ShareReference`, `AttachmentReference`, `VisibilityPolicy`, `AudienceSnapshot`, `ConsentGrant`, `Block`, `Mute`, `Report`, `ModerationCase`, `ModerationDecision`, `Appeal`, `SafetySignal`, `FeedCandidate`, `RankingDecision`, `RankingExplanation`, `UserFeedPreference`, `CreatorProfile`, `SponsorshipDisclosure`, `MonetizationEntitlement`, `CountryPack`, `LanguagePack`, `PolicyVersion`, `JurisdictionDecision`.

Cross-kernel references only: `IdentityRef`, `RelationshipRef`, `ConversationRef`, `PulseSignalRef`, `MediaAssetRef`, `TranslationRef`.

## Command model

Every authoritative Social command requires an idempotency key. Failed policy checks must not create partial canonical writes. Retries are bounded/audited and untrusted content is isolated from AI tooling.

Core command/event pairs:

- `CreatePost` → `PostCreated`
- `PublishPost` → `PostPublished`
- `JoinCommunity` → `CommunityMemberJoined`
- `ReportContent` → `ContentReported`
- `DecideModerationCase` → `ModerationDecisionRecorded`
- appeal workflow → `ModerationAppealOpened`
- `GenerateFeed` → `FeedDecisionLogged`
- `DeletePost` → `PostDeletionRequested` / `PostDeleted`
- `TranslatePost` → `PostTranslationAttached`

## Feed invariants

```text
eligible = policy_allow × audience_allow × safety_allow × block_allow
public_default = eligible × chronological_order
optional_personalized = eligible × bounded(relevance + community_fit + declared_preference)
                      × trust_floor × discussion_health × anti_spam
```

No payment/sponsorship multiplier may affect verification or civic importance. No inferred sensitive-trait targeting. No engagement-only optimization for minors. Personalized items need a concise explanation and reset control. Chronological mode must remain available. Corrections, retractions and verified emergency items propagate independently of engagement preference.

## Required acceptance suite

- ISO country/area entries alphabetical in selected UI language.
- Greek, Latin, Cyrillic, Arabic, Han, Indic and RTL rendering/search.
- deterministic/auditable local dates, consent and policy versions.
- constrained-network low-data mode and interrupted upload recovery.
- offline queues must not duplicate posts after reconnection.
- private Chat content never enters Social index/ranking.
- public/followers/community/private scopes truthfully labelled.
- minors safe defaults; targeted ads/adult discovery blocked where required.
- block/mute/report propagation across discovery without leaking private reasons.
- community moderation cannot override law/security/age/trust invariants.
- chronological mode has no hidden personalization.
- sponsorship cannot affect verification or civic/correction priority.
- translations/narration retain original content and labels.
- moderation decisions expose evidence, policy version, reason and appeal path.
- WCAG 2.2 AA, captions, transcripts, keyboard and screen-reader gates.
- Antarctica/degraded pack prioritizes operational/emergency queues over social uploads.

## Research coverage truth

The original research described a 249-entry ISO country/area scaffold and first deep/partial representative batches. Any row lacking country-specific evidence remains **Missing** and must not be represented as completed.

Priority sequence from the recovered pack: Cyprus/Greece; China/India; Nigeria/South Africa/Kenya/DR Congo; Brazil/Mexico/Colombia; Japan/Republic of Korea/Viet Nam/Indonesia/Philippines; Australia/Papua New Guinea/Fiji/Antarctica; then remaining countries by risk, population, language gap, launch dependency and evidence availability.

## Cyprus/Greece sandbox evidence from source pack

The supplied source states that a separate local sandbox had a 249-entry selector, reviewed Cyprus/Greece packs, pending state for the other 247 entries, scoped GDPR digital-consent handling (14 Cyprus, 15 Greece when consent is the applicable legal basis for the covered child-facing information-society service), deterministic country-policy validation/audit, Social/Chat/SOS boundaries, low-data/offline and neutral-feed rules, 12 unit tests, passing TypeScript/build and local health. That sandbox was explicitly **not merged/deployed** into `pantavion-planet` at the time of the pack.

This recovery document preserves that evidence boundary. The sandbox implementation itself is not claimed recovered until matching source/code is found and reconciled.