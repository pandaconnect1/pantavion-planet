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
  assert(source.includes("derivativeMayReplaceOriginal: false"), "Missing derivative block.");
});

addCheck("original DWG viewer bridge exists", () => {
  const source = read("core/water/original-dwg-viewer-bridge.ts");
  assert(source.includes("assessPantavionOriginalDwgViewerBridge"), "Missing original DWG viewer bridge assessment.");
  assert(source.includes("PANTAVION_ORIGINAL_DWG_VIEWER_SURFACES"), "Missing original DWG viewer surfaces.");
  assert(source.includes("surface: \"B\""), "Missing B surface.");
  assert(source.includes("surface: \"C\""), "Missing C surface.");
  assert(source.includes("noDerivativeAsOriginal: true"), "Missing no derivative original rule.");
  assert(source.includes("automaticRenderBlocked: true"), "Missing automatic render block.");
  assert(source.includes("oda_inweb_dwg_viewer"), "Missing ODA adapter bridge.");
});

addCheck("original DWG viewer bridge audit exists", () => {
  const source = read("core/water/original-dwg-viewer-bridge-audit.ts");
  assert(source.includes("original-dwg-viewer-bridge-audit.jsonl"), "Missing viewer bridge audit file.");
  assert(source.includes("appendPantavionOriginalDwgViewerBridgeAudit"), "Missing viewer bridge audit append.");
});

addCheck("original DWG viewer bridge API route exists", () => {
  const source = read("app/api/kernel/original-dwg-viewer-bridge/route.ts");
  assert(source.includes("export async function GET"), "Missing viewer bridge GET route.");
  assert(source.includes("export async function POST"), "Missing viewer bridge POST route.");
  assert(source.includes("pantavion_b_c_original_dwg_viewer_bridge"), "Missing viewer bridge capability.");
});

addCheck("B and C pages are bridged", () => {
  const pageB = read("app/professional/infrastructure/water/b/page.tsx");
  const pageC = read("app/professional/infrastructure/water/c/page.tsx");
  assert(pageB.includes("OriginalDwgViewerBridgePanel"), "Surface B is not connected to bridge panel.");
  assert(pageB.includes("surface: \"B\""), "Surface B page is not bound to B.");
  assert(pageC.includes("OriginalDwgViewerBridgePanel"), "Surface C is not connected to bridge panel.");
  assert(pageC.includes("surface: \"C\""), "Surface C page is not bound to C.");
});

addCheck("PATCH 8J docs exist", () => {
  const source = read("docs/pantavion/original-dwg-viewer-bridge.md");
  assert(source.includes("PATCH 8J"), "Missing PATCH 8J doc heading.");
  assert(source.includes("No PDF, image, screenshot, GeoJSON"), "Missing no fake original rule.");
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
