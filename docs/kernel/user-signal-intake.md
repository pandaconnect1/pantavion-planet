# Pantavion User Signal Intake

Status: real local/runtime intake.

Purpose:

- Accept bugs, ideas, needs and complaints.
- Persist them in kernel state.
- Classify category and severity.
- Assign a safety zone.
- Write audit.
- Prevent direct code execution from normal user input.

Boundary:

```text
User signal
→ stored
→ categorized
→ grouped later by Kernel
→ founder/admin review
→ PR/checks only if approved
