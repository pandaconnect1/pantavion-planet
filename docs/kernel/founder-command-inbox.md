# Pantavion Founder Command Inbox

Status: internal / real backend state / no production execution by itself.

Real flow:

- Founder writes instruction
- Command is persisted in kernel state
- Safety zone is classified
- Audit record is written
- Implementation/evolution plan is returned
- Z1/Z2 may later become controlled PRs
- Z3/Z4 require founder approval

Implemented files:

- app/kernel/founder-command/page.tsx
- app/api/kernel/founder-command/route.ts
- app/api/kernel/founder-command/[commandId]/route.ts
- core/kernel/founder-command.ts
- core/kernel/founder-command-store.ts

No fake capabilities:

- No production deployment is performed.
- No water/DWG source is touched.
- No secrets are read or written.
- No user/auth/billing/database mutation is executed.
- Voice command is intentionally not exposed until a real voice route/provider exists.
