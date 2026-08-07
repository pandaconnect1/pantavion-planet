const fs = require("fs");

const failures = [];

function read(file) {
  if (!fs.existsSync(file)) {
    failures.push("[FAIL] Missing file: " + file);
    return "";
  }

  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function requireIncludes(file, markers) {
  const text = read(file);

  for (const marker of markers) {
    if (!text.includes(marker)) {
      failures.push("[FAIL] " + file + " missing marker: " + marker);
    }
  }
}

function requireAnyFileIncludes(files, markers, label) {
  const combined = files.map((file) => read(file)).join("\n");

  for (const marker of markers) {
    if (!combined.includes(marker)) {
      failures.push("[FAIL] " + label + " missing marker: " + marker);
    }
  }
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

// Global language/translation contracts remain part of the product kernel.
requireIncludes("core/language/pantavion-language-atlas.ts", [
  "PANTAVION_LANGUAGE_ATLAS_V1",
  "supports7000NaturalLanguages",
  "globalInitialCoverageMinimum",
]);

requireIncludes("core/translation/pantavion-universal-interpreter.ts", [
  "PANTAVION_UNIVERSAL_INTERPRETER_V1",
  "independentFromSos",
  "auto-bidirectional",
]);

requireIncludes("core/translation/pantavion-natural-language-universe.ts", [
  "pantavion_natural_language_universe_v1",
  "targetNaturalLanguageCount",
  "practicalWorldMenuMinimum",
]);

// Public production must be product-facing, not a development status board.
requireIncludes("app/pantavion-home-client.tsx", [
  "Pantavion One",
  "/professional/infrastructure/water",
]);

// Translation must call a real backend route and preserve both directions.
requireIncludes("app/translate/page.tsx", [
  "PantaTranslate / Universal Interpreter",
  "startListening",
  "SpeechRecognition",
  "speechSynthesis",
  'fetch("/api/pantavion/translate"',
  "from,",
  "to,",
]);

requireIncludes("app/api/pantavion/translate/route.ts", [
  "sourceLanguage",
  "targetLanguage",
  "translatedText",
  "translateWithPantavionProvider",
]);

requireAnyFileIncludes(
  [
    "app/api/pantavion/translate/route.ts",
    "app/api/translate/universal/route.ts",
    "core/translation/pantavion-translation-provider-adapters.ts",
    "core/translation/pantavion-translation-provider-router.ts",
  ],
  ["provider_pending", "translatedText", "mymemory"],
  "real translation provider boundary",
);

// Social release must have real server-side Supabase reads/writes, not static cards.
requireIncludes("app/daily/feed/actions.ts", [
  "createPost",
  "toggleLike",
  "addComment",
  '.from("social_posts")',
  '.from("social_reactions")',
  '.from("social_comments")',
]);

requireIncludes("app/social/chat/actions.ts", [
  "createConversation",
  "sendMessage",
  '.from("conversations")',
  '.from("conversation_members")',
  '.from("messages")',
]);

requireIncludes("app/social/communities/actions.ts", [
  "createCommunity",
  "joinCommunity",
  '.from("communities")',
  '.from("community_memberships")',
]);

requireIncludes("app/social/notifications/actions.ts", [
  "markNotificationRead",
  "markAllNotificationsRead",
  '.from("social_notifications")',
]);

requireIncludes("supabase/migrations/20260806095000_social_core_foundation.sql", [
  "social_posts",
  "social_comments",
  "social_reactions",
  "social_notifications",
  "enable row level security",
]);

requireIncludes("supabase/migrations/20260806102500_social_chat_communities.sql", [
  "conversations",
  "conversation_members",
  "messages",
  "communities",
  "community_memberships",
  "enable row level security",
]);

const languageUniverse = read("core/translation/pantavion-natural-language-universe.ts");
const emergencyLanguages = read("core/emergency/global-emergency-languages.ts");

const targetNaturalLanguageCount = /targetNaturalLanguageCount:\s*7000/.test(languageUniverse);
const practicalMinimum = /practicalWorldMenuMinimum:\s*250/.test(languageUniverse);
const practicalLanguageCount = countMatches(emergencyLanguages, /\{\s*code:\s*"/g);

if (!targetNaturalLanguageCount) {
  failures.push("[FAIL] Natural language universe must preserve targetNaturalLanguageCount: 7000.");
}

if (!practicalMinimum) {
  failures.push("[FAIL] Natural language universe must preserve practicalWorldMenuMinimum: 250.");
}

if (practicalLanguageCount < 250) {
  failures.push("[FAIL] Practical emergency language menu below 250 entries: " + practicalLanguageCount);
} else {
  console.log("[OK] Practical emergency language menu has " + practicalLanguageCount + " entries.");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  console.error("Pantavion master audit failed.");
  process.exit(1);
}

console.log("Pantavion master audit passed.");
