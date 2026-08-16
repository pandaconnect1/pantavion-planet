const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const sourcePath = path.join(root, "core", "kernel", "conversion-format-matrix.ts");
const reportPath = path.join(root, ".pantavion", "kernel", "conversion-format-matrix-report.json");

const requiredTerms = [
  "supported_local",
  "provider_required",
  "requires_adapter",
  "manual_quote",
  "blocked_sensitive",
  ".dwg",
  ".dxf",
  ".rvt",
  ".heic",
  ".env",
  ".exe",
  "originalPreservation",
  "derivativeOnly"
];

function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error("Missing core/kernel/conversion-format-matrix.ts");
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  const missing = requiredTerms.filter((term) => !source.includes(term));

  const report = {
    ok: missing.length === 0,
    createdAt: new Date().toISOString(),
    checkedFile: "core/kernel/conversion-format-matrix.ts",
    requiredTerms,
    missing,
    recommendation:
      missing.length === 0
        ? "Conversion format matrix is present and includes required statuses/formats."
        : "Matrix is incomplete. Add missing required statuses/formats before commit."
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify(report, null, 2));

  if (missing.length > 0) {
    process.exit(1);
  }
}

main();
