const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "scripts/pantavion-safe-patch-writer.cjs",
  "scripts/pantavion-safe-patch-writer-gate.cjs",
  "data/pantavion-safe-patches/last-safe-patch-receipt.json",
  "core/capabilities/pantavion-capability-registry.ts",
  "app/api/pantavion/capabilities/route.ts",
  "scripts/pantavion-capability-registry-gate.cjs",
  "docs/continuity/pantavion-safe-patch-writer.md",
  "package.json"
];

function read(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const writer = read("scripts/pantavion-safe-patch-writer.cjs");
const receiptText = read("data/pantavion-safe-patches/last-safe-patch-receipt.json");
const pkgText = read("package.json");

const markers = [
  "allowedWriteRoots",
  "assertAllowedWrite",
  "isSafeSlice",
  "fallbackSlice",
  "capabilityRegistry",
  "capabilityRoute",
  "capabilityGate",
  "last-safe-patch-receipt.json"
];

for (const marker of markers) {
  if (!writer.includes(marker)) {
    failures.push("Safe patch writer missing marker: " + marker);
  }
}

let receipt = null;
let pkg = null;

try {
  receipt = JSON.parse(receiptText);
} catch {
  failures.push("Safe patch receipt invalid JSON.");
}

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (receipt) {
  if (!receipt.ok) failures.push("Safe patch receipt not ok.");
  if (!Array.isArray(receipt.wrote) || receipt.wrote.length < 3) {
    failures.push("Safe patch receipt must list generated files.");
  }

  if (!receipt.safety || receipt.safety.approvalRequiredBlocked !== true) {
    failures.push("Safe patch receipt must confirm approval blocking.");
  }
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["agent:safe-patch"] !== "node scripts/pantavion-safe-patch-writer.cjs") {
    failures.push("package.json missing agent:safe-patch.");
  }

  if (pkg.scripts["audit:safe-patch"] !== "node scripts/pantavion-safe-patch-writer-gate.cjs") {
    failures.push("package.json missing audit:safe-patch.");
  }

  if (pkg.scripts["audit:capability-registry"] !== "node scripts/pantavion-capability-registry-gate.cjs") {
    failures.push("package.json missing audit:capability-registry.");
  }
}

const dangerous = writer.toLowerCase();

if (dangerous.includes("push --force")) failures.push("Writer must not force push.");
if (dangerous.includes("vercel --prod")) failures.push("Writer must not production deploy.");
if (dangerous.includes("rm -rf")) failures.push("Writer must not contain destructive rm.");
if (dangerous.includes("process.env.") && dangerous.includes("secret")) {
  failures.push("Writer must not read secrets.");
}

if (failures.length > 0) {
  console.error("PANTAVION SAFE PATCH WRITER GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION SAFE PATCH WRITER GATE: PASSED");
  console.log("- safe patch writer present");
  console.log("- scoped write allowlist present");
  console.log("- receipt present");
  console.log("- generated capability registry present");
  console.log("- generated route present");
  console.log("- approval blocking present");
  console.log("- package scripts present");
}
