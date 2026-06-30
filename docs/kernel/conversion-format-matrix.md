# Pantavion Conversion Format Matrix

Status: professional user-facing conversion coverage registry.

Purpose:

- Show exactly which source formats Pantavion can intake.
- Show exactly which target formats can be produced.
- Mark every route as supported_local, provider_required, requires_adapter, manual_quote, or blocked_sensitive.
- Show adapter, license, cost band, device support and risk zone.
- Preserve the original file as source truth.
- Treat all conversion outputs as derivative copies only.

User-facing truth:

Pantavion can absorb many formats safely, but it only claims conversion support when a real adapter/provider/license exists.

Core rules:

- Original preserved.
- Derivative output only.
- No fake conversion.
- No unsupported claims.
- No CAD/DWG source truth replacement.
- No sensitive artifact preview or automatic processing.
- Mobile/tablet act as interface for heavy conversions; backend workers do the processing.

DWG/CAD rule:

Original DWG/DXF remains untouched.
Any conversion output is derivative only.
CAD/BIM conversion requires governed adapter, license or provider.
Founder approval is required for CAD engineering source-truth operations.

Sensitive artifact rule:

.env, private keys, executables, database dumps and similar files are not normal converter inputs.
They require Sensitive Artifact Vault, quarantine, security review and audit.
