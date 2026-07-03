# Pantavion Agent Contract

Pantavion agents are governed runtime workers, not uncontrolled autonomous actors.

## Mandatory rules

- No fake/static/UI-only capability may be presented as implemented.
- Every implemented capability must have real route, real logic, real state/data flow, audit, and verification gate.
- No `git add .`.
- No blind global replacements.
- No source-truth DWG edits.
- No auth, billing, data, legal, production, infrastructure, security, or private-source change without founder approval.
- No merge or deployment unless build, TypeScript, and Pantavion audit gates are green.

## Required action envelope

Every agent action must declare:

- scope
- authority
- risk class
- touched files/routes
- adapter status
- audit record
- founder approval requirement

## Runtime status labels

- supported
- beta
- internal
- requires_adapter
- restricted
- blocked

## Sensitive approval classes

Founder approval is mandatory for:

- auth
- billing
- production deploy
- infrastructure
- user data
- private data
- security
- legal/compliance
- DWG/source-truth
- provider keys/secrets
- destructive repository changes
