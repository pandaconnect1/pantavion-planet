const fs = require("fs");
const path = require("path");

const root = process.cwd();
const required = [
  ["core/intelligence/pantavion-market-radar.ts", "pantavion_market_radar_kernel_v1"],
  ["app/api/pantavion/radar/route.ts", "getPantavionMarketRadarReport"],
  ["app/pantavion/radar/page.tsx", "PANTAVION MARKET RADAR KERNEL V1"],
  ["core/language/pantavion-global-language-runtime.ts", "pantavion_global_language_runtime_v1"],
  ["app/api/pantavion/language/route.ts", "pantavion_language"],
  [".github/workflows/pantavion-continuity-runtime.yml", "pantavion-continuity-runtime"],
];

const failures = [];

for (const [file, marker] of required) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push("Missing file: " + file);
    continue;
  }

  const content = fs.readFileSync(absolute, "utf8");
  if (!content.includes(marker)) failures.push("Missing marker in " + file + ": " + marker);
  if (content.includes("TODO") || content.includes("placeholder")) failures.push("Forbidden TODO/placeholder in " + file);
}

if (failures.length) {
  console.error("PANTAVION CONTINUITY RUNTIME GATE: FAILED");
  failures.forEach((failure) => console.error("- " + failure));
  process.exitCode = 1;
} else {
  console.log("PANTAVION CONTINUITY RUNTIME GATE: PASSED");
  console.log("- market radar runtime exists");
  console.log("- global language runtime exists");
  console.log("- cloud continuity workflow exists");
}
