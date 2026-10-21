import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const m = readFileSync("supabase/migrations/20261022023000_chat_membership_rls_private_helper.sql","utf8");
assert.match(m,/CREATE OR REPLACE FUNCTION pantavion_internal\.current_user_in_conversation/);
assert.match(m,/SET search_path TO ''/);
assert.match(m,/m\.user_id = \(SELECT auth\.uid\(\)\)/);
assert.match(m,/m\.left_at IS NULL/);
assert.match(m,/REVOKE ALL ON FUNCTION pantavion_internal\.current_user_in_conversation\(uuid\) FROM PUBLIC, anon/);
assert.match(m,/GRANT EXECUTE ON FUNCTION pantavion_internal\.current_user_in_conversation\(uuid\) TO authenticated/);
for(const policy of ["members_read","messages_read","messages_insert","conversations_read","conversation_security_read","conversation_security_event_read","message_receipts_read","message_receipts_insert"]){
 assert.match(m,new RegExp("CREATE POLICY "+policy+" "));
}
for (const unsafe of ["messages_block_shield_read","messages_block_shield_insert","conversation_members_block_shield"]) {
 assert.ok(m.includes("DROP POLICY IF EXISTS "+unsafe),unsafe);
}
assert.match(m,/NOT public\.pantavion_is_blocked\(auth\.uid\(\),sender_id\)/);
assert.match(m,/AND public\.pantavion_can_send_to_conversation\(conversation_id,auth\.uid\(\)\)/);
assert.match(m,/AND NOT public\.pantavion_conversation_blocked_for\(conversation_id,auth\.uid\(\)\)/);
const checks = readFileSync("supabase/tests/pantavion-chat-membership-rls.sql","utf8");
assert.match(checks,/SET LOCAL ROLE authenticated/);
assert.match(checks,/ROLLBACK;/);
console.log("Pantavion chat participant-only read/write boundary: PASS");
