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
  assert(source.includes("cad_dwg_to_embedded_viewer"), "Missing DWG embedded viewer rule.");
});

addCheck("cad viewer adapter matrix exists", () => {
  const source = read("core/cad/cad-viewer-adapter-matrix.ts");
  assert(source.includes("PANTAVION_CAD_VIEWER_ADAPTER_MATRIX"), "Missing CAD matrix.");
  assert(source.includes("oda_inweb_dwg_viewer"), "Missing ODA rule.");
  assert(source.includes("static_image_pdf_as_original"), "Missing blocked static/PDF rule.");
});

addCheck("sensitive artifact vault exists", () => {
  const source = read("core/vault/sensitive-artifact-vault.ts");
  assert(source.includes("PANTAVION_SENSITIVE_ARTIFACT_RULES"), "Missing vault rules.");
  assert(source.includes("dwg_master_source_truth"), "Missing DWG source-truth rule.");
  assert(source.includes("secret_or_token_artifact"), "Missing secret rule.");
});

addCheck("founder approval board exists", () => {
  const source = read("core/approval/founder-approval-board.ts");
  assert(source.includes("PantavionFounderApprovalRecord"), "Missing approval record.");
  assert(source.includes("Z3_Z4_ACTION_CLASSES"), "Missing Z3/Z4 action classes.");
  assert(source.includes("blocksAutomaticExecution"), "Missing execution block.");
});

addCheck("repo agent safety gate exists", () => {
  const source = read("core/agent/repo-agent-safety-gate.ts");
  assert(source.includes("PANTAVION_REPO_AGENT_ALLOWED_COMMAND_PATTERNS"), "Missing allowed commands.");
  assert(source.includes("PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS"), "Missing blocked commands.");
  assert(source.includes("createPantavionAiCodeProvenanceRecord"), "Missing provenance.");
});

addCheck("startup builder stack exists", () => {
  const source = read("core/startup/startup-builder-stack.ts");
  assert(source.includes("PANTAVION_STARTUP_BUILDER_STACK"), "Missing startup stack.");
  assert(source.includes("code_writer_runtime"), "Missing code writer runtime.");
  assert(source.includes("company_workspace_agents"), "Missing workspace agents.");
});

addCheck("agent execution reliability exists", () => {
  const source = read("core/agent/agent-execution-reliability.ts");
  assert(source.includes("assessPantavionAgentExecutionReliability"), "Missing reliability assessment.");
  assert(source.includes("listPantavionAgentExecutionReliabilityPolicy"), "Missing reliability policy.");
  assert(source.includes("BLOCKED_COMMAND_PATTERNS"), "Missing blocked command patterns.");
  assert(source.includes("SECRET_PATTERNS"), "Missing secret redaction patterns.");
  assert(source.includes("retryPolicy"), "Missing retry policy.");
  assert(source.includes("checkpointPlan"), "Missing checkpoint plan.");
  assert(source.includes("rollbackPlan"), "Missing rollback plan.");
  assert(source.includes("sanitizedResult"), "Missing sanitized result capture.");
});

addCheck("agent execution reliability audit exists", () => {
  const source = read("core/agent/agent-execution-reliability-audit.ts");
  assert(source.includes("agent-execution-reliability-audit.jsonl"), "Missing execution audit file.");
  assert(source.includes("appendPantavionAgentExecutionReliabilityAudit"), "Missing execution audit append.");
});

addCheck("agent execution reliability API route exists", () => {
  const source = read("app/api/kernel/agent-execution-reliability/route.ts");
  assert(source.includes("export async function GET"), "Missing execution GET route.");
  assert(source.includes("export async function POST"), "Missing execution POST route.");
  assert(source.includes("appendPantavionAgentExecutionReliabilityAudit"), "Missing execution audit append in route.");
});

addCheck("PATCH 8H docs exist", () => {
  const source = read("docs/pantavion/agent-execution-reliability-layer.md");
  assert(source.includes("PATCH 8H"), "Missing PATCH 8H doc heading.");
  assert(source.includes("Command results must capture status"), "Missing result capture rule.");
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
