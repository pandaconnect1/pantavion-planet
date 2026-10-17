# Pantavion Sovereign Technology Factory — Verification Runbook v1

Status: CODED
Authority: documentation-only, fail-closed

## Purpose

This runbook defines the minimum evidence needed to advance a Sovereign Technology Factory workstream without confusing repository, preview, production, or live truth.

## Canonical lifecycle

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

Only one adjacent transition may be recorded per verification event. A later state must never be inferred from a preview badge, a passing local check, or a prior commit.

## Verification packet

Every transition packet must bind:

- repository and base branch;
- exact commit SHA and changed-file list;
- workflow run IDs, status, conclusion, and timestamps;
- build/type/test/security results relevant to the change;
- deployment target and environment, when applicable;
- live URL and observed response evidence, when applicable;
- blocker, hold, and owner-gate fields;
- negative authorization assertions.

## Workstream evidence gates

### Intent-to-Outcome Fabric

Require deterministic intent identity, validated plan invariants, bounded cost/approval decisions, and tests for deny/hold paths.

### Ephemeral Agent Swarm

Require immutable agent envelope, scope inheritance, expiry, replay protection, aggregate budget limits, and activation distinct from creation.

### Disconnected / edge execution

Require deterministic and reversible task constraints, packet digest verification, replay rejection, no production writes, and expiry enforcement.

### Intent Firewall

Require explicit allow / owner-approval / deny outcomes, identity and capability checks, consent/privacy/legal gates, and deterministic decision evidence.

### Agent Capability / Budget Control

Require scoped capability authorization, expiry, bounded duration/steps/retries/cost, cumulative spend accounting, and write-scope separation.

### Owner Control integration

Require exact-scope approval, expiry/revocation semantics, disconnected revalidation, and evidence that no approval is inferred from intent alone.

### Technology Library

Require provenance, source/license evidence, security/privacy review state, deterministic readiness, drift invalidation, and explicit non-authorization of deployment.

### Visible implementation-status surface

Require read-only projection, exact evidence anchors, preview/live separation, HOLD on missing or contradictory evidence, and no mutation authority.

### Canonical recovery / classification

Require loss-preserving intake, raw/normalized retention, deterministic batch identity, provenance, non-destructive duplicate linking, conflict quarantine, and exact source evidence.

## Mandatory negative assertions

Unless separately authorized and independently evidenced, the packet must state:

- merge not performed;
- production deployment not performed;
- production/Supabase mutation not performed;
- owner admission not granted;
- external technology authorization not granted;
- public release not performed;
- force-push not performed;
- agent activation not performed.

## HOLD conditions

Set lifecycle state to `HOLD` outside the canonical progression when any of the following is true:

- exact head cannot be established;
- required workflow evidence is missing, stale, or contradictory;
- preview evidence is being used as live evidence;
- owner, legal, privacy, or security gate is unresolved;
- evidence does not cover the changed scope;
- a replay, tamper, expiry, or budget boundary is unverified.

## Review rule

A documentation-only change can advance to `TESTED` only after exact-head repository checks and applicable CI evidence are recorded. It cannot advance to `MERGED`, `DEPLOYED`, or `VERIFIED_LIVE` by automation alone.
