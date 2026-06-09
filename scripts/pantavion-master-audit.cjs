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
  "camera_sign_menu_document_scan",
]);

requireIncludes("core/ai/pantavion-ai-command-center.ts", [
  "PANTAVION_AI_COMMAND_CENTER_V1",
  "publicGuide",
  "internalGuardian",
  "personalUserAssistant",
]);

requireIncludes("core/sos/pantavion-sos-ai-center.ts", [
  "PANTAVION_SOS_AI_CENTER_V1",
  "authorityDispatchRequiresContract",
]);

requireIncludes("app/panta-ai/page.tsx", [
  "PANTAVION_AI_COMMAND_CENTER_V1",
  "Internal Guardian Kernel",
  "Provider-required",
]);

requireIncludes("app/sos/page.tsx", [
  "PANTAVION_SOS_AI_CENTER_V1",
  "Emergency Circle",
  "Open interpreter",
]);

requireIncludes("app/api/pantavion/ai/route.ts", [
  "PANTAVION_AI_PROVIDER_MISSING",
  "buildPantaAiSystemInstruction",
]);

requireIncludes("app/pantavion-home-client.tsx", [
  "/translate",
  "/panta-ai",
  "/sos",
  "The planet in one living screen",
  "Every button points to a real route or protected module",
]);

requireIncludes("app/translate/page.tsx", [
  "PantaTranslate / Universal Interpreter",
  "startListening",
  "SpeechRecognition",
  "speechSynthesis",
  "handleCameraFile",
  'type="file"',
  'accept="image/*"',
  'fetch("/api/translate/universal"',
]);

requireIncludes("app/api/translate/universal/route.ts", [
  "translateWithPantavionProvider",
  "PantavionTranslationRequest",
  "provider_error",
]);

requireAnyFileIncludes(
  ["app/api/translate/universal/route.ts", "core/translation/pantavion-translation-provider-adapters.ts"],
  ["provider_missing", "translatedText"],
  "real translation provider boundary",
);

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