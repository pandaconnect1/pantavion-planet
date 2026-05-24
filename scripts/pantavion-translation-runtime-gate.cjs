const fs = require("fs");
const path = require("path");

const required = [
  ["core/translation/pantavion-universal-translation-runtime.ts", "pantavion_universal_translation_runtime_v1"],
  ["app/api/pantavion/translate/route.ts", "OPENAI_API_KEY"],
  ["app/api/pantavion/translate/route.ts", "https://api.openai.com/v1/responses"],
  ["app/pantavion/translate-live/page.tsx", "PANTAVION UNIVERSAL TRANSLATION RUNTIME"],
];

const failures = [];

for (const [file, marker] of required) {
  if (!fs.existsSync(path.join(process.cwd(), file))) failures.push("Missing file: " + file);
  else if (!fs.readFileSync(path.join(process.cwd(), file), "utf8").includes(marker)) failures.push("Missing marker: " + marker);
}

if (failures.length) {
  console.error("PANTAVION TRANSLATION RUNTIME GATE: FAILED");
  failures.forEach((failure) => console.error("- " + failure));
  process.exitCode = 1;
} else {
  console.log("PANTAVION TRANSLATION RUNTIME GATE: PASSED");
}
