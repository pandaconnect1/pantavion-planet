# Pantavion Donor Repository Consolidation — 2026-08-19

Canonical repository: `pandaconnect1/pantavion-planet`

## Rule
All further product development belongs in `pantavion-planet`. Legacy Pantavion repositories are recovery/donor sources only. Nothing is copied blindly: every item is inventoried, compared to current canonical code, classified, placed, tested and only then accepted.

## Donor inventory discovered
The connected GitHub installation currently exposes these Pantavion repositories in addition to the canonical repository: `pantavion`, `pantavion.com`, `pantavion-app.`, `pantavion-one`, `pantavion-one-main`, `pantavion-one-clean`, `pantavion-one-clean-ui`, `pantavion-socialhub`, `pantavion-voice`, and `pantavion-voice-`.

## Audit 1 — `pantavion-one-clean-ui`
Root inspection confirms a real Next.js application. Its `app/` directory contains explicit historical surfaces for:

- Chat
- Compass
- Create
- Mind
- People
- Pulse
- Voice

These are not treated as finished features. They are canonical recovery inputs for the corresponding `pantavion-planet` modules. Each surface must be compared file-by-file against current backend/UI/runtime before any donor code is retained.

Initial decision: `INVESTIGATE -> MERGE/EVOLVE` per capability, never whole-repo overwrite.

## Audit 2 — `pantavion-voice`
The legacy Voice repository contains a dedicated `app/voice/page.tsx` (~13 KB) with a broad language/dialect list, browser speech recognition, translation API routing and speech synthesis behavior.

Comparison with current canonical `app/translate/page.tsx` shows that `pantavion-planet` already has a materially more advanced Interpreter/Translation implementation: explicit microphone permission handling, browser and server recording paths, speech normalization, speech-to-text API use, bidirectional translation, device-voice selection and richer error/status handling.

Therefore the legacy Voice page must **not** overwrite canonical Translation/Interpreter. Its language/dialect coverage and any UI behaviors not represented in the current global language registry are recovery candidates.

Initial decision:
- legacy Voice page shell: `ARCHIVE/SUPERSEDED` unless a unique interaction is found;
- language/dialect coverage: `INVESTIGATE -> MERGE` into canonical language registry if missing;
- browser speech/translation behavior: `COMPARE`, because current canonical implementation appears newer;
- any unique API route beneath legacy `app/api`: `INVESTIGATE` separately.

## Canonical placement map
- Chat donor material -> `app/chat`, messaging/realtime core, relationship graph as appropriate.
- Compass donor material -> canonical Compass/Discovery module.
- Mind donor material -> canonical Mind module and governed personal-memory/intelligence links.
- People donor material -> People/Profiles/Relationship Graph.
- Pulse donor material -> Social/Pulse/Event fabric.
- Voice donor material -> Interpreter/Translation/Voice runtime, not a disconnected second Voice stack.
- Legacy homepage/layout assets -> compare against current Pantavion shell; retain only unique value.

## Required record for every recovered item
For every file/capability recovered from a donor repository record:

`source repository -> source path -> source commit/ref -> recovered capability -> canonical module -> current canonical counterpart -> Recovery State -> Decision -> Live State -> differences -> blockers -> tests/evidence -> next action`.

## Next execution order
1. Finish `pantavion-one-clean-ui` surface-by-surface: Chat, Compass, Create, Mind, People, Pulse, Voice.
2. Finish `pantavion-voice`, including legacy API routes and language coverage.
3. Inspect `pantavion-one-clean` and compare its UI/components against both the clean-ui donor and canonical code.
4. Inspect smaller/non-empty legacy repositories.
5. Inspect zero-size repositories for historical branches/commits before deciding they contain nothing useful.
6. Only after donor extraction is complete may legacy repositories be considered archival.

## Truth gate
`DONOR_DISCOVERED` is not `MIGRATED`. `MIGRATED` requires canonical code/data placement plus tests. `VERIFIED_LIVE` requires deployed, real end-to-end behavior on the production surface.
