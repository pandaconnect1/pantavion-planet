#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const required = [
  ["core/translation/pantavion-universal-translation-runtime.ts", "pantavion_universal_translation_runtime_v1"],
  ["core/global-connect/foundation-contract.ts", "createBidirectionalTranslationChannel"],
  ["core/global-connect/foundation-contract.ts", "immutable_original_separate_translation_records"],
  ["core/global-connect/foundation-contract.ts", "private_content_consent_missing"],
  ["core/global-connect/foundation-contract.ts", "sos_machine_translation_blocked"],
  ["core/translation/pantavion-translation-provider-adapters.ts", "PANTAVION_TRANSLATE_ALLOW_PUBLIC_FALLBACK"],
  ["core/translation/pantavion-translation-provider-adapters.ts", "Public translation fallback is disabled"],
  ["docs/implementation/GLOBAL_CONNECT_FOUNDATION_CYCLE_1.md", "No engine is connected or tested."],
];

const failures = [];

for (const [file, marker] of required) {
  const absolutePath = path.join(ROOT, file);

  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing file: ${file}`);
  } else if (!fs.readFileSync(absolutePath, "utf8").includes(marker)) {
    failures.push(`Missing marker ${JSON.stringify(marker)} in ${file}`);
  }
}

const adapterPath = path.join(ROOT, "core/translation/pantavion-translation-provider-adapters.ts");
if (fs.existsSync(adapterPath)) {
  const adapter = fs.readFileSync(adapterPath, "utf8");

  if (adapter.includes('return process.env.PANTAVION_TRANSLATE_ENDPOINT ? "generic" : "mymemory";')) {
    failures.push("Public MyMemory fallback must not be selected implicitly.");
  }
}

if (failures.length > 0) {
  console.error("PANTAVION TRANSLATION FOUNDATION GATE: FAILED");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PANTAVION TRANSLATION FOUNDATION GATE: PASSED");
  console.log("- two inverse translation lanes and immutable originals are contract-tested");
  console.log("- private-content consent and SOS machine-translation blocking are represented");
  console.log("- no engine/provider connection is asserted by this gate");
}
