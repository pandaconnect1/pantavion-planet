# Donor Preservation Status — 2026-08-25

This ledger records exact donor-repository preservation state. No donor is considered disposable until all refs/content are preserved and verified.

## Main trees already preserved in Pantavion Planet

- `pandaconnect1/pantavion-voice` — main preserved
- `pandaconnect1/pantavion-one-clean-ui` — main preserved
- `pandaconnect1/pantavion-one-clean` — main preserved
- `pandaconnect1/pantavion-one` — main preserved
- `pandaconnect1/pantavion-app.` — main preserved
- `pandaconnect1/pantavion.com` — main preserved

## Additional ref discovered and still mandatory

- `pandaconnect1/pantavion-one-clean-ui`
  - branch: `vercel/react-server-components-cve-vu-68t1ie`
  - commit: `833bbbfd1308174be414db9230c7643f83579f62`
  - tree: `a20472e82c46f40c9876d2c2a4869f2cd9e2f05d`
  - differs from main in `package.json` and `package-lock.json`
  - state: DISCOVERED / NOT YET BYTE-PRESERVED IN DESTINATION

## Repositories currently reporting no branches

- `pandaconnect1/pantavion`
- `pandaconnect1/pantavion-socialhub`
- `pandaconnect1/pantavion-voice-`
- `pandaconnect1/pantavion-one-main`

No-branch status is not permission to delete. Historical commits/refs, external recovery snapshots and other evidence remain mandatory excavation targets.

## Safety rule

Nothing in this ledger authorizes donor deletion. Delete/archive gate remains closed until raw preservation, count/hash verification, branch/ref verification and canonical integration are complete.
