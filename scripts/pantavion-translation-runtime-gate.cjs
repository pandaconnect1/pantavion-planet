const fs = require("fs");
const path = require("path");

const required = [
  ["core/translation/pantavion-universal-translation-runtime.ts", "pantavion_universal_translation_runtime_v1"],
  ["core/translation/pantavion-gateway-resilience.ts", "buildPantavionGatewayModelPlan"],
  ["core/translation/pantavion-gateway-resilience.ts", "providerNamespace"],
  ["core/translation/pantavion-direct-openai-translation.ts", "translateWithPantavionDirectOpenAI"],
  ["core/translation/pantavion-direct-openai-translation.ts", "https://api.openai.com/v1/responses"],
  ["core/translation/pantavion-translation-provider-adapters.ts", "getPantavionDirectOpenAITranslationStatus().configured"],
  ["core/translation/pantavion-translation-provider-adapters.ts", "provider === \"openai\""],
  ["app/api/pantavion/translate/route.ts", "pantavionGatewayRuntimeAvailable"],
  ["app/api/pantavion/translate/route.ts", "Promise.any"],
  ["app/api/pantavion/translate/route.ts", "models: input.lane.fallbackModels"],
  ["app/api/pantavion/translate/route.ts", "hedgedLanes"],
  ["app/api/pantavion/translate/route.ts", "GATEWAY_HEDGE_DELAY_MS"],
  ["app/api/pantavion/translate/route.ts", "pantavionPublicTranslationFallbackAllowed"],
  ["app/api/pantavion/translate/route.ts", "configuredProviderAllowed"],
  ["app/pantavion/translate-live/page.tsx", "PANTAVION UNIVERSAL TRANSLATION RUNTIME"],
];

const forbidden = [
  ["app/api/pantavion/translate/route.ts", "publicTextFallback: true", "Public translation fallback must not be hard-enabled."],
  ["app/api/pantavion/translate/route.ts", "publicFallbackAllowed = true", "Public fallback policy must remain configuration-controlled."],
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
  console.log("- AI Gateway hedged dual-lane execution: present");
  console.log("- Provider-diverse lane planning: present");
  console.log("- Existing direct private AI failover path: present");
  console.log("- Public fallback policy remains runtime-controlled: present");
  console.log("- Provider-neutral configured fallback boundary: present");
}
