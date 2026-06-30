import { promises as fs } from "fs";
import path from "path";
import type {
  PantavionLicensedDwgAdapterRuntimeAssessment,
  PantavionLicensedDwgAdapterRuntimeInput
} from "./licensed-dwg-adapter-runtime-contract";

export type PantavionLicensedDwgAdapterRuntimeAuditEvent = {
  event:
    | "licensed.dwg.adapter.contracts.read"
    | "licensed.dwg.adapter.contract.assessed";
  actor: string;
  createdAt: string;
  request?: PantavionLicensedDwgAdapterRuntimeInput;
  assessment?: PantavionLicensedDwgAdapterRuntimeAssessment;
};

const auditDir = path.join(process.cwd(), "data", "kernel");
const auditFile = path.join(auditDir, "licensed-dwg-adapter-runtime-contract-audit.jsonl");

export async function appendPantavionLicensedDwgAdapterRuntimeAudit(
  event: PantavionLicensedDwgAdapterRuntimeAuditEvent
): Promise<void> {
  await fs.mkdir(auditDir, { recursive: true });
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export function getPantavionLicensedDwgAdapterRuntimeAuditPath(): string {
  return auditFile;
}
