# Pantavion Sovereign Technology Factory — Execution Contract v1

Status: CODED

## Purpose

This contract defines the minimum deterministic boundary for progressing a Sovereign Technology Factory work item from an accepted intent to a reviewable outcome without authorizing runtime activation, production mutation, external technology use, or owner admission.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only adjacent transitions are valid. Missing, stale, contradictory, or unverifiable evidence forces `HOLD`.

## Required envelope

Every work item must carry:

- immutable `intent_id` and `work_item_id`
- repository, branch, base SHA, head SHA, and changed-file inventory
- declared workstream and risk class
- deterministic outcome plan with explicit non-goals
- capability, budget, expiry, replay, and rollback constraints
- owner/legal/privacy/security gate results
- evidence references for each claimed lifecycle transition

## Workstream gates

### Intent-to-Outcome Fabric

The intent must be normalized, bounded, and mapped to a reversible outcome plan. Ambiguous or irreversible outcomes remain `HOLD`.

### Intent Firewall

The firewall must classify the intent and return `ALLOW_REVIEW_ONLY`, `OWNER_APPROVAL_REQUIRED`, or `DENY`. No execution follows from classification alone.

### Agent Capability/Budget Control

Capabilities, duration, steps, retries, cost, and cumulative budget must be bounded before any agent envelope is created. Expired or exceeded budgets deny continuation.

### Ephemeral Agent Swarm

Creation and activation are separate. Fan-out requires inherited scope, aggregate budget enforcement, expiry propagation, duplicate-intent protection, and deterministic aggregation evidence.

### Disconnected/edge execution

Only deterministic, bounded, reversible work may run disconnected. Packets require integrity, timestamp, expiry, replay protection, and explicit no-production-write constraints.

### Owner Control integration

Owner approval must be exact-scope, time-bounded, revocable, and revalidated after reconnect. Approval never widens capabilities or bypasses safety, privacy, legal, or security gates.

### Technology Library

A technology entry is non-authorizing metadata until provenance, license, compatibility, security, privacy, legal, and drift checks are evidenced. Unknown or stale entries remain quarantined.

### Visible implementation-status surface

Status projection is read-only and must expose exact evidence anchors, blocker/HOLD state, current lifecycle state, next permitted transition, and explicit negative authorization assertions.

## Evidence minimums

`CODED -> TESTED` requires exact-head build/type/test/security evidence.

`TESTED -> MERGED` requires review/approval evidence and a mergeable exact head.

`MERGED -> DEPLOYED` requires an approved deployment record and environment identity.

`DEPLOYED -> VERIFIED_LIVE` requires live endpoint/route verification, timestamp, environment identity, and rollback reference.

## Explicit non-authorizations

This contract does not authorize:

- production or Supabase data mutation
- deployment or public release
- owner admission
- external technology authorization
- agent activation
- force-push or bypass of repository protections

## Deterministic truth rule

A claim is valid only when its evidence names the exact object, exact commit or environment, exact timestamp, and exact check result. Otherwise the state remains `HOLD`.
