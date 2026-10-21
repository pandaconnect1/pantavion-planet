-- Chat/People core security correction, verified against the connected production
-- Supabase project on 2026-10-21. NO real user, contact, GIS or message rows mutated.
-- Previously permissive RLS policies could OR away the participation condition.
-- The old public membership-check helper was not executable by authenticated.
-- This scoped internal function evaluates only the *actual* auth.uid().
BEGIN;

CREATE OR REPLACE FUNCTION pantavion_internal.current_user_in_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $body$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_members m
       WHERE m.conversation_id = p_conversation_id
         AND m.user_id = (SELECT auth.uid())
         AND m.left_at IS NULL
    );
$body$;

REVOKE ALL ON FUNCTION pantavion_internal.current_user_in_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION pantavion_internal.current_user_in_conversation(uuid) TO authenticated;

DROP POLICY IF EXISTS conversation_members_block_shield ON public.conversation_members;
DROP POLICY IF EXISTS members_read ON public.conversation_members;
CREATE POLICY members_read ON public.conversation_members
FOR SELECT TO authenticated
USING (
  pantavion_internal.current_user_in_conversation(conversation_id)
  AND NOT public.pantavion_is_blocked(auth.uid(),user_id)
);

DROP POLICY IF EXISTS messages_block_shield_read ON public.messages;
DROP POLICY IF EXISTS messages_read ON public.messages;
CREATE POLICY messages_read ON public.messages
FOR SELECT TO authenticated
USING (
  pantavion_internal.current_user_in_conversation(conversation_id)
  AND NOT public.pantavion_is_blocked(auth.uid(),sender_id)
);

DROP POLICY IF EXISTS messages_block_shield_insert ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_id=auth.uid()
  AND public.pantavion_can_send_to_conversation(conversation_id,auth.uid())
  AND NOT public.pantavion_conversation_blocked_for(conversation_id,auth.uid())
);

DROP POLICY IF EXISTS conversations_read ON public.conversations;
CREATE POLICY conversations_read ON public.conversations
FOR SELECT TO authenticated
USING (pantavion_internal.current_user_in_conversation(id));

DROP POLICY IF EXISTS conversation_security_read ON public.conversation_security;
CREATE POLICY conversation_security_read ON public.conversation_security
FOR SELECT TO authenticated
USING (pantavion_internal.current_user_in_conversation(conversation_id));

DROP POLICY IF EXISTS conversation_security_event_read ON public.conversation_security_event;
CREATE POLICY conversation_security_event_read ON public.conversation_security_event
FOR SELECT TO authenticated
USING (pantavion_internal.current_user_in_conversation(conversation_id));

DROP POLICY IF EXISTS message_receipts_insert ON public.message_receipts;
CREATE POLICY message_receipts_insert ON public.message_receipts
FOR INSERT TO authenticated
WITH CHECK (
  user_id=auth.uid()
  AND pantavion_internal.current_user_in_conversation(
    (SELECT m.conversation_id FROM public.messages m WHERE m.id=message_id)
  )
);

DROP POLICY IF EXISTS message_receipts_read ON public.message_receipts;
CREATE POLICY message_receipts_read ON public.message_receipts
FOR SELECT TO authenticated
USING (
  pantavion_internal.current_user_in_conversation(
    (SELECT m.conversation_id FROM public.messages m WHERE m.id=message_id)
  )
);
COMMIT;
