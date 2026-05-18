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
  "No dead buttons",
  "No static-only completion claims",
  "No git add .",
  "No public private-data exposure",
  "No production/local mismatch",
  "No founder-sensitive change without founder approval",
  "No complete claim without audit, TypeScript, and build verification",
  "createPantavionImplementationPlan",
  "founderApprovalRequired",
  "buildVerificationRequired",
  "auditRequired",
];

const failures = [];
const warnings = [];

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

const engine = read("core/kernel/pantavion-implementation-engine.ts");
const packageJsonText = read("package.json");

for (const marker of requiredEngineMarkers) {
  if (!engine.includes(marker)) {
    failures.push(`Implementation engine missing marker: ${marker}`);
  }
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageJsonText);
} catch (error) {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  const script = packageJson.scripts && packageJson.scripts["audit:implementation"];
  if (script !== "node scripts/pantavion-implementation-gate.cjs") {
    failures.push(
      'package.json must include "audit:implementation": "node scripts/pantavion-implementation-gate.cjs"',
    );
  }
}

const forbiddenPatterns = [
  {
    pattern: /git add \./,
    message: "Implementation files must not instruct use of git add .",
  },
  {
    pattern: /private infrastructure data is public/i,
    message: "Implementation must not claim private infrastructure data is public.",
  },
  {
    pattern: /complete without build/i,
    message: "Implementation must not allow completion without build verification.",
  },
];

for (const item of forbiddenPatterns) {
  if (item.pattern.test(engine)) {
    failures.push(item.message);
  }
}

if (!engine.includes("PantavionImplementationRequest")) {
  warnings.push("Implementation request type not found.");
}

if (failures.length > 0) {
  console.error("PANTAVION IMPLEMENTATION GATE: FAILED");
  for (const failure of failures) {
    console.error("- " + failure);
  }
  process.exitCode = 1;
} else {
  console.log("PANTAVION IMPLEMENTATION GATE: PASSED");
  console.log("- implementation engine contract present");
  console.log("- founder approval boundary present");
  console.log("- fake/static/dead-route risks represented");
  console.log("- audit/build/TypeScript verification boundary present");
}

if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) {
    console.warn("- " + warning);
  }
}
