import { readFileSync } from "node:fs";

const source = readFileSync("core/conversion/format-matrix.ts", "utf8");

const requiredTokens = [
  "PANTAVION_CONVERSION_FORMAT_MATRIX",
  "assessPantavionConversionRequest",
  "cad_dwg_to_embedded_viewer",
  "cad_dwg_to_static_image_as_original",
  "requiresFounderApproval: true",
  "sourceTruthPolicy",
  "blocked",
  "requires_adapter",
];

const missing = requiredTokens.filter((token) => !source.includes(token));

if (missing.length > 0) {
  console.error("Conversion matrix audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Conversion matrix audit passed.");
