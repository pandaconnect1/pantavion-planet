# Pantavion production visibility policy

Production navigation must expose only features that are implemented, access-controlled where required, and validated for real use.

- Do not present foundation, prototype, future, placeholder, or provider-required modules as live products.
- Keep unfinished routes in the repository when useful for development, but hide them from normal production discovery.
- Water production discovery currently exposes Water Control Center, Users / Access, and A Live Water Map.
- Administrator controls remain visible only after the existing secure admin-session check.
- New modules may be added to production discovery only after their real runtime path and required safety checks are ready.
