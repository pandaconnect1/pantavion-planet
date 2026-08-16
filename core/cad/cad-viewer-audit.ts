import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionCadViewerAssessment,
  PantavionCadViewerAssessmentInput
} from "./cad-viewer-adapter-matrix";

export type PantavionCadViewerAuditEvent = {
  event: "cad.viewer.adapters.read" | "cad.viewer.adapter.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionCadViewerAssessmentInput;
  assessment?: PantavionCadViewerAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "cad-viewer-adapters-audit.jsonl");

export async function appendPantavionCadViewerAudit(
  event: PantavionCadViewerAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionCadViewerAuditPath(): string {
  return auditFile;
}
