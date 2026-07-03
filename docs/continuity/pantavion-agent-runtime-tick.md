# Pantavion Agent Runtime Tick

This patch adds the first local autonomous tick layer for Pantavion agents.

## Implemented

- `GET /api/pantavion/agents/runtime/tick`
- `POST /api/pantavion/agents/runtime/tick`
- `npm run agent:tick`
- `npm run agent:daemon`
- `.pantavion/agent-runtime/state.json`
- `.pantavion/agent-runtime/audit.jsonl`
- `npm run audit:agent-tick`

## Runtime truth

This is local/internal runtime. It can tick, update local state, and append audit records.

It is not yet a cloud 24/7 autonomous worker.

Cloud scheduling requires:

- founder approval
- auth and role access
- durable database
- job queue
- monitoring
- provider adapters
- budget guard
- deployment approval

## Safety

The daemon is bounded by default. It runs a limited number of ticks unless explicitly configured.

No repo write, deployment, provider call, DWG/source-truth action, auth change, billing change, or production change is performed by this tick.
