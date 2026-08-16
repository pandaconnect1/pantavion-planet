import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionOriginalDwgViewerBridgeAssessment,
  PantavionOriginalDwgViewerBridgeInput
} from "./original-dwg-viewer-bridge";

export type PantavionOriginalDwgViewerBridgeAuditEvent = {
  event:
    | "original.dwg.viewer.bridge.read"
    | "original.dwg.viewer.bridge.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionOriginalDwgViewerBridgeInput;
  assessment?: PantavionOriginalDwgViewerBridgeAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "original-dwg-viewer-bridge-audit.jsonl");

export async function appendPantavionOriginalDwgViewerBridgeAudit(
  event: PantavionOriginalDwgViewerBridgeAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionOriginalDwgViewerBridgeAuditPath(): string {
  return auditFile;
}
