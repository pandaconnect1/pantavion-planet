const fs = require("fs");

const checks = [
  {
    file: "core/language/pantavion-language-atlas.ts",
    includes: ["PANTAVION_LANGUAGE_ATLAS_V1", "supports7000NaturalLanguages", "globalInitialCoverageMinimum"],
  },
  {
    file: "core/translation/pantavion-universal-interpreter.ts",
    includes: ["PANTAVION_UNIVERSAL_INTERPRETER_V1", "independentFromSos", "auto-bidirectional"],
  },
  {
    file: "core/ai/pantavion-ai-command-center.ts",
    includes: ["PANTAVION_AI_COMMAND_CENTER_V1", "publicGuide", "internalGuardian", "personalUserAssistant"],
  },
  {
    file: "core/sos/pantavion-sos-ai-center.ts",
    includes: ["PANTAVION_SOS_AI_CENTER_V1", "authorityDispatchRequiresContract"],
  },
  {
    file: "app/translate/page.tsx",
    includes: ["PANTAVION_UNIVERSAL_INTERPRETER_V1", "Scan image", "Speak input"],
  },
  {
    file: "app/panta-ai/page.tsx",
    includes: ["PANTAVION_AI_COMMAND_CENTER_V1", "Internal Guardian Kernel"],
  },
  {
    file: "app/sos/page.tsx",
    includes: ["PANTAVION_SOS_AI_CENTER_V1", "Emergency Circle", "Open interpreter"],
  },
  {
    file: "app/api/pantavion/translate/route.ts",
    includes: ["PANTAVION_TRANSLATION_PROVIDER_MISSING", "input_image"],
  },
  {
    file: "app/api/pantavion/ai/route.ts",
    includes: ["PANTAVION_AI_PROVIDER_MISSING", "buildPantaAiSystemInstruction"],
  },
  {
    file: "app/page.tsx",
    includes: ["/translate", "/panta-ai", "/sos", "The planet in one living screen"],
  },
];

let failed = false;

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    console.error(`[FAIL] Missing file: ${check.file}`);
    failed = true;
    continue;
  }

  const text = fs.readFileSync(check.file, "utf8");
  for (const marker of check.includes) {
    if (!text.includes(marker)) {
      console.error(`[FAIL] ${check.file} missing marker: ${marker}`);
      failed = true;
    }
  }
}

const languageRaw = fs.readFileSync("core/language/pantavion-language-atlas.ts", "utf8");
const match = languageRaw.match(/RAW_GLOBAL_LANGUAGE_NAMES = `([\s\S]*?)`;/);
const uniqueLanguages = match
  ? new Set(match[1].split("|").map((name) => name.trim()).filter(Boolean)).size
  : 0;

if (uniqueLanguages < 250) {
  console.error(`[FAIL] Language atlas below 250 unique global seeds: ${uniqueLanguages}`);
  failed = true;
} else {
  console.log(`[OK] Language atlas has ${uniqueLanguages} unique global seeds.`);
}

if (failed) {
  console.error("Pantavion master audit failed.");
  process.exit(1);
}

console.log("Pantavion master audit passed.");
