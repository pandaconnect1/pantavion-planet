const fs = require("fs");
const path = require("path");

const required = [
  ["core/translation/pantavion-universal-translation-runtime.ts", "pantavion_universal_translation_runtime_v1"],
  ["app/api/pantavion/translate/route.ts", "pantavionGatewayRuntimeAvailable"],
  ["app/api/pantavion/translate/route.ts", "providerOptions"],
  ["app/api/pantavion/translate/route.ts", "models: fallbackModels"],
  ["app/api/pantavion/translate/route.ts", "nativeModelFallback: true"],
  ["app/api/pantavion/translate/route.ts", "pantavionPublicTranslationFallbackAllowed"],
  ["app/api/pantavion/translate/route.ts", "configuredProviderAllowed"],
  ["app/pantavion/translate-live/page.tsx", "PANTAVION UNIVERSAL TRANSLATION RUNTIME"],
];

const forbidden = [
  ["app/api/pantavion/translate/route.ts", "publicTextFallback: true", "Public translation fallback must not be hard-enabled."],
];

const failures = [];

for (const [file, marker] of required) {
  const absolute = path.join(process.cwd(), file);
  if (!fs.existsSync(absolute)) failures.push("Missing file: " + file);
  else if (!fs.readFileSync(absolute, "utf8").includes(marker)) failures.push("Missing marker: " + marker);
}

for (const [file, marker, message] of forbidden) {
  const absolute = path.join(process.cwd(), file);
  if (fs.existsSync(absolute) && fs.readFileSync(absolute, "utf8").includes(marker)) failures.push(message);
}

if (failures.length) {
  console.error("PANTAVION TRANSLATION RUNTIME GATE: FAILED");
  failures.forEach((failure) => console.error("- " + failure));
  process.exitCode = 1;
} else {
  console.log("PANTAVION TRANSLATION RUNTIME GATE: PASSED");
  console.log("- AI Gateway native model fallback: present");
  console.log("- Public fallback policy remains runtime-controlled: present");
  console.log("- Provider-neutral configured fallback boundary: present");
}
