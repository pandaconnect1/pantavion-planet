import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionOriginalDwgBindingAssessment,
  PantavionOriginalDwgBindingInput
} from "./original-dwg-source-binding";

export type PantavionOriginalDwgSourceAuditEvent = {
  event:
    | "original.dwg.binding.read"
    | "original.dwg.binding.assessed"
    | "original.dwg.local.verification.requested";
  actor: string;
  createdAt: string;
  request?: PantavionOriginalDwgBindingInput & {
    localPathProvided?: boolean;
    verifySha256?: boolean;
  };
  assessment?: PantavionOriginalDwgBindingAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "original-dwg-source-binding-audit.jsonl");

export async function appendPantavionOriginalDwgSourceAudit(
  event: PantavionOriginalDwgSourceAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionOriginalDwgSourceAuditPath(): string {
  return auditFile;
}
