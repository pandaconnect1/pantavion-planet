import { existsSync, readFileSync } from "node:fs";

const checks = [];

function addCheck(name, fn) {
  checks.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`);
  return readFileSync(path, "utf8");
}

addCheck("conversion matrix exists", () => {
  const source = read("core/conversion/format-matrix.ts");
  assert(source.includes("PANTAVION_CONVERSION_FORMAT_MATRIX"), "Missing conversion matrix export.");
  assert(source.includes("assessPantavionConversionRequest"), "Missing conversion assessment function.");
  assert(source.includes("cad_dwg_to_embedded_viewer"), "Missing DWG embedded viewer rule.");
  assert(source.includes("cad_dwg_to_static_image_as_original"), "Missing blocked fake/static DWG rule.");
  assert(source.includes("requiresFounderApproval: true"), "Missing founder approval requirement.");
});

addCheck("conversion API route exists", () => {
  const source = read("app/api/kernel/conversion-matrix/route.ts");
  assert(source.includes("export async function GET"), "Missing GET route.");
  assert(source.includes("export async function POST"), "Missing POST route.");
  assert(source.includes("appendPantavionConversionAudit"), "Missing conversion audit append.");
});

addCheck("conversion audit exists", () => {
  const source = read("core/conversion/conversion-audit.ts");
  assert(source.includes("conversion-matrix-audit.jsonl"), "Missing JSONL audit path.");
  assert(source.includes("appendPantavionConversionAudit"), "Missing audit function.");
});

addCheck("PATCH 8B docs exist", () => {
  const source = read("docs/pantavion/conversion-format-matrix.md");
  assert(source.includes("PATCH 8B"), "Missing PATCH 8B doc heading.");
  assert(source.includes("Derivatives must never be presented as original source truth."), "Missing source-truth derivative rule.");
});

let failed = 0;

for (const check of checks) {
  try {
    check.fn();
    console.log(`PASS ${check.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${check.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) {
  console.error(`Pantavion kernel failed with ${failed} failing check(s).`);
  process.exit(1);
}

console.log("Pantavion kernel passed.");
