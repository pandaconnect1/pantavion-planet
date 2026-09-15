# Vercel emergency transfer checkpoint — 2026-09-15 08:15 Cyprus

Preservation branch: `backup/pre-vercel-risk-20260914`
Team: `pantavion` / `pandaconnect` (`team_tGNSGGjcV3VNecscMvaAniGY`)

## Emergency transfer delta
In this manual emergency pass, 80 additional historical deployment records were retrieved from the two still-open Pantavion Planet Vercel histories and bound to their immutable Git provenance where Vercel exposed it. No Vercel, GitHub, or Supabase resource was deleted or cleaned up.

### pantavion-planet
Project: `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
Current older-history continuation point: `1787865352638`.
History remains open.

Recovered evidence in this batch includes production and preview provenance for:
- direct private OpenAI translation failover and provider credential isolation;
- AI Gateway 429 circuit-breaker / bounded hedged translation routing;
- production translation gateway resilience;
- zero-trust decision context binding and Agent Immune System foundation;
- founder-only Kernel release gates and owner approval transitions;
- canonical 58/58 Supabase production migration provenance;
- Evolution Intelligence V2 / Technology Signal & Horizon Radar;
- native AI Gateway translation failover and exact-revision production verification.

Verified production rollback candidates captured in this range include commits:
- `3f951b2a4f90ee1a67e07b1b176e8cb87270eaf1`
- `f7dc1137593a32038281d5c3c76b4e16b5666158`
- `496e243264ed5970fa0e695fb097de5325fe67d6`
- `c4605e527855e669b20861ffb5380dfe907d5a27`
- `cf6798d100c5e670297b428f220ac47593e99cc9`

### pantavion-planet-vmxx
Project: `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
Current older-history continuation point: `1787865352413`.
History remains open.

The vmxx mirror returned matching Git provenance and corresponding production/preview evidence for the same milestones, including matching production rollback candidates.

## Truth boundary
This checkpoint preserves deployment metadata and Git provenance. It does not claim the full deployment filesystem or decrypted environment-secret values were exported. The current Vercel connector does not expose those two classes of data directly. They require authorized Vercel CLI/REST API access and must be written only to private Pantavion runtime/recovery storage, never this public repository.

## Cleanup freeze
ZERO deletions. Do not remove any Vercel project, deployment, branch, domain, Git repository, Supabase resource, or historical evidence until preservation is independently verified and the owner separately authorizes cleanup.
