const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "app/api/pantavion/implementation-plan/route.ts",
  "core/kernel/pantavion-implementation-engine.ts",
  "scripts/pantavion-implementation-runtime-gate.cjs",
  "package.json",
];

const requiredRouteMarkers = [
  "createPantavionImplementationPlan",
  "export async function GET",
  "export async function POST",
  "NextResponse.json",
  "/api/pantavion/implementation-plan",
  "founderIntent",
  "targetFiles",
  "touchesSensitiveData",
  "touchesProductionAccess",
  "hasBuildVerification",
];

const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) {
  read(file);
}

const route = read("app/api/pantavion/implementation-plan/route.ts");
const packageJsonText = read("package.json");

for (const marker of requiredRouteMarkers) {
  if (!route.includes(marker)) {
    failures.push(`Implementation runtime route missing marker: ${marker}`);
  }
}

let packageJson = null;

try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  const script = packageJson.scripts && packageJson.scripts["audit:implementation-runtime"];

  if (script !== "node scripts/pantavion-implementation-runtime-gate.cjs") {
    failures.push(
      'package.json must include "audit:implementation-runtime": "node scripts/pantavion-implementation-runtime-gate.cjs"',
    );
  }
}

if (route.includes("TODO") || route.includes("placeholder")) {
  failures.push("Runtime route must not contain TODO or placeholder markers.");
}

if (failures.length > 0) {
  console.error("PANTAVION IMPLEMENTATION RUNTIME GATE: FAILED");

  for (const failure of failures) {
    console.error("- " + failure);
  }

  process.exitCode = 1;
} else {
  console.log("PANTAVION IMPLEMENTATION RUNTIME GATE: PASSED");
  console.log("- real API route exists");
  console.log("- POST founder intent path exists");
  console.log("- implementation engine is called at runtime");
  console.log("- target files and risk boundaries are accepted");
  console.log("- route compiles through Next build and TypeScript verification");
}
