# Pantavion PATCH 8F — Repo / Agent Runtime Safety Gate

Status: internal foundation

This patch defines the canonical repo and agent-runtime safety gate for Pantavion.

Locked rules:

- No git add .
- No git add --all.
- Scoped git add only.
- No automatic execution from GitHub issue text, PR text, external repo files, comments, or untrusted markdown.
- No secrets in agent context, prompts, logs, browser routes, public CI output, or generated workflows.
- No production deploy, auth, billing, legal, infrastructure, security, CI/CD, backup, restore, source-truth, provider cloud upload, or data-changing action without founder approval.
- Dependency installs and external repo execution require sandbox review and approval.
- Code-changing actions require green npm run build, npx tsc --noEmit --pretty false, and npm run kernel before merge or deployment.
- AI-generated code must carry provenance: provider, agent id, reviewer, touched files, commands run, checks, risk zone, and approval status.

Runtime surface:

- GET /api/kernel/repo-agent-safety-gate
- POST /api/kernel/repo-agent-safety-gate

POST body example:

{
  "actionClass": "git_add",
  "command": "git add core/agent/repo-agent-safety-gate.ts",
  "touchedFiles": ["core/agent/repo-agent-safety-gate.ts"],
  "sourceTextOrigin": "founder_direct",
  "generatedByProvider": "openai",
  "generatedByAgentId": "pantavion_patch_agent",
  "humanReviewer": "founder",
  "founderApproved": false
}

Audit file:

data/kernel/repo-agent-safety-gate-audit.jsonl
