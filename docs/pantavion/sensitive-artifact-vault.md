# Pantavion PATCH 8D — Sensitive Artifact Vault

Status: internal foundation

This patch defines the canonical sensitive artifact vault for Pantavion.

Protected artifact classes:

- DWG/CAD/source-truth files
- CAD/GIS derivative files
- secrets, tokens, keys, credentials, and env files
- production and deployment configs
- legal, contract, compliance, terms, and privacy documents
- auth, identity, session, OTP, profile, and user data
- billing, payment, invoice, finance, and subscription data
- backups, dumps, restore points, archives, and snapshots

Locked rules:

- Original source-truth artifacts are read-only and immutable by default.
- Secrets must never be exposed to prompts, logs, client routes, public CI, GitHub issues, or PR text.
- Production, infrastructure, auth, billing, legal, backup, restore, data-changing, security, and source-truth actions require founder approval.
- Automatic runtime may plan and assess, but must not execute sensitive mutations without approval gates.

Runtime surface:

- GET /api/kernel/sensitive-artifact-vault
- POST /api/kernel/sensitive-artifact-vault

POST body example:

{
  "path": "data/water-network-private/master/GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "operation": "render",
  "sourceTruth": true,
  "production": false,
  "founderApproved": false
}

Audit file:

data/kernel/sensitive-artifact-vault-audit.jsonl
