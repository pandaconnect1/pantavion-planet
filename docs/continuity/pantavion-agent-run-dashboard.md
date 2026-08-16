# Pantavion Agent Run Dashboard

Patch 14 adds a read-only dashboard/API for the controlled agent runtime.

## Routes

- `/api/pantavion/agents/runtime/dashboard`
- `/pantavion/agents/dashboard`

## Reads

- `.pantavion/agent-runtime/safe-patch-loop-report.json`
- `.pantavion/agent-runtime/supervisor-report.json`
- `.pantavion/agent-runtime/selected-implementation-slice.json`
- `.pantavion/agent-runtime/state.json`
- `data/pantavion-safe-patches/last-safe-patch-receipt.json`

## Safety

This dashboard is read-only. It does not commit, push, deploy, mutate secrets, mutate DWG/source truth, or bypass founder approval.

Missing runtime files are shown as missing instead of being faked.
