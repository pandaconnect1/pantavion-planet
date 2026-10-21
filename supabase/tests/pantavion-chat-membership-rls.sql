-- Read-only repeatable sanity check for an unauthenticated session
-- masquerading as an authenticated database role. MUST return zeros.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT
  auth.uid() IS NULL AS no_session,
  (SELECT count(*) FROM public.messages) AS visible_messages,
  (SELECT count(*) FROM public.conversation_members) AS visible_members,
  (SELECT count(*) FROM public.conversations) AS visible_conversations,
  (SELECT count(*) FROM public.message_receipts) AS visible_receipts;
ROLLBACK;
