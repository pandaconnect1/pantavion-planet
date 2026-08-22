# Pantavion Identity / Trust / Security Core

Status: implementation foundation
Branch: `feature/identity-trust-security-core`

## Launch gate

Public registration MUST remain disabled until the critical social stack is production-ready and verified live.

Required launch sequence:
1. People / Profile
2. Contacts / Relationship Graph
3. Social
4. Chat / Messaging
5. Translation / Voice
6. Dating
7. Safety / Privacy / Trust
8. End-to-end, mobile and security tests
9. Production deployment
10. Live verification
11. Enable public registration

A visible registration UI is not sufficient. Registration is considered launch-ready only when the server-side account creation path is enabled intentionally after all gates pass.

## Identity model

Each human has one canonical Pantavion user UUID. Multiple verified email addresses and phone numbers attach to the same user rather than creating duplicate identities.

Core identity data:
- legal first name / family name (private identity layer)
- public display name / username
- date of birth and derived age band
- profile photo
- live selfie / liveness verification state
- primary language
- continent / country / region / city / locality
- account type
- trust / verification state
- security protection level
- created / updated / last reviewed timestamps

Exact residential address is private and must not be used for public discovery.

## Contact points

Support multiple email addresses and phone numbers per user. Each contact point has:
- canonical normalized value
- label (personal/work/other)
- primary flag
- verified timestamp
- login enabled flag
- recovery enabled flag
- discoverability enabled flag
- created/updated timestamps

A contact point cannot be used for login or recovery before ownership verification.

## Age bands

Age is policy-driven by country and use case. Store DOB privately; derive the policy band.

Initial bands:
- child
- teen
- adult
- verified_adult

Minor accounts default to stricter privacy, restricted discovery and messaging, no targeted advertising, and jurisdiction-aware guardian/consent requirements.

## Account / trust classes

Initial classes:
- personal
- professional
- business
- verified_public_figure
- elite
- protected
- institutional

Payment never establishes identity or trust. Verification is independent from plan or billing.

## Protection levels

User-facing choices where allowed:
- standard
- enhanced
- maximum

System policy may enforce a minimum level. Protected/high-risk identities cannot downgrade below the required protection level.

Maximum/Protected design requirements:
- passkeys / WebAuthn
- phishing-resistant hardware security keys for high-risk accounts
- at least two registered recovery-capable authenticators for protected accounts where operationally appropriate
- no SMS-only recovery for critical changes
- strict device/session management
- step-up authentication for sensitive actions
- controlled recovery and cooling-off periods for high-risk changes
- security alerts
- immutable/auditable security-event trail
- manual review for identity takeover signals or critical profile changes

Do not expose the internal security tier publicly.

## Verification

Profile image and live verification are distinct. The profile image is user-visible subject to privacy settings. Liveness/selfie evidence is private and retained only under an explicit retention policy.

Verification workflow:
1. identity/profile data
2. profile photo
3. live liveness/selfie check
4. email/phone ownership verification
5. automated risk checks
6. manual review when required
7. activate verified/trust state

High-risk public figures use enhanced/manual verification and anti-impersonation review.

## Admin Users Center

Admin analytics and user management must support:
- World -> Continent -> Country -> Region/Province -> City/Locality
- registration counts by day/week/month/custom range
- active / pending / verified / suspended / blocked states
- age band
- account type
- verification state
- security state (restricted to authorized security/admin roles)

User list should support photo, permitted name fields, username, location summary, account type, verification state, registration date and status.

Aggregated statistics are separated from access to private personal data. Admin access is least-privilege and audited.

## Accessibility / assisted setup

Security must not require advanced technical skill. Registration and recovery flows should support:
- simplified guided mode
- large controls
- clear language
- voice guidance where appropriate
- accessible error recovery

Ease of use must not weaken mandatory security controls.

## Data protection rules

- Never store or expose plaintext passwords.
- Authentication secrets remain under the authentication provider/security subsystem.
- Private identity data is separated from public profile data.
- RLS/authorization is mandatory for user-scoped data.
- Sensitive admin/security operations require audited, explicit authorization.
- Minimize collection and retention of high-risk personal data.
- No public launch until the end-to-end identity/session flow is production verified.
