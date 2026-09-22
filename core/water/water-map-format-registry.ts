import {
  createPantavionArtifactIntakeRecord,
  getPantavionUniversalFormatRegistrySummary,
  type PantavionArtifactIntakeRecord,
  type PantavionArtifactSupportState,
} from "../intake/pantavion-universal-artifact-intake";

export type WaterMapAdapterState =
  | "known_adapter"
  | "convert"
  | "adapter_required"
  | "preserve"
  | "quarantine";

export type WaterMapFormatDecision = {
  artifact: PantavionArtifactIntakeRecord;
  adapterState: WaterMapAdapterState;
  waterRelevant: boolean;
  canonicalMutationAllowed: false;
  reviewRequired: boolean;
  rawPreservationRequired: true;
  truth: string;
};

const WATER_RELEVANT_FAMILIES = new Set([
  "cad_2d",
  "cad_3d",
  "gis_vector",
  "gis_raster",
  "map_tile",
  "image",
  "document",
  "spreadsheet",
  "structured_data",
  "archive",
  "model_3d",
]);

function adapterStateFor(
  support: PantavionArtifactSupportState,
): WaterMapAdapterState {
  if (support === "NATIVE") return "known_adapter";
  if (support === "CONVERT") return "convert";
  if (support === "ADAPTER_REQUIRED") return "adapter_required";
  if (support === "SANDBOX_REQUIRED") return "quarantine";
  return "preserve";
}

export function classifyWaterMapArtifact(input: {
  sourceId: string;
  fileName: string;
  sizeBytes: number;
  mimeType?: string | null;
  firstBytesBase64?: string | null;
  sha256?: string | null;
  sha256VerifiedFromBytes?: boolean;
  storageReference?: string | null;
  sourceDate?: string | null;
  notes?: string[];
}): WaterMapFormatDecision {
  const artifact = createPantavionArtifactIntakeRecord({
    sourceKind: input.storageReference ? "storage_reference" : "device_upload",
    sourceId: input.sourceId,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    mimeType: input.mimeType,
    firstBytesBase64: input.firstBytesBase64,
    sha256: input.sha256,
    sha256VerifiedFromBytes: input.sha256VerifiedFromBytes,
    storageReference: input.storageReference,
    sourceDate: input.sourceDate,
    domains: ["water"],
    notes: [
      "Pantavion Water universal map intake",
      "Raw source must remain private and immutable.",
      ...(input.notes ?? []),
    ],
  });

  const adapterState = adapterStateFor(artifact.detection.supportState);
  const waterRelevant =
    WATER_RELEVANT_FAMILIES.has(artifact.detection.family) ||
    artifact.detection.family === "unknown";

  return {
    artifact,
    adapterState,
    waterRelevant,
    canonicalMutationAllowed: false,
    reviewRequired:
      artifact.detection.risk === "HIGH" ||
      artifact.detection.risk === "CRITICAL" ||
      adapterState === "adapter_required" ||
      adapterState === "preserve" ||
      adapterState === "quarantine",
    rawPreservationRequired: true,
    truth:
      artifact.detection.family === "unknown"
        ? "Unknown or future format accepted for lossless private preservation. Pantavion does not claim parsing until a verified adapter exists."
        : "Water intake reuses the canonical Pantavion universal format registry. Detection/support state describes routing capability, not VERIFIED_LIVE engineering interpretation.",
  };
}

export function getWaterUniversalMapFormatSummary() {
  const universal = getPantavionUniversalFormatRegistrySummary();

  return {
    marker: "pantavion_water_universal_map_format_summary_v1",
    universal,
    rawPreservationBeforeConversion: true,
    acceptsUnknownFutureFormats: true,
    noFakeParsing: true,
    canonicalMutationRequiresReview: true,
    maxPrivateUploadBytes: 1_610_612_736,
    truth:
      "Known format coverage means classify/preserve/route. Unknown future formats are preserved intact and routed to adapter discovery instead of being rejected or falsely parsed.",
  };
}
