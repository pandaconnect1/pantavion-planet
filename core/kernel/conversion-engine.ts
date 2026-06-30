import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { appendKernelAudit } from "./kernel-audit";
import { ensureKernelStorage } from "./kernel-state";
import {
  listOmnimodalIntakeRecords,
  type OmnimodalCategory,
  type OmnimodalIntakeRecord,
} from "./omnimodal-intake";

export type ConversionAdapterStatus =
  | "available_local"
  | "provider_required"
  | "requires_adapter"
  | "blocked";

export type ConversionJobStatus =
  | "planned"
  | "requires_adapter"
  | "completed"
  | "failed"
  | "blocked_sensitive";

export type ConversionRiskZone =
  | "Z1_AUTO_SAFE"
  | "Z2_PREVIEW_REQUIRED"
  | "Z3_FOUNDER_APPROVAL_REQUIRED"
  | "Z4_BLOCKED_MANUAL_ONLY";

export type ConversionOption = {
  id: string;
  sourceCategory: OmnimodalCategory | "any";
  inputExtensions: string[];
  outputExtensions: string[];
  label: string;
  adapterStatus: ConversionAdapterStatus;
  adapterName: string;
  pricingUnit: "per_file" | "per_mb" | "per_minute" | "manual_quote";
  estimatedBaseCostCents: number;
  estimatedVariableCostCents: number;
  currency: "EUR";
  preservesOriginal: true;
  derivativeOnly: true;
  policy: string;
};

export type ConversionJob = {
  id: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  actor: string;
  sourceIntakeId: string;
  sourceOriginalName: string;
  sourceObjectRelativePath?: string;
  sourceExtension: string;
  sourceCategory: OmnimodalCategory;
  sourceSha256: string;
  desiredOutputExtension: string;
  status: ConversionJobStatus;
  safetyZone: ConversionRiskZone;
  adapterStatus: ConversionAdapterStatus;
  adapterName: string;
  estimatedCostCents: number;
  currency: "EUR";
  outputRelativePath?: string;
  outputSha256?: string;
  receipt?: {
    originalPreserved: true;
    derivativeOnly: true;
    conversionPolicy: string;
    adapterName: string;
    completedAt?: string;
  };
  recommendation: string;
  error?: string;
};

type ConversionDatabase = {
  version: 1;
  updatedAt: string;
  jobs: ConversionJob[];
};

