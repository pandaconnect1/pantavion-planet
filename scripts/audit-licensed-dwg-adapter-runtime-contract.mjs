import { readFileSync } from "node:fs";

const source = readFileSync("core/water/licensed-dwg-adapter-runtime-contract.ts", "utf8");
const audit = readFileSync("core/water/licensed-dwg-adapter-runtime-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/licensed-dwg-adapter-runtime-contract/route.ts", "utf8");

const requiredSourceTokens = [
  "LICENSED_DWG_ADAPTER_RUNTIME_CONTRACTS",
  "assessPantavionLicensedDwgAdapterRuntime",
  "listPantavionLicensedDwgAdapterRuntimeContracts",
  "oda_inweb_runtime_contract",
  "oda_mcp_future_runtime_contract",
  "autodesk_aps_cloud_runtime_contract",
  "custom_local_runtime_contract",
  "loadOriginalDwgReadOnly",
  "renderEmbedded",
  "dispose",
  "noFakeRender",
  "noDerivativeAsOriginal",
  "noClientFileBytes",
  "allowedForProduction: false",
  "canExposeFileBytesToClient: false",
  "canPresentDerivativeAsOriginal: false",
  "canModifySourceDwg: false"
];

const requiredAuditTokens = [
  "licensed-dwg-adapter-runtime-contract-audit.jsonl",
  "appendPantavionLicensedDwgAdapterRuntimeAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_licensed_dwg_adapter_runtime_contract",
  "licensed.dwg.adapter.contract.assessed"
];

const missing = [
  ...requiredSourceTokens.filter((token) => !source.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Licensed DWG adapter runtime contract audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Licensed DWG adapter runtime contract audit passed.");
