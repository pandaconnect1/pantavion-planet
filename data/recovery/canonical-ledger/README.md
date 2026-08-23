# Pantavion Canonical Classification Ledger

This directory is the ordered index for recovered material. It is an index, not a dumping ground and not a deletion queue.

## Record identity

Every record receives a deterministic identifier:

`PANT-<CATEGORY>-<12_HEX>`

The suffix is derived from the source family, source path, source reference and content checksum. Re-running the catalog does not renumber unchanged records.

## Categories

| Code | Canonical section | Typical material |
|---|---|---|
| SEC | Identity & Security | auth, RLS, keys, permissions, security |
| SOC | Social & People | profiles, follows, feeds, communities |
| CHT | Chat & Translation | messages, voice, translation |
| BUS | Business & Marketplace | business, products, payments, marketplace |
| MAP | Maps & Water | maps, geo, water, environment |
| AIK | AI & Kernel | agents, AI, kernel, runtime, orchestration |
| REC | Recovery & Continuity | backups, recovery, migration, manifests |
| GOV | Governance & Safety | policy, moderation, audit, compliance |
| MED | Media & Music | audio, video, images, music |
| INF | Infrastructure & Deployment | GitHub, Vercel, Supabase, CI, deploy |
| DOC | Documentation | specifications, notes, reports |
| REV | Review queue | insufficient evidence for safe classification |

## Required fields

Each JSONL record contains: stable ID, category, topic, subtopic, source family, source repository/ref/path, proposed canonical destination, status, checksum and classification reason.

## Safety rules

- No secret values, private keys, tokens, environment files or production exports are cataloged in plaintext.
- Unknown items go to `REV`; they are never silently dropped.
- Duplicate content is linked by checksum and preserved once in the canonical content store.
- Donor repositories and branches remain unchanged until reconciliation proves that every accepted item is represented.
- Generated ledgers are split into batches so reviews and CI remain manageable.

## Status values

`INDEXED` → `REVIEWED` → `ACCEPTED` → `MIGRATED` → `VERIFIED`

Possible side states: `DUPLICATE`, `QUARANTINED`, `REJECTED_WITH_REASON`.
