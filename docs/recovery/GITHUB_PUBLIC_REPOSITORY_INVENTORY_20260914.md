# GitHub Public Repository Inventory — 2026-09-14

Owner searched: `pandaconnect1`.
Search returned 15 public repositories; page 2 returned no additional repositories.

## Canonical destination
- `pandaconnect1/pantavion-planet` — canonical central repository; preservation branch: `backup/pre-vercel-risk-20260914`.

## Non-empty public repositories copied into the canonical preservation branch
The current `main` file trees of these repositories have been copied under `docs/recovery/legacy-source-snapshots/`:
- `pantavion-one` → `legacy-source-snapshots/pantavion-one/`
- `pantavion-one-clean` → `legacy-source-snapshots/pantavion-one-clean/`
- `pantavion-one-clean-ui` → `legacy-source-snapshots/pantavion-one-clean-ui/`
- `pantavion-voice` → `legacy-source-snapshots/pantavion-voice/`
- `nextjs-boilerplate` → `legacy-source-snapshots/nextjs-boilerplate/`
- `pantavion.com` → `legacy-source-snapshots/pantavion.com/`
- `Pantaai` → `legacy-source-snapshots/Pantaai/`
- `pantavion-app.` → `legacy-source-snapshots/pantavion-app-dot/`

The consolidation commit for the latter five repositories is `60c981851fd6e5bf2d9dd6f936d196e2922c4321`. Earlier consolidation commit `8eea98613a25c9c24dfc8b727649c121ad8d7740` preserved `pantavion-one`, `pantavion-one-clean`, and `pantavion-one-clean-ui`.

## Public repositories verified empty
A direct recursive Git tree request returned GitHub HTTP 409 `Git Repository is empty` for each of these:
- `pantavion-socialhub`
- `pantaai-template`
- `pantavion`
- `pantavion-one-main`
- `pantavion-voice-`
- `SocialConnect`

There was therefore no source tree to copy from these repositories at the time of verification.

## Private source repositories known from Vercel evidence but not readable through the current GitHub connector
- `pandaconnect1/nextjs-ai-chatbot` — repository id `994952595`, Vercel reports visibility `private`; linked to Vercel project `pantaai` and `nextjs-ai-chatbot`.
- `pandaconnect1/pantaai-v1` — repository id `998179796`, Vercel reports visibility `private`; linked to Vercel projects `pantaai-v1` and `pantaai-v1-nf17`.

Their Vercel source/deployment provenance has been preserved under `docs/recovery/vercel-private-source-evidence/`. Their actual private source contents have NOT been copied into this public repository, because the current GitHub connector cannot read them and because publishing formerly private code to a public repository would change its confidentiality boundary.

## Preservation rule
No source repository, Vercel project, deployment, domain binding, branch, or historical evidence should be deleted until its preservation state has been independently verified. No secret credential, private user data, private database row content, or environment-variable secret value should be committed to this public repository.