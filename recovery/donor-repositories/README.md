# Pantavion donor repository preservation

This directory preserves the exact file contents of every non-empty donor repository inventoried on 2026-08-23.

Safety rules:
- Files are isolated below per-repository provenance directories.
- Donor GitHub workflows are inert because they are not placed in the canonical root .github/workflows directory.
- No source repository was modified, archived, or deleted.
- No secrets or private infrastructure artifact names were detected in the transferred set.
- This preservation commit does not make donor features production-live.
- Canonical integration requires separate comparison, tests, preview deployment, and VERIFIED_LIVE evidence.
- Source repositories may only be archived after owner approval and full verification.

See manifest.json for every source path, blob SHA, size, and destination.
