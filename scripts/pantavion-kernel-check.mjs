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

addCheck("cad viewer adapter matrix exists", () => {
  const source = read("core/cad/cad-viewer-adapter-matrix.ts");
  assert(source.includes("PANTAVION_CAD_VIEWER_ADAPTER_MATRIX"), "Missing CAD viewer adapter matrix.");
  assert(source.includes("oda_inweb_dwg_viewer"), "Missing ODA inWEB rule.");
  assert(source.includes("autodesk_aps_cloud_viewer"), "Missing Autodesk APS cloud rule.");
  assert(source.includes("leaflet_geojson_as_original"), "Missing blocked Leaflet/GeoJSON original rule.");
  assert(source.includes("static_image_pdf_as_original"), "Missing blocked static/PDF original rule.");
});

addCheck("sensitive artifact vault exists", () => {
  const source = read("core/vault/sensitive-artifact-vault.ts");
  assert(source.includes("PANTAVION_SENSITIVE_ARTIFACT_RULES"), "Missing sensitive artifact rules.");
  assert(source.includes("dwg_master_source_truth"), "Missing DWG source-truth vault rule.");
  assert(source.includes("secret_or_token_artifact"), "Missing secret/token vault rule.");
  assert(source.includes("sourceTruthMutationBlocked"), "Missing source-truth mutation block.");
});

addCheck("founder approval board exists", () => {
  const source = read("core/approval/founder-approval-board.ts");
  assert(source.includes("PantavionFounderApprovalRecord"), "Missing founder approval record type.");
  assert(source.includes("createPantavionFounderApprovalRecord"), "Missing founder approval creation logic.");
  assert(source.includes("decidePantavionFounderApprovalRecord"), "Missing founder approval decision logic.");
  assert(source.includes("assessPantavionFounderApprovalRecord"), "Missing founder approval assessment logic.");
  assert(source.includes("Z3_Z4_ACTION_CLASSES"), "Missing Z3/Z4 protected action classes.");
  assert(source.includes("dwg_source_truth"), "Missing DWG/source-truth approval class.");
  assert(source.includes("secret_access"), "Missing secret approval class.");
  assert(source.includes("production_deploy"), "Missing production deploy approval class.");
  assert(source.includes("billing_payment"), "Missing billing approval class.");
  assert(source.includes("auth_user_access"), "Missing auth/user approval class.");
  assert(source.includes("backup_restore"), "Missing backup/restore approval class.");
  assert(source.includes("blocksAutomaticExecution"), "Missing automatic execution block.");
});

addCheck("founder approval store exists", () => {
  const source = read("core/approval/founder-approval-store.ts");
  assert(source.includes("founder-approval-board.json"), "Missing founder approval state file.");
  assert(source.includes("founder-approval-board-audit.jsonl"), "Missing founder approval audit file.");
  assert(source.includes("createStoredPantavionFounderApprovalRequest"), "Missing stored approval create function.");
  assert(source.includes("decideStoredPantavionFounderApprovalRequest"), "Missing stored approval decision function.");
  assert(source.includes("appendPantavionFounderApprovalAudit"), "Missing approval audit append.");
});

addCheck("founder approval API route exists", () => {
  const source = read("app/api/kernel/founder-approval-board/route.ts");
  assert(source.includes("export async function GET"), "Missing approval GET route.");
  assert(source.includes("export async function POST"), "Missing approval POST route.");
  assert(source.includes("export async function PATCH"), "Missing approval PATCH route.");
  assert(source.includes("createStoredPantavionFounderApprovalRequest"), "Missing approval create route logic.");
  assert(source.includes("decideStoredPantavionFounderApprovalRequest"), "Missing approval decision route logic.");
});

addCheck("PATCH 8E docs exist", () => {
  const source = read("docs/pantavion/founder-approval-board.md");
  assert(source.includes("PATCH 8E"), "Missing PATCH 8E doc heading.");
  assert(source.includes("Z3/Z4 actions require founder approval before execution."), "Missing Z3/Z4 approval rule.");
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
