# PantaAI v1 Vercel source-recovery evidence — 2026-09-14

Vercel reports GitHub repository `pandaconnect1/pantaai-v1`, repository id `998179796`, visibility `private`. The current GitHub connector cannot resolve the repository, so Vercel provenance is preserved here before any cleanup.

Projects using this source:
- `pantaai-v1-nf17` — `prj_EAWqpERO72KiDdYv2pXPhKZdPUGe`
- `pantaai-v1` — `prj_7grzRBApMytGyui5TzP2JTzxaR6k`

Both project histories returned the same six source commits:
- `9f6db83b15c9401647e14b98f72401f17c7b2905` — Initial commit — READY production deployments
- `1b514a9c353a6828eecf8ef85f6f5a7cc5d09c6b` — initial homepage setup — READY production deployments
- `b1b83470c153488264cce7aaf5cb0c252d3fa5c4` — Create package.json — ERROR deployments
- `7854a6cce4e0bb58348c9efa5b910615a0c34552` — Create next.config.js — ERROR deployments
- `af2c83f95d75cb58f8cb388aa7e20f52685e75ca` — Delete pages/next.config.js — ERROR deployments
- `cab42ccc04bafb9f7f0261156243b37cb46e97a3` — Create next.config.js — ERROR deployments

A READY build for commit `1b514a9c...` shows Vercel cloned `github.com/pandaconnect1/pantaai-v1`, restored build cache, ran Vercel CLI 44.2.10, completed `/vercel/output`, and deployed successfully. The initial `9f6db83...` deployment also cloned that private repository successfully.

Preservation boundary: no secret environment-variable values are recorded here. Do not delete either Vercel project or its Git linkage until the private repository/source is independently recovered.