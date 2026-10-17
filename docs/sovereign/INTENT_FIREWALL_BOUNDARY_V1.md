# Intent Firewall Boundary v1

**Lifecycle state:** `CODED`

## Purpose

The Intent Firewall is a deterministic, fail-closed admission boundary between an expressed intent and any proposed execution plan. It classifies the request, checks authority and risk gates, and returns only one of:

- `allow_review_only`
- `owner_approval_required`
- `deny`

It does not itself execute tools, activate agents, mutate production data, publish externally, or authorize third-party technology.

## Canonical decision inputs

Every decision MUST bind to an immutable, auditable envelope containing:

- `intent_id`, `intent_digest`, `requested_by`, `issued_at`, and `expires_at`
- normalized intent class and requested outcome
- requested capabilities and scopes
- reversibility and rollback information
- network mode (`connected` or `disconnected`)
- data classification and privacy impact
- jurisdiction/legal flags
- estimated cost, duration, steps, retries, and fan-out
- proposed side effects and external recipients
- current lifecycle state and exact evidence references

Missing, malformed, expired, contradictory, or tampered inputs fail closed.

## Mandatory deny or escalate gates

The firewall MUST return `deny` or `owner_approval_required` when a proposal includes any of the following without separately verified authority and evidence:

- production or persistent-data mutation
- identity, access, permission, or billing changes
- external messaging or public release
- irreversible or non-reversible actions
- unbounded agent activation, fan-out, retries, or budget
- capability/scope mismatch, expired grant, or revoked authority
- privacy, safety, legal, jurisdiction, or consent uncertainty
- disconnected execution that requires network access or deferred side effects
- external technology use without recorded authorization and license evidence

## Determinism and replay safety

Equivalent canonical inputs MUST produce the same decision and normalized reason codes. The decision record MUST include a deterministic digest over the canonicalized envelope, decision ruleset version, and evidence references. Replaying the same envelope MUST not create new authority or side effects.

## Review-only allow path

`allow_review_only` is informational and non-authorizing. It may prepare a bounded, reversible plan for human review only. It MUST NOT be interpreted as permission to merge, deploy, activate an agent, contact an external party, or modify production state.

## Evidence requirements

A valid decision record MUST preserve:

1. exact input envelope and digest;
2. ruleset/version identifier;
3. evaluated gates and reason codes;
4. resulting decision;
5. blocker or required owner action, when applicable;
6. timestamp, evaluator identity, and lifecycle state;
7. links to exact commit/workflow/test evidence when a lifecycle transition is claimed.

Stale, missing, or conflicting evidence forces `HOLD` at the lifecycle layer and prevents promotion.

## Explicit non-authorizing boundary

This document is a design contract only. It does not grant owner admission, production access, public-release authority, external-technology authorization, agent activation, or permission to bypass privacy, legal, security, consent, rollback, or repository review gates.

## Next transition test plan

Before this boundary can move from `CODED` to `TESTED`, exact-head checks MUST cover:

- deterministic equivalence and digest stability;
- malformed, expired, contradictory, and tampered envelopes;
- production-write, identity/access, external-message, and irreversible-action denial;
- owner-approval escalation for bounded but sensitive work;
- disconnected/network-required rejection;
- capability, scope, consent, privacy, legal, and jurisdiction failures;
- replay safety and non-authorizing review-only behavior.
