# Legacy unapplied migrations — security review required

These SQL files existed in the repository migration path but their defining objects were not present in the production database and their versions were absent from the production migration ledger as of 2026-08-27.

They are preserved byte-for-byte, but are intentionally NOT active migrations. Before any is implemented it must be re-reviewed against the current schema/security model, regenerated as a new migration with a version later than current production history, tested in an isolated environment, and verified before production deployment.

This prevents old timestamps from being silently replayed against a modern production schema while preserving all prior design work.
