# Pantavion Water Access Approval Identity Rule

Locked requirement:
No authority/founder/admin should approve access blindly.

Every access request must show:
- requester full name
- employee ID
- role
- department
- supervisor
- email/phone or verified contact
- verified login status
- approved device / device fingerprint
- requested layer
- requested area
- requested action
- duration
- purpose/reason
- export permission
- KMZ/KML download permission
- risk level
- audit log entry

Production rule:
- If identity is not verified, Approve must be disabled.
- Default access is view-only.
- Raw KMZ/KML download must remain blocked unless explicitly allowed by policy.
- Sensitive infrastructure access must be time-limited.
- Approval must be stored in database with audit history.

Marker:
PANTAVION_WATER_NO_BLIND_APPROVAL_RULE
