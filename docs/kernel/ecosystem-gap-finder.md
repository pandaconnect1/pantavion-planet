# Pantavion Ecosystem Gap Finder

Status: real local/runtime analyzer.

Purpose:

- Find missing runtime files.
- Find missing scripts.
- Detect provider readiness without making paid API calls.
- Read founder commands.
- Infer repeated ecosystem gaps.
- Write ecosystem-gap-report.json.
- Write audit.
- Feed later code writer / evolution flow.

Important rule:

Normal users may later submit requests and signals, but they must not directly write code, deploy, change auth, touch data, or mutate infrastructure.

Correct flow:

User signal
→ moderation / trust boundary
→ grouped ecosystem need
→ founder/admin review
→ Kernel plan
→ Code writer branch/PR
→ build/typecheck/kernel tick
→ approval for sensitive zones
→ merge/deploy only when safe
