# Human + Communication Core migration notes

Branch: `feat/human-communication-core`

## Scope

This migration introduces the first canonical backend slice after recovery:

`Auth/Profile -> Privacy/Consent -> Contacts -> Relationships/Blocks -> Conversations -> Messages -> Receipts`.

## Safety corrections applied before PR

- Avoid recursive `conversation_members` RLS by using narrow `SECURITY DEFINER` boolean helpers.
- Permit conversation creator bootstrap without weakening table-wide RLS.
- Enforce blocks in both directions before relationships/messages are created.
- Enforce legal relationship state transitions with a trigger using `OLD`/`NEW` state.
- Replace unconditional public profile reads with privacy/relationship-aware visibility.
- Avoid nested-RLS profile visibility failure by using a dedicated boolean visibility helper.
- Add explicit authenticated table grants rather than relying on project default privileges.
- Add idempotent message client IDs and canonical unordered relationship-pair uniqueness.

## Still gated after merge

This schema being merged does **not** mean Social/Chat is DONE. The next required work is:

1. apply migrations in Supabase environment
2. verify RLS with at least two users plus anonymous access
3. add server/API contracts for consent, contacts, relationship requests and conversation creation
4. replace the guarded message endpoint with authenticated persistence
5. add realtime subscriptions and truthful receipt state transitions
6. integrate translation per message
7. add abuse/rate/moderation controls
8. run mobile tests
9. deploy and verify live

## Truth state

Recovery State: `PARTIAL -> EVOLVE`

Live State after code merge only: `BACKEND_PARTIAL` until database application and end-to-end verification succeed.
