# Pantavion Recovery → Personalized Section Allocation

Date: 2026-08-15
Canonical repository: `pandaconnect1/pantavion-planet`
Purpose: no verified recovered capability remains an unassigned orphan.

## Truth boundary

This allocation does **not** declare every recovered capability production-ready. It separates:
- `connected`: a current canonical route/runtime is connected in the repository;
- `building`: recovered implementation exists but still requires completion and/or live verification;
- `foundation`: recovered architecture/policy/data contract exists but is not a complete live user capability.

The final DONE gate remains:
`RECOVERED -> CANONICALIZED -> MERGED -> BACKEND_LIVE -> UI_LIVE -> TESTED -> DEPLOYED -> VERIFIED_LIVE`.

## Recovery datasets assigned to the Recovery / Continuity section

The following historical datasets are not user features; they feed the **PantaAI, Kernel & Συνέχεια → Evolution / Recovery Engine** lane:

- Source Inventory: `data/pantavion-source-inventory/inventory.json` — historical inventory evidence.
- Founder Vision Ingestion: `data/runtime-reports/latest-founder-vision-ingestion.json` — 13,801 historical findings, requiring deduplication/current-main comparison.
- Unfinished Plan Ingestion: `data/runtime-reports/latest-unfinished-plan-ingestion.json` — 11,360 historical findings, requiring rescan/current-main comparison.
- Recovery Snapshot: `PANTAVION_RECOVERY_SNAPSHOT_20260425-215458.txt` plus verified backup duplicate — historical provenance source.
- PR #165 Master Recovery ledger — provenance/control source, not wholesale merge target.

These queues are **assigned**, but their individual findings are not automatically considered canonical or live. Each finding must still be deduplicated and classified.

## Personalized product sections

### 1. Άνθρωποι & Social
Assigned recovery/provenance: #138, #166, #174, #175, #182, #189, #211.

Canonical capabilities:
- Profiles / People / requests / relationship graph
- Nearby with privacy-preserving distance
- Block / unblock
- Feed / posts / reactions / comments
- Personal-media attachments
- Social Map foundation
- Communities and relationship contexts: Family, Friends, Communities, Professional, Business, Learning, Dating, Elite Society

### 2. Επικοινωνία
Assigned recovery/provenance: #138, #146, #166, #172, #184, #211.

Canonical capabilities:
- Conversations / members / persistent messages
- Realtime subscription state
- Original-language messages and per-message translation
- Multi-user language fanout donor
- Secure / Elite chat readiness donor

Important truth: recovered secure-chat work does not prove E2EE/forward secrecy is implemented. It stays foundation until an audited protocol and key lifecycle exist.

### 3. Διερμηνέας & Γλώσσες
Assigned recovery/provenance: #140, #142, #143, #144, #145, #147-#162, #171, #180, #194-#196, #208-#210.

Canonical capabilities:
- Shared translation runtime
- Strict source/target routing
- Vercel AI Gateway/OIDC runtime path
- Mobile MediaRecorder capture and MIME normalization
- Server STT fallback
- Language hints and retry policy
- Accessibility normalization for stutter/repetition/articulation differences
- Two-speaker bidirectional Interpreter
- Script-first/model-fallback language detection
- Production health/readiness gate
- Current full-turn anti-stall recovery lane

Historical Interpreter UI from #143 is donor-only where newer current UI/runtime supersedes it.

### 4. Ο προσωπικός μου χώρος
Assigned recovery/provenance: #166, #173, #174, #183, #188, #197.

Canonical capabilities:
- Profile
- Contacts and consent-backed imports
- People linkage
- Messages linkage
- Private personal media
- Identity/profile separation direction

### 5. Ταυτότητα, Εμπιστοσύνη & Ασφάλεια
Assigned recovery/provenance: #188, #191, #197.

