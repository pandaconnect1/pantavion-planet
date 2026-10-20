# Social + Chat FREE donor audit — 2026-10-20

Status: SOURCE-VERIFIED INVENTORY, NOT VERIFIED_LIVE. Scope strictly Social, People, Chat, Voice/Video; no mapping/geolocation work.

## Repository reality

- `pandaconnect1/pantavion-socialhub` exists, but GitHub Contents API reports it as empty (404: `This repository is empty`). Do not claim recoverable code from it without other evidence.
- Main canonical repo: `pandaconnect1/pantavion-planet`.

## Historical donor branches confirmed by GitHub branch search

`agent/canonical-social-flagship-wave`, `agent/social-messaging-persistence`, `agent/social-production-hardening`, `feat/revenue-social-foundation`, `feat/social-business-listings-shell`, `feat/social-flagship`, `feature/social-chat-live-wave-20260825`, `feature/social-core-foundation`, `feature/social-core-runtime-v2`, `fix/social-health-auth-aware`, `fix/social-health-diagnostics`, `fix/social-live-backend-gate`, `recovery/social-people-chat-all-inside-20260815`; matching recovery snapshot branches also exist. These are leads for file-level comparison, not evidence of deployed features.

## Historical PR evidence

- PR #138: social core contracts, age policy, relationship contexts Family/Friends/Communities/Professional/Business/Learning/Dating/Elite; explicitly incomplete Feed/Chat/Voice/Video/provider translation at that checkpoint.
- PR #166: privacy/consent/contact sources, relationship requests, blocks, conversation memberships, messages, receipts and RLS design; production verification required.
- PR #174: social feed/post/reaction/comment foundation; original PR itself explicitly lists communities, dating, external imports, multi-email inbox as incomplete. Location/map functionality in this PR is EXCLUDED from Social + Chat FREE recovery by founder direction.
- PR #175: capability-aware Social UI and health checking.
- PR #211: translation lineage, realtime state, per-message translation; two-account live verification required.
- Existing `docs/recovery/social-people-chat-full-excavation-20260815.md` and `docs/recovery/SOCIAL_GLOBAL_001_20260717.md` provide recovery and worldwide social design evidence; any map-related sections are excluded.

## Canonical source files located

- `app/social/social-home-client.tsx`: posts, reactions, comments, media UI.
- `app/messages/[conversationId]/conversation-client.tsx`: realtime conversation UI.
- `app/messages/page.tsx`: conversation inbox.
- `app/api/messages/send/route.ts`: first-party send API invoking `pantavion_send_message` RPC.
- `app/api/messages/conversations/route.ts`: conversation membership-based listing.
- `supabase/migrations/20260814050449_chat_direct_conversation_privacy_gate.sql`: privacy gate for direct conversations.

## Next executable recovery steps

1. Compare donor Social Core policy and contexts against current main and isolate missing canonical capabilities.
2. Verify two real user accounts can sign in, connect, send, receive, read and block; capture evidence.
3. Implement missing group chat and notifications in separate tested increments, reusing existing schema/RLS.
4. Add WebRTC voice/video only after signalling, TURN, permission and abuse design are reviewed.
5. Build provider-specific opt-in unified inbox after provider/API feasibility, explicit scopes and revocation tests.
6. Keep kernels independent and internal; do not add any maps to this product.

No production deploy or release authorized by this inventory.