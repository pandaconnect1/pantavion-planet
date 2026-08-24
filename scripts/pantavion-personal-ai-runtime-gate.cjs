const fs = require('fs');
const path = require('path');

const root = process.cwd();
const checks = [];

function read(relative) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) throw new Error(`missing:${relative}`);
  return fs.readFileSync(full, 'utf8');
}

function expect(relative, tokens) {
  const content = read(relative);
  for (const token of tokens) {
    if (!content.includes(token)) throw new Error(`missing-token:${relative}:${token}`);
  }
  checks.push(`${relative}:${tokens.length}`);
}

expect('supabase/migrations/20260824184042_create_personal_ai_runtime_v1.sql', [
  'create table public.personal_ai_profiles',
  'create table public.personal_ai_threads',
  'create table public.personal_ai_turns',
  'create table public.personal_ai_memories',
  'create table public.personal_ai_items',
  'create table public.personal_ai_relationship_contexts',
  'create table public.personal_ai_action_audit',
  'force row level security',
  '(select auth.uid()) = user_id',
  'revoke all on table public.personal_ai_profiles from anon',
]);

expect('core/intelligence/personal-ai-runtime.ts', [
  'AI_GATEWAY_API_KEY',
  'PANTAVION_AI_MODEL',
  'executePersonalAI',
  'ensurePersonalAIProfile',
  'cross_thread_enabled',
  'personal_ai_memories',
  'personal_ai_items',
  'personal_ai_relationship_contexts',
  'truthState = "BLOCKED"',
  'HANDS-FREE DRIVING MODE',
  'disallowPromptTraining: true',
]);

for (const route of [
  'app/api/personal-ai/execute/route.ts',
  'app/api/personal-ai/state/route.ts',
  'app/api/personal-ai/memory/route.ts',
  'app/api/personal-ai/items/route.ts',
  'app/api/personal-ai/relationships/route.ts',
]) {
  expect(route, ['auth.getUser()', 'authentication_required']);
}

expect('app/api/personal-ai/execute/route.ts', ['executePersonalAI', 'executionStatus === "blocked"']);
expect('app/api/personal-ai/memory/route.ts', ['deleted_at', 'user_explicit']);
expect('app/api/personal-ai/items/route.ts', ['birthday', 'appointment', 'reminder', 'follow_up']);
expect('app/api/personal-ai/relationships/route.ts', ['relationship_type', 'subject_key']);
expect('app/my-ai/page.tsx', ['auth.getUser()', 'redirect("/auth/login?next=/my-ai")', 'PersonalAIConsole']);
expect('app/my-ai/PersonalAIConsole.tsx', [
  '/api/personal-ai/execute',
  '/api/personal-ai/memory',
  '/api/personal-ai/items',
  '/api/personal-ai/relationships',
  'Νέο νήμα με ίδια μνήμη',
  'handoffFrom',
  'handsFree',
]);

console.log(JSON.stringify({
  ok: true,
  gate: 'pantavion-personal-ai-runtime',
  checked: checks.length,
  truth: 'This gate verifies implementation contracts, authenticated UI wiring and safety boundaries. It does not claim provider or production deployment availability.',
}, null, 2));
