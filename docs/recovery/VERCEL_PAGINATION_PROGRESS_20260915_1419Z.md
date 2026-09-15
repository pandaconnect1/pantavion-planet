# Vercel pagination checkpoint — 2026-09-15 14:19Z

Mode: preservation only. Zero deletions. No secret values recorded.

## Batch completed
- canonical `pantavion-planet`: 3 full pages x 20 = 60 deployment records
- vmxx `pantavion-planet-vmxx`: 3 full pages x 20 = 60 deployment records
- total this batch: 120 deployment records
- all six pages returned `count=20`; both histories remain OPEN and are not terminal

## Cursor movement
Canonical:
- `1787625799458` -> `1787613724688`
- `1787613724688` -> `1787597096545`
- `1787597096545` -> `1787582483810`

vmxx:
- `1787625799487` -> `1787613724563`
- `1787613724563` -> `1787597096545`
- `1787597096545` -> `1787582483561`

Continue from:
- canonical `until=1787582483810`
- vmxx `until=1787582483561`

## Notable provenance surfaced in this batch
Historical deployment evidence only; READY/production does not by itself equal current VERIFIED_LIVE.

- PR #291 / Personal AI Runtime v1: secure per-user runtime schema, authenticated execute/state APIs, user-controlled memory, notes/dates/reminders/tasks, relationship-aware context, authenticated `/my-ai` surface, DB truth hardening, handoff binding, and production merge commit `0c36f17dd444b0978df0388f4d7c069d65076302`.
- PR #292 / Personal AI advanced memory v2: context capsule, memory-health engine/UI, authenticated context handoff and memory health, memory supersession ownership hardening; production merge `bf6a1201fa62655146212185373513e6adddd34c`.
- PR #293 / Personal AI multimodal OIDC v3: OIDC multimodal runtime, real image/PDF input panel, multimodal analysis surface, runtime gate.
- PR #287 / Foundry: control-plane rebase and production integration `c63532a6cb7e8564204b1145851ebc658d0e12f8`.
- PR #288 / bidirectional translation production gate: branch evidence `6776bb4a8e3f7faf3e12c2682da716fccb33d224`; production verification commit `49682c8915c2cded6d0d647af56115e8d9d19e1c`.
- Donor-preservation evidence: Pantaai donor main tree, four donor repository trees, `pantavion-one-clean-ui`, and `pantavion-voice` snapshots preserved through historical recovery branches.
- CI/promotion safeguards: explicit production promotion approval, pinned Vercel CLI, locked Node 22 quality gates.

## Safety / preservation status
- no project, deployment, branch, or evidence deleted
- no secret values exposed or committed
- this checkpoint records metadata/provenance only
- deep pagination remains incomplete until an empty terminal page/no older deployments is verified for both projects
