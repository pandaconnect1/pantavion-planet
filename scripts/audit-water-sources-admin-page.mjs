import { readFileSync } from "node:fs";

const page = readFileSync("app/professional/infrastructure/water/sources/page.tsx", "utf8");
const component = readFileSync("components/water/WaterSourcesAdminPanel.tsx", "utf8");

const requiredTokens = [
  "WaterSourcesAdminPanel",
  "assessPantavionArtifactIntake",
  "listPantavionArtifactIntakeRules",
  "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  "water-network-mobile.geojson",
  "Artifact Intake / Upload Source Registry",
  "DWG original source truth",
  "Supported intake rules"
];

const combined = `${page}\n${component}`;
const missing = requiredTokens.filter((token) => !combined.includes(token));

if (missing.length > 0) {
  console.error("Water sources admin page audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Water sources admin page audit passed.");
