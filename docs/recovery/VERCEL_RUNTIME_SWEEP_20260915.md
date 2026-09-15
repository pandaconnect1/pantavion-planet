# Vercel Runtime Sweep — 2026-09-15

## Purpose
Preserve current runtime-health evidence while Vercel access is at risk. This is evidence only and contains no secret values.

## Canonical Pantavion production project
Project: `prj_BxhpnjvAs1seyfBU1UYFU8nDykwh`
Production deployment: `dpl_Dc5bXsU48aZAdZ8sASugaN7rnxSC`

Observed active runtime failure:
- Route: `/api/pantavion/intelligence/cron`
- Error: `Pantavion Supabase admin runtime is missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.`
- Recurrence: approximately every 5 minutes in the latest one-hour sample.
- Impact: secure scheduled worker/admin-runtime path is not functioning correctly.

## Additional 7-day runtime-error checks
No grouped runtime errors were returned for these projects in the selected 7-day window:
- `pantavion-planet-vmxx` — `prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU`
- `pantavion-one` — `prj_Rld6OiU8Iu0TeBDYZ6Y2igDd200e`
- `pantavion-one-clean` — `prj_PZD1t2hOc6SaiY5pKithCHILboHF`
- `pantavion-one-clean-ui` — `prj_e5oghsEalj1r5sIKmXFyRlXGYUdC`
- `pantaai` — `prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs`
- `pantaai-v1` — `prj_7grzRBApMytGyui5TzP2JTzxaR6k`

Absence of grouped errors in this 7-day window is not proof that historical deployments never failed; old build/deployment evidence must still be preserved separately.

## Recovery consequence
The currently missing Supabase admin secret affects one real production runtime path. Source-code preservation alone is therefore not sufficient for full reconstruction. A private Vercel environment export remains mandatory before cleanup or account loss.

## Required private export
Use an authorized private Vercel CLI/API flow (for example `vercel env pull` / `vercel pull --environment=production`) for each non-empty project/environment. Do not commit exported values to the public repository. Preserve only key names and recovery status publicly; preserve secret values in a private secure location.

## Deletion freeze
No Vercel cleanup is authorized until source/history/configuration evidence and private environment exports are verified.