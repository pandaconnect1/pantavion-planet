const fs = require("fs");

const requiredFiles = [
  "package.json",
  "tsconfig.json",
  "core/kernel/kernel.ts"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error("PANTAVION CLOUD AGENT: FAILED");
  for (const file of missing) {
    console.error("- Missing required file: " + file);
  }
  process.exitCode = 1;
} else {
  console.log("PANTAVION CLOUD AGENT: PASSED");
  console.log("- repo baseline files found");
  console.log("- cloud agent placeholder is active");
  console.log("- no autonomous production mutation is allowed in this placeholder");
}
