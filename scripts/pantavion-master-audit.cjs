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
]);

requireIncludes("app/translate/page.tsx", [
  "globalEmergencyLanguages",
  'fetch("/api/pantavion/translate"',
  "sourceLanguage",
  "targetLanguage",
  "swapDirection",
  "startListening",
  "speechSynthesis",
  "Μίλα & Μετάφραση",
  "Επόμενος ομιλητής",
  "7 ήπειροι",
]);

// Translation must be one shared engine before Social/Chat/Voice/Video are built
// on top of it. Group rooms fan out one original message to unique target languages.
requireIncludes("core/translation/pantavion-shared-translation-service.ts", [
  "PANTAVION_SHARED_TRANSLATION_SERVICE_ID",
  "translateWithPantavionSharedService",
  "translatePantavionMessageForTargets",
  "multiUserLanguageFanout",
  '"social"',
  '"chat"',
  '"voice"',
  '"video"',
  '"group_room"',
]);

requireIncludes("app/api/pantavion/translate/route.ts", [
  "translateWithPantavionSharedService",
  "normalizePantavionTranslationSurface",
  "pantavionSharedTranslationCapabilities",
  "publicTextFallback: true",
]);

requireIncludes("core/translation/pantavion-public-text-fallback.ts", [
  "api.mymemory.translated.net/get",
  "langpair",
  "translatedText",
  "mymemory_public_fallback",
]);

requireIncludes("app/pantavion-home-client.tsx", [
  "PANTAVION ONE",
  "Here We Are One. For All Humanity.",
  "/professional/infrastructure/water",
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
  failures.push("[FAIL] Practical world language catalog below 250 entries: " + practicalLanguageCount);
} else {
  console.log("[OK] Practical world language catalog has " + practicalLanguageCount + " entries.");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  console.error("Pantavion master audit failed.");
  process.exit(1);
}

console.log("Pantavion master audit passed.");
