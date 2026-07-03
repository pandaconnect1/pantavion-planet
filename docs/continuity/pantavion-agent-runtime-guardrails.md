# Pantavion Agent Runtime Guardrails

This patch establishes the first canonical Pantavion agent runtime guardrail layer.

## What is implemented

- Root `AGENTS.md` contract.
- Provider registry with supported/internal/requires_adapter status labels.
- Protocol fabric registry for MCP, A2A, and repo trace audit.
- Sensitive-change classifier.
- Runtime status route.
- Repo safety scan route.
- Founder approval request route.
- Filesystem JSONL audit record for local/internal runtime.
- Audit gate script.

## Routes

- `GET /api/pantavion/agents/runtime/status`
- `POST /api/pantavion/agents/runtime/scan`
- `POST /api/pantavion/agents/runtime/approval`

## Runtime truth

This is an internal runtime foundation. It is not a public claim of full autonomous execution.

Production execution still requires:

- durable database
- auth and role model
- queue
- provider adapters
- budget guard
- deployment guard
- monitoring
- founder approval dashboard

## Sensitive changes

Founder approval is mandatory for:

- legal/compliance
- auth
- billing
- production
- infrastructure
- security
- user data
- private data
- DWG/source-truth
- provider keys/secrets
- destructive repository changes

## Merge requirements

Before merge or deployment:

- `npm run build`
- `npx tsc --noEmit --pretty false`
- `npm run audit:agent-runtime`
- scoped git add only
- human-readable diff summary
- founder approval for sensitive changes
