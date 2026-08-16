import { readFileSync } from "node:fs";

const bridge = readFileSync("core/water/original-dwg-viewer-bridge.ts", "utf8");
const audit = readFileSync("core/water/original-dwg-viewer-bridge-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/original-dwg-viewer-bridge/route.ts", "utf8");
const component = readFileSync("components/water/OriginalDwgViewerBridgePanel.tsx", "utf8");
const pageB = readFileSync("app/professional/infrastructure/water/b/page.tsx", "utf8");
const pageC = readFileSync("app/professional/infrastructure/water/c/page.tsx", "utf8");

const requiredBridgeTokens = [
  "assessPantavionOriginalDwgViewerBridge",
  "PANTAVION_ORIGINAL_DWG_VIEWER_SURFACES",
  "surface: \"B\"",
  "surface: \"C\"",
  "requiresCadViewerAdapter: true",
  "requiresLicenseAdapter: true",
  "noDerivativeAsOriginal: true",
  "automaticRenderBlocked: true",
  "oda_inweb_dwg_viewer",
  "canRenderOriginal"
];

const requiredAuditTokens = [
  "original-dwg-viewer-bridge-audit.jsonl",
  "appendPantavionOriginalDwgViewerBridgeAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_b_c_original_dwg_viewer_bridge",
  "original.dwg.viewer.bridge.assessed"
];

const requiredComponentTokens = [
  "OriginalDwgViewerBridgePanel",
  "Original DWG Source Bridge",
  "Real embedded rendering requires a licensed CAD/DWG"
];

const requiredPageTokens = [
  "assessPantavionOriginalDwgViewerBridge",
  "OriginalDwgViewerBridgePanel"
];

const missing = [
  ...requiredBridgeTokens.filter((token) => !bridge.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token)),
  ...requiredComponentTokens.filter((token) => !component.includes(token)),
  ...requiredPageTokens.filter((token) => !pageB.includes(token)),
  ...requiredPageTokens.filter((token) => !pageC.includes(token))
];

if (missing.length > 0) {
  console.error("Original DWG viewer bridge audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Original DWG viewer bridge audit passed.");
