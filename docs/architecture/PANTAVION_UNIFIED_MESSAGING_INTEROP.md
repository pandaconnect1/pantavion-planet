# Pantavion Unified Messaging + Move to Pantavion

Status: ARCHITECTURE CONTRACT — implementation must remain provider-policy compliant and consent-driven.

## Product principle

**Import what the user owns. Connect what official APIs allow. Make Pantavion good enough that the user stays.**

Pantavion must never claim access to private third-party messages, contacts, media, or account data that the user did not authorize or that the external provider does not expose through an official API/export path.

## Canonical architecture

External providers must NOT become parallel Pantavion identity, contacts, or messaging systems.

All integrations terminate at adapters and map into the existing Human + Communication Core:

`auth.users -> profiles -> consent_records -> contact_sources / contacts -> relationships -> conversations / conversation_members -> messages / message_receipts`

Provider adapters sit outside that chain:

`provider -> official API / user-owned export -> Pantavion adapter -> canonical core`

## Move to Pantavion

A user-controlled migration surface should support, per provider capability:

1. Account/profile metadata the user is allowed to export.
2. Contacts/address-book data the user explicitly selects or imports.
3. Photos, videos, audio, documents and other user-owned media.
4. Message/history exports only when the provider officially permits export/import and the user explicitly selects them.
5. Provenance on every imported dataset: provider, import method, consent record, timestamp and source identifier.
6. Preview-before-import, deduplication, cancel/revoke controls and deletion controls.

No scraping of private accounts, credential harvesting, session-cookie reuse, reverse-engineered private APIs, or background contact discovery without explicit consent.

## Unified Messaging Hub

Pantavion should present one inbox while preserving source identity.

Every external channel adapter must expose a normalized contract such as:

- provider
- external_account_id
- external_conversation_id
- external_message_id
- direction
- sender mapping
- message type
- original text/language
- media references
- provider timestamp
- delivery/read evidence when officially available
- provider capability flags

The Pantavion UI may unify presentation, search, translation and notifications, but it must always retain provenance so the user can tell whether a message is Pantavion-native, WhatsApp, Viber, Telegram, SMS, email, or another supported channel.

## Adapter capability model

Each provider gets an explicit capability manifest instead of assumed parity:

- receive_messages
- send_messages
- import_history
- import_contacts
- import_media
- attachments
- voice
- video
- location
- reactions
- read_receipts
- typing_indicators
- group_management
- business_only
- user_to_user_supported
- webhook_supported

Unsupported capabilities must be disabled in UI, never simulated.

## Pantavion-native advantages

Features layered above normalized channels may include:

- one inbox and one contact identity graph
- multilingual translation while preserving original text
- PantaAI assistance with user control
- unified search
- media library integration
- spam/abuse controls
- notification preferences
- cross-channel contact linking with explicit user confirmation
- accessibility features

Provider rules remain authoritative for externally routed messages.

## Security and privacy boundary

- OAuth/API tokens are encrypted server-side and never exposed to the browser after connection.
- Minimum provider scopes only.
- Explicit consent purpose per import/connection.
- Revocation disconnects future sync.
- Imported data keeps provenance.
- Blocks and Pantavion privacy policy apply to Pantavion-native actions.
- External-provider retention/deletion limitations must be shown truthfully.
- Secrets and provider credentials must never be stored in Git or client bundles.

## Implementation phases

### Phase 0 — current prerequisite
Make the existing Pantavion Human + Communication Core production-live and verified. Do not build external adapters on a broken canonical messaging core.

### Phase 1 — provider-neutral contracts
Create server-only provider adapter interfaces, capability manifests, account-link records, consent/provenance records and normalized inbound/outbound event envelopes.

### Phase 2 — Move to Pantavion
Build user-owned file/export imports for contacts and media first, with preview, deduplication and provenance. Add provider-specific official export paths only where permitted.

### Phase 3 — official messaging adapters
Connect providers one at a time using official APIs/webhooks. Business/bot APIs must be labelled as such and must not be presented as access to arbitrary personal chats.

### Phase 4 — unified inbox
Render Pantavion-native and external conversations in one source-aware inbox with capability-aware actions.

### Phase 5 — open Pantavion interoperability
Publish stable Pantavion messaging/identity integration APIs for approved third-party services, with scoped authorization, auditing, rate limits and revocation.

## Definition of DONE

An integration is not DONE because an icon, provider name, OAuth button, mock conversation or adapter stub exists.

DONE requires:

`official capability confirmed -> credentials configured -> consent flow live -> adapter connected -> real inbound/outbound test -> provenance persisted -> disconnect/revoke tested -> security review -> production deployment -> VERIFIED_LIVE`
