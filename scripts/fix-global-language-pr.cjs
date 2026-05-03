const fs = require("fs");

const registryPath = "core/emergency/global-emergency-languages.ts";
const i18nPath = "core/emergency/lifeshield-emergency-i18n.ts";
const scriptPath = "scripts/global-emergency-languages-patch.cjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

const greekLabel = "\\u0395\\u03bb\\u03bb\\u03b7\\u03bd\\u03b9\\u03ba\\u03ac";

let registry = read(registryPath);
registry = registry.replace(
  /\\{ code: "el", label: "[^"]*" \\}/,
  `{ code: "el", label: "${greekLabel}" }`
);
write(registryPath, registry);

let script = read(scriptPath);
script = script.replace(
  /\\["el", "[^"]*"\\]/,
  `["el", "${greekLabel}"]`
);
write(scriptPath, script);

let i18n = read(i18nPath);

i18n = i18n.replace(
  /export function normalizeEmergencyLanguage\\(language\\?: string \\| null\\): EmergencyLanguage \\{[\\s\\S]*?\\n\\}/,
  `export function normalizeEmergencyLanguage(
  language?: string | null
): EmergencyLanguage {
  return normalizeGlobalEmergencyLanguage(language);
}`
);

write(i18nPath, i18n);

console.log("Fixed Greek label and global language normalization.");
