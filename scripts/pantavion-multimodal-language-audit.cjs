const fs = require("fs");
const path = require("path");

const root = process.cwd();
let failures = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function pass(message) {
  console.log("[PASS] " + message);
}

function fail(message) {
  failures += 1;
  console.error("[FAIL] " + message);
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    fail("Missing file: " + relativePath);
    return "";
  }

  pass("File exists: " + relativePath);
  return read(relativePath);
}

function requireMarker(content, label, marker) {
  if (content.includes(marker)) {
    pass(label + " marker present: " + marker);
  } else {
    fail(label + " marker missing: " + marker);
  }
}

console.log("=== Pantavion Multimodal Language Audit ===");

const contract = requireFile("core/i18n/pantavion-multimodal-language-contract.ts");
const readinessRoute = requireFile("app/api/professional/infrastructure/water/language/multimodal/readiness/route.ts");
const translateRoute = requireFile("app/api/professional/infrastructure/water/language/translate/route.ts");
const page = requireFile("app/professional/infrastructure/water/readiness/page.tsx");
const consoleComponent = requireFile("app/professional/infrastructure/water/readiness/water-multimodal-language-console.tsx");

const combined = [
  contract,
  readinessRoute,
  translateRoute,
  page,
  consoleComponent,
].join("\n");

const requiredMarkers = [
  "pantavion_multimodal_bidirectional_language_contract_v1",
  "textInput: true",
  "speechInput: true",
  "speechOutput: true",
  "audioInput: true",
  "imageTextExtraction: true",
  "subtitleGeneration: true",
  "bidirectionalConversation: true",
  "currentMinimumLanguageTarget: 250",
  "dialectRoadmapTarget: 7200",
  "providerActivationAllowed: false",
  "waterNetworkDataReturned: false",
  "translatedTextReturned: false",
  "audioReturned: false",
  "imageTextReturned: false",
  "SpeechRecognition",
  "webkitSpeechRecognition",
  "SpeechSynthesisUtterance",
  "speechSynthesis",
  "Έλεγχος multimodal readiness",
  "Μίλησε / Speech input",
  "Άκου / Text-to-speech",
  "Δοκιμή translation provider contract",
  "/api/professional/infrastructure/water/language/multimodal/readiness",
  "/api/professional/infrastructure/water/language/translate",
];

for (const marker of requiredMarkers) {
  requireMarker(combined, "multimodal language", marker);
}

console.log("Failures: " + failures);

if (failures > 0) {
  process.exit(1);
}
