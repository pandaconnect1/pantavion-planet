const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/kernel/pantavion-implementation-engine.ts",
  "scripts/pantavion-implementation-gate.cjs",
  "package.json",
];

const requiredEngineMarkers = [
  "pantavion_implementation_engine_v1",
  "No fake UI",
  "No visual-only features",
  "No fake connected systems",
  "No dead buttons",
  "No static-only completion claims",
  "No button without route API runtime function or disabled beta boundary",
  "No public private-data exposure",
  "No production/local mismatch",
  "No founder-sensitive change without founder approval",
  "No complete claim without audit, TypeScript, and build verification",
  "No architecture-only claim as implemented product behavior",
  "createPantavionImplementationPlan",
  "PantavionRealityProof",
  "createPantavionRealityProof",
  "pantavionRealityNonNegotiables",
  "founderApprovalRequired",
  "buildVerificationRequired",
  "auditRequired",
];

const failures = [];
const warnings = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) read(file);

const engine = read("core/kernel/pantavion-implementation-engine.ts");
const packageJsonText = read("package.json");

for (const marker of requiredEngineMarkers) {
  if (!engine.includes(marker)) {
    failures.push("Implementation engine missing marker: " + marker);
  }
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  const script = packageJson.scripts && packageJson.scripts["audit:implementation"];
  if (script !== "node scripts/pantavion-implementation-gate.cjs") {
    failures.push('package.json must include "audit:implementation": "node scripts/pantavion-implementation-gate.cjs"');
  }
}

const allowedCommandsMatch = engine.match(/allowedNextCommands:\s*\[([\s\S]*?)\]/);
if (allowedCommandsMatch && allowedCommandsMatch[1].includes("git add .")) {
  failures.push("Implementation engine must not allow git add . as an allowed command.");
}

if (/private infrastructure data is public/i.test(engine)) {
  failures.push("Implementation must not claim private infrastructure data is public.");
}

if (/implementation may be complete without build/i.test(engine)) {
  failures.push("Implementation must not allow completion without build verification.");
}

if (!engine.includes("PantavionImplementationRequest")) {
  warnings.push("Implementation request type not found.");
}

if (failures.length > 0) {
  console.error("PANTAVION IMPLEMENTATION GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION IMPLEMENTATION GATE: PASSED");
  console.log("- implementation engine contract present");
  console.log("- founder approval boundary present");
  console.log("- fake/static/dead-route risks represented");
  console.log("- audit/build/TypeScript verification boundary present");
  console.log("- reality proof contract present");
  console.log("- visual-only/static/fake implementation claims blocked");
}

if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) console.warn("- " + warning);
}
