# Pantavion Raw Donor Preservation Policy

Owner directive: every discovered Pantavion donor repository/project is treated as unique source material. Similar-looking files are not assumed equivalent.

Rules:

1. Preserve donor content as-is under `recovery/raw-donors/<source-repo>/<source-commit>/...` before any consolidation, refactor, deduplication, deletion, or replacement.
2. Preserve source repository name, branch, commit SHA, original path, file bytes/content, and provenance.
3. Do not omit files merely because a canonical file appears similar or newer.
4. Canonical integration is a separate second stage. Raw preservation remains immutable evidence.
5. No donor repository/project may be deleted until its complete snapshot has been transferred and independently verified against the source.
6. Binary/media/configuration/documentation/source files are all in scope. Secrets are never copied into the repository; only safe configuration structure/provenance may be preserved.
7. `pandaconnect1/pantavion-planet` remains the canonical active repository. Raw donor snapshots are historical/recovery material, not competing runtime implementations.

Completion gate for each donor: SOURCE INVENTORIED -> RAW SNAPSHOT COPIED -> PATH/COUNT/HASH VERIFIED -> CANONICAL INTEGRATION REVIEWED -> SAFE-TO-ARCHIVE. Deletion requires a separate explicit verified gate.