const CONVERSION_OPTIONS: ConversionOption[] = [
  {
    id: "text-to-text-local",
    sourceCategory: "text",
    inputExtensions: [".txt", ".md"],
    outputExtensions: [".txt", ".md"],
    label: "Text / Markdown local derivative",
    adapterStatus: "available_local",
    adapterName: "pantavion.local.text-copy-v1",
    pricingUnit: "per_file",
    estimatedBaseCostCents: 1,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy: "Local text derivative. Original remains preserved.",
  },
  {
    id: "json-to-text-local",
    sourceCategory: "text",
    inputExtensions: [".json"],
    outputExtensions: [".txt", ".json"],
    label: "JSON pretty/text derivative",
    adapterStatus: "available_local",
    adapterName: "pantavion.local.json-pretty-v1",
    pricingUnit: "per_file",
    estimatedBaseCostCents: 1,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy: "Local JSON formatting derivative. Original remains preserved.",
  },
  {
    id: "csv-to-text-local",
    sourceCategory: "spreadsheet",
    inputExtensions: [".csv"],
    outputExtensions: [".txt", ".csv"],
    label: "CSV text derivative",
    adapterStatus: "available_local",
    adapterName: "pantavion.local.csv-copy-v1",
    pricingUnit: "per_file",
    estimatedBaseCostCents: 1,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy: "Local CSV derivative. Original remains preserved.",
  },
  {
    id: "document-provider",
    sourceCategory: "document",
    inputExtensions: [".pdf", ".docx"],
    outputExtensions: [".pdf", ".txt", ".png", ".jpg"],
    label: "Document conversion adapter",
    adapterStatus: "provider_required",
    adapterName: "provider.document-conversion.required",
    pricingUnit: "per_mb",
    estimatedBaseCostCents: 5,
    estimatedVariableCostCents: 2,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "Provider/open-source adapter required. No fake extraction or rendering is allowed.",
  },
  {
    id: "image-provider",
    sourceCategory: "image",
    inputExtensions: [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"],
    outputExtensions: [".png", ".jpg", ".webp", ".pdf"],
    label: "Image/photo conversion adapter",
    adapterStatus: "provider_required",
    adapterName: "provider.image-conversion.required",
    pricingUnit: "per_mb",
    estimatedBaseCostCents: 3,
    estimatedVariableCostCents: 1,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "Image conversion requires a governed image adapter before processing.",
  },
  {
    id: "audio-provider",
    sourceCategory: "audio",
    inputExtensions: [".mp3", ".wav", ".m4a", ".ogg"],
    outputExtensions: [".txt", ".srt", ".vtt", ".mp3", ".wav"],
    label: "Audio conversion/transcription adapter",
    adapterStatus: "provider_required",
    adapterName: "provider.audio-conversion.required",
    pricingUnit: "per_minute",
    estimatedBaseCostCents: 10,
    estimatedVariableCostCents: 4,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "Audio conversion/transcription requires a speech/audio provider or local adapter.",
  },
  {
    id: "video-provider",
    sourceCategory: "video",
    inputExtensions: [".mp4", ".mov", ".avi", ".mkv"],
    outputExtensions: [".mp4", ".mp3", ".wav", ".txt", ".srt", ".png"],
    label: "Video conversion/extraction adapter",
    adapterStatus: "provider_required",
    adapterName: "provider.video-conversion.required",
    pricingUnit: "per_minute",
    estimatedBaseCostCents: 25,
    estimatedVariableCostCents: 8,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "Video conversion requires a governed media adapter. No fake frame/audio extraction.",
  },
  {
    id: "cad-dwg-provider",
    sourceCategory: "cad",
    inputExtensions: [".dwg", ".dxf"],
    outputExtensions: [".pdf", ".png", ".svg", ".dxf", ".dwg"],
    label: "Professional CAD/DWG conversion adapter",
    adapterStatus: "provider_required",
    adapterName: "provider.cad-dwg-conversion.required",
    pricingUnit: "manual_quote",
    estimatedBaseCostCents: 120,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "Original CAD/DWG remains source truth. Conversion outputs are derivative copies only. No layer/color/text/arrow/label removal unless explicitly authorized on a derivative copy.",
  },
  {
    id: "gis-provider",
    sourceCategory: "gis",
    inputExtensions: [".kml", ".kmz", ".geojson", ".shp"],
    outputExtensions: [".geojson", ".kml", ".png", ".pdf"],
    label: "GIS/map conversion adapter",
    adapterStatus: "provider_required",
    adapterName: "provider.gis-conversion.required",
    pricingUnit: "per_file",
    estimatedBaseCostCents: 15,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "GIS conversion creates derivative outputs. It must not be presented as DWG/CAD original truth.",
  },
  {
    id: "unknown-format-adapter",
    sourceCategory: "unknown",
    inputExtensions: ["unknown"],
    outputExtensions: ["requires_adapter"],
    label: "Unknown future format",
    adapterStatus: "requires_adapter",
    adapterName: "pantavion.registry.requires-new-adapter",
    pricingUnit: "manual_quote",
    estimatedBaseCostCents: 0,
    estimatedVariableCostCents: 0,
    currency: "EUR",
    preservesOriginal: true,
    derivativeOnly: true,
    policy:
      "Store original bytes. Add a governed adapter before claiming conversion support.",
  },
];

function normalizeExtension(value: string): string {
  const clean = String(value || "").trim().toLowerCase();
  if (!clean) return "unknown";
  // Strip everything except alphanumerics so the result can never contain
  // path separators or `..` segments. Without this, a crafted extension such
  // as ".../../../../tmp/pwned" survives into the output filename and lets
  // path.join escape the conversion output directory (arbitrary file write).
  const stripped = clean.replace(/[^a-z0-9]/g, "");
  if (!stripped) return "unknown";
  return `.${stripped}`;
}

function safeFileName(input: string): string {
  return (
    input
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120) || "conversion-output"
  );
}

