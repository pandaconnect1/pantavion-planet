import { readFileSync } from "node:fs";

const source = readFileSync("core/agent/agent-execution-reliability.ts", "utf8");
const audit = readFileSync("core/agent/agent-execution-reliability-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/agent-execution-reliability/route.ts", "utf8");

const requiredSourceTokens = [
  "assessPantavionAgentExecutionReliability",
  "listPantavionAgentExecutionReliabilityPolicy",
  "PantavionAgentExecutionReliabilityAssessment",
  "DEFAULT_TIMEOUT_MS",
  "MAX_RETRIES",
  "BLOCKED_COMMAND_PATTERNS",
  "SECRET_PATTERNS",
  "requiresCheckpoint",
  "requiresRollbackPlan",
  "requiresResultCapture",
  "requiresGreenChecks",
  "retryPolicy",
  "checkpointPlan",
  "rollbackPlan",
  "sanitizedResult",
  "redactSecrets"
];

const requiredAuditTokens = [
  "agent-execution-reliability-audit.jsonl",
  "appendPantavionAgentExecutionReliabilityAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "appendPantavionAgentExecutionReliabilityAudit",
  "agent.execution.reliability.assessed"
];

const missing = [
  ...requiredSourceTokens.filter((token) => !source.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Agent execution reliability audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Agent execution reliability audit passed.");
