const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredF (const file of requiredFiles) {
  read(file);
}

const source = read("core/kernel/pantavion-autonomous-builder-kernel.ts");
const packageJsonText = read("package.json");

for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    failures.push(`Autonomous builder kernel missing marker: ${marker}`);
  }
}

let packageJson = null;

try {
  packageJson = JSON.parse(packageJsonText);
} catch (error) {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  const script = packageJson.scripts && packageJson.scripts["audit:autonomous-builder"];

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
  console.log("- audit TypeScript and build verification boundaries present");
}
