# Pantavion PATCH 8H - Agent Execution Reliability Layer

Status: internal foundation

This patch defines the canonical agent execution reliability layer for Pantavion.

Locked rules:

- Commands are assessed before execution.
- Dangerous commands are blocked.
- Sensitive commands require founder approval.
- File, repo, dependency, CI/CD, and deploy actions require checkpoints.
- High-risk execution requires rollback planning.
- Retries are limited and only allowed for safe checks.
- Command results must capture status, exit code, duration, sanitized stdout, and sanitized stderr.
- Secrets must be redacted from all logs and audit records.
- Green build, typecheck, and kernel checks are required before merge or deployment.

Runtime surface:

- GET /api/kernel/agent-execution-reliability
- POST /api/kernel/agent-execution-reliability

POST body example:

{
  "actionClass": "build_check",
  "command": "npm run build",
  "timeoutMs": 120000,
  "maxRetries": 1,
  "resultStatus": "not_run"
}

Audit file:

data/kernel/agent-execution-reliability-audit.jsonl
