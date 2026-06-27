import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { appendKernelAudit } from "./kernel-audit";
import { ensureKernelStorage } from "./kernel-state";

export type OmnimodalSource =
  | "web"
  | "api"
  | "local_script"
  | "founder"
  | "admin"
  | "future_voice"
  | "system";

export type OmnimodalCategory =
  | "text"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "audio"
  | "video"
  | "cad"
  | "gis"
  | "map"
  | "archive"
  | "code"
  | "unknown";

export type OmnimodalSupportStatus =
  | "stored_raw"
  | "stored_raw_readonly_preserve"
  | "stored_quarantined"
  | "requires_adapter"
  | "blocked_sensitive";

export type OmnimodalProcessingStatus =
  | "stored_only"
  | "quarantined"
  | "blocked"
  | "requires_adapter"
  | "ready_for_viewer_adapter"
  | "ready_for_parser_adapter";

export type FormatRegistryEntry = {
  extension: string;
  category: OmnimodalCategory;
  label: string;
  status: OmnimodalSupportStatus;
  policy: string;
  viewerAdapter: "available" | "not_implemented" | "provider_required";
  parserAdapter: "available" | "not_implemented" | "provider_required";
  originalPreservation: "required" | "not_required";
};

export type OmnimodalIntakeRecord = {
  id: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  actor: string;
  source: OmnimodalSource;
  originalName: string;
  safeName: string;
  mimeType: string;
  extension: string;
  category: OmnimodalCategory;
  label: string;
  byteSize: number;
  sha256: string;
  supportStatus: OmnimodalSupportStatus;
  processingStatus: OmnimodalProcessingStatus;
  safetyZone:
    | "Z1_AUTO_SAFE"
    | "Z2_PREVIEW_REQUIRED"
    | "Z3_FOUNDER_APPROVAL_REQUIRED"
    | "Z4_BLOCKED_MANUAL_ONLY";
  quarantineReason?: string;
  objectRelativePath?: string;
  declaredPurpose?: string;
  preservationPolicy: string;
  recommendation: string;
};

type OmnimodalDatabase = {
  version: 1;
  updatedAt: string;
  records: OmnimodalIntakeRecord[];
};

