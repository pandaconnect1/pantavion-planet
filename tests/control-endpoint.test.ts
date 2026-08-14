import { describe, it } from 'vitest';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Basic tests for control endpoint signing and replay protection.
// These are skeletons — adapt to your test runner and environment.

describe('control endpoint', () => {
  it('rejects unsigned requests', async () => {
    const res = await fetch('http://localhost:3000/api/agents/translation/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 't1', intent: 'test' }) });
    if (res.status === 401) return;
    throw new Error('expected 401 for unsigned request');
  });

  it('accepts signed requests', async () => {
    const secret = process.env.PANTAVION_CONTROL_SHARED_SECRET || 'test-secret';
    const payload = { id: 't-signed', intent: 'test_translate', actor: { type: 'gpt', id: 'my-gpt' } };
    const raw = JSON.stringify(payload);
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const res = await fetch('http://localhost:3000/api/agents/translation/control', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-pantavion-gpt-signature': `sha256=${sig}` }, body: raw });
    if (res.status === 202) return;
    throw new Error('expected 202 for signed request');
  });
});
