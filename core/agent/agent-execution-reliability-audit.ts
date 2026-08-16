import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionAgentExecutionReliabilityAssessment,
  PantavionAgentExecutionReliabilityInput
} from "./agent-execution-reliability";

export type PantavionAgentExecutionReliabilityAuditEvent = {
  event:
    | "agent.execution.reliability.policy.read"
    | "agent.execution.reliability.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionAgentExecutionReliabilityInput;
  assessment?: PantavionAgentExecutionReliabilityAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "agent-execution-reliability-audit.jsonl");

export async function appendPantavionAgentExecutionReliabilityAudit(
  event: PantavionAgentExecutionReliabilityAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionAgentExecutionReliabilityAuditPath(): string {
  return auditFile;
}
