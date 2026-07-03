# Pantavion Agent Supervisor

Patch 9 adds the first work-order executor supervisor.

## Purpose

The supervisor reads the implementation slices generated from Founder Doctrine, Canonical Archive and Code Writer planning.

It selects the next safe implementation slice and separates:

- safe Z1/Z2 internal work
- founder approval queue
- blocked/destructive actions
- target files
- required checks

## Implemented

- `npm run agent:supervisor`
- `npm run audit:agent-supervisor`
- `/api/pantavion/agents/runtime/supervisor`
- local runtime report:
  - `.pantavion/agent-runtime/supervisor-report.json`
  - `.pantavion/agent-runtime/selected-implementation-slice.json`

## Safety

The supervisor does not mutate source code.
The supervisor does not commit.
The supervisor does not push.
The supervisor does not deploy.

Patch 10 may add a Safe Patch Writer, but only for selected Z1/Z2 slices and only with scoped files and green checks.
