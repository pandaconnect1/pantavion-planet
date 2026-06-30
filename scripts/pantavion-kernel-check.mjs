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


addCheck("water work order registry exists", () => {
  const source = read("core/water/water-work-order-registry.ts");
  assert(source.includes("assessPantavionWaterWorkOrder"), "Missing work order assessment.");
  assert(source.includes("fault"), "Missing fault workflow.");
  assert(source.includes("repair"), "Missing repair workflow.");
  assert(source.includes("replacement"), "Missing replacement workflow.");
  assert(source.includes("lost_covered_investigation"), "Missing lost/covered investigation workflow.");
  assert(source.includes("telemetry_check"), "Missing telemetry check workflow.");
  assert(source.includes("as_built_verification"), "Missing as-built verification workflow.");
  assert(source.includes("requiresFieldVerification"), "Missing field verification gate.");
  assert(source.includes("requiresPhotoRefs"), "Missing photo refs gate.");
  assert(source.includes("originalDwgMutationAllowed: false"), "Missing no original DWG mutation rule.");
  assert(source.includes("physicalControlAllowed: false"), "Missing no physical control rule.");
  assert(source.includes("scadaWriteAllowed: false"), "Missing no SCADA write rule.");
});

addCheck("water work order registry store exists", () => {
  const source = read("core/water/water-work-order-registry-store.ts");
  assert(source.includes("water-work-order-registry-state.json"), "Missing work order state file.");
  assert(source.includes("water-work-order-registry-audit.jsonl"), "Missing work order audit file.");
  assert(source.includes("registerPantavionWaterWorkOrder"), "Missing work order register function.");
});

addCheck("water work order registry API route exists", () => {
  const source = read("app/api/kernel/water-work-order-registry/route.ts");
  assert(source.includes("export async function GET"), "Missing work order GET route.");
  assert(source.includes("export async function POST"), "Missing work order POST route.");
  assert(source.includes("pantavion_water_work_order_field_verification_registry"), "Missing work order capability.");
  assert(source.includes("mode === \"register\""), "Missing work order register mode.");
});

addCheck("PATCH 8Q docs exist", () => {
  const source = read("docs/pantavion/water-work-order-field-verification-registry.md");
  assert(source.includes("PATCH 8Q"), "Missing PATCH 8Q doc heading.");
  assert(source.includes("Work Order / Field Verification Registry"), "Missing work order doc scope.");
  assert(source.includes("Original DWG is never mutated."), "Missing no DWG mutation doc rule.");
  assert(source.includes("No SCADA write."), "Missing no SCADA write doc rule.");
});


addCheck("python worker runtime exists", () => {
  const source = read("core/processing/python-worker-runtime-contract.ts");
  assert(source.includes("PANTAVION_PYTHON_WORKER_JOB_DEFINITIONS"), "Missing Python worker job definitions.");
  assert(source.includes("assessPantavionPythonWorkerRuntime"), "Missing Python worker assessment.");
  assert(source.includes("excel_xlsx_parse"), "Missing Excel worker job.");
  assert(source.includes("pdf_text_extract"), "Missing PDF text worker job.");
  assert(source.includes("pdf_ocr_extract"), "Missing PDF OCR worker job.");
  assert(source.includes("docx_text_extract"), "Missing DOCX worker job.");
  assert(source.includes("gis_spatial_index"), "Missing GIS spatial index worker job.");
  assert(source.includes("cad_text_index"), "Missing CAD/DWG text index worker job.");
  assert(source.includes("telemetry_timeseries_profile"), "Missing telemetry worker job.");
  assert(source.includes("hydraulic_epanet_prepare"), "Missing hydraulic/EPANET worker job.");
  assert(source.includes("sidecarOnly: true"), "Missing sidecar-only rule.");
  assert(source.includes("pythonExecutionAllowedNow: false"), "Missing no-execution-yet rule.");
  assert(source.includes("originalDwgMutationAllowed: false"), "Missing no original DWG mutation rule.");
});

