import fs from "node:fs/promises";
import { ensureKernelStorage } from "./kernel-state";

export type KernelAuditRecord = {
  id: string;
  type: string;
  actor: string;
  createdAt: string;
  payload: unknown;
};

export async function appendKernelAudit(record: KernelAuditRecord): Promise<string> {
  const paths = await ensureKernelStorage();
  await fs.appendFile(paths.auditPath, `${JSON.stringify(record)}\n`, "utf8");
  return paths.auditPath;
}
