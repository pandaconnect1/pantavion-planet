import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionConversionAssessment,
  PantavionConversionRequestInput,
} from "./format-matrix";

export type PantavionConversionAuditEvent = {
  event: "conversion.matrix.read" | "conversion.request.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionConversionRequestInput;
  assessment?: PantavionConversionAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "conversion-matrix-audit.jsonl");

export async function appendPantavionConversionAudit(
  event: PantavionConversionAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionConversionAuditPath(): string {
  return auditFile;
}
