import { readFileSync } from "node:fs";

const board = readFileSync("core/approval/founder-approval-board.ts", "utf8");
const store = readFileSync("core/approval/founder-approval-store.ts", "utf8");
const route = readFileSync("app/api/kernel/founder-approval-board/route.ts", "utf8");

const requiredBoardTokens = [
  "PantavionFounderApprovalRecord",
  "createPantavionFounderApprovalRecord",
  "decidePantavionFounderApprovalRecord",
  "assessPantavionFounderApprovalRecord",
  "Z3_Z4_ACTION_CLASSES",
  "dwg_source_truth",
  "secret_access",
  "auth_user_access",
  "billing_payment",
  "production_deploy",
  "infrastructure_change",
  "legal_compliance",
  "backup_restore",
  "repo_ci_cd",
  "provider_cloud_upload",
  "blocksAutomaticExecution",
  "allowedToExecute"
];

const requiredStoreTokens = [
  "founder-approval-board.json",
  "founder-approval-board-audit.jsonl",
  "createStoredPantavionFounderApprovalRequest",
  "decideStoredPantavionFounderApprovalRequest",
  "appendPantavionFounderApprovalAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "export async function PATCH",
  "readPantavionFounderApprovalRecords",
  "createStoredPantavionFounderApprovalRequest",
  "decideStoredPantavionFounderApprovalRequest"
];

const missing = [
  ...requiredBoardTokens.filter((token) => !board.includes(token)),
  ...requiredStoreTokens.filter((token) => !store.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Founder approval board audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Founder approval board audit passed.");