const FORMAT_REGISTRY: FormatRegistryEntry[] = [
  {
    extension: ".txt",
    category: "text",
    label: "Plain text",
    status: "stored_raw",
    policy: "May be parsed later by text adapter.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "not_required",
  },
  {
    extension: ".md",
    category: "text",
    label: "Markdown",
    status: "stored_raw",
    policy: "May be rendered later by markdown adapter.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "not_required",
  },
  {
    extension: ".json",
    category: "text",
    label: "JSON",
    status: "stored_raw",
    policy: "May be parsed later by JSON adapter.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "not_required",
  },
  {
    extension: ".csv",
    category: "spreadsheet",
    label: "CSV",
    status: "stored_raw",
    policy: "May be parsed later by tabular adapter.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "not_required",
  },
  {
    extension: ".pdf",
    category: "document",
    label: "PDF",
    status: "stored_raw_readonly_preserve",
    policy: "Store original PDF bytes. Viewer/parser adapter required before analysis.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".docx",
    category: "document",
    label: "Word document",
    status: "stored_raw",
    policy: "Store original document. Parser adapter required before extraction.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".xlsx",
    category: "spreadsheet",
    label: "Excel workbook",
    status: "stored_raw",
    policy: "Store original workbook. Spreadsheet adapter required before extraction.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".pptx",
    category: "presentation",
    label: "PowerPoint presentation",
    status: "stored_raw",
    policy: "Store original presentation. Slide adapter required before extraction.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".png",
    category: "image",
    label: "PNG image",
    status: "stored_raw",
    policy: "Store original image. Vision adapter required before interpretation.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".jpg",
    category: "image",
    label: "JPEG image",
    status: "stored_raw",
    policy: "Store original image. Vision adapter required before interpretation.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".jpeg",
    category: "image",
    label: "JPEG image",
    status: "stored_raw",
    policy: "Store original image. Vision adapter required before interpretation.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".mp3",
    category: "audio",
    label: "MP3 audio",
    status: "stored_raw",
    policy: "Store original audio. Speech/audio adapter required before transcription.",
    viewerAdapter: "not_implemented",
    parserAdapter: "provider_required",
    originalPreservation: "required",
  },
  {
    extension: ".wav",
    category: "audio",
    label: "WAV audio",
    status: "stored_raw",
    policy: "Store original audio. Speech/audio adapter required before transcription.",
    viewerAdapter: "not_implemented",
    parserAdapter: "provider_required",
    originalPreservation: "required",
  },
  {
    extension: ".mp4",
    category: "video",
    label: "MP4 video",
    status: "stored_raw",
    policy: "Store original video. Video adapter required before analysis.",
    viewerAdapter: "not_implemented",
    parserAdapter: "provider_required",
    originalPreservation: "required",
  },
  {
    extension: ".mov",
    category: "video",
    label: "MOV video",
    status: "stored_raw",
    policy: "Store original video. Video adapter required before analysis.",
    viewerAdapter: "not_implemented",
    parserAdapter: "provider_required",
    originalPreservation: "required",
  },
  {
    extension: ".dwg",
    category: "cad",
    label: "AutoCAD DWG",
    status: "stored_raw_readonly_preserve",
    policy:
      "Store exact original DWG bytes only. No conversion, no layer filtering, no color/text/arrow removal, no GeoJSON replacement as original truth.",
    viewerAdapter: "provider_required",
    parserAdapter: "provider_required",
    originalPreservation: "required",
  },
  {
    extension: ".dxf",
    category: "cad",
    label: "AutoCAD DXF",
    status: "stored_raw_readonly_preserve",
    policy:
      "Store exact original DXF bytes only. CAD adapter required before viewing or processing.",
    viewerAdapter: "provider_required",
    parserAdapter: "provider_required",
    originalPreservation: "required",
  },
  {
    extension: ".kml",
    category: "gis",
    label: "KML map",
    status: "stored_raw_readonly_preserve",
    policy: "Store original KML. GIS adapter required before map rendering.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".kmz",
    category: "gis",
    label: "KMZ map archive",
    status: "stored_raw_readonly_preserve",
    policy: "Store original KMZ. GIS adapter required before map rendering.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".geojson",
    category: "gis",
    label: "GeoJSON",
    status: "stored_raw",
    policy:
      "Store original GeoJSON. It must not be presented as a DWG/CAD original source.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
  {
    extension: ".zip",
    category: "archive",
    label: "ZIP archive",
    status: "stored_quarantined",
    policy: "Store archive in quarantine. Extraction adapter required.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  },
];

const SENSITIVE_EXTENSIONS = [
  ".env",
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".sqlite",
  ".db",
];

const SENSITIVE_NAME_FRAGMENTS = [
  "password",
  "credential",
  "private_key",
  "secret_key",
  "api_key",
];

function safeFileName(input: string): string {
  const trimmed = input.trim() || "upload.bin";
  const replaced = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return replaced.slice(0, 140) || "upload.bin";
}

function extensionOf(input: string): string {
  const ext = path.extname(input || "").toLowerCase();
  return ext || "unknown";
}

function defaultRegistryEntry(extension: string): FormatRegistryEntry {
  return {
    extension,
    category: "unknown",
    label: "Unknown or new market format",
    status: "requires_adapter",
    policy:
      "Store original bytes safely and mark requires_adapter. No fake parsing or viewing is allowed.",
    viewerAdapter: "not_implemented",
    parserAdapter: "not_implemented",
    originalPreservation: "required",
  };
}

export function getOmnimodalFormatRegistry(): FormatRegistryEntry[] {
  return [...FORMAT_REGISTRY];
}

export function detectOmnimodalFormat(input: {
  originalName: string;
  mimeType?: string;
}): FormatRegistryEntry {
  const extension = extensionOf(input.originalName);
  return (
    FORMAT_REGISTRY.find((entry) => entry.extension === extension) ??
    defaultRegistryEntry(extension)
  );
}

function sensitiveBlockReason(originalName: string): string | null {
  const lower = originalName.toLowerCase();
  const ext = extensionOf(originalName);

  if (SENSITIVE_EXTENSIONS.includes(ext)) {
    return `Sensitive extension is blocked: ${ext}`;
  }

  for (const fragment of SENSITIVE_NAME_FRAGMENTS) {
    if (lower.includes(fragment)) {
      return `Sensitive filename fragment is blocked: ${fragment}`;
    }
  }

  return null;
}

function statusToProcessingStatus(
  status: OmnimodalSupportStatus,
): OmnimodalProcessingStatus {
  if (status === "blocked_sensitive") return "blocked";
  if (status === "requires_adapter") return "requires_adapter";
  if (status === "stored_quarantined") return "quarantined";
  if (status === "stored_raw_readonly_preserve") return "ready_for_viewer_adapter";
  return "stored_only";
}

function zoneFor(input: {
  status: OmnimodalSupportStatus;
  category: OmnimodalCategory;
}): OmnimodalIntakeRecord["safetyZone"] {
  if (input.status === "blocked_sensitive") return "Z4_BLOCKED_MANUAL_ONLY";

  if (
    input.category === "cad" ||
    input.category === "gis" ||
    input.category === "map"
  ) {
    return "Z3_FOUNDER_APPROVAL_REQUIRED";
  }

  if (
    input.category === "archive" ||
    input.category === "video" ||
    input.category === "audio" ||
    input.status === "requires_adapter"
  ) {
    return "Z2_PREVIEW_REQUIRED";
  }

  return "Z1_AUTO_SAFE";
}

async function getOmnimodalDbPath(): Promise<string> {
  const paths = await ensureKernelStorage();
  return path.join(paths.kernelDir, "omnimodal-intake.json");
}

async function readOmnimodalDatabase(): Promise<OmnimodalDatabase> {
  const dbPath = await getOmnimodalDbPath();

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as OmnimodalDatabase;

    if (parsed.version !== 1 || !Array.isArray(parsed.records)) {
      throw new Error("Invalid omnimodal intake database shape.");
    }

    return parsed;
  } catch {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      records: [],
    };
  }
}

