const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

function file(pathname) {
  return path.join(root, pathname);
}

function exists(pathname) {
  return fs.existsSync(file(pathname));
}

function read(pathname) {
  return fs.readFileSync(file(pathname), "utf8");
}

function requireFile(pathname, reason) {
  if (!exists(pathname)) {
    failures.push(pathname + " missing -> " + reason);
  }
}

function requireText(pathname, text, reason) {
  if (!exists(pathname)) {
    failures.push(pathname + " missing -> " + reason);
    return;
  }

  const content = read(pathname);

  if (!content.includes(text)) {
    failures.push(pathname + " missing " + JSON.stringify(text) + " -> " + reason);
  }
}

requireFile("app/translate/page.tsx", "PantaTranslate public route must exist");
requireFile("app/interpreter/page.tsx", "Interpreter alias route must exist");
requireFile("app/translate/interpreter/page.tsx", "Two-speaker interpreter route must exist");
requireFile("app/pantavion-home-client.tsx", "Current public gateway must exist");
requireFile("app/api/translate/universal/route.ts", "Universal translation API route must exist");
requireFile("core/translation/pantavion-natural-language-universe.ts", "Natural language universe contract must exist");
requireFile("core/translation/pantavion-universal-interpreter-contract.ts", "Universal interpreter contract must exist");
requireFile("core/translation/pantavion-translation-provider-router.ts", "Translation provider router must exist");
requireFile("core/translation/pantavion-translation-provider-adapters.ts", "Real translation provider adapters must exist");
requireFile("app/api/translate/status/route.ts", "Translation provider status API must exist");
requireFile("components/pantavion/PantavionGlobalUiTranslationRuntime.tsx", "Global UI translation runtime must exist");
requireFile("app/pantavion-global-language-selector.tsx", "Global language selector must exist");

requireText("core/translation/pantavion-natural-language-universe.ts", "targetNaturalLanguageCount: 7000", "7000+ natural language target must be preserved");
requireText("core/translation/pantavion-universal-interpreter-contract.ts", "notSosOnly", "translation must not be SOS-only");
requireText("core/translation/pantavion-universal-interpreter-contract.ts", "samePhoneMode", "same-phone interpreter mode must be locked");
requireText("core/translation/pantavion-universal-interpreter-contract.ts", "twoDeviceMode", "two-device interpreter mode must be locked");
requireText("core/translation/pantavion-universal-interpreter-contract.ts", "socialMode", "social translation must be locked");
requireText("core/translation/pantavion-universal-interpreter-contract.ts", "cameraMode", "camera/sign/menu/document scan must be locked");
requireText("core/translation/pantavion-universal-interpreter-contract.ts", "elderSimpleMode", "elder simple interpreter must be locked");
requireText("app/translate/page.tsx", "PantaTranslate", "main translation route must identify PantaTranslate");
requireText("app/translate/page.tsx", "/api/pantavion/translate", "main translation route must call the live translation runtime");
requireText("app/translate/interpreter/page.tsx", "pantavion-interpreter", "two-speaker interpreter must call the translation runtime");
requireText("app/pantavion-home-client.tsx", "/translate", "current public gateway must expose translation entry");
requireText("app/layout.tsx", "PantavionGlobalUiTranslationRuntime", "global layout must mount the UI translation runtime");
requireText("app/layout.tsx", "PantavionGlobalLanguageSelector", "global layout must mount the language selector");
requireText("components/pantavion/PantavionGlobalUiTranslationRuntime.tsx", "/api/pantavion/translate", "global UI runtime must call the translation route");
requireText("core/translation/pantavion-translation-provider-adapters.ts", "translateWithPantavionProvider", "translation must call real provider adapter");
requireText("core/translation/pantavion-translation-provider-adapters.ts", "deepl", "DeepL adapter must be present");
requireText("core/translation/pantavion-translation-provider-adapters.ts", "azure", "Azure adapter must be present");
requireText("core/translation/pantavion-translation-provider-adapters.ts", "google", "Google adapter must be present");
requireText("core/translation/pantavion-translation-provider-adapters.ts", "libretranslate", "LibreTranslate adapter must be present");
requireText("app/sos/elder/page.tsx", "pantavion_global_language_v1", "elder language memory must remain global");

const world = exists("core/emergency/global-emergency-languages.ts")
  ? read("core/emergency/global-emergency-languages.ts")
  : "";

const languageCount = (world.match(/code:\s*"/g) || []).length;

if (languageCount < 250) {
  failures.push("core/emergency/global-emergency-languages.ts language count " + languageCount + " < 250");
}

if (failures.length) {
  console.log("\nPANTAVION TRANSLATION INTEGRITY FAILURES");
  for (const failure of failures) console.log("- " + failure);
  process.exit(1);
}

console.log("PASS: Pantavion translation kernel, PantaTranslate route, current public gateway entry, global language runtime, 7000-language target, 250+ practical menu, SOS binding, elder simple mode, social/camera/accessibility contracts are present.");
