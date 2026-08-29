import type {
  PantavionArtifactDetection,
  PantavionArtifactFamily,
  PantavionArtifactSupportState,
} from "./pantavion-universal-artifact-intake";

export const PANTAVION_ARTIFACT_EDITING_CAPABILITY_MARKER =
  "pantavion_artifact_editing_capability_v1" as const;

export type PantavionArtifactOperation =
  | "PRESERVE_ORIGINAL"
  | "VERIFY_BYTES"
  | "VIEW"
  | "EXTRACT"
  | "SEARCH"
  | "ANNOTATE"
  | "EDIT_METADATA"
  | "EDIT_CONTENT"
  | "CONVERT"
  | "TRANSCODE"
  | "RENDER"
  | "CROP_RESIZE"
  | "LAYER_EDIT"
  | "GEOMETRY_EDIT"
  | "MEASURE"
  | "GEOREFERENCE"
  | "COMPARE"
  | "EXPORT"
  | "CREATE_DERIVATIVE";

export type PantavionArtifactCapabilityState =
  | "READY"
  | "WORKER_REQUIRED"
  | "CONVERT_FIRST"
  | "ADAPTER_REQUIRED"
  | "SANDBOX_ONLY"
  | "PRESERVE_ONLY";

export interface PantavionArtifactOperationCapability {
  operation: PantavionArtifactOperation;
  state: PantavionArtifactCapabilityState;
  adapter: string;
  nonDestructive: true;
  reason: string;
}

export interface PantavionArtifactEditingCapabilities {
  marker: typeof PANTAVION_ARTIFACT_EDITING_CAPABILITY_MARKER;
  formatId: string;
  family: PantavionArtifactFamily;
  supportState: PantavionArtifactSupportState;
  originalImmutable: true;
  derivativeRequiredForByteChanges: true;
  operations: PantavionArtifactOperationCapability[];
}

type CapabilitySeed = Omit<PantavionArtifactOperationCapability, "nonDestructive">;

function cap(
  operation: PantavionArtifactOperation,
  state: PantavionArtifactCapabilityState,
  adapter: string,
  reason: string,
): PantavionArtifactOperationCapability {
  return { operation, state, adapter, nonDestructive: true, reason };
}

function baseline(detection: PantavionArtifactDetection): CapabilitySeed[] {
  const unsafe =
    detection.supportState === "SANDBOX_REQUIRED" ||
    detection.family === "executable" ||
    detection.family === "disk_image" ||
    detection.family === "archive" ||
    detection.family === "database";

  if (unsafe) {
    return [
      {
        operation: "PRESERVE_ORIGINAL",
        state: "READY",
        adapter: detection.adapter,
        reason: "Original bytes can be preserved privately without direct execution.",
      },
      {
        operation: "VERIFY_BYTES",
        state: "WORKER_REQUIRED",
        adapter: "pantavion_durable_artifact_verifier",
        reason: "Large or active-content artifacts require bounded worker verification.",
      },
      {
        operation: "EXTRACT",
        state: "SANDBOX_ONLY",
        adapter: detection.adapter,
        reason: "Extraction must occur inside a restricted sandbox before promotion.",
      },
      {
        operation: "EDIT_CONTENT",
        state: "SANDBOX_ONLY",
        adapter: detection.adapter,
        reason: "Byte-changing operations are forbidden outside a sandbox for this family.",
      },
      {
        operation: "CREATE_DERIVATIVE",
        state: "SANDBOX_ONLY",
        adapter: detection.adapter,
        reason: "Any derivative must be produced by a restricted worker and never replace the original.",
      },
    ];
  }

  return [
    {
      operation: "PRESERVE_ORIGINAL",
      state: "READY",
      adapter: detection.adapter,
      reason: "Universal Artifact Intake already preserves the private original.",
    },
    {
      operation: "VERIFY_BYTES",
      state: "WORKER_REQUIRED",
      adapter: "pantavion_durable_artifact_verifier",
      reason: "Verification state depends on artifact size; large files use the fenced durable worker path.",
    },
    {
      operation: "ANNOTATE",
      state: "ADAPTER_REQUIRED",
      adapter: "pantavion_artifact_studio",
      reason: "Universal annotation is part of Artifact Studio and must preserve source lineage.",
    },
    {
      operation: "EDIT_METADATA",
      state: "ADAPTER_REQUIRED",
      adapter: "pantavion_artifact_studio",
      reason: "Metadata edits must be versioned and provenance-backed.",
    },
    {
      operation: "COMPARE",
      state: "ADAPTER_REQUIRED",
      adapter: "pantavion_artifact_studio",
      reason: "Version comparison requires a derivative lineage record.",
    },
    {
      operation: "CREATE_DERIVATIVE",
      state: "ADAPTER_REQUIRED",
      adapter: "pantavion_artifact_studio",
      reason: "Byte-changing edits must create a new derivative rather than overwrite the original.",
    },
  ];
}

