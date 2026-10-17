# Foundation Sprint 1 — Initial Audit

Status: in progress

## Confirmed stack
- Next.js 15
- React 18
- TypeScript
- Supabase SSR and Supabase JS
- Leaflet
- Zustand
- Vercel analytics and blob dependencies

## Confirmed runtime dependency
The application requires these public Supabase environment variables in both browser and server runtime:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Both Supabase client factories fail immediately when either variable is missing. This is a likely deployment blocker and must be verified in every provider before release.

## Immediate audit priorities
1. Enumerate all application routes and classify each as implemented, partial, mocked, static, documentation-only or broken.
2. Verify map components, tile/data sources, licenses, update paths and offline behavior.
3. Verify Supabase schema usage, authentication, row-level security, storage buckets and realtime subscriptions.
4. Verify all environment-variable names without recording secret values.
5. Run typecheck, build and the existing Pantavion safety gates.
6. Identify provider-specific dependencies that prevent deployment outside Vercel.
7. Add provider-neutral health endpoints for web, API, database and maps.

## Safety rule
No production deployment, secret rotation, database migration or destructive change is authorized by this audit document. All implementation changes must remain on a branch, pass review and include rollback guidance.

## Initial risk finding
The current Supabase initialization is fail-fast. That is appropriate for detecting configuration errors, but the public application should also provide a truthful degraded-mode status page rather than presenting a generic outage when the database configuration or provider is unavailable.
