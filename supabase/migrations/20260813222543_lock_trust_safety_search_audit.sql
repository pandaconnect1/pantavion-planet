-- Audit rows are written only by the security-definer search function.
-- Do not expose this sensitive query history via the GraphQL/PostgREST schema.
revoke select on table public.trust_safety_search_audit from authenticated;
