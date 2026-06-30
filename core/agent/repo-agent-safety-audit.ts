import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionAiCodeProvenanceRecord,
  PantavionRepoAgentSafetyAssessment,
  PantavionRepoAgentSafetyInput
} from "./repo-agent-safety-gate";

export type PantavionRepoAgentSafetyAuditEvent = {
  event:
    | "repo.agent.safety.policy.read"
    | "repo.agent.safety.assessed"
    | "repo.agent.provenance.recorded";
  actor: string;
  createdAt: string;
  request?: PantavionRepoAgentSafetyInput;
  assessment?: PantavionRepoAgentSafetyAssessment;
  provenance?: PantavionAiCodeProvenanceRecord;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "repo-agent-safety-gate-audit.jsonl");

export async function appendPantavionRepoAgentSafetyAudit(
  event: PantavionRepoAgentSafetyAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionRepoAgentSafetyAuditPath(): string {
  return auditFile;
}
