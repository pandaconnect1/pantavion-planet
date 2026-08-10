# Pantavion Backlog / Pending Work

This folder is the permanent holding area for incomplete, blocked, experimental, or partially implemented Pantavion work that must not be lost while production development continues.

## Status rules

Every unfinished item should be tracked with one of these states:

- `NEXT` — required soon after the current end-to-end production flow.
- `LATER` — valid work, intentionally deferred.
- `BLOCKED` — cannot continue until a dependency, provider, legal/compliance requirement, infrastructure change, or decision is resolved.
- `EXPERIMENTAL` — prototype/research work that is not production truth.
- `REVIEW` — existing code or UI exists but needs audit before it can be treated as live.

## Required fields per item

Each backlog item must record:

- Module / area
- Current state
- What already exists
- What is missing
- Dependencies / blockers
- Next concrete implementation step
- Production risk if exposed too early

## Current known pending areas

### Interpreter / Language Core — REVIEW

Existing voice, STT, translation and contextual normalization work is present, but the professional long-form interpreter is not complete. Pending work includes continuous/chunked recording, long-session persistence, autosave, folders/history, live transcript, speaker diarization, conference mode and stronger multi-provider routing.

### Social / Discovery — REVIEW

Existing Discovery, Communication and Unified Inbox foundations need to be connected into a real user flow with persisted actions, permissions, moderation and end-to-end tests.

### Business — REVIEW

Business-related foundations exist, but the consumer-facing business profile and lifecycle need a production audit and integration with discovery, listings and monetization.

### Listings / Ads / Marketplace — REVIEW

Advertise and marketplace taxonomy foundations exist. Pending work is to turn them into a real create → publish → discover → boost/promote → payment flow with moderation, persistence, billing and entitlement checks.

### Payments / Revenue — REVIEW

Pricing and Stripe-readiness foundations exist. Payments must not be treated as live until release gates, product/price mapping, webhook/idempotency handling, entitlement writes, receipts and failure recovery are confirmed.

### Pantavion 3D Identity — NEXT

Create a unique Pantavion One 3D emblem and visual identity system suitable for app icon, header, large-format use, animation and later sonic branding. It must be original and distinct from the PantaStudio turtle example.

### PantaStudio — LATER

Creative AI/media generation experience and its 3D visual language remain pending after the first revenue-producing Social/Business/Listings flow is live.

## Production rule

A feature is not considered complete because a page, component, route, schema or prototype exists. It is complete only when the user flow is usable, data is persisted canonically, permissions/trust rules are enforced, failures are handled, tests pass and the production deployment is verified.
