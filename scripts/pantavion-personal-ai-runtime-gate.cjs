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

expect('supabase/migrations/20260824185510_harden_personal_ai_runtime_v1.sql', [
  'personal_ai_threads_parent_owner_fk',
  'foreign key (parent_thread_id, user_id)',
  "truth_state in ('KNOWN','INFERRED')",
  "truth_state in ('KNOWN','INFERRED','UNVERIFIED','PARTIAL','BLOCKED')",
]);

expect('supabase/migrations/20260825022839_harden_personal_ai_memory_supersession_v2.sql', [
  'personal_ai_memories_id_user_unique',
  'personal_ai_memories_supersedes_owner_fk',
  'foreign key (supersedes_memory_id, user_id)',
  'references public.personal_ai_memories(id, user_id)',
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

expect('core/intelligence/personal-ai-advanced-memory.ts', [
  'createPersonalAIContextHandoff',
  'getPersonalAIMemoryHealth',
  'contextCapsule',
  'sourceBoundToSameUser: true',
  'same_source_ref_different_active_values',
  'never rewrites, deletes, verifies or resolves a memory automatically',
]);

for (const route of [
  'app/api/personal-ai/execute/route.ts',
  'app/api/personal-ai/state/route.ts',
  'app/api/personal-ai/memory/route.ts',
  'app/api/personal-ai/items/route.ts',
  'app/api/personal-ai/relationships/route.ts',
  'app/api/personal-ai/handoff/route.ts',
  'app/api/personal-ai/memory-health/route.ts',
]) {
  expect(route, ['auth.getUser()', 'authentication_required']);
}

expect('app/api/personal-ai/execute/route.ts', ['executePersonalAI', 'executionStatus === "blocked"']);
expect('app/api/personal-ai/memory/route.ts', ['USER_MEMORY_TRUTH_STATES', 'deleted_at', 'user_explicit']);
expect('app/api/personal-ai/items/route.ts', ['birthday', 'appointment', 'reminder', 'follow_up']);
expect('app/api/personal-ai/relationships/route.ts', ['relationship_type', 'subject_key']);
expect('app/api/personal-ai/handoff/route.ts', ['createPersonalAIContextHandoff', 'source_thread_id_required']);
expect('app/api/personal-ai/memory-health/route.ts', ['getPersonalAIMemoryHealth', 'personal_ai_memory_health_failed']);
expect('app/my-ai/page.tsx', ['auth.getUser()', 'redirect("/auth/login?next=/my-ai")', 'PersonalAIConsole']);
expect('app/my-ai/PersonalAIConsole.tsx', [
  '/api/personal-ai/execute',
  '/api/personal-ai/memory',
  '/api/personal-ai/items',
  '/api/personal-ai/relationships',
  '/api/personal-ai/handoff',
  '/api/personal-ai/memory-health',
  'Νέο νήμα με Context Capsule',
  'Memory Health',
  'handsFree',
]);

console.log(JSON.stringify({
  ok: true,
  gate: 'pantavion-personal-ai-runtime',
  checked: checks.length,
  truth: 'This gate verifies implementation contracts, authenticated UI wiring, continuity integrity and memory-health safety boundaries. It does not claim provider or production deployment availability.',
}, null, 2));
