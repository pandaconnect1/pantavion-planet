# Core four verification — 2026-08-15

Verified against production Supabase project `cxhulvwkagzufbjsdwwu` before additional implementation.

## Interpreter
- UI full-turn recorder exists on PR #210.
- Live mobile test failed at server STT.
- Anti-stall server fix committed in this branch: one primary gateway attempt, no retry cascade, one bounded fallback.
- Status: NOT DONE until new preview/mobile pass.

## People
Production database objects verified present:
- `profiles`
- `relationships`
- `conversations`
- `messages`

Production RPCs verified present:
- `pantavion_update_location_presence`
- `pantavion_find_nearby_people`
- `pantavion_disable_location_presence`
- `pantavion_find_people_from_my_contacts`

Current main People UI already implements profile discovery, relationship request/accept/decline, nearby discovery and open-conversation flow.
Status: BACKEND PRESENT + UI PRESENT; requires two-account live verification before DONE.

## Chat
Production `messages` / `conversations` tables and `pantavion_mark_message_receipt` RPC verified present.
Current main has realtime subscription + send flow. PR #184 contains recovered in-message translation and realtime state UI.
Status: CORE BACKEND PRESENT; translation UI recovery pending canonical merge/verification.

## Social
Production tables verified present:
- `social_posts`
- `social_comments`
- `social_reactions`

Current main `/social` already reads capabilities and exposes post/reaction/comment flows.
Status: BACKEND PRESENT + UI PRESENT; requires authenticated live CRUD verification before DONE.

Truth rule: no module is DONE until live device/account verification passes end-to-end.
