# Pantavion Dating — Detailed Recovered Findings

Date: 2026-08-23  
Status: DEEPLY_ANALYZED — NOT VERIFIED LIVE  
Corpus baseline: 82,413 records  
Initial semantic hits: 266 references; these are references, not 266 unique Dating capabilities.

## Important counting rule

The same source line can appear multiple times under different recovery families such as founder vision, unfinished gap, current code, donor and recovery. These are preserved provenance views, not automatically separate features. They must be grouped by source identity and capability before implementation counting.

Examples:

- `app/listings/[listingId]/page.tsx:24` appears as founder-vision, unfinished-gap and current-code evidence.
- `docs/recovery/social-people-chat-full-excavation-20260815.md:67` appears across several source families.
- `app/api/people/relationships/route.ts:6` appears across several source families.

## What is actually recovered

### 1. Shared People relationship API — real code exists

Source: `app/api/people/relationships/route.ts`

Implemented evidence:

- authenticated relationship listing through GET;
- relationship request creation through POST;
- accept/decline response through PATCH;
- Supabase `relationships` table access;
- RPC calls `pantavion_request_relationship` and `pantavion_respond_relationship`;
- authentication-required responses;
- error responses for unavailable relationships or invalid requests.

Truth:

This is a shared human-relationship graph. It supports a Dating foundation but is not itself a complete Dating system. It does not yet prove romantic intent, matching, eligibility, compatibility or Dating-specific safety.

### 2. Relationship-gated direct Chat from listings — real code exists

Source: `app/listings/[listingId]/page.tsx`

Implemented evidence:

- authenticated user may request a relationship with a listing owner;
- an accepted relationship can open a direct conversation;
- existing pending/accepted relationship state is checked;
- contact remains inside Pantavion unless another approved contact method is explicitly exposed.

Truth:

This proves reusable People → relationship → Chat integration. The context is marketplace/listings, not dedicated Dating. The same pattern can be reused after Dating-specific consent and policy gates are added.

### 3. Romantic social context — database design exists

Source: `supabase/migrations/20260811050000_create_social_flagship_core.sql`

Implemented/design evidence:

- `social_posts.context` explicitly permits `romantic`;
- shared posts, photo/video/audio/file media, reactions and comments;
- public/connections/private visibility;
- shared relationship graph;
- location sharing with audience, expiry and revoke-capable state;
- Row Level Security policies on posts, media, reactions, comments and location shares.

Truth:

This provides a concrete romantic-context data foundation with privacy controls. It does not yet prove a dedicated Dating feed, mutual matching, adult gating or live production deployment.

### 4. Dating as a context world — explicit recovery plan exists

Source: `docs/recovery/social-people-chat-full-excavation-20260815.md`

Recovered design:

- Communities, Professional, Business, Learning, Dating and Elite should reuse the shared relationship graph;
- each context must apply age, privacy and trust policy;
- routes must not be exposed until backend and policy tests pass;
- People → Chat → translation → Social requires real multi-account testing;
- secure messaging must not be labeled E2EE without cryptographic proof.

Truth:

Dating is deliberately designed as an integrated context, not a duplicate isolated application. The document also explicitly says it is not ready to expose before policy/backend testing.

### 5. Restricted Adult Connect policy surface — explicit design exists

Source: `core/public/pantavion-public-surfaces.ts`

Recovered design:

- future restricted 18+ private social and relationship zone;
- verified-adult access;
- strict separation from minors and protected youth experiences;
- country-specific legality, consent, privacy, safety and moderation;
- separate payment-provider/legal review;
- explicit statement that it is a policy foundation, not an active adult marketplace;
- no adult recommendations, advertising or content leakage to minors.

Truth:

This is a safety/legal product specification and public policy surface. It is not a working adult or Dating marketplace.

### 6. Age-aware access model — explicit foundation exists

Source: `core/pantavion/pantavion-access-model.ts`

Recovered design:

- access governed by identity, age, consent, risk, payment, verification, jurisdiction and capability;
- minor class blocks adult and unmoderated Dating;
- `adult_verified` class exists for a future legally reviewed restricted lane;
- adult monetization is separated from Stripe-first products pending review;
- sensitive capabilities require audit, jurisdiction and escalation.

Truth:

This is a strong reusable governance foundation. Runtime enforcement and production proof still require verification.

## What is not yet evidenced as complete

The reviewed sources do not yet prove complete implementations for:

- dedicated Dating onboarding and explicit romantic-intent consent;
- jurisdiction-aware minimum-age and adult-verification runtime;
- orientation, identity and preference controls with privacy;
- discovery and recommendation rules;
- mutual matching;
- compatibility model with explainability and user controls;
- distance/location privacy suitable for Dating;
- request, accept, decline, unmatch and revoke flows specific to Dating;
- anti-harassment, stalking, coercion, scam and impersonation defenses;
- photo/profile verification;
- Dating-specific report, block, appeal and moderation queues;
- minors isolation tested end to end;
- live translation and cultural-context assistance inside Dating Chat;
- region/country availability matrix;
- data retention and deletion rules for sensitive Dating data;
- production deployment, monitoring and dated end-to-end evidence.

## Canonical unification decision

Do not create a second identity, People graph or Chat stack.

Dating should reuse:

- Identity/Auth/Consent;
- verified age/access classes;
- People profiles and shared relationship graph;
- Chat, Voice/Video and Interpreter;
- Safety/Trust/Minors;
- location privacy;
- audit and observability.

Dating adds a bounded context layer:

- romantic-intent consent;
- eligibility and regional policy;
- preference and discovery controls;
- mutual match state;
- Dating-specific safety and moderation;
- cultural and language context;
- reversible exits, unmatch and data controls.

## Current truth state

- recovered Dating-related design: YES
- reusable relationship backend: YES, code present
- romantic social schema: YES, code/migration present
- age/safety policy foundation: YES
- dedicated complete Dating product: NO
- tested in production: NOT PROVEN
- VERIFIED_LIVE: NO
- deletion allowed: NO

## Next evidence work

1. Deduplicate the 266 references by source identity and capability while preserving every provenance link.
2. Trace the exact database migration and runtime deployment status for relationships and romantic context.
3. Build the Dating capability ledger with one row per unique capability.
4. Perform international research for Dating laws, safety, age, privacy and cultural expectations by region.
5. Define the smallest safe end-to-end slice: verified eligible adult → explicit Dating consent → profile/preferences → mutual match → guarded Chat → report/block/unmatch.
6. Implement, test and capture dated evidence before any completion or grant claim.
