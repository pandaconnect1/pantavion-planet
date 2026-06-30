# Pantavion PATCH 8E — Founder Approval Board

Status: internal foundation

This patch defines the canonical founder approval board for Pantavion Z3/Z4 actions.

Protected actions:

- DWG/source-truth actions
- CAD/GIS conversion or viewer actions
- secret/token/key/env access
- auth, identity, user access, session, OTP, and profile actions
- billing, payment, subscription, invoice, and finance actions
- production deploy and infrastructure actions
- legal, compliance, terms, privacy, and contract actions
- backup, restore, archive, dump, and snapshot actions
- security-sensitive, repo, CI/CD, provider cloud upload, and data-changing actions

Runtime surface:

- GET /api/kernel/founder-approval-board
- POST /api/kernel/founder-approval-board
- PATCH /api/kernel/founder-approval-board

Rules:

- Z3/Z4 actions require founder approval before execution.
- Approval does not bypass build, typecheck, kernel, audit, scoped git add, or deploy guardrails.
- Approval is scoped to the requested action only.
- Rejected, cancelled, expired, or missing approvals must block execution.

State file:

data/kernel/founder-approval-board.json

Audit file:

data/kernel/founder-approval-board-audit.jsonl
