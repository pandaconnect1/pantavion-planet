# Pantavion Sovereign Technology Factory — Disconnected / Edge Execution Boundary v1

## Purpose

Define a deterministic, fail-closed boundary for disconnected and edge execution. This document is informational and non-authorizing.

## Allowed execution class

Disconnected execution may proceed only when all conditions hold:

- the task is deterministic;
- the task is reversible;
- the task does not require network access;
- the task does not write production data;
- the capability is explicitly allow-listed;
- the payload remains within the declared byte limit;
- issue and expiry timestamps are valid;
- the packet digest verifies exactly;
- the packet has not already been consumed.

## Required denial conditions

Execution must fail closed when any of the following is present:

- network-required work;
- production mutation or irreversible side effects;
- unknown or expired capability;
- malformed timestamps or packet identity;
- payload size overflow;
- non-finite numeric payload values;
- digest mismatch;
- replay of a consumed packet;
- task not yet valid or already expired.

## Deterministic packet boundary

Each packet must carry:

- version identifier;
- task identity and intent identity;
- explicit capability;
- canonical payload;
- SHA-256 payload digest;
- disconnected execution mode;
- issued-at and expires-at timestamps.

Canonicalization must sort object keys recursively and preserve array order. Any equivalent input must produce the same digest; any tampering must change the digest.

## Authority and safety gates

This boundary does not authorize:

- owner admission;
- production or Supabase mutation;
- public release;
- external technology authorization;
- agent activation;
- lifecycle promotion;
- bypass of privacy, legal, security, rollback, or consent controls.

Disconnected execution is therefore a bounded execution mechanism, not a release or governance mechanism.

## Evidence required for lifecycle progression

For any transition beyond `CODED`, record:

- exact commit SHA;
- exact workflow run identifiers and conclusions;
- verification timestamp;
- test scope and result;
- packet-policy fixtures used;
- blocker status;
- explicit confirmation that authority gates remained closed.

The canonical lifecycle remains:

`IDEA -> CODED -> TESTED -> MERGED -> DEPLOYED -> VERIFIED_LIVE`

No state may be skipped or inferred from preview availability.
