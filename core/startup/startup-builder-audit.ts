import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionStartupBuilderAssessment,
  PantavionStartupBuilderRequestInput
} from "./startup-builder-stack";

export type PantavionStartupBuilderAuditEvent = {
  event: "startup.builder.stack.read" | "startup.builder.request.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionStartupBuilderRequestInput;
  assessment?: PantavionStartupBuilderAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "startup-builder-stack-audit.jsonl");

export async function appendPantavionStartupBuilderAudit(
  event: PantavionStartupBuilderAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionStartupBuilderAuditPath(): string {
  return auditFile;
}
