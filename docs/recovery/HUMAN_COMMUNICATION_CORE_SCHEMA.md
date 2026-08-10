# Pantavion Human + Communication Core schema map

Canonical chain:

`auth.users -> profiles -> user_privacy_settings / consent_records -> contact_sources / contacts -> relationships / user_blocks -> conversations / conversation_members -> messages / message_receipts`

## Privacy and consent

- `user_privacy_settings`: profile visibility, discoverability, contact import opt-in, messaging policy, translation preference.
- `consent_records`: auditable purpose/status/source history. Designed to retain provenance rather than overwrite a single boolean.

## Contacts

- `contact_sources`: identifies the user-authorized import source and consent record.
- `contacts`: normalized user-owned contact rows; may later link to a Pantavion account.

## Relationship graph

- `relationships`: one canonical unordered pair, request lifecycle enforced server-side.
- `user_blocks`: directional blocks; communication checks treat either direction as a hard stop.

## Messaging

- `conversations`: direct/group/channel/elite-private container.
- `conversation_members`: membership and role boundary.
- `messages`: persistent message records with idempotent client IDs and original language field.
- `message_receipts`: truthful state evidence; does not by itself claim network delivery until runtime writes that state from real evidence.

## RLS doctrine

- private records are owner/participant scoped.
- conversation membership checks use narrow security-definer boolean functions to avoid self-recursive RLS.
- profile visibility is evaluated through a narrow visibility predicate so nested RLS does not accidentally hide intentionally public profiles.
- blocks are checked before relationship creation and message insertion.

This is a backend foundation only. It must not be surfaced as completed Social/Chat until runtime APIs, realtime transport, moderation, translation integration, deployment and live verification are complete.
