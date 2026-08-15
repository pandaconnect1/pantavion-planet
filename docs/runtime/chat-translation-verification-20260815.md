# Chat translation verification — 2026-08-15

## Production Supabase verification
Read-only SQL verification against production project `cxhulvwkagzufbjsdwwu` confirmed:

- `messages` is in the `supabase_realtime` publication.
- `message_receipts` is in the `supabase_realtime` publication.
- `social_posts`, `social_comments`, and `social_reactions` are also in the realtime publication.
- `pantavion_create_direct_conversation(p_other_user_id uuid)` exists.
- `pantavion_send_message(p_conversation_id uuid, p_body text, p_client_message_id text, p_original_language text)` exists.
- `pantavion_mark_message_receipt(p_message_id uuid, p_state text)` exists.

This means the current canonical message send path and the recovered realtime subscriber match the live database function signatures.

## Recovery / excavation findings
PR #184 contains a useful donor implementation for:
- Supabase realtime subscription state (`SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`).
- Per-message translation through canonical `/api/pantavion/translate`.
- Preservation of `original_language` on send.

PR #146 contains the earlier shared-translation design for:
- one translation engine across Social, Chat, Voice, Video, group rooms, Business and SOS;
- preserving original text;
- multi-target language fanout for group rooms.

The current main translation route is newer than PR #146 and already prefers Vercel AI Gateway, enforces strict target-language routing, then falls back to the configured Pantavion provider. Therefore PR #146 is treated as a donor for platform/fanout concepts, not copied wholesale over the newer route.

## Implementation added in PR #211
- Recovered PR #184 realtime status and per-message translation onto current main.
- Conversation page now derives the signed-in user's profile language and, when available, the peer profile language.
- Chat language selectors now use the wider canonical `globalEmergencyLanguages` registry instead of a hard-coded 14-language list.
- New incoming messages can be automatically translated into the recipient's selected reading language while always preserving the original message.
- Translation failure is shown per message rather than hiding or replacing the original text.
- Manual translation remains available per message.

## Truth state
- Production database/realtime prerequisites: VERIFIED PRESENT.
- Code path for realtime + automatic per-recipient translation: IMPLEMENTED IN PR #211.
- Vercel build/preview: must pass on the latest PR #211 head before merge.
- Two-account live send/receive + automatic translation: NOT YET VERIFIED_LIVE.
- Group multi-language fanout: recovered design exists in PR #146 but is NOT YET canonical/live.

No DONE claim until preview/build and two-account live verification pass.
