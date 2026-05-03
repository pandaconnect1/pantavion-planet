const fs = require("fs");

const registryPath = "core/emergency/global-emergency-languages.ts";
const patchScriptPath = "scripts/global-emergency-languages-patch.cjs";
const forceScriptPath = "scripts/force-fix-language-source.cjs";
const i18nPath = "core/emergency/lifeshield-emergency-i18n.ts";

const greekEscaped = "\\u0395\\u03bb\\u03bb\\u03b7\\u03bd\\u03b9\\u03ba\\u03ac";

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

let registry = read(registryPath);
registry = registry.replace(
  /\{ code: "el", label: "[^"]*" \}/,
  `{ code: "el", label: "${greekEscaped}" }`
);
write(registryPath, registry);

let patchScript = read(patchScriptPath);
if (patchScript) {
  patchScript = patchScript.replace(
    /\["el", "[^"]*"\]/,
    `["el", "${greekEscaped}"]`
  );
  write(patchScriptPath, patchScript);
}

let forceScript = read(forceScriptPath);
if (forceScript) {
  forceScript = forceScript.replace(
    /const greekLabel[^;]*;/,
    `const greekLabel = "${greekEscaped}";`
  );
  forceScript = forceScript.replace(
    /registry = registry\.replace\([\s\S]*?\);\nwrite\(registryPath, registry\);/,
    `registry = registry.replace(
  /\\{ code: "el", label: "[^"]*" \\}/,
  \`{ code: "el", label: "\${greekLabel}" }\`
);
write(registryPath, registry);`
  );
  write(forceScriptPath, forceScript);
}

let i18n = read(i18nPath);
i18n = i18n.replace(
  /export function normalizeEmergencyLanguage\([\s\S]*?\n\}\n\nconst englishCopy/,
  `export function normalizeEmergencyLanguage(
  language?: string | null
): EmergencyLanguage {
  return normalizeGlobalEmergencyLanguage(language);
}

const englishCopy`
);
write(i18nPath, i18n);

console.log("Greek label fixed with Unicode-safe source literal.");