async function writeOmnimodalDatabase(db: OmnimodalDatabase): Promise<void> {
  const dbPath = await getOmnimodalDbPath();

  await fs.writeFile(
    dbPath,
    JSON.stringify(
      {
        ...db,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

export async function listOmnimodalIntakeRecords(input?: {
  limit?: number;
}): Promise<OmnimodalIntakeRecord[]> {
  const db = await readOmnimodalDatabase();
  return db.records.slice(0, Math.max(1, Math.min(input?.limit ?? 50, 150)));
}

export async function ingestOmnimodalBlob(input: {
  actor?: string;
  source?: OmnimodalSource;
  originalName: string;
  mimeType?: string;
  bytes: Uint8Array;
  declaredPurpose?: string;
}): Promise<OmnimodalIntakeRecord> {
  const paths = await ensureKernelStorage();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const actor = input.actor ?? "omnimodal";
  const source = input.source ?? "api";
  const originalName = input.originalName || "upload.bin";
  const safeName = safeFileName(originalName);
  const mimeType = input.mimeType || "application/octet-stream";
  const registry = detectOmnimodalFormat({ originalName, mimeType });
  const blockingReason = sensitiveBlockReason(originalName);
  const bytes = Buffer.from(input.bytes);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

  let supportStatus: OmnimodalSupportStatus = registry.status;
  let quarantineReason: string | undefined;
  let objectRelativePath: string | undefined;

  if (blockingReason) {
    supportStatus = "blocked_sensitive";
    quarantineReason = blockingReason;
  } else {
    const datePath = now.slice(0, 7).replace("-", path.sep);
    const objectDir = path.join(paths.kernelDir, "omnimodal", "objects", datePath);
    await fs.mkdir(objectDir, { recursive: true });

    const objectFileName = `${id}-${safeName}`;
    const objectPath = path.join(objectDir, objectFileName);

    await fs.writeFile(objectPath, bytes);

    objectRelativePath = path
      .relative(process.cwd(), objectPath)
      .replaceAll("\\", "/");
  }

  const processingStatus = statusToProcessingStatus(supportStatus);
  const safetyZone = zoneFor({
    status: supportStatus,
    category: registry.category,
  });

  const record: OmnimodalIntakeRecord = {
    id,
    version: 1,
    createdAt: now,
    updatedAt: now,
    actor,
    source,
    originalName,
    safeName,
    mimeType,
    extension: registry.extension,
    category: registry.category,
    label: registry.label,
    byteSize: bytes.byteLength,
    sha256,
    supportStatus,
    processingStatus,
    safetyZone,
    quarantineReason,
    objectRelativePath,
    declaredPurpose: input.declaredPurpose,
    preservationPolicy: registry.policy,
    recommendation:
      supportStatus === "blocked_sensitive"
        ? "Blocked sensitive file. Do not store, parse, view or execute."
        : supportStatus === "requires_adapter"
          ? "Stored as original bytes and marked requires_adapter. Add a governed adapter before parsing or viewing."
          : registry.category === "cad"
            ? "Stored exact CAD original. Use read-only CAD viewer adapter only. Never replace original with derived map."
            : "Stored original bytes. Later processing requires an explicit adapter and audit.",
  };

  const db = await readOmnimodalDatabase();
  await writeOmnimodalDatabase({
    version: 1,
    updatedAt: new Date().toISOString(),
    records: [record, ...db.records].slice(0, 500),
  });

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "kernel.omnimodal_intake.created",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      intakeId: record.id,
      originalName: record.originalName,
      extension: record.extension,
      category: record.category,
      byteSize: record.byteSize,
      sha256: record.sha256,
      supportStatus: record.supportStatus,
      processingStatus: record.processingStatus,
      safetyZone: record.safetyZone,
      objectRelativePath: record.objectRelativePath,
    },
  });

  return record;
}
