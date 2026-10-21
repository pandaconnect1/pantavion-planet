# Pantavion — AI independence release gate

## Objective
Pantavion controls the user interface, routing, model choice, prompts, inference process, and data. A private llama.cpp server runs a separately licensed GGUF model on Render's private network. No request to an OpenAI, Vercel or third-party **inference** API is made by `/api/pantavion/ai` after this change.

This is independence from **AI vendors**, not independence from the Render hosting provider itself. Ultimate hosting independence would also require an owned or interchangeable server, a tested redeploy process and off-provider backups.

## Provisioning, NOT YET DONE
1. Review a legally usable model's license, safety, capabilities and source. Download the **actual GGUF weights** and verify SHA-256 before mounting them as `/models/pantavion.gguf`. Do not commit weights to GitHub or serve the weights publicly.
2. Review the recurring cost and memory of the optional `deploy/owned-ai/render.yaml` template (2 CPU, 8 GB, 25 GB persistent disk); then deliberately create the **new private service only** in Frankfurt. The Blueprint is *not* active merely because it exists in Git.
3. Set a strong independent secret `LLAMA_API_KEY` on the private AI service (Render secret). Set the same secret as `PANTAVION_OWNED_AI_BEARER_TOKEN` on the existing public Render app. Never store secrets in Git.
4. On the existing web app configure `PANTAVION_OWNED_AI_BASE_URL=http://pantavion-owned-ai:10000`, `PANTAVION_OWNED_AI_MODEL=pantavion-local`. Keep `PANTAVION_OWNED_AI_ENABLED` **unset or false** until the private model is running and independently verified.
5. Verify service `/health` and `/v1/chat/completions` over the private network with key, no outside fallback, Greek and multilingual quality, safety and prompt injection handling, bounded resource usage and 503 on upstream failure. Add persistent public request rate limits before exposing it at scale.
6. Only then set `PANTAVION_OWNED_AI_ENABLED=true` and verify `/api/pantavion/ai/health` returns 200, followed by an authenticated live answer from the PantaAI interface. Confirm unavailable model yields 503 without invoking an external AI provider.

## Production guardrails
- Existing web service `pantavion-planet` must **not** be reconfigured by the standalone private-service Blueprint.
- This AI branch must remain **draft/unmerged** until the model is provisioned: merging it earlier would make the existing public AI path return 503.
- This route intentionally refuses internal Guardian and personal-account personas on its unauthenticated endpoint. Personalized accounts require verified authentication and authorization first.
- Do not disable Pantavion registration, Water access or safety gates to make inference work.
- External AI SDK/OIDC use elsewhere (speech-to-text, interpreter, personal intelligence) is **not removed by this isolated change**. Those runtimes require separate, tested migrations.
- Vercel Blob objects and persistent file references **must be fully inventoried, copied, checksummed and restore-tested** before Vercel services or old tokens are deleted.
