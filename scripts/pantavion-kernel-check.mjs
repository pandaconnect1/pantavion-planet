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

addCheck("cad viewer adapter matrix exists", () => {
  const source = read("core/cad/cad-viewer-adapter-matrix.ts");
  assert(source.includes("PANTAVION_CAD_VIEWER_ADAPTER_MATRIX"), "Missing CAD viewer adapter matrix.");
  assert(source.includes("assessPantavionCadViewerAdapter"), "Missing CAD viewer assessment function.");
  assert(source.includes("oda_inweb_dwg_viewer"), "Missing ODA inWEB rule.");
  assert(source.includes("oda_mcp_future"), "Missing ODA MCP future rule.");
  assert(source.includes("autodesk_aps_cloud_viewer"), "Missing Autodesk APS cloud rule.");
  assert(source.includes("leaflet_geojson_as_original"), "Missing blocked Leaflet/GeoJSON original rule.");
  assert(source.includes("static_image_pdf_as_original"), "Missing blocked static/PDF original rule.");
  assert(source.includes("preserve_original"), "Missing preserve_original source-truth policy.");
  assert(source.includes("blocked"), "Missing blocked policy.");
});

addCheck("cad viewer adapter API route exists", () => {
  const source = read("app/api/kernel/cad-viewer-adapters/route.ts");
  assert(source.includes("export async function GET"), "Missing CAD GET route.");
  assert(source.includes("export async function POST"), "Missing CAD POST route.");
  assert(source.includes("appendPantavionCadViewerAudit"), "Missing CAD audit append.");
});

addCheck("cad viewer adapter audit exists", () => {
  const source = read("core/cad/cad-viewer-audit.ts");
  assert(source.includes("cad-viewer-adapters-audit.jsonl"), "Missing CAD JSONL audit path.");
  assert(source.includes("appendPantavionCadViewerAudit"), "Missing CAD audit function.");
});

addCheck("sensitive artifact vault exists", () => {
  const source = read("core/vault/sensitive-artifact-vault.ts");
  assert(source.includes("PANTAVION_SENSITIVE_ARTIFACT_RULES"), "Missing sensitive artifact rules.");
  assert(source.includes("assessPantavionSensitiveArtifact"), "Missing sensitive artifact assessment function.");
  assert(source.includes("dwg_master_source_truth"), "Missing DWG source-truth vault rule.");
  assert(source.includes("secret_or_token_artifact"), "Missing secret/token vault rule.");
  assert(source.includes("production_config_artifact"), "Missing production config vault rule.");
  assert(source.includes("legal_document_artifact"), "Missing legal document vault rule.");
  assert(source.includes("auth_user_data_artifact"), "Missing auth/user data vault rule.");
  assert(source.includes("billing_data_artifact"), "Missing billing vault rule.");
  assert(source.includes("backup_restore_artifact"), "Missing backup/restore vault rule.");
  assert(source.includes("sourceTruthMutationBlocked"), "Missing source-truth mutation block.");
});

addCheck("sensitive artifact vault API route exists", () => {
  const source = read("app/api/kernel/sensitive-artifact-vault/route.ts");
  assert(source.includes("export async function GET"), "Missing vault GET route.");
  assert(source.includes("export async function POST"), "Missing vault POST route.");
  assert(source.includes("appendPantavionSensitiveArtifactAudit"), "Missing vault audit append.");
});

addCheck("sensitive artifact vault audit exists", () => {
  const source = read("core/vault/sensitive-artifact-audit.ts");
  assert(source.includes("sensitive-artifact-vault-audit.jsonl"), "Missing vault JSONL audit path.");
  assert(source.includes("appendPantavionSensitiveArtifactAudit"), "Missing vault audit function.");
});

addCheck("PATCH 8D docs exist", () => {
  const source = read("docs/pantavion/sensitive-artifact-vault.md");
  assert(source.includes("PATCH 8D"), "Missing PATCH 8D doc heading.");
  assert(source.includes("Original source-truth artifacts are read-only and immutable by default."), "Missing source-truth immutability rule.");
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
