import { readFileSync } from "node:fs";

const source = readFileSync("core/cad/cad-viewer-adapter-matrix.ts", "utf8");
const route = readFileSync("app/api/kernel/cad-viewer-adapters/route.ts", "utf8");

const requiredTokens = [
  "PANTAVION_CAD_VIEWER_ADAPTER_MATRIX",
  "assessPantavionCadViewerAdapter",
  "oda_inweb_dwg_viewer",
  "oda_mcp_future",
  "autodesk_aps_cloud_viewer",
  "leaflet_geojson_as_original",
  "static_image_pdf_as_original",
  "preserve_original",
  "derivative_only",
  "blocked",
  "requiresFounderApproval: true",
  "requiresCloudUpload: true",
  "canBePresentedAsOriginal: false"
];

const missing = requiredTokens.filter((token) => !source.includes(token));

if (!route.includes("appendPantavionCadViewerAudit")) {
  missing.push("appendPantavionCadViewerAudit");
}

if (!route.includes("export async function GET") || !route.includes("export async function POST")) {
  missing.push("GET/POST route exports");
}

if (missing.length > 0) {
  console.error("CAD viewer adapter audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("CAD viewer adapter audit passed.");
