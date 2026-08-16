import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionArtifactIntakeAssessment,
  PantavionArtifactIntakeInput
} from "./artifact-intake-registry";

export type PantavionArtifactIntakeAuditEvent = {
  event:
    | "artifact.intake.rules.read"
    | "artifact.intake.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionArtifactIntakeInput;
  assessment?: PantavionArtifactIntakeAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "artifact-intake-registry-audit.jsonl");

export async function appendPantavionArtifactIntakeAudit(
  event: PantavionArtifactIntakeAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionArtifactIntakeAuditPath(): string {
  return auditFile;
}
