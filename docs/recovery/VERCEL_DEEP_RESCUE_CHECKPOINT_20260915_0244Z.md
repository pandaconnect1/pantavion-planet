# Vercel deep rescue checkpoint — 2026-09-15 02:44Z

Branch: `backup/pre-vercel-risk-20260914`
Team: `pantavion` / `pandaconnect` (`team_tGNSGGjcV3VNecscMvaAniGY`)

## Deployment-history traversal

### pantavion-planet
Project ID: `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`

This pass recovered two additional 20-record pages (40 older deployment records) after the preceding checkpoint. The records include deployment IDs, URLs, created timestamps, READY/ERROR state, production/preview target when present, creator metadata, GitHub repository/ref/commit SHA provenance, PR IDs when returned, branch aliases, inspector URLs and rollback-candidate flags.

Current older-history continuation cursor: `1788967700081`.

History is still open and MUST NOT be declared complete until an older-page request returns zero records.

### pantavion-planet-vmxx
Project ID: `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`

This pass recovered two additional 20-record pages (40 older deployment records). The same deployment/Git provenance metadata is retained where Vercel exposes it.

Current older-history continuation cursor: `1788978762947`.

History is still open and MUST NOT be declared complete until an older-page request returns zero records.

## Additional Vercel evidence surfaces checked

### Toolbar comment threads
Team-wide checks were performed for both `unresolved` and `resolved` Vercel Toolbar threads with a 100-result request. Both returned an empty thread set at the current API view. This is recorded as a checked-empty evidence surface, not as proof that comments could never have existed outside current retention/API visibility.

### Agent Runs observability
Team-wide Agent Runs project discovery was checked for both `production` and `preview` over the available 90-day preset. Both returned zero projects with Agent Runs observability data. This is recorded as checked-empty for the current observability view.

## Preservation boundary
- No Vercel project, deployment, domain, alias, repository ref or historical evidence is authorized for deletion.
- Encrypted environment-variable values remain a private-export blocker because the connected Vercel tool does not expose decrypted env-value export.
- No secrets are written into this public repository.
- Full deployment filesystem/build-artifact export is not represented as preserved unless independently exported and verified.
