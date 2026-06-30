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
  assert(source.includes("allowedForAutomaticPublicUse: false"), "Missing public use block.");
});

addCheck("water sources admin page exists", () => {
  const page = read("app/professional/infrastructure/water/sources/page.tsx");
  const component = read("components/water/WaterSourcesAdminPanel.tsx");
  assert(page.includes("WaterSourcesAdminPanel"), "Missing water sources panel.");
  assert(component.includes("Artifact Intake / Upload Source Registry"), "Missing water sources heading.");
});

addCheck("water operational overlay exists", () => {
  const source = read("core/water/water-operational-overlay.ts");
  assert(source.includes("PANTAVION_WATER_OPERATIONAL_COLOR_POLICY"), "Missing water operational color policy.");
  assert(source.includes("assessPantavionWaterOperationalOverlay"), "Missing overlay assessment.");
  assert(source.includes("closed_temporary_fault"), "Missing blue temporary closed state.");
  assert(source.includes("closed_permanent"), "Missing red permanent closed state.");
  assert(source.includes("opened_after_repair"), "Missing green opened after repair state.");
  assert(source.includes("sv_replacement_required"), "Missing SV replacement required state.");
  assert(source.includes("sv_lost_or_covered"), "Missing lost/covered SV state.");
  assert(source.includes("cyan_lost_covered_ring"), "Missing cyan lost/covered ring intent.");
  assert(source.includes("dashed_ring"), "Missing dashed ring shape.");
  assert(source.includes("dashed_ring_white_hatch"), "Missing white hatch lost/covered ring shape.");
  assert(source.includes("white_hatch_lines"), "Missing white hatch visual distinction.");
  assert(source.includes("originalDwgMutationAllowed: false"), "Missing no original DWG mutation rule.");
  assert(source.includes("physicalValveControl: false"), "Missing no physical valve control rule.");
  assert(source.includes("scadaWriteAllowed: false"), "Missing no SCADA write rule.");
});

addCheck("water operational overlay store exists", () => {
  const source = read("core/water/water-operational-overlay-store.ts");
  assert(source.includes("water-operational-overlay-state.json"), "Missing overlay state file.");
  assert(source.includes("water-operational-overlay-audit.jsonl"), "Missing overlay audit file.");
  assert(source.includes("applyPantavionWaterOperationalOverlay"), "Missing overlay apply function.");
  assert(source.includes("restore_all_opened"), "Missing restore all opened workflow.");
});

addCheck("water operational overlay API route exists", () => {
  const source = read("app/api/kernel/water-operational-overlay/route.ts");
  assert(source.includes("export async function GET"), "Missing overlay GET route.");
  assert(source.includes("export async function POST"), "Missing overlay POST route.");
  assert(source.includes("pantavion_water_operational_overlay_sv_workflow"), "Missing overlay capability.");
  assert(source.includes("mark_sv_lost_or_covered"), "Missing lost/covered action route.");
});

addCheck("water operational overlay audit script exists", () => {
  const source = read("scripts/audit-water-operational-overlay.mjs");
  assert(source.includes("Water operational overlay audit passed."), "Missing overlay audit script.");
});

addCheck("PATCH 8O docs exist", () => {
  const source = read("docs/pantavion/water-operational-overlay-sv-workflow.md");
  assert(source.includes("PATCH 8O"), "Missing PATCH 8O doc heading.");
  assert(source.includes("Cyan dashed ring"), "Missing lost/covered ring documentation.");
  assert(source.includes("Original DWG is never mutated."), "Missing no DWG mutation doc rule.");
});


addCheck("water asset registry exists", () => {
  const source = read("core/water/water-asset-registry.ts");
  assert(source.includes("PANTAVION_WATER_ASSET_TYPE_REGISTRY"), "Missing water asset type registry.");
  assert(source.includes("assessPantavionWaterAssetRegistration"), "Missing water asset assessment.");
  assert(source.includes("SV"), "Missing SV asset kind.");
  assert(source.includes("FH"), "Missing FH asset kind.");
  assert(source.includes("PRV"), "Missing PRV asset kind.");
  assert(source.includes("DMA"), "Missing DMA asset kind.");
  assert(source.includes("TELEMETRY"), "Missing telemetry asset kind.");
  assert(source.includes("lost_or_covered"), "Missing lost/covered asset condition.");
  assert(source.includes("replacement_required"), "Missing replacement required condition.");
  assert(source.includes("originalDwgMutationAllowed: false"), "Missing no original DWG mutation rule.");
  assert(source.includes("physicalControlAllowed: false"), "Missing no physical control rule.");
  assert(source.includes("scadaWriteAllowed: false"), "Missing no SCADA write rule.");
});

addCheck("water asset registry store exists", () => {
  const source = read("core/water/water-asset-registry-store.ts");
  assert(source.includes("water-asset-registry-state.json"), "Missing water asset state file.");
  assert(source.includes("water-asset-registry-audit.jsonl"), "Missing water asset audit file.");
  assert(source.includes("registerPantavionWaterAsset"), "Missing water asset register function.");
});

addCheck("water asset registry API route exists", () => {
  const source = read("app/api/kernel/water-asset-registry/route.ts");
  assert(source.includes("export async function GET"), "Missing water asset GET route.");
  assert(source.includes("export async function POST"), "Missing water asset POST route.");
  assert(source.includes("pantavion_water_asset_registry_sv_fh_prv_dma_telemetry"), "Missing water asset capability.");
  assert(source.includes("mode === \"register\""), "Missing register mode.");
});

addCheck("PATCH 8P docs exist", () => {
  const source = read("docs/pantavion/water-asset-registry-sv-fh-prv-dma-telemetry.md");
  assert(source.includes("PATCH 8P"), "Missing PATCH 8P doc heading.");
  assert(source.includes("SV / FH / PRV / DMA / Telemetry"), "Missing asset registry doc scope.");
  assert(source.includes("Original DWG is never mutated."), "Missing no DWG mutation doc rule.");
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