Canonical capabilities:
- Registration fields and consent
- Registration launch gate
- Private identity vs public profile separation
- Multiple phone/email identifier architecture
- Age/trust/security tiers
- Protected-account policy
- Founder / Trust & Safety control plane

Still gated: real passkey/security-key enrollment, liveness provider, guardian-consent completion, protected public-figure verification and live rollout evidence.

### 6. Business, Αγγελίες & Αγορά
Assigned recovery/provenance: #138, #164, #167, #168, #189.

Canonical capabilities:
- Business context inside unified Social
- Public listings lifecycle
- Jobs/events/marketplace data contracts
- Internal advertising / sales workflow donor
- Moderation-before-publication architecture

No external payment/provider readiness is inferred from these donors.

### 7. Media, Ειδήσεις & Γνώση
Assigned recovery/provenance: #168, #179, #189.

Canonical capabilities:
- Rights/provenance-aware media sources
- News/sports/radio/podcast/video/announcement content model
- Public media feed
- Knowledge Vault
- Evidence/Provenance Ledger
- Temporal Knowledge Graph
- Rights & Access Engine
- Search/index + live research separation
- Protected viewer architecture

Knowledge Vault remains foundation until schema/persistence/search/ingestion/viewer/tests/deploy/live verification are completed.

### 8. Κόσμος, Χώρες & Χάρτες
Assigned recovery/provenance: #174, #182, #207 plus protected Water sequence #89-#100.

Canonical capabilities:
- Global Connect country/area registry
- Social Map location sharing with expiry/revoke
- Emergency-location separation
- Professional Water / Infrastructure protected runtime
- Water administrator/users/access workflow
- Private range loading, runtime locks and regression gates

### 9. Safety, SOS & Ανθεκτικότητα
Assigned recovery/provenance: #130, #138, #143, #167, #190, #191.

Canonical capabilities:
- Trust & Safety operator surface
- Incident/health degradation model
- Redacted alerts foundation
- SOS architecture boundary
- Translation consumption by emergency flows where verified

External SMS/resilience transports are not marked live unless separately configured and verified.

### 10. PantaAI, Kernel & Συνέχεια
Assigned recovery/provenance: #71, #72, #73, #88, #165, #169, #170, #190, #196.

Canonical capabilities:
- Runtime safety gates
- Evolution registry
- Capability readiness / ecosystem signals
- Kernel donor runtime
- Durable Execution state machine / store contract
- Continuity Graph
- Decisions / provenance artifacts / recall bundles
- Guardian / AI integrity / translation integrity
- Production synchronization verification
- Recovery + Completion Engine intake

## Historical donors that are superseded, not lost

- #193 is superseded by merged #194; provenance retained.
- #209 is an incident-driven donor/precursor for #210; its live-test evidence remains useful, while implementation continues in #210.
- #184 remains donor provenance for the newer #211 recovery wave rather than a separate canonical endpoint.
- #164 is a donor shell; canonical consumer integration moved through #167/#182 and later work.
- #138 and #174 are donor mines; they must be selectively recovered, not merged wholesale over current main.
- #88 and #73 remain historical/core donors; newer merged runtime work must win whenever contracts overlap.

## No-orphan rule

Every newly recovered item must be recorded with:
1. provenance (PR/commit/path/snapshot),
2. recovery state,
3. decision,
4. canonical personalized section,
5. canonical target path/runtime,
6. live state,
7. blocker,
8. next action.

A recovered item may be archived or superseded, but it may not remain unclassified.

## Current implementation added by this wave

`core/personalization/pantavion-personalized-sections.ts` is the canonical code registry for these sections. `app/profile/ProfileClient.tsx` consumes it to create **Το Pantavion μου**, prioritizing the Interpreter for non-English profile languages and World/Maps when a country exists. Only entries with a current route are clickable; foundation-only recovered work is shown as non-clickable capability state so the UI does not create fake buttons.

This wave is an allocation + personalization implementation. It does not replace the module-specific completion/testing/deployment gates above.
