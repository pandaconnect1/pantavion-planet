revoke all on table public.owner_decision_queue from anon;
revoke all on table public.owner_decision_queue from authenticated;
-- Keep RLS and owner policies as defense in depth, but the browser/authenticated role has no table privileges.
-- Only trusted server-side service_role access is granted.
grant select, insert, update, delete on table public.owner_decision_queue to service_role;