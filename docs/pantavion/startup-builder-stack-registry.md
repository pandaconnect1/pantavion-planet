# Pantavion PATCH 8G - Startup Builder Stack Registry

Status: internal foundation

This patch defines the canonical Startup Builder / Company OS stack registry for Pantavion.

Locked rules:

- No fake/static/UI-only startup builder capability.
- Every capability must declare status, provider/adapter state, risk zone, audit, and execution gates.
- Code, repo, CI/CD, deploy, infrastructure, auth, billing, legal, secrets, analytics, source-truth, provider integration, external messaging, and production actions require founder approval.
- Code-changing actions require repo safety gate and green checks.
- External provider capabilities must be marked provider_required or requires_adapter until real integration exists.

Runtime surface:

- GET /api/kernel/startup-builder-stack
- POST /api/kernel/startup-builder-stack

POST body example:

{
  "capabilityId": "code_writer_runtime",
  "domain": "coding",
  "actionClass": "write_code",
  "touchesRepo": true,
  "founderApproved": false
}

Audit file:

data/kernel/startup-builder-stack-audit.jsonl
