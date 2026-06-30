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
  assert(source.includes("Z3_Z4_ACTION_CLASSES"), "Missing Z3/Z4 protected action classes.");
  assert(source.includes("blocksAutomaticExecution"), "Missing automatic execution block.");
});

addCheck("repo agent safety gate exists", () => {
  const source = read("core/agent/repo-agent-safety-gate.ts");
  assert(source.includes("PANTAVION_REPO_AGENT_ALLOWED_COMMAND_PATTERNS"), "Missing allowed command patterns.");
  assert(source.includes("PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS"), "Missing blocked command patterns.");
  assert(source.includes("PANTAVION_REPO_AGENT_APPROVAL_COMMAND_PATTERNS"), "Missing approval command patterns.");
  assert(source.includes("assessPantavionRepoAgentSafety"), "Missing repo safety assessment function.");
  assert(source.includes("createPantavionAiCodeProvenanceRecord"), "Missing AI code provenance record.");
  assert(source.includes("git_add"), "Missing git add action class.");
  assert(source.includes("secrets_access"), "Missing secrets action class.");
  assert(source.includes("production_deploy"), "Missing production deploy action class.");
  assert(source.includes("source_truth_change"), "Missing source-truth action class.");
  assert(source.includes("allowedForAutomaticExecution"), "Missing automatic execution decision.");
  assert(source.includes("requiredChecks"), "Missing required checks.");
});

addCheck("startup builder stack exists", () => {
  const source = read("core/startup/startup-builder-stack.ts");
  assert(source.includes("PANTAVION_STARTUP_BUILDER_STACK"), "Missing startup builder stack.");
  assert(source.includes("assessPantavionStartupBuilderRequest"), "Missing startup builder assessment function.");
  assert(source.includes("startup_ideation_engine"), "Missing ideation capability.");
  assert(source.includes("market_research_intake"), "Missing market research capability.");
  assert(source.includes("code_writer_runtime"), "Missing code writer runtime capability.");
  assert(source.includes("deployment_planner"), "Missing deployment planner capability.");
  assert(source.includes("legal_checklist_builder"), "Missing legal checklist capability.");
  assert(source.includes("finance_checklist_builder"), "Missing finance checklist capability.");
  assert(source.includes("sales_outreach_assistant"), "Missing sales outreach capability.");
  assert(source.includes("company_workspace_agents"), "Missing workspace agents capability.");
  assert(source.includes("requiresRepoSafetyGate"), "Missing repo safety gate requirement.");
  assert(source.includes("requiresSensitiveVaultCheck"), "Missing vault check requirement.");
  assert(source.includes("allowedForAutomaticExecution"), "Missing automatic execution decision.");
});

addCheck("startup builder audit exists", () => {
  const source = read("core/startup/startup-builder-audit.ts");
  assert(source.includes("startup-builder-stack-audit.jsonl"), "Missing startup builder audit file.");
  assert(source.includes("appendPantavionStartupBuilderAudit"), "Missing startup builder audit append.");
});

addCheck("startup builder API route exists", () => {
  const source = read("app/api/kernel/startup-builder-stack/route.ts");
  assert(source.includes("export async function GET"), "Missing startup builder GET route.");
  assert(source.includes("export async function POST"), "Missing startup builder POST route.");
  assert(source.includes("appendPantavionStartupBuilderAudit"), "Missing startup builder audit append in route.");
});

addCheck("PATCH 8G docs exist", () => {
  const source = read("docs/pantavion/startup-builder-stack-registry.md");
  assert(source.includes("PATCH 8G"), "Missing PATCH 8G doc heading.");
  assert(source.includes("No fake/static/UI-only startup builder capability."), "Missing no fake UI rule.");
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
