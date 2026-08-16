import { promises as fs } from "fs";
import path from "path";
import {
  createPantavionFounderApprovalRecord,
  decidePantavionFounderApprovalRecord,
  type PantavionFounderApprovalDecisionInput,
  type PantavionFounderApprovalRecord,
  type PantavionFounderApprovalRequestInput
} from "./founder-approval-board";

export type PantavionFounderApprovalAuditEvent = {
  event:
    | "founder.approval.requests.read"
    | "founder.approval.request.created"
    | "founder.approval.request.decided";
  actor: string;
  createdAt: string;
  request?: PantavionFounderApprovalRequestInput | PantavionFounderApprovalDecisionInput;
  record?: PantavionFounderApprovalRecord;
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const stateFile = path.join(dataDir, "founder-approval-board.json");
const auditFile = path.join(dataDir, "founder-approval-board-audit.jsonl");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function appendPantavionFounderApprovalAudit(
  event: PantavionFounderApprovalAuditEvent
): Promise<void> {
  await ensureDataDir();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionFounderApprovalRecords(): Promise<
  PantavionFounderApprovalRecord[]
> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionFounderApprovalRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writePantavionFounderApprovalRecords(
  records: PantavionFounderApprovalRecord[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function createStoredPantavionFounderApprovalRequest(
  input: PantavionFounderApprovalRequestInput
): Promise<PantavionFounderApprovalRecord> {
  const records = await readPantavionFounderApprovalRecords();
  const record = createPantavionFounderApprovalRecord(input);
  records.unshift(record);
  await writePantavionFounderApprovalRecords(records);

  await appendPantavionFounderApprovalAudit({
    event: "founder.approval.request.created",
    actor: input.requestedBy,
    createdAt: new Date().toISOString(),
    request: input,
    record
  });

  return record;
}

export async function decideStoredPantavionFounderApprovalRequest(
  input: PantavionFounderApprovalDecisionInput
): Promise<PantavionFounderApprovalRecord> {
  const records = await readPantavionFounderApprovalRecords();
  const index = records.findIndex((record) => record.id === input.requestId);

  if (index === -1) {
    throw new Error(`Approval request not found: ${input.requestId}`);
  }

  const current = records[index];
  if (!current) {
    throw new Error(`Approval request not found: ${input.requestId}`);
  }

  const updated = decidePantavionFounderApprovalRecord(current, input);
  records[index] = updated;
  await writePantavionFounderApprovalRecords(records);

  await appendPantavionFounderApprovalAudit({
    event: "founder.approval.request.decided",
    actor: input.decidedBy,
    createdAt: new Date().toISOString(),
    request: input,
    record: updated
  });

  return updated;
}

export function getPantavionFounderApprovalStatePath(): string {
  return stateFile;
}

export function getPantavionFounderApprovalAuditPath(): string {
  return auditFile;
}
