const fs = require("fs");
const path = require("path");

const root = process.cwd();
const required = [
  ["core/vision/pantavion-vision-registry.ts", "pantavion_vision_registry_runtime_v1"],
  ["core/vision/pantavion-vision-registry.ts", "planet_world_screen"],
  ["core/vision/pantavion-vision-registry.ts", "universal_communication"],
  ["core/vision/pantavion-vision-registry.ts", "pantaai_center"],
  ["core/vision/pantavion-vision-registry.ts", "social_universe"],
  ["core/vision/pantavion-vision-registry.ts", "professional_infrastructure_water"],
  ["app/api/pantavion/vision/route.ts", "getPantavionVisionRuntimeReport"],
  ["app/pantavion/vision/page.tsx", "PANTAVION VISION REGISTRY RUNTIME"],
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
}

if (failures.length) {
  console.error("PANTAVION VISION REGISTRY GATE: FAILED");
  failures.forEach((failure) => console.error("- " + failure));
  process.exitCode = 1;
} else {
  console.log("PANTAVION VISION REGISTRY GATE: PASSED");
}
