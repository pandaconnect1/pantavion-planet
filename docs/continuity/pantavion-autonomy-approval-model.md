# Pantavion Autonomy Approval Model

Pantavion autonomy rule:

- Safe implementation slices may be generated automatically.
- Risk classes go to Founder Approval Dashboard.
- Founder approval is required for auth, contacts, profiles, social graph, messages, privacy, moderation, age gates, terms/policy, billing, secrets, production deploy and DWG/source truth.

Routes:

- `/pantavion/agents/approvals`
- `/api/pantavion/agents/runtime/approvals`

Runtime files:

- `.pantavion/agent-runtime/founder-approval-queue.json`
- `.pantavion/agent-runtime/founder-approval-audit.jsonl`
- `.pantavion/agent-runtime/autonomous-code-runner-report.json`

This is not a fake UI. It reads and writes runtime approval state locally.
