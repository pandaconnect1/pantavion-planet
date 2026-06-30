import { readFileSync } from "node:fs";

const core = readFileSync("core/processing/python-worker-runtime-contract.ts", "utf8");
const store = readFileSync("core/processing/python-worker-runtime-store.ts", "utf8");
const route = readFileSync("app/api/kernel/python-worker-runtime/route.ts", "utf8");
const docs = readFileSync("docs/pantavion/python-worker-runtime-contract.md", "utf8");

const requiredCoreTokens = [
  "PANTAVION_PYTHON_WORKER_JOB_DEFINITIONS",
  "assessPantavionPythonWorkerRuntime",
  "excel_xlsx_parse",
  "csv_profile",
  "pdf_text_extract",
  "pdf_ocr_extract",
  "docx_text_extract",
  "image_ocr_extract",
  "gis_spatial_index",
  "cad_text_index",
  "sha256_verify",
  "telemetry_timeseries_profile",
  "hydraulic_epanet_prepare",
  "sidecarOnly: true",
  "pythonExecutionAllowedNow: false",
  "originalMutationAllowed: false",
  "originalDwgMutationAllowed: false",
  "canExecuteNow: false"
];

const requiredStoreTokens = [
  "python-worker-runtime-jobs.json",
  "python-worker-runtime-audit.jsonl",
  "registerPantavionPythonWorkerJob",
  "registered_pending_worker",
  "python.worker.runtime.registered"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_python_worker_runtime_contract",
  "mode === \"register\""
];

const requiredDocTokens = [
  "PATCH 8R",
  "Python Worker Runtime Contract",
  "Excel / XLSX",
  "PDF OCR extraction",
  "Word / DOCX",
  "GIS spatial index",
  "CAD / DWG text index sidecars",
  "Original DWG is never mutated",
  "No SCADA write",
  "No physical infrastructure control"
];

const missing = [
  ...requiredCoreTokens.filter((token) => !core.includes(token)),
  ...requiredStoreTokens.filter((token) => !store.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token)),
  ...requiredDocTokens.filter((token) => !docs.includes(token))
];

if (missing.length > 0) {
  console.error("Python worker runtime audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Python worker runtime audit passed.");
