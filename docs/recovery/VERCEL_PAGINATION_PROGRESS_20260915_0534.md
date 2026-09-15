# Vercel pagination progress — 2026-09-15 05:34 Cyprus

Preservation branch: `backup/pre-vercel-risk-20260914`
Team: `pantavion` / `pandaconnect` (`team_tGNSGGjcV3VNecscMvaAniGY`)

## Completed in this pass

### pantavion-planet
Project: `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
- Recovered 40 additional older deployment records in two pages.
- Current older-history cursor: `1789216696561`.
- Pagination is still open; history is NOT yet declared complete.
- Each recovered record includes deployment id/url/state/target plus Git commit/ref provenance where returned by Vercel.

### pantavion-planet-vmxx
Project: `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
- Recovered 40 additional older deployment records in two pages.
- Current older-history cursor: `1789216696827`.
- Pagination is still open; history is NOT yet declared complete.
- Each recovered record includes deployment id/url/state/target plus Git commit/ref provenance where returned by Vercel.

### pantavion-one-clean
Project: `prj_PZD1t2hOc6SaiY5pKithCHILboHF`
- Recovered the next 20 older records, then the final 12 older records.
- A follow-up query before the oldest recovered timestamp (`1763936819675`) returned `count: 0`.
- Deployment history is therefore exhausted through the currently exposed Vercel API pagination path.
- Combined with the previously recovered first page, 52 deployment records are accounted for in the recovery sweep.

## Preservation boundary
No Vercel project/deployment/environment configuration/domain binding is approved for deletion. Encrypted environment-variable values are still not exportable through the current connector and remain a separate private-export blocker. No secret values are stored in this public recovery branch.