function findOption(input: {
  source: OmnimodalIntakeRecord;
  desiredOutputExtension: string;
}): ConversionOption {
  const desired = normalizeExtension(input.desiredOutputExtension);

  return (
    CONVERSION_OPTIONS.find(
      (option) =>
        (option.sourceCategory === input.source.category ||
          option.sourceCategory === "any") &&
        option.inputExtensions.includes(input.source.extension) &&
        option.outputExtensions.includes(desired),
    ) ??
    CONVERSION_OPTIONS.find(
      (option) => option.sourceCategory === input.source.category,
    ) ??
    CONVERSION_OPTIONS.find((option) => option.sourceCategory === "unknown") ??
    CONVERSION_OPTIONS[CONVERSION_OPTIONS.length - 1]
  );
}

function estimateCostCents(input: {
  option: ConversionOption;
  byteSize: number;
}): number {
  const mb = Math.max(1, Math.ceil(input.byteSize / 1024 / 1024));

  if (input.option.pricingUnit === "per_mb") {
    return (
      input.option.estimatedBaseCostCents +
      mb * input.option.estimatedVariableCostCents
    );
  }

  return (
    input.option.estimatedBaseCostCents + input.option.estimatedVariableCostCents
  );
}

function zoneFor(input: {
  source: OmnimodalIntakeRecord;
  option: ConversionOption;
}): ConversionRiskZone {
  if (input.option.adapterStatus === "blocked") return "Z4_BLOCKED_MANUAL_ONLY";

  if (
    input.source.category === "cad" ||
    input.source.category === "gis" ||
    input.option.pricingUnit === "manual_quote"
  ) {
    return "Z3_FOUNDER_APPROVAL_REQUIRED";
  }

  if (input.option.adapterStatus !== "available_local") {
    return "Z2_PREVIEW_REQUIRED";
  }

  return "Z1_AUTO_SAFE";
}

async function getConversionDbPath(): Promise<string> {
  const paths = await ensureKernelStorage();
  return path.join(paths.kernelDir, "conversion-jobs.json");
}

async function readConversionDatabase(): Promise<ConversionDatabase> {
  const dbPath = await getConversionDbPath();

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as ConversionDatabase;

    if (parsed.version !== 1 || !Array.isArray(parsed.jobs)) {
      throw new Error("Invalid conversion database shape.");
    }

    return parsed;
  } catch {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      jobs: [],
    };
  }
}

