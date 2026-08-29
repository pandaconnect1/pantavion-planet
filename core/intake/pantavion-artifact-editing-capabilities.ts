import type {
  PantavionArtifactDetection,
  PantavionArtifactFamily,
} from "@/core/intake/pantavion-universal-artifact-intake";

export const PANTAVION_ARTIFACT_EDITING_CAPABILITIES_MARKER =
  "pantavion_artifact_editing_capabilities_v3" as const;

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

export type PantavionArtifactOperationState =
  | "READY"
  | "WORKER_REQUIRED"
  | "CONVERT_FIRST"
  | "ADAPTER_REQUIRED"
  | "SANDBOX_ONLY"
  | "PRESERVE_ONLY";

export type PantavionArtifactOperationCapability = {
  operation: PantavionArtifactOperation;
  state: PantavionArtifactOperationState;
  adapter: string;
  reason: string;
  nonDestructive: boolean;
};

export type PantavionArtifactEditingCapabilities = {
  marker: typeof PANTAVION_ARTIFACT_EDITING_CAPABILITIES_MARKER;
  formatId: string;
  family: PantavionArtifactFamily;
  supportState: PantavionArtifactDetection["supportState"];
  originalImmutable: true;
  derivativeRequiredForByteChanges: true;
  executionTruth: {
    intakeSupportIsNotExecutionSupport: true;
    readyRequiresRealExecutor: true;
    unsignedArbitraryExecutionAllowed: false;
    unsupportedOriginalStillPreserved: true;
  };
  operations: PantavionArtifactOperationCapability[];
};

const BYTE_CHANGING = new Set<PantavionArtifactOperation>([
  "ANNOTATE",
  "EDIT_METADATA",
  "EDIT_CONTENT",
  "CONVERT",
  "TRANSCODE",
  "CROP_RESIZE",
  "LAYER_EDIT",
  "GEOMETRY_EDIT",
  "GEOREFERENCE",
  "CREATE_DERIVATIVE",
]);

function cap(
  operation: PantavionArtifactOperation,
  state: PantavionArtifactOperationState,
  adapter: string,
  reason: string,
): PantavionArtifactOperationCapability {
  return {
    operation,
    state,
    adapter,
    reason,
    nonDestructive: BYTE_CHANGING.has(operation),
  };
}

function signedViewReady(detection: PantavionArtifactDetection): boolean {
  if (detection.formatId === "pdf") return true;
  return detection.family === "image" || detection.family === "audio" || detection.family === "video";
}

function textExecutionReady(family: PantavionArtifactFamily): boolean {
  return family === "text" || family === "structured_data" || family === "source_code";
}

function unsafeFamily(family: PantavionArtifactFamily): boolean {
  return family === "executable" || family === "disk_image" || family === "archive" || family === "database";
}

