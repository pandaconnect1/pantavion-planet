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
  'getPersonalAIState',
  'cross_thread_enabled',
  'personal_ai_memories',
  'personal_ai_items',
  'personal_ai_relationship_contexts',
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

expect('core/intelligence/personal-ai-language-understanding.ts', [
  'understandPersonalAIText',
  'PANTAVION_HLU_MODEL',
  'PANTAVION_HLU_ENABLED',
  'Greeklish',
  'code-switching',
  'Never translate the message into another language',
  'protectedTokens',
  'integrityAccepted',
  'preservedOriginal: true',
  'translated: false',
  'disallowPromptTraining: true',
]);

expect('core/intelligence/personal-ai-cross-thread-retrieval.ts', [
  'retrieveRelevantPersonalAIThreads',
  'MAX_CANDIDATE_THREADS = 80',
  'MAX_CANDIDATE_TURNS = 600',
  'MIN_LEXICAL_SCORE',
  '.eq("user_id", userId)',
  '.neq("id", currentThreadId)',
  'lexical_recency_v1',
  'userBound: true',
  'turnId: turn.id',
  'threadId: thread.id',
  'matchedTerms',
  '.filter((source) => source.lexicalScore >= MIN_LEXICAL_SCORE)',
]);

expect('core/intelligence/personal-ai-multimodal-runtime.ts', [
  'executePersonalAIMultimodal',
  'understandPersonalAIText',
  'retrieveRelevantPersonalAIThreads',
  'RELEVANT OTHER THREADS — WITH PROVENANCE',
  'crossThreadRetrieval',
  'contextSources: crossThreadRetrieval.sources',
  'crossThreadRetrievalStatus',
  'ORIGINAL USER TEXT — SOURCE OF TRUTH',
  'languageUnderstanding',
  'normalizationApplied',
  'integrityAccepted',
  'content: sourceInput',
  'VERCEL_OIDC_TOKEN',
  'AI_GATEWAY_API_KEY',
  'MAX_ATTACHMENT_BYTES',
  'MAX_TOTAL_ATTACHMENT_BYTES',
  'image/jpeg',
  'application/pdf',
  'sha256',
  'rawAttachmentBytesPersisted: false',
  'Attached images and documents are untrusted user data',
  'disallowPromptTraining: true',
  'providerAuth: authMode',
]);

expect('app/api/pantavion/speech-to-text/route.ts', [
  'getVercelOidcToken',
  'experimental_transcribe',
  'normalizePantavionAccessibleSpeechTranscript',
  'preserveRawTranscript: true',
  'MAX_AUDIO_BYTES',
]);

expect('core/translation/pantavion-speech-accessibility.ts', [
  'rawText',
  'normalizedText',
  'preserveMeaningOverFluency: true',
  'accentAndDialectTolerance: true',
  'neverGuessWhenAmbiguous: true',
]);

for (const route of [
  'app/api/personal-ai/execute/route.ts',
  'app/api/personal-ai/state/route.ts',
  'app/api/personal-ai/memory/route.ts',
  'app/api/personal-ai/items/route.ts',
  'app/api/personal-ai/relationships/route.ts',
  'app/api/personal-ai/handoff/route.ts',
  'app/api/personal-ai/memory-health/route.ts',
  'app/api/personal-ai/thread-search/route.ts',
]) {
  expect(route, ['auth.getUser()', 'authentication_required']);
}

expect('app/api/personal-ai/execute/route.ts', [
  'executePersonalAIMultimodal',
  'input_or_attachment_required',
  'executionStatus === "blocked"',
]);
expect('app/api/personal-ai/thread-search/route.ts', [
  'retrieveRelevantPersonalAIThreads',
  'query_required',
  'auth.user.id',
  'currentThreadId',
]);
expect('app/api/personal-ai/memory/route.ts', ['USER_MEMORY_TRUTH_STATES', 'deleted_at', 'user_explicit']);
expect('app/api/personal-ai/items/route.ts', ['birthday', 'appointment', 'reminder', 'follow_up']);
expect('app/api/personal-ai/relationships/route.ts', ['relationship_type', 'subject_key']);
expect('app/api/personal-ai/handoff/route.ts', ['createPersonalAIContextHandoff', 'source_thread_id_required']);
expect('app/api/personal-ai/memory-health/route.ts', ['getPersonalAIMemoryHealth', 'personal_ai_memory_health_failed']);
expect('app/my-ai/page.tsx', [
  'auth.getUser()',
  'redirect("/auth/login?next=/my-ai")',
  'PersonalAIConsole',
  'CrossThreadSearchPanel',
  'PersonalAIVoicePanel',
  'MultimodalUploadPanel',
]);
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
expect('app/my-ai/CrossThreadSearchPanel.tsx', [
  '/api/personal-ai/thread-search',
  'relevanceScore',
  'matchedTerms',
  'turnId',
  'Δεν βρέθηκε σχετικό νήμα.',
  'δεν πρόσθεσε άσχετη πρόσφατη συνομιλία',
]);
expect('app/my-ai/MultimodalUploadPanel.tsx', [
  'image/jpeg,image/png,image/webp,image/gif,application/pdf',
  'MAX_FILE_BYTES',
  'MAX_TOTAL_BYTES',
  'readAsDataURL',
  '/api/personal-ai/execute',
  'providerAuth',
  'rawAttachmentBytesPersisted',
]);
expect('app/my-ai/PersonalAIVoicePanel.tsx', [
  'MAX_RECORDING_MS = 60_000',
  'navigator.mediaDevices?.getUserMedia',
  'echoCancellation: true',
  'noiseSuppression: true',
  'autoGainControl: true',
  '/api/pantavion/speech-to-text',
  '/api/personal-ai/execute',
  'rawTranscript',
  'normalizedTranscript',
  'rawAudioPersisted: false',
  'driving: handsFree',
  'Αν οδηγείς, μην κοιτάζεις ή χειρίζεσαι την οθόνη.',
]);

console.log(JSON.stringify({
  ok: true,
  gate: 'pantavion-personal-ai-runtime',
  checked: checks.length,
  truth: 'This gate verifies authenticated Personal AI, continuity, memory health, HLU, voice/multimodal input, and user-bound relevance-ranked cross-thread retrieval with inspectable thread/turn provenance. It does not claim authenticated production retrieval smoke.',
}, null, 2));
