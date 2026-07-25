# Pantavion Secure Circles

## Purpose
Pantavion Secure Circles is the protected communication layer for private individuals, verified professional groups, executive teams, institutions, families, and other closed communities. It is part of Pantavion Social, but operates as an independent domain connected to the central Pantavion identity, trust, policy, translation, notification, and audit kernels.

## Core principles

1. **End-to-end encryption by default** for private one-to-one and closed-circle conversations. Message content, attachments, voice notes, calls, and video sessions must be encrypted so that Pantavion infrastructure cannot read the content.
2. **No hidden backdoor.** Recovery, moderation, and compliance must never rely on a universal decryption key.
3. **Closed membership.** Entry requires invitation, approval, or policy-based entitlement. Public discovery is disabled unless the circle owner explicitly enables a discoverable request page.
4. **Verified access levels.** High-assurance circles may require verified identity, organization membership, device registration, passkeys, and step-up authentication.
5. **Minimal metadata.** Store only operational metadata required for delivery, anti-abuse, billing, and lawful security controls, with short retention wherever possible.
6. **User-controlled privacy.** Members can hide presence, disable read receipts, restrict forwarding, disable external sharing, and use disappearing messages where legally and operationally appropriate.
7. **Age and jurisdiction gates.** Minors cannot enter adult, dating, sexual-content, or high-risk closed circles. Country policy determines allowed features, retention, consent, and verification requirements.
8. **No promise of unlawful secrecy.** Secure Circles protects legitimate privacy; it must not be marketed as a way to evade lawful obligations or facilitate abuse.

## Conversation classes

### Personal Private
- One-to-one or small trusted group.
- End-to-end encrypted.
- Optional disappearing messages.
- Safety number / device verification.
- Encrypted attachments and calls.

### Verified Circle
- Invitation-only group.
- Identity or professional verification optional or required.
- Membership approval workflow.
- Member roles: owner, security administrator, moderator, member, guest.
- Join/leave/device-change security events.

### Executive / Institutional Circle
- High-assurance access policy.
- Passkey plus step-up authentication.
- Managed devices optional.
- Organization-controlled membership lifecycle.
- Legal hold and records policy only for circles configured as managed, never silently applied to personal E2EE conversations.
- Separate managed encryption model where the organization explicitly requires records retention.

### Restricted Mission Room
- Temporary closed room for projects, incidents, emergency coordination, negotiations, or sensitive operations.
- Start/end date, approved participant list, automatic access expiry, and post-mission archive or cryptographic destruction policy.

## Security model

- Use a mature, externally reviewed protocol rather than inventing cryptography.
- One-to-one messaging should follow a Signal-style asynchronous ratchet design.
- Group messaging should use an audited group key-management protocol suitable for membership changes and forward secrecy.
- Every device has its own identity key and signed prekeys.
- New devices trigger visible security warnings.
- Key rotation occurs after device changes, membership changes, compromise reports, and defined time thresholds.
- Local encrypted storage is protected with platform secure hardware where available.
- Backup is opt-in, end-to-end encrypted, and protected by a recovery secret that Pantavion does not possess.

## Safety and abuse controls

Because servers cannot inspect E2EE message content, safety must combine:

- user reports that include only content intentionally submitted by the reporter;
- rate limits and anti-spam controls;
- account reputation and trust states;
- detection of abusive network behaviour without scanning private content;
- block, mute, leave, emergency exit, and evidence-preservation controls;
- strict child-safety isolation and age gates;
- rapid account/device suspension when credible abuse is reported;
- hash matching only where lawful, technically compatible, and designed without creating general content access.

## Translation

Private translation must preserve confidentiality:

- prefer on-device translation when supported;
- otherwise use a confidential translation service with explicit consent and clear disclosure;
- never send E2EE content to a general AI provider silently;
- allow users to disable translation per conversation;
- show original and translated text when requested.

## Product capabilities

- text, voice notes, files, photos, video, calls, screen sharing;
- disappearing messages and view-once media;
- message edit/delete policies;
- invitation links with expiry and usage limits;
- QR or safety-code verification;
- hidden notification previews;
- app lock and biometric unlock;
- screenshot warnings where the operating system allows them, without claiming screenshots can always be prevented;
- panic exit and rapid session lock;
- compartmentalized identities for legitimate personal and professional contexts, governed by policy and not usable for impersonation.

## Central-kernel integrations

Secure Circles remains a separate Social entity but connects to:

- Pantavion Identity and Authentication;
- Trust and Verification;
- Age and Jurisdiction Policy Engine;
- Entitlements and Billing;
- Notifications;
- Translation Kernel;
- Abuse Reporting and Safety Operations;
- Audit and Observability for security events only, not plaintext message content.

## First implementation milestone

1. Domain types for circles, membership, devices, access policies, and conversation class.
2. Policy evaluator for age, country, trust level, and entitlement.
3. Invitation and membership workflow.
4. Device identity and key-registration interfaces.
5. Encrypted message-envelope API contract.
6. Security-event log with no plaintext content.
7. UI shell for creating and entering a Secure Circle.
8. Threat model and independent cryptographic review before production release.

## Non-negotiable acceptance criteria

- No plaintext private messages stored server-side.
- No universal decryption key.
- No minor/adult dating crossover.
- No silent AI or translation access to private content.
- No public member list for closed circles.
- Every membership and device change produces a visible security event.
- Personal E2EE and managed institutional retention are clearly separated in product language and architecture.