export function createPantavionArtifactEditingCapabilities(
  detection: PantavionArtifactDetection,
): PantavionArtifactEditingCapabilities {
  const operations: PantavionArtifactOperationCapability[] = [
    cap(
      "PRESERVE_ORIGINAL",
      "READY",
      "pantavion_private_artifact_storage",
      "The private artifact upload pipeline preserves the original object and does not overwrite it during later edits.",
    ),
    cap(
      "VERIFY_BYTES",
      "WORKER_REQUIRED",
      "pantavion_sync_or_fenced_hash_verifier",
      "Stored size/header bytes are verified by the upload completion route; complete SHA-256 is synchronous only for bounded files and otherwise requires the fenced durable worker.",
    ),
  ];

  if (unsafeFamily(detection.family)) {
    operations.push(
      cap("VIEW", "SANDBOX_ONLY", "pantavion_artifact_sandbox", "Potentially active or complex binary content must not be opened through an unrestricted execution path."),
      cap("EXTRACT", "SANDBOX_ONLY", "pantavion_artifact_sandbox", "Extraction requires a bounded sandbox with archive/active-content limits."),
      cap("SEARCH", "ADAPTER_REQUIRED", "pantavion_adapter_registry", "Search requires a safe parser/indexer specific to this format."),
      cap("EDIT_CONTENT", "SANDBOX_ONLY", "pantavion_artifact_sandbox", "Direct binary/database/executable editing is not authorized by Artifact Studio v3."),
      cap("EXPORT", "ADAPTER_REQUIRED", "pantavion_adapter_registry", "Export requires a format-aware safe adapter."),
    );
    return {
      marker: PANTAVION_ARTIFACT_EDITING_CAPABILITIES_MARKER,
      formatId: detection.formatId,
      family: detection.family,
      supportState: detection.supportState,
      originalImmutable: true,
      derivativeRequiredForByteChanges: true,
      executionTruth: {
        intakeSupportIsNotExecutionSupport: true,
        readyRequiresRealExecutor: true,
        unsignedArbitraryExecutionAllowed: false,
        unsupportedOriginalStillPreserved: true,
      },
      operations,
    };
  }

  if (textExecutionReady(detection.family)) {
    operations.push(
      cap("VIEW", "READY", "pantavion_artifact_executor:text-read", "Founder-only Artifact Executor can read bounded UTF-8 text from private storage."),
      cap("EXTRACT", "READY", "pantavion_artifact_executor:text-read", "Bounded text extraction is implemented by the founder-only Artifact Executor."),
      cap("SEARCH", "READY", "pantavion_artifact_executor:text-search", "Bounded literal text search is implemented against the stored bytes."),
    );
  } else if (signedViewReady(detection)) {
    operations.push(
      cap("VIEW", "READY", "pantavion_artifact_executor:signed-view", "Founder-only Artifact Executor creates a short-lived signed read URL for browser-native viewing/playback."),
      cap("EXTRACT", detection.formatId === "pdf" ? "ADAPTER_REQUIRED" : "WORKER_REQUIRED", detection.formatId === "pdf" ? "pantavion_document_parser" : "pantavion_media_worker", detection.formatId === "pdf" ? "PDF text extraction from stored artifacts is not yet bound to a verified parser." : "Media extraction/transcription requires a bounded worker/runtime adapter."),
      cap("SEARCH", detection.formatId === "pdf" ? "ADAPTER_REQUIRED" : "WORKER_REQUIRED", detection.formatId === "pdf" ? "pantavion_document_parser" : "pantavion_media_indexer", "Search requires extracted/indexed content rather than filename classification."),
    );
  } else {
    operations.push(
      cap("VIEW", "ADAPTER_REQUIRED", "pantavion_adapter_registry", "The intake registry recognizes/preserves this format, but no verified Artifact Studio viewer executor is currently bound."),
      cap("EXTRACT", detection.supportState === "CONVERT" ? "CONVERT_FIRST" : "ADAPTER_REQUIRED", detection.adapter, "A verified format-specific extraction adapter is required before claiming execution support."),
      cap("SEARCH", "ADAPTER_REQUIRED", "pantavion_adapter_registry", "Search requires safe extraction/indexing first."),
    );
  }

  const conversionState: PantavionArtifactOperationState =
    detection.supportState === "CONVERT" ? "WORKER_REQUIRED" : "ADAPTER_REQUIRED";
  operations.push(
    cap("ANNOTATE", "ADAPTER_REQUIRED", "pantavion_derivative_editor", "No general annotation executor is verified yet; annotations must create a derivative or sidecar."),
    cap("EDIT_METADATA", "ADAPTER_REQUIRED", "pantavion_derivative_editor", "Metadata editing needs an artifact-version persistence contract before it can be READY."),
    cap("EDIT_CONTENT", "ADAPTER_REQUIRED", "pantavion_derivative_editor", "Content editing is format-specific and must never overwrite the immutable original."),
    cap("CONVERT", conversionState, detection.adapter, detection.supportState === "CONVERT" ? "The intake plan identifies a conversion lane, but execution must run through a bounded worker and produce a derivative." : "No verified conversion executor is bound for this format yet."),
    cap("TRANSCODE", detection.family === "audio" || detection.family === "video" ? "WORKER_REQUIRED" : "ADAPTER_REQUIRED", "pantavion_media_worker", "Media transcoding requires a bounded worker and derivative output; direct mutation is prohibited."),
    cap("RENDER", "ADAPTER_REQUIRED", "pantavion_render_adapter", "A verified renderer is required; recognition alone is not rendering support."),
    cap("CROP_RESIZE", detection.family === "image" ? "ADAPTER_REQUIRED" : "ADAPTER_REQUIRED", "pantavion_image_editor", "Image byte editing is not marked READY until a real derivative editor is bound and tested."),
    cap("LAYER_EDIT", "ADAPTER_REQUIRED", "pantavion_layer_editor", "Layer editing requires a format-aware editor."),
    cap("GEOMETRY_EDIT", "ADAPTER_REQUIRED", "pantavion_geometry_editor", "CAD/GIS geometry write support is not yet verified; parser/worker presence is read evidence only."),
    cap("MEASURE", detection.family === "cad_2d" || detection.family === "cad_3d" || detection.family === "gis_vector" || detection.family === "gis_raster" ? "ADAPTER_REQUIRED" : "ADAPTER_REQUIRED", "pantavion_measurement_adapter", "No general measurement executor is marked READY until the actual CAD/GIS viewer/runtime is bound to Artifact Studio."),
    cap("GEOREFERENCE", "ADAPTER_REQUIRED", "pantavion_georeference_adapter", "Georeferencing requires a GIS-specific verified write/derivative workflow."),
    cap("COMPARE", "ADAPTER_REQUIRED", "pantavion_artifact_compare", "Comparison requires family-specific semantic or visual diff support."),
    cap("EXPORT", textExecutionReady(detection.family) ? "READY" : "ADAPTER_REQUIRED", textExecutionReady(detection.family) ? "pantavion_artifact_executor:text-read" : "pantavion_export_adapter", textExecutionReady(detection.family) ? "Bounded text can be returned/exported without altering the original." : "A format-aware export executor is required."),
    cap("CREATE_DERIVATIVE", "ADAPTER_REQUIRED", "pantavion_derivative_store", "Derivative version persistence must be bound before any byte-changing editor can become READY."),
  );

  return {
    marker: PANTAVION_ARTIFACT_EDITING_CAPABILITIES_MARKER,
    formatId: detection.formatId,
    family: detection.family,
    supportState: detection.supportState,
    originalImmutable: true,
    derivativeRequiredForByteChanges: true,
    executionTruth: {
      intakeSupportIsNotExecutionSupport: true,
      readyRequiresRealExecutor: true,
      unsignedArbitraryExecutionAllowed: false,
      unsupportedOriginalStillPreserved: true,
    },
    operations,
  };
}