addCheck("python worker runtime store exists", () => {
  const source = read("core/processing/python-worker-runtime-store.ts");
  assert(source.includes("python-worker-runtime-jobs.json"), "Missing Python worker state file.");
  assert(source.includes("python-worker-runtime-audit.jsonl"), "Missing Python worker audit file.");
  assert(source.includes("registerPantavionPythonWorkerJob"), "Missing Python worker register function.");
  assert(source.includes("registered_pending_worker"), "Missing pending worker status.");
});

addCheck("python worker runtime API route exists", () => {
  const source = read("app/api/kernel/python-worker-runtime/route.ts");
  assert(source.includes("export async function GET"), "Missing Python worker GET route.");
  assert(source.includes("export async function POST"), "Missing Python worker POST route.");
  assert(source.includes("pantavion_python_worker_runtime_contract"), "Missing Python worker capability.");
  assert(source.includes("mode === \"register\""), "Missing Python worker register mode.");
});

addCheck("PATCH 8R docs exist", () => {
  const source = read("docs/pantavion/python-worker-runtime-contract.md");
  assert(source.includes("PATCH 8R"), "Missing PATCH 8R doc heading.");
  assert(source.includes("Python Worker Runtime Contract"), "Missing Python worker doc scope.");
  assert(source.includes("Original DWG is never mutated."), "Missing no DWG mutation doc rule.");
  assert(source.includes("No SCADA write."), "Missing no SCADA write doc rule.");
});


addCheck("private upload session exists", () => {
  const source = read("core/storage/private-upload-session-contract.ts");
  assert(source.includes("PANTAVION_PRIVATE_UPLOAD_SUPPORTED_EXTENSIONS"), "Missing private upload supported extensions.");
  assert(source.includes("assessPantavionPrivateUploadSession"), "Missing private upload assessment.");
  assert(source.includes("dwg"), "Missing DWG upload support.");
  assert(source.includes("dxf"), "Missing DXF upload support.");
  assert(source.includes("dgn"), "Missing DGN upload support.");
  assert(source.includes("multipart_private_upload"), "Missing multipart upload strategy.");
  assert(source.includes("chunked_resumable_upload"), "Missing chunked resumable upload strategy.");
  assert(source.includes("privateStorageOnly: true"), "Missing private storage only rule.");
  assert(source.includes("noGitStorage: true"), "Missing no Git storage rule.");
  assert(source.includes("noPublicFolder: true"), "Missing no public folder rule.");
  assert(source.includes("uploadBytesAllowedNow: false"), "Missing no bytes upload yet rule.");
  assert(source.includes("originalDwgMutationAllowed: false"), "Missing no original DWG mutation rule.");
});

addCheck("private upload session store exists", () => {
  const source = read("core/storage/private-upload-session-store.ts");
  assert(source.includes("private-upload-session-contracts.json"), "Missing private upload state file.");
  assert(source.includes("private-upload-session-audit.jsonl"), "Missing private upload audit file.");
  assert(source.includes("registerPantavionPrivateUploadSessionContract"), "Missing private upload register function.");
  assert(source.includes("registered_pending_adapter"), "Missing pending adapter status.");
});

addCheck("private upload session API route exists", () => {
  const source = read("app/api/kernel/private-upload-session/route.ts");
  assert(source.includes("export async function GET"), "Missing private upload GET route.");
  assert(source.includes("export async function POST"), "Missing private upload POST route.");
  assert(source.includes("pantavion_private_storage_upload_session_multipart_contract"), "Missing private upload capability.");
  assert(source.includes("mode === \"register\""), "Missing private upload register mode.");
});

addCheck("PATCH 8S docs exist", () => {
  const source = read("docs/pantavion/private-storage-upload-session-multipart-contract.md");
  assert(source.includes("PATCH 8S"), "Missing PATCH 8S doc heading.");
  assert(source.includes("Private Storage Upload Session / Multipart Contract"), "Missing private upload doc scope.");
  assert(source.includes("This patch does not upload bytes yet."), "Missing no-upload-yet doc rule.");
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
