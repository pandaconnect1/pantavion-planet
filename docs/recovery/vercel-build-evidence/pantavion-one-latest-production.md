# pantavion-one latest production build evidence — 2026-09-14

Deployment `dpl_7n748GPUgAahXvmgBDbLJUBLUDYi` (`READY`, production) cloned `pandaconnect1/pantavion-one` at commit `402522eaaa8c30bb8cc0ef05829524ad6f1241d9` and built with Next.js 13.4.4.

Observed routes from the Vercel build log:
- `/`
- `/create`
- `/mind`
- `/pages/chat`
- `/pages/compass`
- `/pages/pages/mind`
- `/pages/pages/pages/create`
- `/people`
- `/pulse`
- `/voice`

Vercel also reported a duplicate `/page` source (`pages/page.js` and `pages/page.tsx`). The build completed and deployment completed successfully. The current source tree itself has also been copied into this preservation branch under `docs/recovery/legacy-source-snapshots/pantavion-one/`.

No secret environment values are stored in this evidence file.