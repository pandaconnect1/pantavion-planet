# Translation Agent (control + background worker)

This component implements a translation agent that:

- accepts signed control instructions from your GPT instance at POST /api/agents/translation/control
- queues control requests in the `control_requests` Supabase table
- provides a background worker scaffold (services/translation-agent.ts) that polls the durable execution store and handles translation and control tasks
- sends events back to your GPT using a configurable outbound URL and API key

Environment variables (add to your .env):

- PANTAVION_CONTROL_SHARED_SECRET - HMAC-SHA256 secret shared with your GPT for inbound verification
- PANTAVION_MYGPT_ENDPOINT - outbound callback URL for notifications
- PANTAVION_MYGPT_API_KEY - outbound bearer token
- PANTAVION_INTERNAL_BASE - base URL of the running Next.js app (defaults to http://localhost:3000)
- TRANSLATION_AGENT_POLL_MS - background worker poll interval (ms)

How to sign requests from your GPT (Node example):

```js
import crypto from 'crypto';
import fetch from 'node-fetch';

function signPayload(secret, json) {
  const raw = JSON.stringify(json);
  const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return { raw, header: `sha256=${sig}` };
}

async function sendControl(endpoint, secret, payload) {
  const { raw, header } = signPayload(secret, payload);
  return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-pantavion-gpt-signature': header }, body: raw });
}
```

Audit and approvals

- The control endpoint writes to `control_requests` with status `pending`.
- The background worker can be extended to require manual approval for guarded actions. By default, safe intents may be executed automatically; guarded intents should create a work-order and remain pending until approved.

Next steps

- Provide the shared secret to your GPT signing code and the outbound URL/api key for the agent to report results.
- If you want, I will add the DB migration SQL for the `control_requests` table and the automated approval UI.
