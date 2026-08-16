import { readFileSync } from "node:fs";

const source = readFileSync("core/artifacts/artifact-intake-registry.ts", "utf8");
const audit = readFileSync("core/artifacts/artifact-intake-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/artifact-intake-registry/route.ts", "utf8");

const requiredSourceTokens = [
  "PANTAVION_ARTIFACT_INTAKE_RULES",
  "assessPantavionArtifactIntake",
  "dwg_original_source_truth_intake",
  "cad_source_intake",
  "gis_source_intake",
  "geojson_derivative_intake",
  "pdf_document_source_intake",
  "zip_archive_bundle_intake",
  "direct_private_upload_session",
  "multipart_private_upload",
  "requiresFounderApproval",
  "requiresPrivateStorage",
  "requiresSha256",
  "requiresSensitiveVaultCheck",
  "requiresCadAdapterCheck",
  "allowedForPrivateUploadSession",
  "allowedForAutomaticPublicUse: false"
];

const requiredAuditTokens = [
  "artifact-intake-registry-audit.jsonl",
  "appendPantavionArtifactIntakeAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "pantavion_universal_artifact_intake_registry",
  "artifact.intake.assessed"
];

const missing = [
  ...requiredSourceTokens.filter((token) => !source.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Artifact intake registry audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Artifact intake registry audit passed.");
