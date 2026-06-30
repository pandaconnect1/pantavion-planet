import { readFileSync } from "node:fs";

const source = readFileSync("core/agent/repo-agent-safety-gate.ts", "utf8");
const audit = readFileSync("core/agent/repo-agent-safety-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/repo-agent-safety-gate/route.ts", "utf8");

const requiredSourceTokens = [
  "PANTAVION_REPO_AGENT_ALLOWED_COMMAND_PATTERNS",
  "PANTAVION_REPO_AGENT_BLOCKED_COMMAND_PATTERNS",
  "PANTAVION_REPO_AGENT_APPROVAL_COMMAND_PATTERNS",
  "PANTAVION_REPO_AGENT_APPROVAL_ACTION_CLASSES",
  "assessPantavionRepoAgentSafety",
  "createPantavionAiCodeProvenanceRecord",
  "git_add",
  "git_push",
  "secrets_access",
  "production_deploy",
  "source_truth_change",
  "requiresFounderApproval",
  "allowedForAutomaticExecution",
  "allowedForExecutionAfterApproval",
  "requiredChecks",
  "sourceTruthMutationBlocked"
];

const requiredAuditTokens = [
  "repo-agent-safety-gate-audit.jsonl",
  "appendPantavionRepoAgentSafetyAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "appendPantavionRepoAgentSafetyAudit",
  "repo.agent.safety.assessed",
  "repo.agent.provenance.recorded"
];

const missing = [
  ...requiredSourceTokens.filter((token) => !source.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Repo agent safety gate audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Repo agent safety gate audit passed.");
