import { promises as fs } from "fs";
import path from "path";
import {
  assessPantavionWaterWorkOrder,
  normalizePantavionWaterWorkOrderStringArray,
  type PantavionWaterWorkOrderAssessment,
  type PantavionWaterWorkOrderRecord,
  type PantavionWaterWorkOrderRegistryInput
} from "./water-work-order-registry";

export type PantavionWaterWorkOrderRegistryAuditEvent = {
  event:
    | "water.work.order.registry.read"
    | "water.work.order.registry.assessed"
    | "water.work.order.registry.registered";
  actor: string;
  createdAt: string;
  request?: PantavionWaterWorkOrderRegistryInput;
  assessment?: PantavionWaterWorkOrderAssessment;
  records?: PantavionWaterWorkOrderRecord[];
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const stateFile = path.join(dataDir, "water-work-order-registry-state.json");
const auditFile = path.join(dataDir, "water-work-order-registry-audit.jsonl");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function appendPantavionWaterWorkOrderRegistryAudit(
  event: PantavionWaterWorkOrderRegistryAuditEvent
): Promise<void> {
  await ensureDataDir();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionWaterWorkOrderRecords(): Promise<
  PantavionWaterWorkOrderRecord[]
> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionWaterWorkOrderRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function writePantavionWaterWorkOrderRecords(
  records: PantavionWaterWorkOrderRecord[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function registerPantavionWaterWorkOrder(
  input: PantavionWaterWorkOrderRegistryInput
): Promise<{
  assessment: PantavionWaterWorkOrderAssessment;
  records: PantavionWaterWorkOrderRecord[];
}> {
  const assessment = assessPantavionWaterWorkOrder(input);
  const actor = input.actor ?? "system:water-work-order-registry";
  const now = new Date().toISOString();

  let records = await readPantavionWaterWorkOrderRecords();

  if (!assessment.canRegisterWorkOrder || !assessment.workOrderId || !assessment.assetId) {
    await appendPantavionWaterWorkOrderRegistryAudit({
      event: "water.work.order.registry.assessed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  const existing = records.find((record) => record.workOrderId === assessment.workOrderId);

  const record: PantavionWaterWorkOrderRecord = {
    id:
      existing?.id ??
      `water_work_order_record_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    workOrderId: assessment.workOrderId,
    assetId: assessment.assetId,
    assetKind: assessment.assetKind,
    kind: assessment.kind,
    status: assessment.status,
    priority: assessment.priority,
    title: input.title,
    faultId: input.faultId,
    crewId: input.crewId,
    assignedTo: normalizePantavionWaterWorkOrderStringArray(input.assignedTo),
    photoRefs: normalizePantavionWaterWorkOrderStringArray(input.photoRefs),
    materialRefs: normalizePantavionWaterWorkOrderStringArray(input.materialRefs),
    telemetryPointIds: normalizePantavionWaterWorkOrderStringArray(input.telemetryPointIds),
    relatedWorkOrderIds: normalizePantavionWaterWorkOrderStringArray(input.relatedWorkOrderIds),
    roadName: input.roadName,
    zoneId: input.zoneId,
    dmaId: input.dmaId,
    sourceDwgBindingId: input.sourceDwgBindingId,
    fieldNotes: input.fieldNotes,
    repairNotes: input.repairNotes,
    replacementNotes: input.replacementNotes,
    fieldVerified: Boolean(input.fieldVerified),
    supervisorReviewed: Boolean(input.supervisorReviewed),
    replacementRequired: Boolean(input.replacementRequired),
    repairCompleted: Boolean(input.repairCompleted),
    originalDwgMutationAllowed: false,
    sourceDwgReferenceOnly: true,
    physicalControlAllowed: false,
    scadaWriteAllowed: false,
    telemetryReadOnly: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    closedAt: assessment.canCloseWorkOrder ? now : existing?.closedAt,
    actor,
    reason: input.reason
  };

  records = [
    record,
    ...records.filter((entry) => entry.workOrderId !== record.workOrderId)
  ];

  await writePantavionWaterWorkOrderRecords(records);

  await appendPantavionWaterWorkOrderRegistryAudit({
    event: "water.work.order.registry.registered",
    actor,
    createdAt: now,
    request: input,
    assessment,
    records
  });

  return { assessment, records };
}

export function getPantavionWaterWorkOrderRegistryStatePath(): string {
  return stateFile;
}

export function getPantavionWaterWorkOrderRegistryAuditPath(): string {
  return auditFile;
}
