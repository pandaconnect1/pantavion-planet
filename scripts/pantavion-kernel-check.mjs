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
  assert(source.includes("PANTAVION_CONVERSION_FORMAT_MATRIX"), "Missing conversion matrix.");
  assert(source.includes("cad_dwg_to_embedded_viewer"), "Missing DWG viewer conversion rule.");
});

addCheck("cad viewer adapter matrix exists", () => {
  const source = read("core/cad/cad-viewer-adapter-matrix.ts");
  assert(source.includes("PANTAVION_CAD_VIEWER_ADAPTER_MATRIX"), "Missing CAD adapter matrix.");
  assert(source.includes("oda_inweb_dwg_viewer"), "Missing ODA inWEB adapter rule.");
  assert(source.includes("static_image_pdf_as_original"), "Missing blocked static/PDF original rule.");
});

addCheck("sensitive artifact vault exists", () => {
  const source = read("core/vault/sensitive-artifact-vault.ts");
  assert(source.includes("PANTAVION_SENSITIVE_ARTIFACT_RULES"), "Missing sensitive vault.");
  assert(source.includes("dwg_master_source_truth"), "Missing DWG source-truth vault rule.");
});

addCheck("founder approval board exists", () => {
  const source = read("core/approval/founder-approval-board.ts");
  assert(source.includes("PantavionFounderApprovalRecord"), "Missing founder approval record.");
  assert(source.includes("Z3_Z4_ACTION_CLASSES"), "Missing protected action classes.");
});

addCheck("repo agent safety gate exists", () => {
  const source = read("core/agent/repo-agent-safety-gate.ts");
  assert(source.includes("PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS"), "Missing blocked repo commands.");
  assert(source.includes("createPantavionAiCodeProvenanceRecord"), "Missing AI provenance.");
});

addCheck("startup builder stack exists", () => {
  const source = read("core/startup/startup-builder-stack.ts");
  assert(source.includes("PANTAVION_STARTUP_BUILDER_STACK"), "Missing startup builder stack.");
  assert(source.includes("code_writer_runtime"), "Missing code writer runtime.");
});

addCheck("agent execution reliability exists", () => {
  const source = read("core/agent/agent-execution-reliability.ts");
  assert(source.includes("assessPantavionAgentExecutionReliability"), "Missing execution reliability assessment.");
  assert(source.includes("checkpointPlan"), "Missing checkpoint plan.");
});

addCheck("original DWG source binding exists", () => {
  const source = read("core/water/original-dwg-source-binding.ts");
  assert(source.includes("PANTAVION_ORIGINAL_DWG_SOURCE_BINDING"), "Missing original DWG source binding.");
  assert(source.includes("GEORGE_MAP_MASTER_B_C_FINAL.dwg"), "Missing final DWG filename.");
  assert(source.includes("0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9"), "Missing final DWG sha256.");
});

addCheck("original DWG viewer bridge exists", () => {
  const source = read("core/water/original-dwg-viewer-bridge.ts");
  assert(source.includes("assessPantavionOriginalDwgViewerBridge"), "Missing original DWG viewer bridge.");
  assert(source.includes("surface: \"B\""), "Missing B bridge.");
  assert(source.includes("surface: \"C\""), "Missing C bridge.");
});

addCheck("licensed DWG adapter runtime contract exists", () => {
  const source = read("core/water/licensed-dwg-adapter-runtime-contract.ts");
  assert(source.includes("LICENSED_DWG_ADAPTER_RUNTIME_CONTRACTS"), "Missing licensed DWG adapter contracts.");
  assert(source.includes("oda_inweb_runtime_contract"), "Missing ODA runtime contract.");
  assert(source.includes("noFakeRender"), "Missing no fake render rule.");
});

addCheck("artifact intake registry exists", () => {
  const source = read("core/artifacts/artifact-intake-registry.ts");
  assert(source.includes("PANTAVION_ARTIFACT_INTAKE_RULES"), "Missing artifact intake rules.");
  assert(source.includes("assessPantavionArtifactIntake"), "Missing artifact intake assessment.");
  assert(source.includes("dwg_original_source_truth_intake"), "Missing DWG intake rule.");
  assert(source.includes("gis_source_intake"), "Missing GIS intake rule.");
  assert(source.includes("geojson_derivative_intake"), "Missing GeoJSON derivative rule.");
  assert(source.includes("direct_private_upload_session"), "Missing direct private upload strategy.");
  assert(source.includes("multipart_private_upload"), "Missing multipart upload strategy.");
  assert(source.includes("requiresPrivateStorage"), "Missing private storage requirement.");
  assert(source.includes("requiresSha256"), "Missing SHA256 requirement.");
  assert(source.includes("allowedForAutomaticPublicUse: false"), "Missing public use block.");
});

addCheck("artifact intake audit exists", () => {
  const source = read("core/artifacts/artifact-intake-audit.ts");
  assert(source.includes("artifact-intake-registry-audit.jsonl"), "Missing intake audit file.");
  assert(source.includes("appendPantavionArtifactIntakeAudit"), "Missing intake audit append.");
});

addCheck("artifact intake API route exists", () => {
  const source = read("app/api/kernel/artifact-intake-registry/route.ts");
  assert(source.includes("export async function GET"), "Missing intake GET route.");
  assert(source.includes("export async function POST"), "Missing intake POST route.");
  assert(source.includes("pantavion_universal_artifact_intake_registry"), "Missing intake capability.");
});

addCheck("PATCH 8L docs exist", () => {
  const source = read("docs/pantavion/artifact-intake-upload-source-registry.md");
  assert(source.includes("PATCH 8L"), "Missing PATCH 8L doc heading.");
  assert(source.includes("Large/source-truth artifacts must not be committed to Git."), "Missing no Git source-truth rule.");
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