async function writeConversionDatabase(db: ConversionDatabase): Promise<void> {
  const dbPath = await getConversionDbPath();

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

async function saveConversionJob(job: ConversionJob): Promise<ConversionJob> {
  const db = await readConversionDatabase();
  const withoutExisting = db.jobs.filter((item) => item.id !== job.id);

  await writeConversionDatabase({
    version: 1,
    updatedAt: new Date().toISOString(),
    jobs: [job, ...withoutExisting].slice(0, 500),
  });

  return job;
}

async function sha256File(filePath: string): Promise<string> {
  const bytes = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function executeLocalConversion(job: ConversionJob): Promise<ConversionJob> {
  if (job.adapterStatus !== "available_local") {
    return {
      ...job,
      updatedAt: new Date().toISOString(),
      status:
        job.adapterStatus === "blocked" ? "blocked_sensitive" : "requires_adapter",
      recommendation:
        "Conversion job stored. A governed adapter/provider is required before producing derivative output.",
    };
  }

  if (!job.sourceObjectRelativePath) {
    return {
      ...job,
      updatedAt: new Date().toISOString(),
      status: "failed",
      error: "Missing source object path.",
      recommendation:
        "Source file was not stored. Re-ingest original bytes before conversion.",
    };
  }

  const sourcePath = path.resolve(process.cwd(), job.sourceObjectRelativePath);
  const sourceBytes = await fs.readFile(sourcePath);
  const sourceText = sourceBytes.toString("utf8");

  let outputText = sourceText;

  if (job.sourceExtension === ".json") {
    outputText = JSON.stringify(JSON.parse(sourceText), null, 2);
  }

  const paths = await ensureKernelStorage();
  const datePath = new Date().toISOString().slice(0, 7).replace("-", path.sep);
  const outputDir = path.join(paths.kernelDir, "conversion", "outputs", datePath);

  await fs.mkdir(outputDir, { recursive: true });

  const baseName = safeFileName(
    job.sourceOriginalName.replace(/\.[^.]+$/, "") || "conversion-output",
  );
  const outputName = safeFileName(
    `${job.id}-${baseName}${normalizeExtension(job.desiredOutputExtension)}`,
  );
  const outputPath = path.join(outputDir, outputName);

  // Defense in depth: the resolved output path must stay inside outputDir.
  const resolvedOutputDir = path.resolve(outputDir);
  const resolvedOutputPath = path.resolve(outputPath);
  if (
    resolvedOutputPath !== path.join(resolvedOutputDir, outputName) ||
    !resolvedOutputPath.startsWith(resolvedOutputDir + path.sep)
  ) {
    throw new Error("Refusing to write conversion output outside output directory.");
  }

  await fs.writeFile(outputPath, outputText, "utf8");

  const outputRelativePath = path
    .relative(process.cwd(), outputPath)
    .replaceAll("\\", "/");

  return {
    ...job,
    updatedAt: new Date().toISOString(),
    status: "completed",
    outputRelativePath,
    outputSha256: await sha256File(outputPath),
    receipt: {
      originalPreserved: true,
      derivativeOnly: true,
      conversionPolicy:
        "Original file remains untouched. Output is derivative only.",
      adapterName: job.adapterName,
      completedAt: new Date().toISOString(),
    },
    recommendation:
      "Local derivative output created. Keep original as source truth.",
  };
}

export function getConversionOptions(): ConversionOption[] {
  return [...CONVERSION_OPTIONS];
}

export async function listConversionJobs(input?: {
  limit?: number;
}): Promise<ConversionJob[]> {
  const db = await readConversionDatabase();
  return db.jobs.slice(0, Math.max(1, Math.min(input?.limit ?? 50, 150)));
}

export async function createConversionJob(input: {
  intakeRecordId: string;
  desiredOutputExtension: string;
  actor?: string;
  executeNow?: boolean;
}): Promise<ConversionJob> {
  const actor = input.actor ?? "conversion-engine";
  const desiredOutputExtension = normalizeExtension(input.desiredOutputExtension);
  const records = await listOmnimodalIntakeRecords({ limit: 500 });
  const source = records.find((record) => record.id === input.intakeRecordId);

  if (!source) {
    throw new Error(`Omnimodal intake record not found: ${input.intakeRecordId}`);
  }

  const option = findOption({ source, desiredOutputExtension });
  const now = new Date().toISOString();
  const safetyZone = zoneFor({ source, option });

  let job: ConversionJob = {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    actor,
    sourceIntakeId: source.id,
    sourceOriginalName: source.originalName,
    sourceObjectRelativePath: source.objectRelativePath,
    sourceExtension: source.extension,
    sourceCategory: source.category,
    sourceSha256: source.sha256,
    desiredOutputExtension,
    status:
      option.adapterStatus === "available_local" && safetyZone === "Z1_AUTO_SAFE"
        ? "planned"
        : option.adapterStatus === "blocked"
          ? "blocked_sensitive"
          : "requires_adapter",
    safetyZone,
    adapterStatus: option.adapterStatus,
    adapterName: option.adapterName,
    estimatedCostCents: estimateCostCents({
      option,
      byteSize: source.byteSize,
    }),
    currency: "EUR",
    receipt: {
      originalPreserved: true,
      derivativeOnly: true,
      conversionPolicy: option.policy,
      adapterName: option.adapterName,
    },
    recommendation:
      option.adapterStatus === "available_local"
        ? "Local adapter available. Job can execute after checks."
        : "Adapter/provider required. Do not claim conversion output until a real adapter is connected.",
  };

  if (input.executeNow) {
    job = await executeLocalConversion(job);
  }

  await saveConversionJob(job);

  await appendKernelAudit({
    id: crypto.randomUUID(),
    type: "kernel.conversion_job.created",
    actor,
    createdAt: new Date().toISOString(),
    payload: {
      jobId: job.id,
      sourceIntakeId: job.sourceIntakeId,
      sourceExtension: job.sourceExtension,
      desiredOutputExtension: job.desiredOutputExtension,
      status: job.status,
      adapterStatus: job.adapterStatus,
      adapterName: job.adapterName,
      estimatedCostCents: job.estimatedCostCents,
      currency: job.currency,
      safetyZone: job.safetyZone,
      outputRelativePath: job.outputRelativePath,
    },
  });

  return job;
}
