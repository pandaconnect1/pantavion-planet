const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/kernel/pantavion-autonomous-builder-kernel.ts",
  "scripts/pantavion-autonomous-builder-gate.cjs",
  "package.json",
];

const requiredMarkers = [
  "pantavion_autonomous_builder_kernel_v1",
  "createPantavionAutonomousWorkOrder",
  "founderApprovalRequired",
  "auditRequired",
  "buildVerificationRequired",
  "typeScriptVerificationRequired",
  "externalAppCreationAllowed",
  "productionDeployAllowed",
  "blockedCommands",
];

const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

const files = Object.fromEntries(
  requiredFiles.map((file) => [file, read(file)]),
);

const source = files["core/kernel/pantavion-autonomous-builder-kernel.ts"];
const packageJsonText = files["package.json"];

for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    failures.push("Autonomous builder kernel missing marker: " + marker);
  }
}

let packageJson = null;

try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  const script = packageJson.scripts?.["audit:autonomous-builder"];

  if (script !== "node scripts/pantavion-autonomous-builder-gate.cjs") {
    failures.push(
      'package.json must include "audit:autonomous-builder": "node scripts/pantavion-autonomous-builder-gate.cjs"',
    );
  }
}

const forbiddenClaims = [
  {
    pattern: /guaranteed\s+autonomous\s+production\s+deploy/i,
    message: "Kernel must not claim guaranteed autonomous production deploy.",
  },
  {
    pattern: /ignore\s+founder\s+approval/i,
    message: "Kernel must not allow ignoring founder approval.",
  },
  {
    pattern: /skip\s+audit/i,
    message: "Kernel must not allow skipping audit.",
  },
];

for (const item of forbiddenClaims) {
  if (item.pattern.test(source)) {
    failures.push(item.message);
  }
}

if (failures.length > 0) {
  console.error("PANTAVION AUTONOMOUS BUILDER GATE: FAILED");

  for (const failure of failures) {
    console.error("- " + failure);
  }

  process.exitCode = 1;
} else {
  console.log("PANTAVION AUTONOMOUS BUILDER GATE: PASSED");
  console.log("- autonomous builder kernel contract present");
  console.log("- work order generator present");
  console.log("- founder approval boundary present");
  console.log("- internal and external app build targets represented");
  console.log("- audit, TypeScript, and build verification boundaries present");
}