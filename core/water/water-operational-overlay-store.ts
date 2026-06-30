import { promises as fs } from "fs";
import path from "path";
import {
  assessPantavionWaterOperationalOverlay,
  type PantavionWaterOperationalOverlayAssessment,
  type PantavionWaterOperationalOverlayInput,
  type PantavionWaterOperationalOverlayRecord
} from "./water-operational-overlay";

export type PantavionWaterOperationalOverlayAuditEvent = {
  event:
    | "water.operational.overlay.read"
    | "water.operational.overlay.assessed"
    | "water.operational.overlay.applied"
    | "water.operational.overlay.bulk_restored";
  actor: string;
  createdAt: string;
  request?: PantavionWaterOperationalOverlayInput;
  assessment?: PantavionWaterOperationalOverlayAssessment;
  records?: PantavionWaterOperationalOverlayRecord[];
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const stateFile = path.join(dataDir, "water-operational-overlay-state.json");
const auditFile = path.join(dataDir, "water-operational-overlay-audit.jsonl");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function appendPantavionWaterOperationalOverlayAudit(
  event: PantavionWaterOperationalOverlayAuditEvent
): Promise<void> {
  await ensureDataDir();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionWaterOperationalOverlayRecords(): Promise<
  PantavionWaterOperationalOverlayRecord[]
> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionWaterOperationalOverlayRecord[];
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

export async function writePantavionWaterOperationalOverlayRecords(
  records: PantavionWaterOperationalOverlayRecord[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function applyPantavionWaterOperationalOverlay(
  input: PantavionWaterOperationalOverlayInput
): Promise<{
  assessment: PantavionWaterOperationalOverlayAssessment;
  records: PantavionWaterOperationalOverlayRecord[];
}> {
  const assessment = assessPantavionWaterOperationalOverlay(input);
  const actor = input.actor ?? "system:water-operational-overlay";
  const now = new Date().toISOString();

  if (assessment.blocked) {
    const records = await readPantavionWaterOperationalOverlayRecords();

    await appendPantavionWaterOperationalOverlayAudit({
      event: "water.operational.overlay.assessed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  let records = await readPantavionWaterOperationalOverlayRecords();

  if (assessment.action === "restore_all_opened") {
    records = records.map((record) => {
      if (record.state !== "opened_after_repair" && record.state !== "sv_replaced_pending_verification") {
        return record;
      }

      return {
        ...record,
        state: "natural_open",
        colorIntent: "natural",
        hex: "none",
        overlayShape: "none",
        overlayActive: false,
        updatedAt: now,
        clearedAt: now
      };
    });

    await writePantavionWaterOperationalOverlayRecords(records);

    await appendPantavionWaterOperationalOverlayAudit({
      event: "water.operational.overlay.bulk_restored",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  const assetId = assessment.assetId ?? "";
  const nextRecord: PantavionWaterOperationalOverlayRecord = {
    id: `water_ops_record_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    assetId,
    assetKind: assessment.assetKind,
    state: assessment.nextState,
    colorIntent: assessment.colorIntent,
    hex: assessment.hex,
    overlayShape: assessment.overlayShape,
    overlayAdornment: assessment.overlayAdornment,
    overlayActive: assessment.overlayActive,
    surface: assessment.surface,
    faultId: input.faultId,
    workOrderId: input.workOrderId,
    reason: input.reason,
    actor,
    originalDwgMutationAllowed: false,
    physicalValveControl: false,
    scadaWriteAllowed: false,
    createdAt: now,
    updatedAt: now,
    clearedAt: assessment.nextState === "natural_open" ? now : undefined
  };

  records = [
    nextRecord,
    ...records.filter((record) => record.assetId !== assetId || record.surface !== assessment.surface)
  ];

  await writePantavionWaterOperationalOverlayRecords(records);

  await appendPantavionWaterOperationalOverlayAudit({
    event: "water.operational.overlay.applied",
    actor,
    createdAt: now,
    request: input,
    assessment,
    records
  });

  return { assessment, records };
}

export function getPantavionWaterOperationalOverlayStatePath(): string {
  return stateFile;
}

export function getPantavionWaterOperationalOverlayAuditPath(): string {
  return auditFile;
}
