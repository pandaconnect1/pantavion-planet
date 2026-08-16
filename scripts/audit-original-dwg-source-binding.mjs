import { readFileSync } from "node:fs";

const binding = readFileSync("core/water/original-dwg-source-binding.ts", "utf8");
const verifier = readFileSync("core/water/original-dwg-source-verifier.ts", "utf8");
const audit = readFileSync("core/water/original-dwg-source-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/original-dwg-source-binding/route.ts", "utf8");

const requiredBindingTokens = [
  "PANTAVION_ORIGINAL_DWG_SOURCE_BINDING",
  "GEORGE_MAP_MASTER_B_C_FINAL.dwg",
  "205877448",
  "0070db27b6b22cc3aa24353c9445f87910925b6d18bea27914c915da13bbc1d9",
  "assessPantavionOriginalDwgSourceBinding",
  "sourceTruth: true",
  "readOnly: true",
  "immutable: true",
  "requiresCadViewerAdapter: true",
  "requiresLicenseAdapter: true",
  "derivativeMayReplaceOriginal: false",
  "allowedForAutomaticRender: false"
];

const requiredVerifierTokens = [
  "verifyPantavionOriginalDwgLocalFile",
  "sha256File",
  "founderApproved",
  "observedFilename !== expectedFilename"
];

const requiredAuditTokens = [
  "original-dwg-source-binding-audit.jsonl",
  "appendPantavionOriginalDwgSourceAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "assessPantavionSensitiveArtifact",
  "assessPantavionCadViewerAdapter",
  "oda_inweb_dwg_viewer",
  "original.dwg.local.verification.requested"
];

const missing = [
  ...requiredBindingTokens.filter((token) => !binding.includes(token)),
  ...requiredVerifierTokens.filter((token) => !verifier.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Original DWG source binding audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Original DWG source binding audit passed.");