function familyCapabilities(detection: PantavionArtifactDetection): CapabilitySeed[] {
  const adapter = detection.adapter;
  switch (detection.family) {
    case "text":
    case "structured_data":
      return [
        { operation: "VIEW", state: "READY", adapter, reason: "Current Pantavion text/data adapter can read this family." },
        { operation: "EXTRACT", state: "READY", adapter, reason: "Text/data extraction is available through the current adapter." },
        { operation: "SEARCH", state: "READY", adapter, reason: "Extracted text/data can enter Pantavion search/intelligence flows." },
        { operation: "EDIT_CONTENT", state: "ADAPTER_REQUIRED", adapter: "pantavion_artifact_studio", reason: "Direct content editing requires the non-destructive derivative editor surface." },
        { operation: "CONVERT", state: "READY", adapter, reason: "Canonical text/structured representations are supported." },
        { operation: "EXPORT", state: "READY", adapter, reason: "Canonical text/data can be exported without mutating the original." },
      ];
    case "document":
    case "spreadsheet":
    case "presentation":
    case "email": {
      const state = detection.supportState === "NATIVE" ? "READY" : "CONVERT_FIRST";
      return [
        { operation: "VIEW", state, adapter, reason: state === "READY" ? "A current Pantavion reader exists for this format." : "A safe canonical conversion is required before viewing." },
        { operation: "EXTRACT", state, adapter, reason: state === "READY" ? "Current reader can extract content." : "Extraction starts after safe conversion." },
        { operation: "SEARCH", state, adapter, reason: "Search becomes available after content extraction." },
        { operation: "EDIT_CONTENT", state: "ADAPTER_REQUIRED", adapter: "pantavion_artifact_studio", reason: "Office/document editing needs a format-specific derivative editor." },
        { operation: "CONVERT", state: detection.supportState === "PRESERVE" ? "ADAPTER_REQUIRED" : "READY", adapter, reason: "Conversion is the safe interoperability path for proprietary/legacy document formats." },
        { operation: "EXPORT", state: state === "READY" ? "READY" : "CONVERT_FIRST", adapter, reason: "Export uses canonical or safely converted content." },
      ];
    }
    case "image":
      return [
        { operation: "VIEW", state: detection.supportState === "NATIVE" ? "READY" : "CONVERT_FIRST", adapter, reason: "Raster formats can use the current multimodal path; vector/proprietary formats convert first." },
        { operation: "EXTRACT", state: "READY", adapter: "pantavion_personal_ai_multimodal", reason: "Image understanding/metadata extraction can use the multimodal path for supported raster inputs." },
        { operation: "CROP_RESIZE", state: "ADAPTER_REQUIRED", adapter: "pantavion_image_editor", reason: "Pixel edits require a non-destructive image derivative adapter." },
        { operation: "EDIT_CONTENT", state: "ADAPTER_REQUIRED", adapter: "pantavion_image_editor", reason: "Image edits must create a derivative and retain the source." },
        { operation: "CONVERT", state: "ADAPTER_REQUIRED", adapter: "pantavion_image_editor", reason: "Image conversion needs an explicit image processing adapter." },
        { operation: "EXPORT", state: "ADAPTER_REQUIRED", adapter: "pantavion_image_editor", reason: "Export format must be selected by the image adapter." },
      ];
    case "audio":
      return [
        { operation: "VIEW", state: "READY", adapter, reason: "Audio playback/voice handling exists in the current Pantavion media path." },
        { operation: "EXTRACT", state: "READY", adapter, reason: "Speech-to-text is routed through Pantavion STT." },
        { operation: "SEARCH", state: "READY", adapter, reason: "Transcribed audio can enter search/intelligence flows." },
        { operation: "TRANSCODE", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Audio transcoding requires a media derivative worker." },
        { operation: "EDIT_CONTENT", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Trim/mix/filter operations require a non-destructive media editor." },
        { operation: "EXPORT", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Audio export is handled by the media adapter." },
      ];
    case "video":
      return [
        { operation: "VIEW", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "A canonical video adapter is still required." },
        { operation: "EXTRACT", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Frames/audio/subtitles need bounded media extraction." },
        { operation: "TRANSCODE", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Video transcode must run in a bounded worker." },
        { operation: "EDIT_CONTENT", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Trim/cut/composite operations create derivatives." },
        { operation: "RENDER", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Video render requires a media worker." },
        { operation: "EXPORT", state: "ADAPTER_REQUIRED", adapter: "pantavion_media_editor", reason: "Export requires codec/container handling." },
      ];
    case "cad_2d":
      return [
        { operation: "VIEW", state: detection.supportState === "NATIVE" ? "READY" : "CONVERT_FIRST", adapter, reason: "DWG/DXF use the existing Pantavion CAD path; other 2D CAD converts first." },
        { operation: "EXTRACT", state: detection.supportState === "NATIVE" ? "READY" : "CONVERT_FIRST", adapter, reason: "Layers/entities can be extracted through the CAD adapter when supported." },
        { operation: "MEASURE", state: detection.supportState === "NATIVE" ? "READY" : "CONVERT_FIRST", adapter, reason: "Geometry measurement is available after CAD parsing." },
        { operation: "LAYER_EDIT", state: "ADAPTER_REQUIRED", adapter: "pantavion_cad_editor", reason: "Layer/entity modification needs a write-capable CAD derivative adapter." },
        { operation: "GEOMETRY_EDIT", state: "ADAPTER_REQUIRED", adapter: "pantavion_cad_editor", reason: "Geometry changes must create a new CAD derivative." },
        { operation: "CONVERT", state: detection.supportState === "NATIVE" ? "READY" : "ADAPTER_REQUIRED", adapter, reason: "Supported CAD can enter canonical representations; legacy formats need a converter." },
        { operation: "EXPORT", state: "ADAPTER_REQUIRED", adapter: "pantavion_cad_editor", reason: "Write/export requires a CAD writer with units/layers preserved." },
      ];
    case "cad_3d":
    case "model_3d":
      return [
        { operation: "VIEW", state: "ADAPTER_REQUIRED", adapter: "pantavion_3d_editor", reason: "3D viewing requires a canonical mesh/BIM adapter." },
        { operation: "EXTRACT", state: "ADAPTER_REQUIRED", adapter: "pantavion_3d_editor", reason: "Model hierarchy/material/geometry extraction needs a 3D adapter." },
        { operation: "MEASURE", state: "ADAPTER_REQUIRED", adapter: "pantavion_3d_editor", reason: "3D measurement follows canonical geometry conversion." },
        { operation: "GEOMETRY_EDIT", state: "ADAPTER_REQUIRED", adapter: "pantavion_3d_editor", reason: "Geometry edits create a new derivative model." },
        { operation: "RENDER", state: "ADAPTER_REQUIRED", adapter: "pantavion_3d_editor", reason: "3D rendering needs a bounded render adapter." },
        { operation: "EXPORT", state: "ADAPTER_REQUIRED", adapter: "pantavion_3d_editor", reason: "Export needs format-aware 3D writing." },
      ];
    case "gis_vector":
    case "gis_raster":
    case "map_tile":
      return [
        { operation: "VIEW", state: detection.supportState === "NATIVE" ? "READY" : detection.supportState === "CONVERT" ? "CONVERT_FIRST" : "ADAPTER_REQUIRED", adapter, reason: "Map viewing uses canonical GeoJSON/raster/tile adapters." },
        { operation: "EXTRACT", state: detection.supportState === "CONVERT" ? "CONVERT_FIRST" : "ADAPTER_REQUIRED", adapter, reason: "Feature/raster metadata extraction follows canonical GIS conversion." },
        { operation: "MEASURE", state: detection.supportState === "CONVERT" ? "CONVERT_FIRST" : "ADAPTER_REQUIRED", adapter, reason: "Measurement needs known CRS and parsed geometry." },
        { operation: "GEOREFERENCE", state: "ADAPTER_REQUIRED", adapter: "pantavion_gis_editor", reason: "CRS/georeference edits must retain transformation lineage." },
        { operation: "GEOMETRY_EDIT", state: "ADAPTER_REQUIRED", adapter: "pantavion_gis_editor", reason: "Feature edits create a versioned GIS derivative." },
        { operation: "LAYER_EDIT", state: "ADAPTER_REQUIRED", adapter: "pantavion_gis_editor", reason: "Layer edits require a write-capable GIS adapter." },
        { operation: "EXPORT", state: "ADAPTER_REQUIRED", adapter: "pantavion_gis_editor", reason: "GIS export must preserve CRS/units/attributes." },
      ];
    case "source_code":
      return [
        { operation: "VIEW", state: "READY", adapter, reason: "Source text can be safely read without execution." },
        { operation: "EXTRACT", state: "READY", adapter, reason: "Static code analysis can extract structure and references." },
        { operation: "SEARCH", state: "READY", adapter, reason: "Source can enter code search without execution." },
        { operation: "EDIT_CONTENT", state: "ADAPTER_REQUIRED", adapter: "pantavion_code_editor", reason: "Code edits need a versioned patch/branch workflow." },
        { operation: "COMPARE", state: "ADAPTER_REQUIRED", adapter: "pantavion_code_editor", reason: "Diff/compare belongs to the versioned code editing path." },
        { operation: "EXPORT", state: "READY", adapter, reason: "Source text can be exported without executing it." },
      ];
    case "font":
      return [
        { operation: "VIEW", state: "ADAPTER_REQUIRED", adapter: "pantavion_font_preview", reason: "Font preview must be sandboxed and must not expose font binaries as executable content." },
        { operation: "EXTRACT", state: "ADAPTER_REQUIRED", adapter: "pantavion_font_preview", reason: "Font metadata extraction requires a dedicated parser." },
        { operation: "CONVERT", state: "ADAPTER_REQUIRED", adapter: "pantavion_font_preview", reason: "Font conversion requires licensing and format checks." },
      ];
    case "unknown":
      return [
        { operation: "VIEW", state: "PRESERVE_ONLY", adapter: "pantavion_adapter_registry", reason: "Unknown bytes are preserved until a verified adapter exists." },
        { operation: "EDIT_CONTENT", state: "PRESERVE_ONLY", adapter: "pantavion_adapter_registry", reason: "Pantavion must not mutate an unknown format blindly." },
        { operation: "CONVERT", state: "ADAPTER_REQUIRED", adapter: "pantavion_adapter_registry", reason: "A verified format adapter must be registered first." },
      ];
    default:
      return [];
  }
}

export function createPantavionArtifactEditingCapabilities(
  detection: PantavionArtifactDetection,
): PantavionArtifactEditingCapabilities {
  const combined = [...baseline(detection), ...familyCapabilities(detection)];
  const operations = new Map<PantavionArtifactOperation, PantavionArtifactOperationCapability>();

  for (const entry of combined) {
    const current = operations.get(entry.operation);
    if (!current) {
      operations.set(entry.operation, { ...entry, nonDestructive: true });
      continue;
    }

    const rank: Record<PantavionArtifactCapabilityState, number> = {
      READY: 6,
      WORKER_REQUIRED: 5,
      CONVERT_FIRST: 4,
      ADAPTER_REQUIRED: 3,
      SANDBOX_ONLY: 2,
      PRESERVE_ONLY: 1,
    };
    if (rank[entry.state] > rank[current.state]) {
      operations.set(entry.operation, { ...entry, nonDestructive: true });
    }
  }

  return {
    marker: PANTAVION_ARTIFACT_EDITING_CAPABILITY_MARKER,
    formatId: detection.formatId,
    family: detection.family,
    supportState: detection.supportState,
    originalImmutable: true,
    derivativeRequiredForByteChanges: true,
    operations: [...operations.values()],
  };
}
