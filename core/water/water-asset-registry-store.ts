import { promises as fs } from "fs";
import path from "path";
import {
  assessPantavionWaterAssetRegistration,
  normalizePantavionWaterAssetStringArray,
  type PantavionWaterAssetRecord,
  type PantavionWaterAssetRegistryAssessment,
  type PantavionWaterAssetRegistryInput
} from "./water-asset-registry";

export type PantavionWaterAssetRegistryAuditEvent = {
  event:
    | "water.asset.registry.read"
    | "water.asset.registry.assessed"
    | "water.asset.registry.registered";
  actor: string;
  createdAt: string;
  request?: PantavionWaterAssetRegistryInput;
  assessment?: PantavionWaterAssetRegistryAssessment;
  records?: PantavionWaterAssetRecord[];
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const stateFile = path.join(dataDir, "water-asset-registry-state.json");
const auditFile = path.join(dataDir, "water-asset-registry-audit.jsonl");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function appendPantavionWaterAssetRegistryAudit(
  event: PantavionWaterAssetRegistryAuditEvent
): Promise<void> {
  await ensureDataDir();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionWaterAssetRecords(): Promise<PantavionWaterAssetRecord[]> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionWaterAssetRecord[];
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

export async function writePantavionWaterAssetRecords(
  records: PantavionWaterAssetRecord[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function registerPantavionWaterAsset(
  input: PantavionWaterAssetRegistryInput
): Promise<{
  assessment: PantavionWaterAssetRegistryAssessment;
  records: PantavionWaterAssetRecord[];
}> {
  const assessment = assessPantavionWaterAssetRegistration(input);
  const actor = input.actor ?? "system:water-asset-registry";
  const now = new Date().toISOString();

  let records = await readPantavionWaterAssetRecords();

  if (assessment.blocked || !assessment.assetId) {
    await appendPantavionWaterAssetRegistryAudit({
      event: "water.asset.registry.assessed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  const existing = records.find(
    (record) => record.assetId === assessment.assetId && record.kind === assessment.kind
  );

  const record: PantavionWaterAssetRecord = {
    id: existing?.id ?? `water_asset_record_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    assetId: assessment.assetId,
    kind: assessment.kind,
    displayName: input.displayName,
    condition: assessment.condition,
    zoneId: input.zoneId,
    dmaId: input.dmaId,
    roadName: input.roadName,
    sourceDwgBindingId: input.sourceDwgBindingId,
    sourceLayerName: input.sourceLayerName,
    sourceBlockName: input.sourceBlockName,
    latitude: input.latitude,
    longitude: input.longitude,
    mapX: input.mapX,
    mapY: input.mapY,
    telemetryPointIds: normalizePantavionWaterAssetStringArray(input.telemetryPointIds),
    workOrderIds: normalizePantavionWaterAssetStringArray(input.workOrderIds),
    photoRefs: normalizePantavionWaterAssetStringArray(input.photoRefs),
    sourceTruth: Boolean(input.sourceTruth),
    fieldVerified: Boolean(input.fieldVerified),
    supervisorReviewed: Boolean(input.supervisorReviewed),
    originalDwgMutationAllowed: false,
    sourceDwgReferenceOnly: true,
    physicalControlAllowed: false,
    scadaWriteAllowed: false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    actor,
    reason: input.reason
  };

  records = [record, ...records.filter((entry) => !(entry.assetId === record.assetId && entry.kind === record.kind))];

  await writePantavionWaterAssetRecords(records);

  await appendPantavionWaterAssetRegistryAudit({
    event: "water.asset.registry.registered",
    actor,
    createdAt: now,
    request: input,
    assessment,
    records
  });

  return { assessment, records };
}

export function getPantavionWaterAssetRegistryStatePath(): string {
  return stateFile;
}

export function getPantavionWaterAssetRegistryAuditPath(): string {
  return auditFile;
}
