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
  assert(source.includes("secret_or_token_artifact"), "Missing secret vault rule.");
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
  assert(source.includes("rollbackPlan"), "Missing rollback plan.");
});

addCheck("original DWG source binding exists", () => {
  const source = read("core/water/original-dwg-source-binding.ts");
  assert(source.includes("PANTAVION_ORIGINAL_DWG_SOURCE_BINDING"), "Missing original DWG source binding.");
  assert(source.includes("GEORGE_MAP_MASTER_B_C_FINAL.dwg"), "Missing final DWG filename.");
  assert(source.includes("205877448"), "Missing final DWG size.");
  assert(source.includes("0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9"), "Missing final DWG sha256.");
  assert(source.includes("sourceTruth: true"), "Missing source truth lock.");
  assert(source.includes("readOnly: true"), "Missing read-only lock.");
  assert(source.includes("immutable: true"), "Missing immutable lock.");
  assert(source.includes("derivativeMayReplaceOriginal: false"), "Missing derivative block.");
});

addCheck("original DWG verifier exists", () => {
  const source = read("core/water/original-dwg-source-verifier.ts");
  assert(source.includes("verifyPantavionOriginalDwgLocalFile"), "Missing local DWG verifier.");
  assert(source.includes("sha256File"), "Missing SHA256 verifier.");
  assert(source.includes("founderApproved"), "Missing founder approval gate.");
});

addCheck("original DWG audit exists", () => {
  const source = read("core/water/original-dwg-source-audit.ts");
  assert(source.includes("original-dwg-source-binding-audit.jsonl"), "Missing original DWG audit file.");
  assert(source.includes("appendPantavionOriginalDwgSourceAudit"), "Missing original DWG audit append.");
});

addCheck("original DWG API route exists", () => {
  const source = read("app/api/kernel/original-dwg-source-binding/route.ts");
  assert(source.includes("export async function GET"), "Missing original DWG GET route.");
  assert(source.includes("export async function POST"), "Missing original DWG POST route.");
  assert(source.includes("assessPantavionSensitiveArtifact"), "Missing vault connection.");
  assert(source.includes("assessPantavionCadViewerAdapter"), "Missing CAD adapter connection.");
});

addCheck("PATCH 8I docs exist", () => {
  const source = read("docs/pantavion/original-dwg-source-binding.md");
  assert(source.includes("PATCH 8I"), "Missing PATCH 8I doc heading.");
  assert(source.includes("No PDF, image, screenshot, GeoJSON"), "Missing no-derivative-as-original rule.");
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
