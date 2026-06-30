import { readFileSync } from "node:fs";

const source = readFileSync("core/vault/sensitive-artifact-vault.ts", "utf8");
const route = readFileSync("app/api/kernel/sensitive-artifact-vault/route.ts", "utf8");

const requiredTokens = [
  "PANTAVION_SENSITIVE_ARTIFACT_RULES",
  "assessPantavionSensitiveArtifact",
  "dwg_master_source_truth",
  "secret_or_token_artifact",
  "production_config_artifact",
  "legal_document_artifact",
  "auth_user_data_artifact",
  "billing_data_artifact",
  "backup_restore_artifact",
  "immutableSourceTruth",
  "requiresFounderApproval",
  "allowedForAutomaticExecution",
  "allowedForExecutionAfterApproval",
  "sourceTruthMutationBlocked"
];

const missing = requiredTokens.filter((token) => !source.includes(token));

if (!route.includes("appendPantavionSensitiveArtifactAudit")) {
  missing.push("appendPantavionSensitiveArtifactAudit");
}

if (!route.includes("export async function GET") || !route.includes("export async function POST")) {
  missing.push("GET/POST route exports");
}

if (missing.length > 0) {
  console.error("Sensitive artifact vault audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Sensitive artifact vault audit passed.");
