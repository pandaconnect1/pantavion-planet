# Pantavion Founder Command Code Writer

Status: internal / provider-backed / guarded by command-pack validation.

Flow:

```text
Founder Command Inbox
→ founder command stored in .pantavion/kernel/founder-commands.json
→ Code Writer Agent reads latest command
→ real AI provider generates command pack JSON
→ paths are validated
→ secrets/DWG/water/private/auth/billing/database/destructive files are blocked
→ command pack bridge applies files
→ build/typecheck/kernel tick run
→ branch commit is created only if checks pass
