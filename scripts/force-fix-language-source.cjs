const fs = require("fs");

const registryPath = "core/emergency/global-emergency-languages.ts";
const i18nPath = "core/emergency/lifeshield-emergency-i18n.ts";
const patchScriptPath = "scripts/global-emergency-languages-patch.cjs";

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

let registry = fs.readFileSync(registryPath, "utf8");
registry = registry.replace('{ code: "el", label: "λληνικά" }', '{ code: "el", label: "λληνικά" }');
write(registryPath, registry);

let patchScript = fs.readFileSync(patchScriptPath, "utf8");
patchScript = patchScript.replace('["el", "λληνικά"]', '["el", "λληνικά"]');
write(patchScriptPath, patchScript);

let i18n = fs.readFileSync(i18nPath, "utf8");

const start = i18n.indexOf("export function normalizeEmergencyLanguage");
const end = i18n.indexOf("const englishCopy", start);

if (start < 0 || end < 0) {
  throw new Error("Could not locate normalizeEmergencyLanguage block.");
}

const replacement = `export function normalizeEmergencyLanguage(
  language?: string | null
): EmergencyLanguage {
  return normalizeGlobalEmergencyLanguage(language);
}

`;

i18n = i18n.slice(0, start) + replacement + i18n.slice(end);

write(i18nPath, i18n);

console.log("Source files fixed: Greek label + global normalization.");
