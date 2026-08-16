# Pantavion Legacy Source Intake

This module prevents old Pantavion work from being lost.

Old repos, old notes, old screenshots, old patch packs, old doctrine files and old agent-session material must not be raw-added blindly. They must be converted into:

- sanitized source intelligence
- manifest
- extracts
- work orders
- Kernel/Agent review material
- implementation queue

## Implemented

- `npm run agent:legacy-intake`
- `npm run audit:legacy-intake`
- `/api/pantavion/agents/runtime/legacy-intake`
- `data/pantavion-legacy-intake/legacy-source-manifest.json`
- `data/pantavion-legacy-intake/legacy-extracts.jsonl`
- `data/pantavion-legacy-intake/legacy-work-orders.json`

## Rules

- No raw old repo dump.
- No `git add .`.
- No secrets in committed extracts.
- DWG/DXF/CAD source-truth files are metadata-only.
- Every idea becomes a work order before implementation.
- Every implemented feature must later get route, state, audit and verification.
