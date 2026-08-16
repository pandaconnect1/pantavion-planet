import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionSensitiveArtifactAssessment,
  PantavionSensitiveArtifactInput
} from "./sensitive-artifact-vault";

export type PantavionSensitiveArtifactAuditEvent = {
  event: "sensitive.artifact.rules.read" | "sensitive.artifact.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionSensitiveArtifactInput;
  assessment?: PantavionSensitiveArtifactAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "sensitive-artifact-vault-audit.jsonl");

export async function appendPantavionSensitiveArtifactAudit(
  event: PantavionSensitiveArtifactAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionSensitiveArtifactAuditPath(): string {
  return auditFile;
}
