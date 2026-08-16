# Pantavion Live User Surface

Patch 10 creates the first visible Pantavion live user surface.

## Routes

- `/pantavion/live`
- `/pantavion/chat`
- `/pantavion/pulse`

## APIs

- `GET /api/pantavion/live/status`
- `GET /api/pantavion/chat`
- `POST /api/pantavion/chat`
- `GET /api/pantavion/pulse`
- `POST /api/pantavion/pulse`

## What is real now

- Chat input is real.
- Chat route calls Pantavion execution kernel.
- Chat messages save to local runtime JSONL.
- Pulse posts save to local runtime JSONL.
- Modules show truthful status.
- Sensitive social, VIP, SOS, billing and production areas remain gated.

## What is not production-complete yet

- No durable database yet.
- No auth/profile yet.
- No production social graph yet.
- No private messaging yet.
- No notifications yet.
- No moderation/report/block system yet.
- No billing/VIP production action yet.

## Truth rule

Visible does not mean production-complete. Every module must show status and next foundation until it has auth, database, policy, audit and verification.
